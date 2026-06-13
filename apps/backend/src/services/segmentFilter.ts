export interface FilterRule {
  field: string
  operator: 'gte' | 'lte' | 'equals' | 'eq' | 'in' | 'notIn'
  value: any
}

/**
 * Applies the filter configuration to a Supabase query builder.
 */
export function applySupabaseFilters(query: any, filterConfig: FilterRule[]): any {
  if (!filterConfig || !Array.isArray(filterConfig)) return query

  for (const rule of filterConfig) {
    if (rule.field === 'daysSinceLastOrder') {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - Number(rule.value))
      
      // If daysSinceLastOrder >= 60, it means last order was ON OR BEFORE (lte) 60 days ago
      // If daysSinceLastOrder <= 30, it means last order was ON OR AFTER (gte) 30 days ago
      if (rule.operator === 'gte') {
        query = query.lte('lastOrderDate', targetDate.toISOString())
      } else if (rule.operator === 'lte') {
        query = query.gte('lastOrderDate', targetDate.toISOString())
      }
    } else {
      if (rule.operator === 'equals' || rule.operator === 'eq') {
        query = query.eq(rule.field, rule.value)
      } else if (rule.operator === 'in') {
        // If value is an array, we pass it as a comma-separated string for Supabase .in()
        // Or if the Supabase client handles arrays natively, we just pass the array
        const valArray = Array.isArray(rule.value) ? rule.value : [rule.value]
        query = query.in(rule.field, valArray)
      } else if (rule.operator === 'notIn') {
        const valArray = Array.isArray(rule.value) ? rule.value : [rule.value]
        // Supabase js client uses .not('column', 'in', 'value')
        // We format it as a comma separated string inside parenthesis if needed, but the client often handles arrays
        query = query.not(rule.field, 'in', valArray.length > 0 ? `(${valArray.join(',')})` : '()')
      } else {
        // other operators like gte, lte
        if (typeof query[rule.operator] === 'function') {
          query = query[rule.operator](rule.field, rule.value)
        }
      }
    }
  }

  return query
}
