import { Type } from '@google/genai'

export const getSegmentsTool = {
  name: 'getSegments',
  description: 'Gets a list of all customer segments and their IDs. Use this to find the right segmentId when the user asks to target a specific audience. CRITICAL: This tool automatically renders a datagrid in the UI. DO NOT call renderDataGrid yourself when using this tool, or you will overwrite the real data with hallucinations.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  }
}

export const createSegmentTool = {
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
            value: { type: Type.STRING, description: 'The value to match. VALID TIERS: "Platinum", "Gold", "Silver", "None". VALID GENDER: "male", "female".' }
          }
        }
      }
    },
    required: ['name', 'filterConfig']
  }
}

export const createDraftCampaignTool = {
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

export const dispatchCampaignTool = {
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

export const getCampaignStatsTool = {
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

export const searchCustomersTool = {
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

export const revenueReportTool = {
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

export const compareCampaignsTool = {
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

export const predictCampaignOutcomeTool = {
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

export const renderDataGridTool = {
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

export const renderChartTool = {
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

export const targetCustomersTool = {
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

export const tools = [{ 
  functionDeclarations: [
    getSegmentsTool, 
    createSegmentTool, 
    createDraftCampaignTool, 
    dispatchCampaignTool, 
    getCampaignStatsTool, 
    searchCustomersTool, 
    revenueReportTool, 
    compareCampaignsTool, 
    predictCampaignOutcomeTool, 
    renderDataGridTool, 
    renderChartTool, 
    targetCustomersTool
  ] 
}]
