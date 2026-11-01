'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { UnsavedNavigationChoice } from '@/lib/learning/lesson-editor-guard'

type UnsavedLessonDialogProps = {
  open: boolean
  saving?: boolean
  onChoice: (choice: UnsavedNavigationChoice) => void
}

export function UnsavedLessonDialog({ open, saving = false, onChoice }: UnsavedLessonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && !saving && onChoice('stay')}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          event.preventDefault()
          if (!saving) onChoice('stay')
        }}
      >
        <DialogHeader>
          <DialogTitle>Unsaved lesson changes</DialogTitle>
          <DialogDescription>
            Save this lesson, discard the edits, or stay in the editor.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" disabled={saving} onClick={() => onChoice('stay')}>
            Remain in editor
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => onChoice('discard')}
            >
              Discard
            </Button>
            <Button
              type="button"
              disabled={saving}
              className="bg-[var(--brand-navy)] text-white"
              onClick={() => onChoice('save')}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
