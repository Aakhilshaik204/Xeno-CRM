require('dotenv/config')
const { createClient } = require('@supabase/supabase-js')
const { randomBytes } = require('crypto')

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

s.from('Segment').insert({
  id: 'c' + randomBytes(12).toString('hex'),
  name: 'Custom test',
  description: 'test',
  filterConfig: [{ field: 'id', operator: 'in', value: ['123'] }],
  customerCount: 1,
  createdBy: 'custom'
}).select().single().then(r => console.log('Segment:', r)).catch(console.error)
