const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ahfsosoabcvxgcwharui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoZnNvc29hYmN2eGdjd2hhcnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMjk1NTQsImV4cCI6MjA4NDcwNTU1NH0.Gi4EodMwX7sQSaOhGKuH9bCYl-3zxicuSxXQhUmApdc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking for Nobora brand...');
    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('name', 'Nobora');

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Brands found:', JSON.stringify(data, null, 2));
        if (data.length === 0) {
            console.log('Brand "Nobora" NOT found in new project.');
        } else {
            console.log('Brand "Nobora" FOUND in new project.');
        }
    }
}

check();
