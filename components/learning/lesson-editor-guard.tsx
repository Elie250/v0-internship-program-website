'use client'

import { createContext, useCallback, useContext, useMemo, useRef } from 'react'

type LeaveHandler = () => Promise<boolean>

type LessonEditorGuardValue = {
  registerLeaveHandler: (handler: LeaveHandler | null) => void
  requestLeave: () => Promise<boolean>
}

const LessonEditorGuardContext = createContext<LessonEditorGuardValue | null>(null)

export function LessonEditorGuardProvider({ children }: { children: React.ReactNode }) {
  const handlerRef = useRef<LeaveHandler | null>(null)

  const registerLeaveHandler = useCallback((handler: LeaveHandler | null) => {
    handlerRef.current = handler
  }, [])

  const requestLeave = useCallback(async () => {
    const handler = handlerRef.current
    if (!handler) return true
    return handler()
  }, [])

  const value = useMemo(
    () => ({ registerLeaveHandler, requestLeave }),
    [registerLeaveHandler, requestLeave]
  )

  return (
    <LessonEditorGuardContext.Provider value={value}>{children}</LessonEditorGuardContext.Provider>
  )
}

export function useLessonEditorGuard(): LessonEditorGuardValue {
  const value = useContext(LessonEditorGuardContext)
  if (!value) {
    throw new Error('useLessonEditorGuard must be used inside LessonEditorGuardProvider')
  }
  return value
}

export function useOptionalLessonEditorGuard(): LessonEditorGuardValue | null {
  return useContext(LessonEditorGuardContext)
}
