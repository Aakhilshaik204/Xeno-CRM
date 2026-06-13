/**
 * Seed script for XenoCRM
 * Brand: Maison Luxe — a premium fashion label
 *
 * Creates:
 *  - 50 customers across 5 cities
 *  - ~250 orders spanning 12 months
 *  - 4 segments: VIPs, Churned, New Users, High Spenders
 *  - 2 completed campaigns with full receipt history
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function daysAgoRandom(minDays: number, maxDays: number): Date {
  return daysAgo(randomBetween(minDays, maxDays))
}

// ─── Reference Data ───────────────────────────────────────────────────────────

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai']
const GENDERS: ('male' | 'female')[] = ['male', 'female']

const FASHION_ITEMS = [
  { name: 'Silk Kurta', category: 'Tops', price: 2800 },
  { name: 'Linen Trousers', category: 'Bottoms', price: 3200 },
  { name: 'Cashmere Shawl', category: 'Accessories', price: 4500 },
  { name: 'Embroidered Jacket', category: 'Outerwear', price: 7800 },
  { name: 'Designer Saree', category: 'Ethnic', price: 12000 },
  { name: 'Leather Handbag', category: 'Bags', price: 8500 },
  { name: 'Ankle Boots', category: 'Footwear', price: 5500 },
  { name: 'Formal Shirt', category: 'Tops', price: 1800 },
  { name: 'Palazzo Pants', category: 'Bottoms', price: 2200 },
  { name: 'Printed Scarf', category: 'Accessories', price: 1200 },
  { name: 'Blazer', category: 'Outerwear', price: 6500 },
  { name: 'Anarkali Suit', category: 'Ethnic', price: 9500 },
  { name: 'Clutch Bag', category: 'Bags', price: 3800 },
  { name: 'Block Heels', category: 'Footwear', price: 4200 },
  { name: 'Denim Jacket', category: 'Outerwear', price: 4800 },
  { name: 'Cotton Dress', category: 'Dresses', price: 2600 },
  { name: 'Sequin Dress', category: 'Dresses', price: 6800 },
  { name: 'Kurti Set', category: 'Ethnic', price: 3400 },
  { name: 'Sunglasses', category: 'Accessories', price: 2200 },
  { name: 'Sneakers', category: 'Footwear', price: 3600 },
]

// Pre-defined customer profiles (deterministic for consistent seed)
const CUSTOMER_PROFILES = [
  // VIP customers (high spend, frequent buyers)
  { name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '+919876543201', city: 'Mumbai', gender: 'female' as const, spendProfile: 'vip' },
  { name: 'Rahul Mehta', email: 'rahul.mehta@email.com', phone: '+919876543202', city: 'Delhi', gender: 'male' as const, spendProfile: 'vip' },
  { name: 'Ananya Krishnan', email: 'ananya.k@email.com', phone: '+919876543203', city: 'Bangalore', gender: 'female' as const, spendProfile: 'vip' },
  { name: 'Vikram Patel', email: 'vikram.patel@email.com', phone: '+919876543204', city: 'Mumbai', gender: 'male' as const, spendProfile: 'vip' },
  { name: 'Deepika Nair', email: 'deepika.nair@email.com', phone: '+919876543205', city: 'Hyderabad', gender: 'female' as const, spendProfile: 'vip' },
  { name: 'Arjun Singh', email: 'arjun.singh@email.com', phone: '+919876543206', city: 'Delhi', gender: 'male' as const, spendProfile: 'vip' },
  { name: 'Kavya Reddy', email: 'kavya.reddy@email.com', phone: '+919876543207', city: 'Chennai', gender: 'female' as const, spendProfile: 'vip' },
  { name: 'Rohan Gupta', email: 'rohan.gupta@email.com', phone: '+919876543208', city: 'Bangalore', gender: 'male' as const, spendProfile: 'vip' },

  // High spenders (moderate-high spend)
  { name: 'Sneha Joshi', email: 'sneha.joshi@email.com', phone: '+919876543209', city: 'Mumbai', gender: 'female' as const, spendProfile: 'high' },
  { name: 'Karthik Iyer', email: 'karthik.iyer@email.com', phone: '+919876543210', city: 'Chennai', gender: 'male' as const, spendProfile: 'high' },
  { name: 'Pooja Verma', email: 'pooja.verma@email.com', phone: '+919876543211', city: 'Delhi', gender: 'female' as const, spendProfile: 'high' },
  { name: 'Aditya Kumar', email: 'aditya.kumar@email.com', phone: '+919876543212', city: 'Hyderabad', gender: 'male' as const, spendProfile: 'high' },
  { name: 'Meera Pillai', email: 'meera.pillai@email.com', phone: '+919876543213', city: 'Bangalore', gender: 'female' as const, spendProfile: 'high' },
  { name: 'Suresh Rao', email: 'suresh.rao@email.com', phone: '+919876543214', city: 'Chennai', gender: 'male' as const, spendProfile: 'high' },
  { name: 'Nisha Agarwal', email: 'nisha.agarwal@email.com', phone: '+919876543215', city: 'Mumbai', gender: 'female' as const, spendProfile: 'high' },
  { name: 'Rajesh Khanna', email: 'rajesh.khanna@email.com', phone: '+919876543216', city: 'Delhi', gender: 'male' as const, spendProfile: 'high' },
  { name: 'Sunita Bose', email: 'sunita.bose@email.com', phone: '+919876543217', city: 'Bangalore', gender: 'female' as const, spendProfile: 'high' },
  { name: 'Manoj Tiwari', email: 'manoj.tiwari@email.com', phone: '+919876543218', city: 'Mumbai', gender: 'male' as const, spendProfile: 'high' },
  { name: 'Divya Menon', email: 'divya.menon@email.com', phone: '+919876543219', city: 'Hyderabad', gender: 'female' as const, spendProfile: 'high' },
  { name: 'Sanjay Dubey', email: 'sanjay.dubey@email.com', phone: '+919876543220', city: 'Chennai', gender: 'male' as const, spendProfile: 'high' },

  // Regular customers
  { name: 'Anjali Shah', email: 'anjali.shah@email.com', phone: '+919876543221', city: 'Mumbai', gender: 'female' as const, spendProfile: 'regular' },
  { name: 'Pranav Malhotra', email: 'pranav.m@email.com', phone: '+919876543222', city: 'Delhi', gender: 'male' as const, spendProfile: 'regular' },
  { name: 'Lakshmi Narayan', email: 'lakshmi.n@email.com', phone: '+919876543223', city: 'Bangalore', gender: 'female' as const, spendProfile: 'regular' },
  { name: 'Vivek Mishra', email: 'vivek.mishra@email.com', phone: '+919876543224', city: 'Hyderabad', gender: 'male' as const, spendProfile: 'regular' },
  { name: 'Geeta Choudhary', email: 'geeta.c@email.com', phone: '+919876543225', city: 'Chennai', gender: 'female' as const, spendProfile: 'regular' },
  { name: 'Amit Banerjee', email: 'amit.banerjee@email.com', phone: '+919876543226', city: 'Mumbai', gender: 'male' as const, spendProfile: 'regular' },
  { name: 'Rekha Pandey', email: 'rekha.pandey@email.com', phone: '+919876543227', city: 'Delhi', gender: 'female' as const, spendProfile: 'regular' },
  { name: 'Harsh Vardhan', email: 'harsh.v@email.com', phone: '+919876543228', city: 'Bangalore', gender: 'male' as const, spendProfile: 'regular' },
  { name: 'Sonal Kapoor', email: 'sonal.kapoor@email.com', phone: '+919876543229', city: 'Mumbai', gender: 'female' as const, spendProfile: 'regular' },
  { name: 'Nitin Saxena', email: 'nitin.saxena@email.com', phone: '+919876543230', city: 'Hyderabad', gender: 'male' as const, spendProfile: 'regular' },

  // Churned customers (haven't bought in 70-120 days)
  { name: 'Swati Tripathi', email: 'swati.t@email.com', phone: '+919876543231', city: 'Chennai', gender: 'female' as const, spendProfile: 'churned' },
  { name: 'Gaurav Shukla', email: 'gaurav.shukla@email.com', phone: '+919876543232', city: 'Delhi', gender: 'male' as const, spendProfile: 'churned' },
  { name: 'Madhuri Patil', email: 'madhuri.patil@email.com', phone: '+919876543233', city: 'Mumbai', gender: 'female' as const, spendProfile: 'churned' },
  { name: 'Ravi Shankar', email: 'ravi.shankar@email.com', phone: '+919876543234', city: 'Bangalore', gender: 'male' as const, spendProfile: 'churned' },
  { name: 'Sujata Desai', email: 'sujata.desai@email.com', phone: '+919876543235', city: 'Hyderabad', gender: 'female' as const, spendProfile: 'churned' },
  { name: 'Prakash Nambiar', email: 'prakash.n@email.com', phone: '+919876543236', city: 'Chennai', gender: 'male' as const, spendProfile: 'churned' },
  { name: 'Asha Pillai', email: 'asha.pillai@email.com', phone: '+919876543237', city: 'Mumbai', gender: 'female' as const, spendProfile: 'churned' },
  { name: 'Sunil Chauhan', email: 'sunil.chauhan@email.com', phone: '+919876543238', city: 'Delhi', gender: 'male' as const, spendProfile: 'churned' },
  { name: 'Kavitha Subramanian', email: 'kavitha.s@email.com', phone: '+919876543239', city: 'Bangalore', gender: 'female' as const, spendProfile: 'churned' },
  { name: 'Dinesh Jain', email: 'dinesh.jain@email.com', phone: '+919876543240', city: 'Hyderabad', gender: 'male' as const, spendProfile: 'churned' },

  // New users (joined in last 20 days, 1-2 orders)
  { name: 'Ritika Sharma', email: 'ritika.sharma@email.com', phone: '+919876543241', city: 'Mumbai', gender: 'female' as const, spendProfile: 'new' },
  { name: 'Karan Sethi', email: 'karan.sethi@email.com', phone: '+919876543242', city: 'Delhi', gender: 'male' as const, spendProfile: 'new' },
  { name: 'Prathima Rao', email: 'prathima.rao@email.com', phone: '+919876543243', city: 'Bangalore', gender: 'female' as const, spendProfile: 'new' },
  { name: 'Akshay Kulkarni', email: 'akshay.k@email.com', phone: '+919876543244', city: 'Hyderabad', gender: 'male' as const, spendProfile: 'new' },
  { name: 'Tanya Chatterjee', email: 'tanya.c@email.com', phone: '+919876543245', city: 'Chennai', gender: 'female' as const, spendProfile: 'new' },
  { name: 'Mihir Bhatt', email: 'mihir.bhatt@email.com', phone: '+919876543246', city: 'Mumbai', gender: 'male' as const, spendProfile: 'new' },
  { name: 'Nalini Venkat', email: 'nalini.v@email.com', phone: '+919876543247', city: 'Bangalore', gender: 'female' as const, spendProfile: 'new' },
  { name: 'Dev Mathur', email: 'dev.mathur@email.com', phone: '+919876543248', city: 'Delhi', gender: 'male' as const, spendProfile: 'new' },
  { name: 'Ishita Bajaj', email: 'ishita.bajaj@email.com', phone: '+919876543249', city: 'Chennai', gender: 'female' as const, spendProfile: 'new' },
  { name: 'Vishal Ahuja', email: 'vishal.ahuja@email.com', phone: '+919876543250', city: 'Hyderabad', gender: 'male' as const, spendProfile: 'new' },
]

// Spending ranges per profile
const SPEND_CONFIG = {
  vip:     { minOrders: 8,  maxOrders: 15, minAmount: 4000, maxAmount: 14000, lastOrderMaxDays: 20  },
  high:    { minOrders: 4,  maxOrders: 8,  minAmount: 2000, maxAmount: 9000,  lastOrderMaxDays: 35  },
  regular: { minOrders: 2,  maxOrders: 5,  minAmount: 1000, maxAmount: 5000,  lastOrderMaxDays: 45  },
  churned: { minOrders: 2,  maxOrders: 4,  minAmount: 1500, maxAmount: 6000,  lastOrderMaxDays: 120, lastOrderMinDays: 70 },
  new:     { minOrders: 1,  maxOrders: 2,  minAmount: 1200, maxAmount: 4000,  lastOrderMaxDays: 15  },
}

// ─── Main Seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding XenoCRM — Maison Luxe fashion brand...\n')

  // ── Clean existing data (in correct order for FK constraints) ──
  console.log('🧹 Cleaning existing data...')
  await prisma.order.deleteMany()
  await prisma.communication.deleteMany()
  await prisma.campaignStats.deleteMany()
  await prisma.segmentStats.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.segment.deleteMany()
  await prisma.customer.deleteMany()
  console.log('   ✓ Done\n')

  // ── Create customers + orders ──────────────────────────────────
  console.log('👥 Creating 50 customers with order history...')
  const createdCustomers: any[] = []

  for (const profile of CUSTOMER_PROFILES) {
    const config = SPEND_CONFIG[profile.spendProfile as keyof typeof SPEND_CONFIG]

    // Determine customer creation date
    const isNew = profile.spendProfile === 'new'
    const customerCreatedAt = isNew
      ? daysAgoRandom(1, 18)
      : daysAgoRandom(90, 400)

    // Generate orders
    const numOrders = randomBetween(config.minOrders, config.maxOrders)
    const orders: { amount: number; items: any[]; createdAt: Date }[] = []
    let totalSpend = 0

    for (let i = 0; i < numOrders; i++) {
      // Determine order date
      let orderDate: Date
      if (profile.spendProfile === 'churned') {
        orderDate = daysAgoRandom(
          (config as any).lastOrderMinDays || 70,
          config.lastOrderMaxDays
        )
      } else if (isNew) {
        orderDate = daysAgoRandom(1, 15)
      } else {
        // Spread orders over last 12 months
        orderDate = daysAgoRandom(i * 20, i * 20 + 60)
      }

      // Pick 1-3 random items
      const numItems = randomBetween(1, 3)
      const selectedItems = []
      for (let j = 0; j < numItems; j++) {
        const item = FASHION_ITEMS[randomBetween(0, FASHION_ITEMS.length - 1)]
        selectedItems.push({
          name: item.name,
          category: item.category,
          quantity: 1,
          price: item.price,
        })
      }
      const amount = selectedItems.reduce((sum, item) => sum + item.price, 0)
      totalSpend += amount
      orders.push({ amount, items: selectedItems, createdAt: orderDate })
    }

    // Sort orders by date ascending
    orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    const lastOrderDate = orders[orders.length - 1].createdAt

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        city: profile.city,
        gender: profile.gender,
        createdAt: customerCreatedAt,
        totalSpend: Math.round(totalSpend),
        orderCount: numOrders,
        lastOrderDate,
        orders: {
          create: orders.map(o => ({
            amount: o.amount,
            items: o.items,
            createdAt: o.createdAt,
          }))
        }
      },
    })

    createdCustomers.push({ ...customer, spendProfile: profile.spendProfile })
    process.stdout.write('.')
  }
  console.log(`\n   ✓ Created ${createdCustomers.length} customers\n`)

  // ── Create segments ────────────────────────────────────────────
  console.log('🏷️  Creating 4 segments...')

  // Segment 1: VIP Customers (totalSpend > 20000)
  const vipCustomers = createdCustomers.filter(c => c.spendProfile === 'vip')
  const segmentVIP = await prisma.segment.create({
    data: {
      name: 'VIP Customers',
      description: 'Top-tier customers with lifetime spend over ₹20,000',
      filterConfig: [{ field: 'totalSpend', operator: 'gte', value: 20000 }],
      customerCount: vipCustomers.length,
      createdBy: 'user',
      stats: { create: {} }
    }
  })
  console.log(`   ✓ VIP Customers — ${vipCustomers.length} customers`)

  // Segment 2: Churned (lastOrderDate > 60 days ago)
  const churnedCustomers = createdCustomers.filter(c => c.spendProfile === 'churned')
  const segmentChurned = await prisma.segment.create({
    data: {
      name: 'Churned Customers',
      description: 'Customers who haven\'t purchased in over 60 days',
      filterConfig: [{ field: 'daysSinceLastOrder', operator: 'gte', value: 60 }],
      customerCount: churnedCustomers.length,
      createdBy: 'user',
      stats: { create: {} }
    }
  })
  console.log(`   ✓ Churned Customers — ${churnedCustomers.length} customers`)

  // Segment 3: New Users (joined in last 30 days)
  const newCustomers = createdCustomers.filter(c => c.spendProfile === 'new')
  const segmentNew = await prisma.segment.create({
    data: {
      name: 'New Users',
      description: 'Customers who joined in the last 30 days',
      filterConfig: [{ field: 'daysSinceLastOrder', operator: 'lte', value: 30 }],
      customerCount: newCustomers.length,
      createdBy: 'user',
      stats: { create: {} }
    }
  })
  console.log(`   ✓ New Users — ${newCustomers.length} customers`)

  // Segment 4: High Spenders (totalSpend > 8000)
  const highSpenders = createdCustomers.filter(c =>
    c.spendProfile === 'vip' || c.spendProfile === 'high'
  )
  const segmentHighSpend = await prisma.segment.create({
    data: {
      name: 'High Spenders',
      description: 'Customers with lifetime spend over ₹8,000',
      filterConfig: [{ field: 'totalSpend', operator: 'gte', value: 8000 }],
      customerCount: highSpenders.length,
      createdBy: 'ai',
      stats: { create: {} }
    }
  })
  console.log(`   ✓ High Spenders — ${highSpenders.length} customers\n`)

  // ── Create 2 completed campaigns with receipt history ──────────
  console.log('📣 Creating 2 completed campaigns with receipt history...')

  // ── Campaign 1: Summer Sale — VIP WhatsApp campaign ────────────
  const campaign1 = await prisma.campaign.create({
    data: {
      name: 'Summer Sale — VIP Preview',
      segmentId: segmentVIP.id,
      channel: 'whatsapp',
      messageTemplate:
        'Hi {{name}} 👗 Maison Luxe\'s exclusive Summer Sale is LIVE! As one of our VIP members, you get early access + flat 20% off on all new arrivals. Shop now: maison.luxe/summer-sale',
      status: 'completed',
      createdAt: daysAgo(14),
      stats: { create: { total: vipCustomers.length } }
    }
  })

  // Create communication records for Campaign 1
  let c1Sent = 0, c1Delivered = 0, c1Failed = 0, c1Opened = 0, c1Read = 0, c1Clicked = 0, c1Converted = 0, c1Revenue = 0
  for (const customer of vipCustomers) {
    const isFailed = Math.random() < 0.05  // 5% fail rate for VIP (good list)
    const isDelivered = !isFailed
    const isOpened = isDelivered && Math.random() < 0.72  // 72% open on WhatsApp for VIPs
    const isRead = isOpened && Math.random() < 0.85
    const isClicked = isRead && Math.random() < 0.30
    const isConverted = isClicked && Math.random() < 0.40

    const baseTime = daysAgo(14)
    let status = 'queued'
    const commData: any = {
      campaignId: campaign1.id,
      customerId: customer.id,
      channel: 'whatsapp',
      message: `Hi ${customer.name} 👗 Maison Luxe's exclusive Summer Sale is LIVE! As one of our VIP members, you get early access + flat 20% off on all new arrivals. Shop now: maison.luxe/summer-sale`,
      queuedAt: baseTime,
    }

    c1Sent++
    commData.sentAt = new Date(baseTime.getTime() + 2000)
    status = 'sent'

    if (isFailed) {
      c1Failed++
      status = 'failed'
      commData.failedAt = new Date(baseTime.getTime() + 5000)
      commData.metadata = { failureReason: 'network_timeout', failureMessage: 'Delivery timed out' }
    } else {
      c1Delivered++
      commData.deliveredAt = new Date(baseTime.getTime() + 8000)
      status = 'delivered'

      if (isOpened) {
        c1Opened++
        commData.openedAt = new Date(baseTime.getTime() + 60000 * randomBetween(5, 40))
        status = 'opened'
      }
      if (isRead) {
        c1Read++
        commData.readAt = new Date(commData.openedAt.getTime() + 30000)
        status = 'read'
      }
      if (isClicked) {
        c1Clicked++
        commData.clickedAt = new Date(commData.readAt.getTime() + 60000 * randomBetween(1, 10))
        commData.metadata = { clickUrl: '/summer-sale' }
        status = 'clicked'
      }
      if (isConverted) {
        c1Converted++
        const revenue = randomBetween(3000, 14000)
        c1Revenue += revenue
        commData.convertedAt = new Date(commData.clickedAt.getTime() + 60000 * randomBetween(5, 60))
        commData.metadata = { ...commData.metadata, orderId: `ORD-SEED-${customer.id.slice(0, 6)}`, revenue }
        status = 'converted'
      }
    }

    commData.status = status
    await prisma.communication.create({ data: commData })
  }

  // Update Campaign 1 stats
  await prisma.campaignStats.update({
    where: { campaignId: campaign1.id },
    data: { sent: c1Sent, delivered: c1Delivered, failed: c1Failed, opened: c1Opened, read: c1Read, clicked: c1Clicked, converted: c1Converted, revenue: c1Revenue }
  })
  // Update segment stats
  const c1OpenRate = c1Delivered > 0 ? c1Opened / c1Delivered : 0
  const c1ClickRate = c1Opened > 0 ? c1Clicked / c1Opened : 0
  await prisma.segmentStats.update({
    where: { segmentId: segmentVIP.id },
    data: { campaignCount: 1, totalReach: c1Sent, avgOpenRate: c1OpenRate, avgClickRate: c1ClickRate, totalConversions: c1Converted, totalRevenue: c1Revenue }
  })
  console.log(`   ✓ Campaign 1: "Summer Sale — VIP Preview" (WhatsApp)`)
  console.log(`     Sent: ${c1Sent} | Delivered: ${c1Delivered} | Opened: ${c1Opened} | Clicked: ${c1Clicked} | Converted: ${c1Converted} | Revenue: ₹${c1Revenue.toLocaleString()}`)

  // ── Campaign 2: Win-Back — Churned Email campaign ──────────────
  const campaign2 = await prisma.campaign.create({
    data: {
      name: 'Win-Back: We Miss You',
      segmentId: segmentChurned.id,
      channel: 'email',
      messageTemplate:
        'Hi {{name}}, it\'s been a while! 💌 We\'ve missed you at Maison Luxe. To welcome you back, here\'s a special 15% off on your next purchase. No minimum spend. Use code: COMEBACK15. Valid for 7 days.',
      status: 'completed',
      createdAt: daysAgo(7),
      stats: { create: { total: churnedCustomers.length } }
    }
  })

  let c2Sent = 0, c2Delivered = 0, c2Failed = 0, c2Opened = 0, c2Read = 0, c2Clicked = 0, c2Converted = 0, c2Revenue = 0
  for (const customer of churnedCustomers) {
    const isFailed = Math.random() < 0.08
    const isDelivered = !isFailed
    const isOpened = isDelivered && Math.random() < 0.32  // 32% open rate for email
    const isRead = isOpened && Math.random() < 0.70
    const isClicked = isRead && Math.random() < 0.18
    const isConverted = isClicked && Math.random() < 0.28

    const baseTime = daysAgo(7)
    let status = 'queued'
    const commData: any = {
      campaignId: campaign2.id,
      customerId: customer.id,
      channel: 'email',
      message: `Hi ${customer.name}, it's been a while! 💌 We've missed you at Maison Luxe. To welcome you back, here's a special 15% off on your next purchase. No minimum spend. Use code: COMEBACK15. Valid for 7 days.`,
      queuedAt: baseTime,
    }

    c2Sent++
    commData.sentAt = new Date(baseTime.getTime() + 3000)
    status = 'sent'

    if (isFailed) {
      c2Failed++
      status = 'failed'
      commData.failedAt = new Date(baseTime.getTime() + 6000)
      commData.metadata = { failureReason: 'invalid_number', failureMessage: 'Email address is invalid' }
    } else {
      c2Delivered++
      commData.deliveredAt = new Date(baseTime.getTime() + 15000)
      status = 'delivered'

      if (isOpened) {
        c2Opened++
        commData.openedAt = new Date(baseTime.getTime() + 60000 * randomBetween(30, 200))
        status = 'opened'
      }
      if (isRead) {
        c2Read++
        commData.readAt = new Date(commData.openedAt.getTime() + 60000 * randomBetween(1, 5))
        status = 'read'
      }
      if (isClicked) {
        c2Clicked++
        commData.clickedAt = new Date(commData.readAt.getTime() + 60000 * randomBetween(1, 20))
        commData.metadata = { clickUrl: '/comeback-offer' }
        status = 'clicked'
      }
      if (isConverted) {
        c2Converted++
        const revenue = randomBetween(2000, 8000)
        c2Revenue += revenue
        commData.convertedAt = new Date(commData.clickedAt.getTime() + 60000 * randomBetween(10, 120))
        commData.metadata = { ...commData.metadata, orderId: `ORD-SEED-WB-${customer.id.slice(0, 6)}`, revenue }
        status = 'converted'
      }
    }

    commData.status = status
    await prisma.communication.create({ data: commData })
  }

  await prisma.campaignStats.update({
    where: { campaignId: campaign2.id },
    data: { sent: c2Sent, delivered: c2Delivered, failed: c2Failed, opened: c2Opened, read: c2Read, clicked: c2Clicked, converted: c2Converted, revenue: c2Revenue }
  })
  const c2OpenRate = c2Delivered > 0 ? c2Opened / c2Delivered : 0
  const c2ClickRate = c2Opened > 0 ? c2Clicked / c2Opened : 0
  await prisma.segmentStats.update({
    where: { segmentId: segmentChurned.id },
    data: { campaignCount: 1, totalReach: c2Sent, avgOpenRate: c2OpenRate, avgClickRate: c2ClickRate, totalConversions: c2Converted, totalRevenue: c2Revenue }
  })
  console.log(`   ✓ Campaign 2: "Win-Back: We Miss You" (Email)`)
  console.log(`     Sent: ${c2Sent} | Delivered: ${c2Delivered} | Opened: ${c2Opened} | Clicked: ${c2Clicked} | Converted: ${c2Converted} | Revenue: ₹${c2Revenue.toLocaleString()}`)

  // ── Summary ────────────────────────────────────────────────────
  console.log('\n✅ Seed complete! Summary:')
  console.log(`   Customers  : ${createdCustomers.length}`)
  const totalOrders = await prisma.order.count()
  console.log(`   Orders     : ${totalOrders}`)
  console.log(`   Segments   : 4 (VIPs, Churned, New Users, High Spenders)`)
  console.log(`   Campaigns  : 2 (completed, with full receipt history)`)
  const totalComms = await prisma.communication.count()
  console.log(`   Comms      : ${totalComms}`)
  console.log('\n🎉 Run "npm run db:studio" to explore the data in Prisma Studio!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
