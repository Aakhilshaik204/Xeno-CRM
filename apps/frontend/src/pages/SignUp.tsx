import { SignUp } from '@clerk/clerk-react'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative z-10 p-8 glass-panel animate-fade-in flex flex-col items-center">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">XenoCRM</h1>
          <p className="text-text-muted">Create your Maison Luxe OS account</p>
        </div>
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </div>
    </div>
  )
}
