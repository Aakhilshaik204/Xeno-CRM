require('dotenv/config')
const { createClient } = require('@supabase/supabase-js')

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

s.from('Campaign').insert({
  name: 'Test', 
  channel: 'email', 
  messageTemplate: 'Test', 
  segmentId: 'cmq9e7wy9000010pc9ujxnx4x', 
  status: 'draft'
}).select('*, segment:Segment(name, customerCount)').single().then(r => console.log(r)).catch(console.error)
