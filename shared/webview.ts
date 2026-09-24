export function shouldOpenWhatsAppInCurrentView(userAgent: string, hasCapacitorBridge = false) {
  return hasCapacitorBridge || /\bwv\b|; wv\)|capacitor/i.test(userAgent);
}
