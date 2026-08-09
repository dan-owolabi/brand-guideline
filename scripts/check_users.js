/**
 * Check user ID mapping
 *
 * Run with: node --env-file=.env.local scripts/check_users.js
 * Requires NOBORA_SUPABASE_URL / NOBORA_SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'

const client = createClient(process.env.NOBORA_SUPABASE_URL, process.env.NOBORA_SUPABASE_SERVICE_ROLE_KEY)

async function run() {
    console.log('=== USER CHECK ===\n')

    // Get all users
    const { data: userData } = await client.auth.admin.listUsers()

    console.log('Users in auth.users:')
    userData.users.forEach(u => {
        console.log(`  ${u.email}: ${u.id}`)
    })

    // Get workspace members
    const { data: members } = await client.from('workspace_members').select('*')

    console.log('\nWorkspace members:')
    members?.forEach(m => {
        const user = userData.users.find(u => u.id === m.user_id)
        console.log(`  User: ${m.user_id} (${user?.email || 'UNKNOWN'}), Role: ${m.role}, Workspace: ${m.workspace_id}`)
    })

    // Check if target email matches workspace member
    const targetEmail = 'owolabidaniel30@gmail.com'
    const targetUser = userData.users.find(u => u.email === targetEmail)

    if (targetUser) {
        const membership = members?.find(m => m.user_id === targetUser.id)
        console.log(`\n${targetEmail}:`)
        console.log(`  User ID: ${targetUser.id}`)
        console.log(`  Has workspace membership: ${membership ? 'YES' : 'NO'}`)
        if (membership) {
            console.log(`  Workspace ID: ${membership.workspace_id}`)
            console.log(`  Role: ${membership.role}`)
        }
    }
}

run().catch(console.error)
