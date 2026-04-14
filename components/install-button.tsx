"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"

// BeforeInstallPromptEvent no está en los tipos DOM estándar de TS
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

function useIsIOS() {
  // iOS Safari nunca dispara beforeinstallprompt — necesita instrucciones manuales
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
}

export function InstallButton() {
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const isIOS = useIsIOS()

  useEffect(() => {
    // Ya está instalada como PWA standalone — no mostrar botón
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true // iOS Safari standalone check

    if (isStandalone) return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      installPromptRef.current = e as BeforeInstallPromptEvent
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      installPromptRef.current = null
      setIsInstallable(false)
      toast.success("App installed successfully")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPromptRef.current) {
      // Fallback: instrucciones manuales (iOS u otros browsers sin soporte)
      const message = isIOS
        ? 'Tap the Share button (□↑) then "Add to Home Screen"'
        : "Use your browser's menu → 'Install app' or 'Add to Home Screen'"

      toast("Add to Desktop", { description: message })
      return
    }

    try {
      await installPromptRef.current.prompt()
      const { outcome } = await installPromptRef.current.userChoice

      if (outcome === "accepted") {
        toast.success("Installing app…")
        // appinstalled event se encarga del cleanup
      }
      // Si dismissed: NO tocar isInstallable — el browser puede re-disparar beforeinstallprompt
      // Solo limpiar la ref del prompt consumido
      installPromptRef.current = null

      if (outcome === "dismissed") {
        setIsInstallable(false) // ocultamos por ahora, se re-activa si el browser re-dispara
      }
    } catch (err) {
      console.error("Install prompt error:", err)
      toast.error("Could not start installation")
    }
  }

  // Mostrar en iOS aunque no haya prompt nativo (para dar instrucciones)
  if (!isInstallable && !isIOS) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstallClick}
      className="flex items-center gap-1"
    >
      <Download className="h-4 w-4" />
      <span>Add to Desktop</span>
    </Button>
  )
}