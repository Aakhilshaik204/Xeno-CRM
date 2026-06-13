import { Sparkles, ArrowRight, BarChart3, Users, Send, Zap, Shield, Brain, TrendingUp, CheckCircle, Star, ChevronRight } from 'lucide-react'
import { SignInButton } from '@clerk/clerk-react'
import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: '500+', label: 'Customers Managed' },
  { value: '98%', label: 'Delivery Rate' },
  { value: '3.2×', label: 'Avg Revenue Lift' },
  { value: '<2s', label: 'Real-Time Updates' },
]

const FEATURES = [
  {
    icon: Brain,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    badge: 'AI-Powered',
    title: 'Intelligent Agent',
    desc: 'Ask your AI assistant to draft, segment, and dispatch campaigns in plain English. No code required, ever.',
    points: ['Natural language campaign creation', 'Live analytics reporting', 'Top spender discovery'],
  },
  {
    icon: Users,
    color: 'text-sky-500',
    bg: 'bg-sky-50',
    badge: 'Precision Targeting',
    title: 'Smart Segmentation',
    desc: 'Build dynamic audience segments with powerful RFM filters and membership tier rules in seconds.',
    points: ['Spend, frequency, recency filters', 'City & demographic targeting', 'Auto customer count'],
  },
  {
    icon: Send,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    badge: 'Omnichannel',
    title: 'Multi-Channel Dispatch',
    desc: 'Deliver personalized messages at scale across Email and SMS with real-time delivery tracking.',
    points: ['Cursor-paginated bulk delivery', 'Personalised via {{name}} tags', 'Live delivered / opened stats'],
  },
  {
    icon: BarChart3,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    badge: 'Live Data',
    title: 'Real-Time Analytics',
    desc: 'Watch conversions and attributed revenue update instantly as your campaigns run.',
    points: ['Revenue attribution per campaign', 'Funnel: Sent → Opened → Converted', 'Recharts-powered dashboard'],
  },
  {
    icon: Zap,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    badge: 'Speed',
    title: 'Blazing Fast',
    desc: 'From draft to dispatch in under 60 seconds. Our background queue handles the heavy lifting.',
    points: ['Sub-2s simulation lifecycle', 'Background channel processor', 'No UI blocking ever'],
  },
  {
    icon: Shield,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    badge: 'Secure',
    title: 'Enterprise Security',
    desc: 'Powered by Clerk authentication and Supabase Postgres. Your data never leaves your control.',
    points: ['OAuth & multi-session support', 'Row-level Postgres security', 'HTTPS-only endpoints'],
  },
]

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Head of CRM, Elara Luxury',
    avatar: 'PS',
    rating: 5,
    text: 'XenoCRM completely replaced our manual segmentation workflow. What used to take 3 hours now happens in 30 seconds. The AI agent is unreal.',
  },
  {
    name: 'Arjun Mehta',
    role: 'Digital Marketing Lead, Noir Collective',
    avatar: 'AM',
    rating: 5,
    text: 'The live analytics dashboard is stunning. Watching our campaigns convert in real time gave us confidence we never had with our old tools.',
  },
  {
    name: 'Nadia Kapoor',
    role: 'Founder, Aurum Atelier',
    avatar: 'NK',
    rating: 5,
    text: "We sent an SMS campaign to 500 Platinum members in 2 clicks. The delivery rate was 98%. Our previous platform couldn't touch that.",
  },
]

function useCountUp(target: number, duration = 1800, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime: number | null = null
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className="text-center">
      <div className={`text-4xl md:text-5xl font-extrabold text-primary transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>{value}</div>
      <div className="text-sm text-text-muted mt-1 font-medium uppercase tracking-widest">{label}</div>
    </div>
  )
}

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  const Icon = feature.icon
  return (
    <div
      ref={ref}
      className={`bg-surface rounded-2xl border border-border p-8 flex flex-col gap-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-500 group ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${feature.color}`} />
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${feature.bg} ${feature.color}`}>{feature.badge}</span>
      </div>
      <div>
        <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
        <p className="text-text-muted text-sm leading-relaxed">{feature.desc}</p>
      </div>
      <ul className="flex flex-col gap-2 mt-auto">
        {feature.points.map(p => (
          <li key={p} className="flex items-center gap-2 text-sm text-text-muted">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background text-text font-sans flex flex-col overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">XenoCRM</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
            <a href="#features" className="hover:text-text transition-colors">Features</a>
            <a href="#analytics" className="hover:text-text transition-colors">Analytics</a>
            <a href="#testimonials" className="hover:text-text transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-text-muted hover:text-text transition-colors px-3 py-2">Log in</button>
            </SignInButton>
            <SignInButton mode="modal">
              <button className="btn-primary text-sm flex items-center gap-2">
                Get Started <ChevronRight className="w-4 h-4" />
              </button>
            </SignInButton>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative flex flex-col items-center text-center px-6 pt-28 pb-32 max-w-7xl mx-auto w-full overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-br from-violet-100/60 via-sky-100/40 to-transparent rounded-full blur-3xl pointer-events-none" style={{ transform: `translate(-50%, ${scrollY * 0.15}px)` }} />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-gradient-to-br from-amber-100/50 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 text-sm font-semibold mb-8 animate-slide-up shadow-sm">
            <Sparkles className="w-4 h-4" />
            Powered by Google Gemini AI
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] animate-slide-up" style={{ animationDelay: '100ms' }}>
            The CRM built for<br />
            <span className="bg-gradient-to-r from-slate-900 via-violet-600 to-sky-500 bg-clip-text text-transparent">
              luxury brands
            </span>
          </h1>

          <p className="text-xl text-text-muted mb-10 max-w-2xl leading-relaxed animate-slide-up" style={{ animationDelay: '200ms' }}>
            Segment elite audiences, dispatch omnichannel campaigns at scale, and let your AI agent draft communications in plain English — all from one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{ animationDelay: '300ms' }}>
            <SignInButton mode="modal">
              <button className="btn-primary px-8 py-4 text-base flex items-center gap-2 hover:scale-105 transition-transform shadow-md">
                Start for free <ArrowRight className="w-5 h-5" />
              </button>
            </SignInButton>
            <SignInButton mode="modal">
              <button className="px-8 py-4 text-base font-medium rounded-lg border border-border hover:bg-surfaceHighlight transition-colors flex items-center gap-2">
                View Dashboard <ChevronRight className="w-5 h-5 text-text-muted" />
              </button>
            </SignInButton>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 text-sm text-text-muted animate-slide-up" style={{ animationDelay: '400ms' }}>
            {['No credit card required', 'SOC-2 Ready', 'Free to start'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Hero dashboard mockup */}
        <div className="relative z-10 mt-20 w-full max-w-5xl animate-slide-up" style={{ animationDelay: '500ms' }}>
          <div className="rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-surfaceHighlight border-b border-border">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="ml-4 text-xs text-text-muted font-mono bg-background px-3 py-1 rounded-full border border-border">app.xenocrm.io/dashboard</span>
            </div>
            {/* Mock dashboard content */}
            <div className="bg-background p-6 grid grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue', value: '₹48,62,400', change: '+18%', color: 'text-emerald-500' },
                { label: 'Campaigns Sent', value: '24', change: '+3 this week', color: 'text-sky-500' },
                { label: 'Customers', value: '500', change: 'Active', color: 'text-violet-500' },
                { label: 'Conversion Rate', value: '52%', change: '+7%', color: 'text-amber-500' },
              ].map(card => (
                <div key={card.label} className="rounded-xl bg-surface border border-border p-4">
                  <div className="text-xs text-text-muted mb-2 font-medium">{card.label}</div>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <div className={`text-xs mt-1 font-semibold ${card.color}`}>{card.change}</div>
                </div>
              ))}
            </div>
            <div className="bg-background px-6 pb-6 grid grid-cols-3 gap-4">
              <div className="col-span-2 rounded-xl bg-surface border border-border p-4 h-32 flex flex-col justify-between">
                <div className="text-xs text-text-muted font-medium">Campaign Performance</div>
                <div className="flex items-end gap-1 h-16">
                  {[30, 55, 40, 70, 62, 90, 75, 85, 95, 88, 100, 92].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-violet-400 to-sky-400 opacity-80" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-surface border border-border p-4 h-32 flex flex-col gap-2">
                <div className="text-xs text-text-muted font-medium">AI Agent</div>
                <div className="text-xs bg-violet-50 text-violet-700 px-3 py-2 rounded-lg border border-violet-100">"Draft SMS for Platinum members about the new winter collection"</div>
                <div className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">✓ Campaign created</div>
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-gradient-to-r from-violet-400/20 via-sky-400/30 to-violet-400/20 blur-2xl rounded-full" />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 border-y border-border bg-surface">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-10">
          {STATS.map(s => <AnimatedStat key={s.label} {...s} />)}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-28 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 border border-sky-200 text-sm font-semibold mb-6">
            <Zap className="w-4 h-4" /> Everything you need
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
            A complete marketing OS
          </h2>
          <p className="text-text-muted text-lg max-w-2xl mx-auto">
            Every tool a luxury brand's marketing team needs — unified in one beautifully designed platform.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} feature={f} index={i} />)}
        </div>
      </section>

      {/* ── Analytics CTA ── */}
      <section id="analytics" className="py-28 px-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-sky-900/30 via-transparent to-transparent" />
        <div className="max-w-5xl mx-auto relative z-10 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white border border-white/20 text-sm font-semibold mb-8">
              <TrendingUp className="w-4 h-4" /> Live Analytics
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
              Watch revenue roll in — in real time
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              Our live analytics engine tracks every step of the campaign funnel — from the moment a message is sent to the final purchase. No refreshing required.
            </p>
            <SignInButton mode="modal">
              <button className="inline-flex items-center gap-2 bg-white text-slate-900 font-semibold px-8 py-4 rounded-xl hover:bg-slate-100 transition-colors">
                View live demo <ArrowRight className="w-5 h-5" />
              </button>
            </SignInButton>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { stage: 'Sent', count: 500, pct: 100, color: 'bg-slate-400' },
              { stage: 'Delivered', count: 490, pct: 98, color: 'bg-sky-400' },
              { stage: 'Opened', count: 430, pct: 86, color: 'bg-violet-400' },
              { stage: 'Clicked', count: 310, pct: 62, color: 'bg-amber-400' },
              { stage: 'Converted', count: 260, pct: 52, color: 'bg-emerald-400' },
            ].map(row => (
              <div key={row.stage} className="flex items-center gap-4">
                <div className="w-24 text-sm text-slate-400 font-medium text-right shrink-0">{row.stage}</div>
                <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                  <div className={`h-full rounded-full ${row.color} transition-all duration-1000`} style={{ width: `${row.pct}%` }} />
                </div>
                <div className="w-10 text-sm font-bold text-right shrink-0">{row.count}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-28 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 text-sm font-semibold mb-6">
            <Star className="w-4 h-4 fill-current" /> Loved by teams
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">What our users say</h2>
          <p className="text-text-muted text-lg">Trusted by marketing teams at leading luxury brands.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} className="bg-surface rounded-2xl border border-border p-8 flex flex-col gap-4 hover:shadow-lg transition-shadow">
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-text-muted leading-relaxed flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-2 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-text-muted">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-6 bg-gradient-to-br from-violet-600 to-sky-600 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Ready to grow your luxury brand?
          </h2>
          <p className="text-white/80 text-lg mb-10">
            Join the teams using XenoCRM to convert their best customers — automatically.
          </p>
          <SignInButton mode="modal">
            <button className="bg-white text-slate-900 font-bold px-10 py-5 rounded-xl text-lg hover:bg-slate-100 transition-colors hover:scale-105 transition-transform shadow-xl flex items-center gap-2 mx-auto">
              Get started free <ArrowRight className="w-5 h-5" />
            </button>
          </SignInButton>
          <p className="text-white/60 text-sm mt-6">No credit card required · Set up in 2 minutes</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 border-t border-border bg-surface">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold">XenoCRM</span>
          </div>
          <p className="text-text-muted text-sm">© 2026 XenoCRM. Built with Maison Luxe OS.</p>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <a href="#features" className="hover:text-text transition-colors">Features</a>
            <a href="#testimonials" className="hover:text-text transition-colors">Reviews</a>
            <SignInButton mode="modal">
              <button className="hover:text-text transition-colors">Sign In</button>
            </SignInButton>
          </div>
        </div>
      </footer>
    </div>
  )
}
