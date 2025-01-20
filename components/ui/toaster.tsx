"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider duration={3000}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props} className="w-fit min-w-[350px]">
            <div className="flex items-center gap-2">
              {title && <ToastTitle className="text-sm">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-sm">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="h-4 w-4 opacity-70 hover:opacity-100" />
          </Toast>
        )
      })}
      <ToastViewport className="fixed bottom-0 right-0 flex flex-col-reverse p-4 gap-2" />
    </ToastProvider>
  )
}
