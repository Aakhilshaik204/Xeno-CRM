import { Router } from 'express'
import asyncHandler from 'express-async-handler'
import { GoogleGenAI, Type } from '@google/genai'
import { supabase, generateId } from '../lib/supabase'

const router = Router()

// Initialize Google GenAI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Define Tools
const getSegmentsTool = {
  name: 'getSegments',
  description: 'Gets a list of all customer segments and their IDs. Use this to find the right segmentId when the user asks to target a specific audience.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  }
}

const createSegmentTool = {
  name: 'createSegment',
  description: 'Creates a new customer segment. Use this when the user asks to create or propose a new segment (e.g. by membership tier, location, etc.).',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: 'Segment name (e.g. "Gold Members in Mumbai")' },
      description: { type: Type.STRING, description: 'Short description' },
      filterConfig: {
        type: Type.ARRAY,
        description: 'Array of rules. Example: [{"field": "membershipTier", "operator": "equals", "value": "Gold"}]',
        items: {
          type: Type.OBJECT,
          properties: {
            field: { type: Type.STRING, description: 'Field name (totalSpend, orderCount, daysSinceLastOrder, membershipTier, city, gender)' },
            operator: { type: Type.STRING, description: '"equals", "gte", or "lte"' },
            value: { type: Type.STRING, description: 'The value to match' }
          }
        }
      }
    },
    required: ['name', 'filterConfig']
  }
}

const createDraftCampaignTool = {
  name: 'createDraftCampaign',
  description: 'Creates a draft campaign for a BROAD segment. ALWAYS use getSegments first to find the correct segmentId. CRITICAL: Do NOT use this tool if the user wants to message specific named individuals (e.g. "Lucas Davis"). For specific individuals, use searchCustomers then targetCustomers instead.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'A professional internal name for the campaign (e.g. "VIP Spring Promo")'
      },
      segmentId: {
        type: Type.STRING,
        description: 'The exact ID of the target segment.'
      },
      channel: {
        type: Type.STRING,
        description: 'The communication channel to use. Must be exactly one of: "whatsapp", "sms", "email", or "rcs". Map user intent accurately — if the user says WhatsApp use "whatsapp", SMS use "sms", Email use "email", RCS use "rcs".'
      },
      messageTemplate: {
        type: Type.STRING,
        description: 'The message template. Use {{name}} as the placeholder for the customer name. E.g. "Hi {{name}}, here is 10% off!"'
      }
    },
    required: ['name', 'segmentId', 'channel', 'messageTemplate']
  }
}

const dispatchCampaignTool = {
  name: 'dispatchCampaign',
  description: 'Dispatches an existing campaign. Use this when the user asks to send or dispatch a campaign.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      campaignName: {
        type: Type.STRING,
        description: 'The exact name of the campaign to dispatch. Extract this from the user prompt.'
      }
    },
    required: ['campaignName']
  }
}

const getCampaignStatsTool = {
  name: 'getCampaignStats',
  description: 'Gets live statistics for a specific campaign or all campaigns. Use this to report on campaign performance.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      campaignName: {
        type: Type.STRING,
        description: 'Optional. The name of the campaign to search for. If omitted, returns recent campaigns.'
      }
    }
  }
}

const searchCustomersTool = {
  name: 'searchCustomers',
  description: 'Searches for customers by name or returns the top spenders if no name is provided.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      nameQuery: {
        type: Type.STRING,
        description: 'Optional. A name to search for (e.g. "Olivia"). If omitted, returns top 5 highest-spending customers.'
      }
    }
  }
}

const revenueReportTool = {
  name: 'revenueReport',
  description: 'Generates a revenue report across all campaigns showing total revenue, top performing campaigns, conversion rates, and channel breakdown. Use when user asks for revenue report, earnings, or financial performance.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      topN: {
        type: Type.NUMBER,
        description: 'Optional. How many top campaigns to include. Defaults to 5.'
      }
    }
  }
}

const compareCampaignsTool = {
  name: 'compareCampaigns',
  description: 'Compares two or more specific campaigns side by side on key metrics: sent, delivered, opened, clicked, converted, and revenue. Use when the user asks to compare campaigns.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      campaignNames: {
        type: Type.ARRAY,
        description: 'Array of campaign name keywords to search and compare (e.g. ["Platinum", "Gold"]).',
        items: { type: Type.STRING }
      }
    },
    required: ['campaignNames']
  }
}

const predictCampaignOutcomeTool = {
  name: 'predictCampaignOutcome',
  description: 'Predicts the expected outcome of a campaign (open rate, conversion rate, estimated revenue, risk level) based on historical data for the given segment and channel. Use when user asks "predict", "forecast", "what will happen", "estimate results", or "will this work".',
  parameters: {
    type: Type.OBJECT,
    properties: {
      segmentId: {
        type: Type.STRING,
        description: 'The ID of the target segment'
      },
      channel: {
        type: Type.STRING,
        description: 'The channel to use: "whatsapp", "sms", "email", or "rcs"'
      }
    },
    required: ['segmentId', 'channel']
  }
}

const renderDataGridTool = {
  name: 'renderDataGrid',
  description: 'Renders a data grid (table) in the user\'s right canvas. Use this INSTEAD of markdown tables for lists of segments, customers, or campaigns. CRITICAL: Do NOT use this tool if the user asked for a chart or graph. If they asked for a chart, you MUST use renderChart instead.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Title of the data grid' },
      columns: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Array of column headers' },
      rows: { 
        type: Type.ARRAY, 
        items: { type: Type.ARRAY, items: { type: Type.STRING } },
        description: 'Array of rows, where each row is an array of strings corresponding to the columns.'
      }
    },
    required: ['title', 'columns', 'rows']
  }
}

const renderChartTool = {
  name: 'renderChart',
  description: 'CRITICAL: You MUST use this tool (and NOT renderDataGrid) if the user asks for a chart, graph, or plot. Renders a beautiful chart in the user\'s right canvas.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'Title of the chart' },
      chartType: { type: Type.STRING, description: '"bar", "line", "pie", or "area"' },
      xAxisKey: { type: Type.STRING, description: 'The property name in data objects for the X-axis (e.g., "name", "channel")' },
      seriesKey: { type: Type.STRING, description: 'The property name in data objects for the Y-axis values (e.g., "revenue", "sent")' },
      seriesName: { type: Type.STRING, description: 'Human-readable label for the Y-axis (e.g., "Revenue ($)", "Total Sent")' },
      data: {
        type: Type.ARRAY,
        items: { type: Type.OBJECT },
        description: 'Array of data objects containing the X-axis key and Y-axis key. Example: [{"name": "Summer", "revenue": 500}]'
      }
    },
    required: ['title', 'chartType', 'xAxisKey', 'seriesKey', 'seriesName', 'data']
  }
}

const targetCustomersTool = {
  name: 'targetCustomers',
  description: 'Creates a campaign targeting SPECIFIC individual customers by name or ID. Use this when the user wants to send a campaign to one or more named customers (e.g. "send an email to Lucas Davis", "message these specific customers", "send a win-back to [customer name]"). First use searchCustomers to find their IDs, then call this tool with the customer IDs.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      customerIds: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: 'Array of customer IDs to target (e.g. ["cust_abc", "cust_xyz"])'
      },
      customerNames: {
        type: Type.STRING,
        description: 'Comma-separated display names of the targeted customers (for the segment name, e.g. "Lucas Davis, Ava Garcia")'
      },
      channel: {
        type: Type.STRING,
        description: 'The communication channel: "whatsapp", "sms", "email", or "rcs"'
      },
      messageTemplate: {
        type: Type.STRING,
        description: 'The personalised message template. Use {{name}} for customer name placeholder.'
      },
      campaignName: {
        type: Type.STRING,
        description: 'A short internal name for this targeted campaign (e.g. "Win-Back – Lucas Davis")'
      }
    },
    required: ['customerIds', 'customerNames', 'channel', 'messageTemplate', 'campaignName']
  }
}

const tools = [{ functionDeclarations: [getSegmentsTool, createSegmentTool, createDraftCampaignTool, dispatchCampaignTool, getCampaignStatsTool, searchCustomersTool, revenueReportTool, compareCampaignsTool, predictCampaignOutcomeTool, renderDataGridTool, renderChartTool, targetCustomersTool] }]

// Retry helper – retries up to 3 times on 503 with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      const is503 = err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('UNAVAILABLE')
      if (is503 && attempt < retries) {
        console.warn(`Gemini 503 – retrying in ${delayMs * attempt}ms (attempt ${attempt}/${retries})`)
        await new Promise(r => setTimeout(r, delayMs * attempt))
      } else {
        throw err
      }
    }
  }
  throw new Error('Max retries exceeded')
}

router.post('/chat', asyncHandler(async (req, res) => {
  const { prompt, history } = req.body

  if (!process.env.GEMINI_API_KEY) {
    res.status(500).json({ error: 'GEMINI_API_KEY is not set in backend environment variables.' })
    return
  }

  try {
    const chatHistory = history ? history.map((msg: any) => ({
      role: msg.role === 'agent' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    })) : []

    const chat = ai.chats.create({
      model: 'gemini-3.1-flash-lite',
      history: chatHistory,
      config: {
        systemInstruction: `You are XenoAI, the intelligent marketing assistant for a luxury fashion CRM. You help marketers make smart decisions fast.

CAPABILITIES:
- Fetch segments, create new AI-generated segments
- Draft campaigns (email, sms, whatsapp, rcs) with professional copy
- Dispatch campaigns to customers
- Pull live campaign stats & revenue reports
- Compare campaigns side by side
- Search and profile customers
- PREDICT campaign outcomes before launch (open rates, conversions, estimated revenue) based on historical segment & channel data

CHANNELS: Use exactly: "whatsapp", "sms", "email", "rcs"

PREDICTION: When a user asks "what will happen if I send X to Y" or "predict outcome" or "will this campaign work", call predictCampaignOutcome tool to generate intelligent predictions based on past similar campaigns.

DRAFTING CAMPAIGNS (CRITICAL TOOL CHAINING): When the user asks to draft a campaign, you MUST call 'createDraftCampaign'. If you don't know the segmentId, you must FIRST call 'getSegments' or 'createSegment', wait for the result, and then IMMEDIATELY call 'createDraftCampaign'. Do not stop until the campaign is drafted!

TARGETING SPECIFIC CUSTOMERS: If the user mentions a specific person's name (e.g., "Lucas Davis", "Ava Garcia", "message this customer"), you MUST follow these exact steps:
  1. Call 'searchCustomers' to find their customer ID.
  2. Call 'targetCustomers' with their ID to create the campaign.
  CRITICAL: Under NO circumstances should you call 'getSegments' or 'createDraftCampaign' when a specific individual is targeted.

VISUALIZATION: When a user asks for a chart, graph, or visual plot, you MUST call the 'renderChart' tool to draw it using the data you fetched. Only use 'renderDataGrid' if they just asked for a list or table of data. DO NOT return markdown tables or text-based charts.

TONE: Concise, sharp, data-driven. Never verbose.

EMAIL templates: Write full professional email with Subject line, body, and sign-off.
SMS/WhatsApp: Short, punchy, personalized. Use {{name}}.
When presenting data: always highlight the most important insight first.`,
        tools: tools,
        temperature: 0.2
      }
    })

    let response = await withRetry(() => chat.sendMessage({ message: prompt }))
    const actions: any[] = []
    let lastStructured: { type: string; data: any } | null = null

    // Import dispatcher lazily so we can use it
    const { dispatchCampaign } = require('../services/dispatcher')

    // Handle tool calls if any
    while (response.functionCalls && response.functionCalls.length > 0) {
      for (const call of response.functionCalls) {
        if (call.name === 'getSegments') {
          actions.push({
            name: 'getSegments',
            description: 'Searching database for customer segments...',
            args: call.args || {}
          })
          const { data: segments } = await supabase.from('Segment').select('id, name, customerCount')
          
          lastStructured = {
            type: 'datagrid',
            data: {
              title: 'Customer Segments',
              columns: ['Segment Name', 'Customer Count', 'Segment ID'],
              rows: (segments || []).map((s: any) => [s.name, s.customerCount.toLocaleString(), s.id])
            }
          }

          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: 'getSegments',
                response: { success: true, message: "Segments rendered in datagrid on the right canvas. Please provide a brief 1-sentence text summary of the segments available. Do NOT print a table." }
              }
            }]
          })
        } else if (call.name === 'createSegment') {
          const { name, description, filterConfig } = call.args as any
          actions.push({
            name: 'createSegment',
            description: `Creating segment "${name}"...`,
            args: call.args || {}
          })

          const { applySupabaseFilters } = require('../services/segmentFilter')
          // ensure number casting
          for (const rule of filterConfig) {
             if (typeof rule.value === 'string' && !isNaN(Number(rule.value))) {
                 rule.value = Number(rule.value)
             }
          }
          let query = supabase.from('Customer').select('*', { count: 'exact', head: true })
          query = applySupabaseFilters(query, filterConfig)
          const { count } = await query

          const { data: segment } = await supabase.from('Segment').insert({
            id: generateId(),
            name,
            description: description || '',
            filterConfig,
            customerCount: count || 0,
            createdBy: 'ai',
            updatedAt: new Date().toISOString()
          }).select().single()
          
          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: 'createSegment',
                response: { success: true, segmentId: segment.id, customerCount: count }
              }
            }]
          })
        } else if (call.name === 'createDraftCampaign') {
          const { name, segmentId, channel, messageTemplate } = call.args as any
          const uniqueName = `${name} #${Math.floor(Math.random() * 1000)}`
          actions.push({
            name: 'createDraftCampaign',
            description: `Creating draft ${channel.toUpperCase()} campaign "${uniqueName}"...`,
            args: call.args || {}
          })

          const { data: segment } = await supabase.from('Segment').select('*').eq('id', segmentId).single()
          
          const { data: campaign } = await supabase.from('Campaign').insert({
            id: generateId(),
            name: uniqueName,
            segmentId,
            channel,
            messageTemplate,
            status: 'draft'
          }).select().single()

          if (campaign) {
            await supabase.from('CampaignStats').insert({
              id: generateId(),
              campaignId: campaign.id,
              total: segment?.customerCount || 0
            })
          }

          // Auto-compute prediction based on historical data for same channel
          const { data: pastRaw } = await supabase
            .from('Campaign')
            .select('*, stats:CampaignStats(*)')
            .eq('channel', channel)
            .in('status', ['sent', 'completed'])
          const past = (pastRaw || []).map((c: any) => ({
            ...c,
            stats: Array.isArray(c.stats) ? c.stats[0] || null : c.stats
          })).filter((c: any) => c.stats?.total > 0)

          const avgOpenRate = past.length > 0 ? past.reduce((s: number, c: any) => s + (c.stats.opened / c.stats.total), 0) / past.length : 0.35
          const avgConvRate = past.length > 0 ? past.reduce((s: number, c: any) => s + (c.stats.converted / c.stats.total), 0) / past.length : 0.08
          const avgRevPerConv = past.length > 0 ? past.reduce((s: number, c: any) => s + (c.stats.converted > 0 ? c.stats.revenue / c.stats.converted : 0), 0) / past.length : 5000

          const audienceSize = segment?.customerCount || 0
          const predictedConversions = Math.round(audienceSize * avgConvRate)
          const predictedRevenue = Math.round(predictedConversions * avgRevPerConv)
          const riskLevel = avgConvRate < 0.05 ? 'High' : avgConvRate < 0.10 ? 'Medium' : 'Low'

          // Alternate channel suggestions
          const channelAlts = ['email', 'sms', 'whatsapp', 'rcs'].filter(c => c !== channel)

          lastStructured = {
            type: 'draft',
            data: {
              campaign: {
                id: campaign?.id,
                name: uniqueName,
                channel,
                segmentName: segment?.name,
                segmentId,
                audienceSize,
                messageTemplate
              },
              prediction: {
                basedOnCampaigns: past.length,
                openRate: (avgOpenRate * 100).toFixed(1),
                opens: Math.round(audienceSize * avgOpenRate),
                conversionRate: (avgConvRate * 100).toFixed(1),
                conversions: predictedConversions,
                estimatedRevenue: predictedRevenue,
                revenuePerSend: audienceSize > 0 ? Math.round(predictedRevenue / audienceSize) : 0,
                riskLevel
              },
              suggestions: [
                { label: `Dispatch this campaign`, prompt: `Dispatch the campaign "${uniqueName}"` },
                { label: `Try ${channelAlts[0].toUpperCase()} instead`, prompt: `Draft a ${channelAlts[0]} campaign for the same segment (${segment?.name}) with similar content` },
                { label: `Predict ${channelAlts[1].toUpperCase()} outcome`, prompt: `Predict the outcome if I send a ${channelAlts[1]} campaign to the ${segment?.name} segment` },
                { label: 'Show top spenders in segment', prompt: `Who are the top 5 spenders in the ${segment?.name} segment?` },
              ]
            }
          }

          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: 'createDraftCampaign',
                response: { success: true, campaignId: campaign?.id }
              }
            }]
          })
        } else if (call.name === 'dispatchCampaign') {
          const { campaignName } = call.args as any
          let campaignId = null
          
          if (campaignName) {
            const cleanName = campaignName.replace(/["']/g, '').trim()
            const { data } = await supabase.from('Campaign').select('id').ilike('name', `%${cleanName}%`).order('createdAt', { ascending: false }).limit(1).single()
            if (data) campaignId = data.id
          }

          if (!campaignId) {
             response = await chat.sendMessage({
               message: [{ functionResponse: { name: 'dispatchCampaign', response: { error: 'Could not find the specified campaign to dispatch. Did you create it first?' } } }]
             })
             continue
          }

          actions.push({
            name: 'dispatchCampaign',
            description: `Dispatching campaign "${campaignName}"...`,
            args: call.args || {}
          })

          await supabase.from('Campaign').update({ status: 'sending' }).eq('id', campaignId)

          dispatchCampaign(campaignId)
          
          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: 'dispatchCampaign',
                response: { success: true, status: 'sending' }
              }
            }]
          })
        } else if (call.name === 'getCampaignStats') {
          const { campaignName } = call.args as any
          actions.push({
            name: 'getCampaignStats',
            description: `Fetching stats for ${campaignName || 'recent campaigns'}...`,
            args: call.args || {}
          })

          let q = supabase.from('Campaign').select('*, stats:CampaignStats(*)')
          if (campaignName) {
            q = q.ilike('name', `%${campaignName}%`)
          } else {
            q = q.order('createdAt', { ascending: false })
          }
          let { data: rawCampaigns } = await q.limit(5)
          const campaigns = rawCampaigns?.map((c: any) => ({
            ...c,
            stats: Array.isArray(c.stats) ? c.stats[0] || null : c.stats
          })) || []

          lastStructured = {
            type: 'datagrid',
            data: {
              title: campaignName ? `Stats for "${campaignName}"` : 'Recent Campaign Stats',
              columns: ['Campaign', 'Channel', 'Status', 'Sent', 'Opened', 'Converted', 'Revenue'],
              rows: campaigns.map((c: any) => [
                c.name,
                c.channel,
                c.status,
                (c.stats?.total || 0).toLocaleString(),
                (c.stats?.opened || 0).toLocaleString(),
                (c.stats?.converted || 0).toLocaleString(),
                `$${(c.stats?.revenue || 0).toLocaleString()}`
              ])
            }
          }

          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: 'getCampaignStats',
                response: { success: true, message: "Campaign stats rendered in datagrid. Please provide a brief text summary of the performance. Do NOT print a table." }
              }
            }]
          })
        } else if (call.name === 'searchCustomers') {
          const { nameQuery } = call.args as any
          actions.push({
            name: 'searchCustomers',
            description: `Searching for customers: ${nameQuery || 'Top Spenders'}...`,
            args: call.args || {}
          })

          let q = supabase.from('Customer').select('id, name, email, totalSpend, orderCount, membershipTier')
          if (nameQuery) {
            q = q.ilike('name', `%${nameQuery}%`)
          } else {
            q = q.order('totalSpend', { ascending: false })
          }
          const { data: customers } = await q.limit(5)
          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: 'searchCustomers',
                response: { customers }
              }
            }]
          })
        } else if (call.name === 'targetCustomers') {
          const { customerIds, customerNames, channel, messageTemplate, campaignName } = call.args as any
          actions.push({
            name: 'targetCustomers',
            description: `Creating targeted campaign for ${customerNames}...`,
            args: call.args || {}
          })

          // 1. Auto-create a micro-segment for these specific customer IDs
          const segmentName = `Target: ${customerNames}`.slice(0, 60)
          const filterConfig = [{ field: 'id', operator: 'in', value: customerIds }]

          const { data: segment } = await supabase.from('Segment').insert({
            id: generateId(),
            name: segmentName,
            description: `Auto-created for targeted campaign to ${customerNames}`,
            filterConfig,
            customerCount: customerIds.length,
            createdBy: 'ai',
            updatedAt: new Date().toISOString()
          }).select().single()

          if (!segment) {
            response = await chat.sendMessage({
              message: [{ functionResponse: { name: 'targetCustomers', response: { error: 'Failed to create micro-segment' } } }]
            })
            continue
          }

          // 2. Create the campaign draft against this micro-segment
          const tcUniqueName = `${campaignName} #${Math.floor(Math.random() * 1000)}`
          const { data: tcCampaign } = await supabase.from('Campaign').insert({
            id: generateId(),
            name: tcUniqueName,
            segmentId: segment.id,
            channel,
            messageTemplate,
            status: 'draft'
          }).select().single()

          if (tcCampaign) {
            await supabase.from('CampaignStats').insert({
              id: generateId(),
              campaignId: tcCampaign.id,
              total: customerIds.length
            })
          }

          lastStructured = {
            type: 'draft',
            data: {
              campaign: {
                id: tcCampaign?.id,
                name: tcUniqueName,
                channel,
                segmentName,
                segmentId: segment.id,
                audienceSize: customerIds.length,
                messageTemplate
              },
              prediction: {
                basedOnCampaigns: 0,
                openRate: '35.0',
                opens: Math.round(customerIds.length * 0.35),
                conversionRate: '8.0',
                conversions: Math.round(customerIds.length * 0.08),
                estimatedRevenue: Math.round(customerIds.length * 0.08 * 5000),
                revenuePerSend: 400,
                riskLevel: 'Low'
              },
              suggestions: [
                { label: 'Dispatch this campaign now', prompt: `Dispatch the campaign "${tcUniqueName}"` },
                { label: 'Edit the message', prompt: `Rewrite the message for "${tcUniqueName}" to be more personalised` },
              ]
            }
          }

          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: 'targetCustomers',
                response: { success: true, campaignId: tcCampaign?.id, segmentId: segment.id, customerCount: customerIds.length }
              }
            }]
          })
        } else if (call.name === 'revenueReport') {
          const { topN } = call.args as any
          const limit = topN || 5
          actions.push({
            name: 'revenueReport',
            description: `Generating revenue report for top ${limit} campaigns...`,
            args: call.args || {}
          })

          const { data: allRawCampaigns } = await supabase.from('Campaign').select('*, stats:CampaignStats(*)').order('createdAt', { ascending: false })
          const allCampaigns = (allRawCampaigns || []).map((c: any) => ({
            ...c,
            stats: Array.isArray(c.stats) ? c.stats[0] || null : c.stats
          }))

          const totalRevenue = allCampaigns.reduce((sum: number, c: any) => sum + (c.stats?.revenue || 0), 0)
          const totalConversions = allCampaigns.reduce((sum: number, c: any) => sum + (c.stats?.converted || 0), 0)
          const totalSent = allCampaigns.reduce((sum: number, c: any) => sum + (c.stats?.total || 0), 0)

          const byChannel = allCampaigns.reduce((acc: any, c: any) => {
            const ch = c.channel || 'unknown'
            if (!acc[ch]) acc[ch] = { count: 0, revenue: 0, converted: 0 }
            acc[ch].count++
            acc[ch].revenue += c.stats?.revenue || 0
            acc[ch].converted += c.stats?.converted || 0
            return acc
          }, {})

          const topCampaigns = [...allCampaigns]
            .sort((a: any, b: any) => (b.stats?.revenue || 0) - (a.stats?.revenue || 0))
            .slice(0, limit)
            .map((c: any) => ({
              name: c.name,
              channel: c.channel,
              status: c.status,
              revenue: c.stats?.revenue || 0,
              converted: c.stats?.converted || 0,
              sent: c.stats?.total || 0,
              conversionRate: c.stats?.total ? ((c.stats?.converted || 0) / c.stats.total * 100).toFixed(1) + '%' : '0%'
            }))

          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: 'revenueReport',
                response: { totalRevenue, totalConversions, totalSent, totalCampaigns: allCampaigns.length, byChannel, topCampaigns }
              }
            }]
          })
        } else if (call.name === 'compareCampaigns') {
          const { campaignNames } = call.args as any
          actions.push({
            name: 'compareCampaigns',
            description: `Comparing campaigns: ${campaignNames.join(' vs ')}...`,
            args: call.args || {}
          })

          const campaigns = await Promise.all(
            campaignNames.map(async (name: string) => {
              const { data: res } = await supabase.from('Campaign')
                .select('*, stats:CampaignStats(*), segment:Segment(name, customerCount)')
                .ilike('name', `%${name}%`)
                .limit(1)
                .single()
              if (!res) return null
              return {
                ...res,
                stats: Array.isArray(res.stats) ? res.stats[0] || null : res.stats,
                segment: Array.isArray(res.segment) ? res.segment[0] || null : res.segment
              }
            })
          )

          const comparison = campaigns
            .filter(Boolean)
            .map((c: any) => ({
              name: c.name,
              channel: c.channel,
              status: c.status,
              segment: c.segment?.name || 'N/A',
              audienceSize: c.segment?.customerCount || 0,
              sent: c.stats?.total || 0,
              delivered: c.stats?.delivered || 0,
              opened: c.stats?.opened || 0,
              clicked: c.stats?.clicked || 0,
              converted: c.stats?.converted || 0,
              revenue: c.stats?.revenue || 0,
              conversionRate: c.stats?.total ? ((c.stats?.converted || 0) / c.stats.total * 100).toFixed(1) + '%' : '0%',
              revenuePerSend: c.stats?.total ? (((c.stats?.revenue || 0) / c.stats.total)).toFixed(0) : '0'
            }))

          lastStructured = {
            type: 'datagrid',
            data: {
              title: 'Campaign Comparison',
              columns: ['Metric', ...comparison.map((c: any) => c.name)],
              rows: [
                ['Status', ...comparison.map((c: any) => c.status)],
                ['Channel', ...comparison.map((c: any) => c.channel)],
                ['Segment', ...comparison.map((c: any) => c.segment)],
                ['Revenue', ...comparison.map((c: any) => `$${c.revenue.toLocaleString()}`)],
                ['Conversion Rate', ...comparison.map((c: any) => c.conversionRate)],
                ['Sent', ...comparison.map((c: any) => c.sent.toLocaleString())],
                ['Opened', ...comparison.map((c: any) => c.opened.toLocaleString())],
                ['Converted', ...comparison.map((c: any) => c.converted.toLocaleString())],
              ]
            }
          }

          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: 'compareCampaigns',
                response: { success: true, message: "Comparison data rendered in datagrid. Please provide a brief text summary analyzing the comparison. Do NOT print a table." }
              }
            }]
          })
        } else if (call.name === 'predictCampaignOutcome') {
          const { segmentId, channel } = call.args as any
          actions.push({
            name: 'predictCampaignOutcome',
            description: `Analysing historical ${channel} campaigns for this segment to predict outcome...`,
            args: call.args || {}
          })

          // Fetch segment info
          const { data: segment } = await supabase.from('Segment').select('name, customerCount').eq('id', segmentId).maybeSingle()

          // Fetch all past campaigns for this channel to compute average rates
          const { data: pastRaw } = await supabase
            .from('Campaign')
            .select('*, stats:CampaignStats(*)')
            .eq('channel', channel)
            .in('status', ['sent', 'completed'])

          const past = (pastRaw || []).map((c: any) => ({
            ...c,
            stats: Array.isArray(c.stats) ? c.stats[0] || null : c.stats
          })).filter((c: any) => c.stats?.total > 0)

          const avgOpenRate = past.length > 0
            ? past.reduce((s: number, c: any) => s + (c.stats.opened / c.stats.total), 0) / past.length
            : 0.35
          const avgConvRate = past.length > 0
            ? past.reduce((s: number, c: any) => s + (c.stats.converted / c.stats.total), 0) / past.length
            : 0.08
          const avgRevPerConv = past.length > 0
            ? past.reduce((s: number, c: any) => s + (c.stats.converted > 0 ? c.stats.revenue / c.stats.converted : 0), 0) / past.length
            : 5000

          const audienceSize = segment?.customerCount || 0
          const predictedOpens = Math.round(audienceSize * avgOpenRate)
          const predictedConversions = Math.round(audienceSize * avgConvRate)
          const predictedRevenue = Math.round(predictedConversions * avgRevPerConv)
          const riskLevel = avgConvRate < 0.05 ? 'High' : avgConvRate < 0.10 ? 'Medium' : 'Low'

          const prediction = {
            segment: segment?.name,
            audienceSize,
            channel,
            basedOnCampaigns: past.length,
            predicted: {
              openRate: (avgOpenRate * 100).toFixed(1) + '%',
              opens: predictedOpens,
              conversionRate: (avgConvRate * 100).toFixed(1) + '%',
              conversions: predictedConversions,
              estimatedRevenue: predictedRevenue,
              revenuePerSend: audienceSize > 0 ? (predictedRevenue / audienceSize).toFixed(0) : 0,
              riskLevel
            }
          }

          lastStructured = { type: 'prediction', data: prediction }

          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: 'predictCampaignOutcome',
                response: { prediction }
              }
            }]
          })
        } else if (call.name === 'renderDataGrid') {
          const { title, columns, rows } = call.args as any
          actions.push({
            name: 'renderDataGrid',
            description: `Rendering data grid: ${title}...`,
            args: call.args || {}
          })
          
          lastStructured = {
            type: 'datagrid',
            data: { title, columns, rows }
          }
          
          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: 'renderDataGrid',
                response: { success: true, message: "Data grid displayed in the user's canvas. Do not print a table in your text response." }
              }
            }]
          })
        } else if (call.name === 'renderChart') {
          const { title, chartType, xAxisKey, seriesKey, seriesName, data } = call.args as any
          const series = [{ key: seriesKey, name: seriesName, color: '#8b5cf6' }] // Violet color to match UI

          actions.push({
            name: 'renderChart',
            description: `Rendering ${chartType} chart: ${title}...`,
            args: call.args || {}
          })
          
          lastStructured = {
            type: 'chart',
            data: { title, chartType, xAxisKey, series, data }
          }
          
          response = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: 'renderChart',
                response: { success: true, message: "Chart displayed in the user's canvas. Do not print a table or graph in your text response." }
              }
            }]
          })
        }
      }
    }

    res.json({ reply: response.text, actions, structured: lastStructured })
    return

  } catch (error: any) {
    console.error('AI Chat Error:', error)
    res.status(500).json({ error: 'AI Agent error: ' + error.message })
    return
  }
}))

router.get('/recommendations', asyncHandler(async (req, res) => {
  try {
    const { data: segments } = await supabase.from('Segment').select('name').limit(5)
    const { data: campaigns } = await supabase.from('Campaign').select('name, channel').limit(5)

    const segmentNames = segments?.map(s => s.name).join(', ') || 'none'
    const campaignNames = campaigns?.map(c => c.name).join(', ') || 'none'

    const prompt = `You are a CRM AI assistant. Suggest 8 diverse, actionable quick-prompts the user can click.
Context:
Recent Segments: ${segmentNames}
Recent Campaigns: ${campaignNames}

Return a JSON object with a single key "chips" containing an array of exactly 8 objects.
Each object must have:
- "icon": a string representing a lucide-react icon name (e.g. "TrendingUp", "IndianRupee", "GitCompare", "BarChart3", "Users", "Mail", "MessageSquare", "Zap", "Activity", "Search", "Target", "Plus")
- "label": a short 2-3 word label (e.g. "Predict Outcome", "Draft Email")
- "prompt": the actual full sentence prompt to send to the AI
- "color": you can omit this since the frontend will force a uniform color, or just provide "primary".

Ensure output is strictly valid JSON.`

    const axios = require('axios')
    const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'system', content: prompt }],
      response_format: { type: 'json_object' }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    const result = JSON.parse(groqResponse.data.choices[0].message.content)
    res.json(result.chips || [])

  } catch (error: any) {
    console.error('Groq API Error:', error.response?.data || error.message)
    res.status(500).json({ error: 'Failed to fetch recommendations' })
  }
}))

export default router
