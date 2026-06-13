import { Building2, Mail, Globe, MapPin, ShieldCheck, CreditCard } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-text-muted mt-1">Manage your company profile and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Navigation/Tabs */}
        <div className="col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-primary/10 text-primary rounded-xl font-medium transition-colors">
            <Building2 className="w-5 h-5" />
            About Company
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surfaceHighlight text-text-muted hover:text-text rounded-xl font-medium transition-colors">
            <ShieldCheck className="w-5 h-5" />
            Security & Access
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surfaceHighlight text-text-muted hover:text-text rounded-xl font-medium transition-colors">
            <CreditCard className="w-5 h-5" />
            Billing & Plans
          </button>
        </div>

        {/* Right Column - Content */}
        <div className="col-span-1 md:col-span-2">
          <div className="bg-surface border border-border rounded-2xl shadow-sm p-8">
            <h2 className="text-xl font-bold mb-6">Company Profile</h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Maison Luxe Inc.</h3>
                  <p className="text-sm text-text-muted">Enterprise Premium Plan</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Company Name</label>
                  <div className="flex items-center gap-2 p-3 bg-surfaceHighlight/50 border border-border rounded-xl">
                    <Building2 className="w-4 h-4 text-text-muted" />
                    <span className="text-sm font-medium">Maison Luxe Inc.</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Support Email</label>
                  <div className="flex items-center gap-2 p-3 bg-surfaceHighlight/50 border border-border rounded-xl">
                    <Mail className="w-4 h-4 text-text-muted" />
                    <span className="text-sm font-medium">concierge@maisonluxe.com</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Website</label>
                  <div className="flex items-center gap-2 p-3 bg-surfaceHighlight/50 border border-border rounded-xl">
                    <Globe className="w-4 h-4 text-text-muted" />
                    <span className="text-sm font-medium">www.maisonluxe.com</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">Headquarters</label>
                  <div className="flex items-center gap-2 p-3 bg-surfaceHighlight/50 border border-border rounded-xl">
                    <MapPin className="w-4 h-4 text-text-muted" />
                    <span className="text-sm font-medium">Paris, France</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border flex justify-end gap-3">
                <button className="px-5 py-2.5 rounded-xl font-medium text-sm text-text-muted hover:bg-surfaceHighlight transition-colors">
                  Cancel
                </button>
                <button className="btn-primary px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-transform hover:scale-105">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
