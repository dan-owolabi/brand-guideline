/**
 * Decode HTML entities in a string
 * Converts &amp; → &, &lt; → <, &gt; → >, etc.
 * Runs twice to handle double-encoded entities (e.g., &amp;amp; → &)
 */
export function decodeHTMLEntities(text: string | null | undefined): string {
    if (!text || typeof text !== 'string') return text || ''
    if (typeof window === 'undefined') return text // Server-side fallback

    // Use a textarea element to decode HTML entities
    const textarea = document.createElement('textarea')
    // First decode
    textarea.innerHTML = text
    let decoded = textarea.value
    // Second decode to handle double-encoded entities
    textarea.innerHTML = decoded
    return textarea.value
}

/**
 * Fix double-encoded HTML entities
 * Converts &amp;amp; → &amp;, etc.
 */
export function fixDoubleEncodedEntities(html: string | null | undefined): string {
    if (!html || typeof html !== 'string') return html || ''

    return html
        .replace(/&amp;amp;/g, '&amp;')
        .replace(/&amp;lt;/g, '&lt;')
        .replace(/&amp;gt;/g, '&gt;')
        .replace(/&amp;quot;/g, '&quot;')
        .replace(/&amp;#/g, '&#')
}
