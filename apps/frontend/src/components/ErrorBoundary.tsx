import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-full">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mb-6 border border-danger/20">
            <AlertTriangle className="w-8 h-8 text-danger" />
          </div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-text-muted mb-8 max-w-md">
            {this.state.error?.message || "An unexpected error occurred in this component."}
          </p>
          <button 
            className="btn-primary flex items-center gap-2"
            onClick={() => {
              this.setState({ hasError: false })
              window.location.reload()
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Reload Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
