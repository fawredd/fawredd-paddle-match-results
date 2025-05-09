"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function InstallButton() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    // Store the install prompt event when it's fired
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default browser install prompt
      e.preventDefault()
      // Store the event for later use
      setInstallPrompt(e)
      // Show our install button
      setIsInstallable(true)
    }

    // Check if the app is already installed
    const handleAppInstalled = () => {
      // Hide the install button
      setIsInstallable(false)
      // Clear the stored prompt
      setInstallPrompt(null)
      // Show a success message
      toast({
        title: "App installed",
        description: "The app has been successfully installed on your device.",
      })
    }

    // Add event listeners
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    // Check if the app is in standalone mode (already installed)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstallable(false)
    }

    // Clean up event listeners
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!installPrompt) {
      // If no install prompt is available, provide instructions
      toast({
        title: "Installation",
        description: "To install this app, use your browser's 'Add to Home Screen' or 'Install' option.",
      })
      return
    }

    // Show the install prompt
    installPrompt.prompt()

    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice

    // Hide the install button regardless of outcome
    setInstallPrompt(null)
    setIsInstallable(false)

    // Log the outcome
    if (choiceResult.outcome === "accepted") {
      toast({
        title: "Thank you!",
        description: "The app is being installed on your device.",
      })
    } else {
      // The user declined, but we'll still hide the button
      console.log("User dismissed the install prompt")
    }
  }

  // Only show the button if the app is installable
  if (!isInstallable) return null

  return (
    <Button variant="outline" size="sm" onClick={handleInstallClick} className="flex items-center gap-1">
      <Download className="h-4 w-4" />
      <span>Install</span>
    </Button>
  )
}
