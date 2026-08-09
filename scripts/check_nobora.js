/**
 * Run with: node --env-file=.env.local scripts/check_nobora.js
 * Requires NOBORA_SUPABASE_URL / NOBORA_SUPABASE_ANON_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NOBORA_SUPABASE_URL, process.env.NOBORA_SUPABASE_ANON_KEY)

async function check() {
    console.log('Checking for Nobora brand...')
    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('name', 'Nobora')

    if (error) {
        console.error('Error:', error)
    } else {
        console.log('Brands found:', JSON.stringify(data, null, 2))
        if (data.length === 0) {
            console.log('Brand "Nobora" NOT found in new project.')
        } else {
            console.log('Brand "Nobora" FOUND in new project.')
        }
    }
}

check()
