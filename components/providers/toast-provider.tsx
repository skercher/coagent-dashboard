"use client"

import {
  ToastProvider as Provider,
  ToastViewport,
} from "@/components/ui/toast"

export function ToastProvider() {
  return (
    <Provider>
      <ToastViewport />
    </Provider>
  )
}
