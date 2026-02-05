/**
 * Check user ID mapping
 */

const { createClient } = require('@supabase/supabase-js');

const NEW_URL = 'https://ahfsosoabcvxgcwharui.supabase.co';
const NEW_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZnNvc29hYmN2eGdjd2hhcnVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyOTU1NCwiZXhwIjoyMDg0NzA1NTU0fQ.a1d9DnNP9nxg3ThS5jrfpUXVZIzqGRcfSBMgM1W7uso';

const client = createClient(NEW_URL, NEW_KEY);

async function run() {
    console.log('=== USER CHECK ===\n');

    // Get all users
    const { data: userData } = await client.auth.admin.listUsers();

    console.log('Users in auth.users:');
    userData.users.forEach(u => {
        console.log(`  ${u.email}: ${u.id}`);
    });

    // Get workspace members
    const { data: members } = await client.from('workspace_members').select('*');

    console.log('\nWorkspace members:');
    members?.forEach(m => {
        const user = userData.users.find(u => u.id === m.user_id);
        console.log(`  User: ${m.user_id} (${user?.email || 'UNKNOWN'}), Role: ${m.role}, Workspace: ${m.workspace_id}`);
    });

    // Check if target email matches workspace member
    const targetEmail = 'owolabidaniel30@gmail.com';
    const targetUser = userData.users.find(u => u.email === targetEmail);

    if (targetUser) {
        const membership = members?.find(m => m.user_id === targetUser.id);
        console.log(`\n${targetEmail}:`);
        console.log(`  User ID: ${targetUser.id}`);
        console.log(`  Has workspace membership: ${membership ? 'YES' : 'NO'}`);
        if (membership) {
            console.log(`  Workspace ID: ${membership.workspace_id}`);
            console.log(`  Role: ${membership.role}`);
        }
    }
}

run().catch(console.error);
