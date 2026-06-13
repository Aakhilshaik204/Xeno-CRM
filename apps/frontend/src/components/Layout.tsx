import { SignedIn, UserButton, useUser } from '@clerk/clerk-react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, PieChart, Settings, Send, Sparkles, MessageSquare, HeartPulse } from 'lucide-react'
import clsx from 'clsx'
import AIAssistant from './AIAssistant'
import { useState, useEffect } from 'react'
import axios from 'axios'

export default function Layout() {
  const { user } = useUser()
  const location = useLocation()
  const [churningCount, setChurningCount] = useState(0)

  useEffect(() => {
    axios.get('/api/customer-health/overview')
      .then(res => setChurningCount(res.data.churning || 0))
      .catch(() => {})
  }, [])

  const navItems = [
    { label: 'Dashboard',     path: '/dashboard',     icon: LayoutDashboard },
    { label: 'Audiences',     path: '/audiences',     icon: Users },
    { label: 'Campaigns',     path: '/campaigns',     icon: Send },
    { label: 'Communications',path: '/communications', icon: MessageSquare },
    { label: 'Analytics',     path: '/analytics',     icon: PieChart },
    { label: 'Health & Churn',path: '/churn',         icon: HeartPulse, badge: churningCount },
    { label: 'AI Agent',      path: '/agent',         icon: Sparkles },
    { label: 'Settings',      path: '/settings',      icon: Settings },
  ]

  return (
    <SignedIn>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <aside className="w-64 flex flex-col border-r border-border bg-surface/50 backdrop-blur-xl">
          <div className="h-16 flex items-center px-6 border-b border-border">
            <h1 className="text-xl font-bold text-primary tracking-tight flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center">
                <span className="text-black text-xs font-black">X</span>
              </div>
              XenoCRM
            </h1>
          </div>
          
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
              
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 group relative',
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-text-muted hover:text-text hover:bg-surfaceHighlight'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
                  )}
                  <Icon className={clsx('w-5 h-5 transition-transform duration-200', isActive ? 'scale-110' : 'group-hover:scale-110')} />
                  {item.label}
                  {(item as any).badge > 0 && (
                    <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
                      {(item as any).badge > 9 ? '9+' : (item as any).badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
          
          <div className="p-4 border-t border-border">
            <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg font-medium text-text-muted hover:text-text hover:bg-surfaceHighlight transition-colors duration-200">
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
          <div className="absolute inset-0 bg-background/90 z-0"></div>
          
          {/* Topbar */}
          <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-surface/50 backdrop-blur-xl z-10">
            <div className="flex items-center gap-4 text-text-muted text-sm font-medium">
              <span>Maison Luxe OS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
              <span className="text-success text-xs">System Online</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right mr-2 hidden sm:block">
                <p className="text-sm font-medium text-text">{user?.fullName}</p>
                <p className="text-xs text-text-muted">{user?.primaryEmailAddress?.emailAddress}</p>
              </div>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-10 h-10 border-2 border-primary/20 hover:border-primary/50 transition-colors',
                  }
                }}
              />
            </div>
          </header>

          {/* Page Content */}
          <div className={clsx("flex-1 overflow-auto z-10", location.pathname === '/agent' ? 'p-0' : 'p-8')}>
            <div className={clsx("mx-auto animate-slide-up h-full", location.pathname === '/agent' ? 'max-w-none' : 'max-w-6xl')}>
              <Outlet />
            </div>
          </div>
          
          <AIAssistant />
        </main>
      </div>
    </SignedIn>
  )
}
