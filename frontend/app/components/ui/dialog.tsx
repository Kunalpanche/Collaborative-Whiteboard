import * as React from "react"

const Dialog = ({ children, open }: { children: React.ReactNode, open: boolean }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
        {children}
      </div>
    </div>
  )
}

const DialogContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="grid gap-4">{children}</div>
}

const DialogHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="flex flex-col space-y-1.5 text-center sm:text-left">{children}</div>
}

const DialogTitle = ({ children }: { children: React.ReactNode }) => {
  return <h2 className="text-lg font-semibold leading-none tracking-tight">{children}</h2>
}

export { Dialog, DialogContent, DialogHeader, DialogTitle }
