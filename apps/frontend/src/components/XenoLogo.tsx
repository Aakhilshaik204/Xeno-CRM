import React from 'react'

export const XenoLogo = ({ className = "w-8 h-8", ...props }: React.HTMLAttributes<HTMLImageElement>) => (
  <img 
    src="/logo.png" 
    alt="Xeno Logo"
    className={className} 
    {...props}
  />
)
