import 'dotenv/config'
import { supabase } from './src/lib/supabase'

async function run() {
  const { data, count, error } = await supabase
    .from('Customer')
    .select('*', { count: 'exact' })
    .limit(5)
    
  console.log('Error:', error)
  console.log('Count:', count)
  console.log('Data length:', data?.length)
}

run()
