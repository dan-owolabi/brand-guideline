import 'server-only'
import { Resend } from 'resend'

/**
 * Transactional email, via Resend.
 *
 * Resend rather than SES because guidr.space is ALREADY verified with Resend —
 * the DNS move carried over `resend._domainkey` (DKIM), an SPF record on
 * `send`, and Resend's bounce MX. SES would have meant a domain verification
 * plus a production-access review with a human turnaround, to reach the same
 * place. The apex MX still points at SES for INBOUND mail; that is unrelated
 * and untouched.
 *
 * Failure policy: send failures are logged and swallowed, never thrown. The
 * callers are auth flows — a password reset that 500s because an email
 * provider hiccuped is worse than one that appears to succeed, since the user
 * can simply request another. The one thing we must never do is leak whether
 * an address is registered, so the caller's response is identical either way.
 */

const FROM = process.env.EMAIL_FROM || 'Guidr <noreply@guidr.space>'
const KEY = process.env.RESEND_API_KEY

let client = null
function resend() {
    if (!KEY) return null
    if (!client) client = new Resend(KEY)
    return client
}

async function send({ to, subject, html, text }) {
    const c = resend()

    if (!c) {
        // No key configured. In development this is expected — print the mail
        // so the flow is still testable end to end. In production it is a
        // misconfiguration worth shouting about, but still not worth throwing.
        const where = process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'dev'
        console.warn(`[email:${where}] RESEND_API_KEY unset — not sending "${subject}" to ${to}`)
        if (process.env.NODE_ENV !== 'production') console.warn(`[email:dev] ${text}`)
        return { sent: false }
    }

    try {
        const { error } = await c.emails.send({ from: FROM, to, subject, html, text })
        if (error) {
            console.error('[email] resend rejected:', error.message)
            return { sent: false }
        }
        return { sent: true }
    } catch (err) {
        console.error('[email] send failed:', err.message)
        return { sent: false }
    }
}

/* ── templates ───────────────────────────────────────────────────────── */

const shell = (heading, body, cta) => `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1b2430">
  <h1 style="font-size:20px;margin:0 0 16px">${heading}</h1>
  ${body}
  ${cta ? `<p style="margin:28px 0"><a href="${cta.href}" style="display:inline-block;background:#1b2430;color:#fff;text-decoration:none;padding:11px 20px;border-radius:6px;font-size:14px">${cta.label}</a></p>
  <p style="font-size:12px;color:#6b7885;margin:0">If the button does not work, paste this into your browser:<br><span style="word-break:break-all">${cta.href}</span></p>` : ''}
</div>`

export function sendPasswordReset({ to, url }) {
    return send({
        to,
        subject: 'Reset your Guidr password',
        text: `Reset your password: ${url}\n\nThis link expires in 1 hour. If you didn't ask for it, ignore this email.`,
        html: shell(
            'Reset your password',
            `<p style="font-size:14px;line-height:1.6;margin:0">Click below to choose a new password. The link expires in one hour.</p>
             <p style="font-size:14px;line-height:1.6;margin:12px 0 0;color:#5c6874">If you didn't request this, you can ignore this email — your password won't change.</p>`,
            { href: url, label: 'Choose a new password' }
        ),
    })
}

export function sendInvite({ to, url, accountName, inviterName, role }) {
    const who = inviterName ? `${inviterName} invited you` : 'You have been invited'
    return send({
        to,
        subject: `Join ${accountName} on Guidr`,
        text: `${who} to join ${accountName} on Guidr as ${role}.\n\nAccept: ${url}\n\nThis invite expires in 7 days.`,
        html: shell(
            `Join ${accountName}`,
            `<p style="font-size:14px;line-height:1.6;margin:0">${who} to collaborate on <strong>${accountName}</strong> as ${role}.</p>
             <p style="font-size:14px;line-height:1.6;margin:12px 0 0;color:#5c6874">This invite expires in 7 days.</p>`,
            { href: url, label: 'Accept invitation' }
        ),
    })
}
