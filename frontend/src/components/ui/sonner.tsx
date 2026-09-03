"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"
import * as React from "react"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="system"
      richColors
      position="top-right"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--success)",
          "--success-text": "#ffffff",
          "--success-border": "var(--success)",
          "--warning-bg": "var(--warning)",
          "--warning-text": "#ffffff",
          "--warning-border": "var(--warning)",
          "--error-bg": "var(--destructive)",
          "--error-text": "#ffffff",
          "--error-border": "var(--destructive)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
