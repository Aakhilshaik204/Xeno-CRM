import 'dotenv/config'
import { supabase } from './src/lib/supabase'

async function run() {
  const generateId = () => Math.random().toString(36).substr(2, 9)
  
  console.log('Inserting Segment...')
  const payload = {
    id: generateId(),
    name: 'Test Segment ' + generateId(),
    description: 'test',
    filterConfig: [],
    customerCount: 0,
    createdBy: 'user',
    updatedAt: new Date().toISOString()
  }
  console.log('Payload:', payload)

  const { data, error } = await supabase
    .from('Segment')
    .insert(payload)
    .select()
    .single()
    
  console.log('Error:', error)
  console.log('Data:', data)
}

run()
