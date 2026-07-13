/** Run work after the HTTP/server-action response without blocking the caller. */
export function runInBackground(task: () => Promise<void>, label = 'background'): void {
  void (async () => {
    try {
      await Promise.race([
        task(),
        new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error(`${label}_timeout`)), 12_000)
        }),
      ])
    } catch (error) {
      console.error(`[${label}]`, error)
    }
  })()
}

export function isLikelyValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
