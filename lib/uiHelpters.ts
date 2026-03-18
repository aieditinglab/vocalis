/**
 * Helper functions for consistent error/success messaging and UI feedback
 * Use these throughout your app for consistent UX
 */

export interface UIFeedback {
    type: 'success' | 'error' | 'warning' | 'info'
    message: string
    duration?: number // ms, 0 = persistent
  }
  
  export const showFeedback = (feedback: UIFeedback, callback?: (cleared: boolean) => void) => {
    console.log(`[${feedback.type.toUpperCase()}]`, feedback.message)
    
    if (feedback.duration !== 0 && feedback.duration) {
      setTimeout(() => {
        callback?.(true)
      }, feedback.duration)
    }
  }
  
  export const feedbackMessages = {
    // Auth messages
    signupSuccess: { type: 'success' as const, message: '✅ Account created! Check your email to confirm.' },
    signupError: (err: string) => ({ type: 'error' as const, message: `❌ Sign-up failed: ${err}` }),
    loginSuccess: { type: 'success' as const, message: '✅ Logged in successfully!' },
    loginError: (err: string) => ({ type: 'error' as const, message: `❌ Login failed: ${err}` }),
    emailResent: { type: 'success' as const, message: '✅ Confirmation email sent! Check your inbox.' },
    emailResendError: (err: string) => ({ type: 'error' as const, message: `❌ Could not resend: ${err}` }),
    
    // Recording messages
    recordingStarted: { type: 'info' as const, message: '🎤 Recording started...' },
    recordingSaved: { type: 'success' as const, message: '✅ Recording saved successfully!' },
    recordingSaveError: (err: string) => ({ type: 'error' as const, message: `❌ Failed to save: ${err}` }),
    recordingMinimum: { type: 'warning' as const, message: '⏱️ Minimum 30 seconds required' },
    
    // Session messages
    sessionLoadError: { type: 'error' as const, message: '❌ Could not load sessions. Please refresh.' },
    sessionNotCreated: { type: 'error' as const, message: '❌ Session not created. Please try again.' },
    networkError: { type: 'error' as const, message: '❌ Network error. Please check your connection.' },
    
    // Generic messages
    unexpectedError: { type: 'error' as const, message: '❌ An unexpected error occurred.' },
    tryAgain: { type: 'info' as const, message: '🔄 Please try again in a moment.' },
  }