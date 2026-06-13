import { SignIn } from '@clerk/clerk-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="relative z-10 p-8 glass-panel animate-fade-in flex flex-col items-center">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary mb-2 tracking-tight">XenoCRM</h1>
          <p className="text-text-muted">Welcome back to Maison Luxe OS</p>
        </div>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </div>
    </div>
  )
}
