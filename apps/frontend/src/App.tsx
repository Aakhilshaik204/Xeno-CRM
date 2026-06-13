import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import Layout from './components/Layout'

import Dashboard from './pages/Dashboard'
import Audiences from './pages/Audiences'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import Communications from './pages/Communications'
import Analytics from './pages/Analytics'
import Landing from './pages/Landing'
import AgentPage from './pages/AgentPage'
import SegmentDetail from './pages/SegmentDetail'
import CustomerProfile from './pages/CustomerProfile'
import CreateCampaign from './pages/CreateCampaign'
import CreateSegment from './pages/CreateSegment'
import ErrorBoundary from './components/ErrorBoundary'
import ChurnAlertsPage from './pages/ChurnAlertsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={
          <>
            <SignedIn><Navigate to="/dashboard" replace /></SignedIn>
            <SignedOut><Landing /></SignedOut>
          </>
        } />

        {/* Protected App Routes */}
        <Route element={
          <>
            <SignedIn>
              <Layout />
            </SignedIn>
            <SignedOut>
              <Navigate to="/" replace />
            </SignedOut>
          </>
        }>
          <Route element={<ErrorBoundary><Outlet /></ErrorBoundary>}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="audiences" element={<Audiences />} />
            <Route path="audiences/new" element={<CreateSegment />} />
            <Route path="audiences/:id" element={<SegmentDetail />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="campaigns/new" element={<CreateCampaign />} />
            <Route path="campaigns/:id" element={<CampaignDetail />} />
            <Route path="communications" element={<Communications />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="agent" element={<AgentPage />} />
            <Route path="churn" element={<ChurnAlertsPage />} />
            <Route path="customers/:id" element={<CustomerProfile />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App
