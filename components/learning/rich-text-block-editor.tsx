'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  isSafeLessonHref,
  LESSON_RICH_TEXT_CLASSNAME,
  plaintextToLessonHtml,
  prepareRichTextFields,
  sanitizeLessonHtml,
} from '@/lib/learning/lesson-html'
import { cn } from '@/lib/utils'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading2,
  Heading3,
  Italic,
  ListIndentDecrease,
  ListIndentIncrease,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Subscript,
  Superscript,
  Underline,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

type RichTextBlockEditorProps = {
  text: string
  html?: string
  disabled?: boolean
  onChange: (next: { text: string; html?: string }) => void
}

function runCommand(command: string, value?: string) {
  document.execCommand(command, false, value)
}

export function RichTextBlockEditor({ text, html, disabled = false, onChange }: RichTextBlockEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const focusedRef = useRef(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkValue, setLinkValue] = useState('https://')
  const [linkError, setLinkError] = useState('')
  const [sizeError, setSizeError] = useState('')

  const displayHtml = html?.trim() ? sanitizeLessonHtml(html).html : plaintextToLessonHtml(text)

  useEffect(() => {
    const node = editorRef.current
    if (!node || focusedRef.current) return
    if (node.innerHTML !== displayHtml) {
      node.innerHTML = displayHtml
    }
  }, [displayHtml])

  const persistFromEditor = () => {
    const node = editorRef.current
    if (!node) return
    const prepared = prepareRichTextFields(node.innerText || '', node.innerHTML)
    if (!prepared.ok) {
      setSizeError(prepared.error)
      return
    }
    setSizeError('')
    onChange({ text: prepared.text, html: prepared.html })
  }

  const apply = (command: string, value?: string) => {
    if (disabled) return
    editorRef.current?.focus()
    runCommand(command, value)
    persistFromEditor()
  }

  const applyBlock = (tag: 'p' | 'h2' | 'h3') => {
    if (disabled) return
    editorRef.current?.focus()
    runCommand('formatBlock', tag)
    runCommand('formatBlock', `<${tag}>`)
    persistFromEditor()
  }

  const applyLink = () => {
    const href = isSafeLessonHref(linkValue)
    if (!href.ok) {
      setLinkError('Enter an https:// link. Relative, javascript, and data URLs are not allowed.')
      return
    }
    editorRef.current?.focus()
    runCommand('createLink', href.href)
    persistFromEditor()
    setLinkOpen(false)
    setLinkError('')
    setLinkValue('https://')
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
        <ToolbarButton label="Paragraph" disabled={disabled} onClick={() => applyBlock('p')}>
          <Pilcrow className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Heading 2" disabled={disabled} onClick={() => applyBlock('h2')}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Heading 3" disabled={disabled} onClick={() => applyBlock('h3')}>
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Bold" disabled={disabled} onClick={() => apply('bold')}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Italic" disabled={disabled} onClick={() => apply('italic')}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Underline" disabled={disabled} onClick={() => apply('underline')}>
          <Underline className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Bulleted list" disabled={disabled} onClick={() => apply('insertUnorderedList')}>
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Numbered list" disabled={disabled} onClick={() => apply('insertOrderedList')}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Indent" disabled={disabled} onClick={() => apply('indent')}>
          <ListIndentIncrease className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Outdent" disabled={disabled} onClick={() => apply('outdent')}>
          <ListIndentDecrease className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Align left" disabled={disabled} onClick={() => apply('justifyLeft')}>
          <AlignLeft className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Align center" disabled={disabled} onClick={() => apply('justifyCenter')}>
          <AlignCenter className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Align right" disabled={disabled} onClick={() => apply('justifyRight')}>
          <AlignRight className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Superscript" disabled={disabled} onClick={() => apply('superscript')}>
          <Superscript className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton label="Subscript" disabled={disabled} onClick={() => apply('subscript')}>
          <Subscript className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton
          label="Insert link"
          disabled={disabled}
          onClick={() => {
            setLinkOpen((open) => !open)
            setLinkError('')
          }}
        >
          <Link2 className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {linkOpen ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={linkValue}
            disabled={disabled}
            onChange={(event) => setLinkValue(event.target.value)}
            placeholder="https://example.com"
            aria-label="Link URL"
          />
          <Button type="button" size="sm" disabled={disabled} onClick={applyLink}>
            Apply link
          </Button>
        </div>
      ) : null}
      {linkError ? <p className="text-xs text-red-700">{linkError}</p> : null}

      <div
        ref={editorRef}
        role="textbox"
        aria-label="Explanation"
        aria-multiline="true"
        contentEditable={!disabled}
        suppressContentEditableWarning
        className={cn(
          'min-h-28 rounded-md border border-slate-200 bg-white px-3 py-2 outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
          LESSON_RICH_TEXT_CLASSNAME,
          disabled && 'cursor-not-allowed bg-slate-50 opacity-70'
        )}
        onFocus={() => {
          focusedRef.current = true
        }}
        onBlur={() => {
          focusedRef.current = false
          persistFromEditor()
        }}
        onInput={() => persistFromEditor()}
        onPaste={(event) => {
          event.preventDefault()
          const clipboard = event.clipboardData
          const pastedHtml = clipboard.getData('text/html')
          const pastedText = clipboard.getData('text/plain')
          const sanitized = sanitizeLessonHtml(pastedHtml || pastedText)
          const insert = sanitized.html || plaintextToLessonHtml(pastedText)
          if (!insert) return
          const prepared = prepareRichTextFields(sanitized.text || pastedText, insert)
          if (!prepared.ok) {
            setSizeError(prepared.error)
            return
          }
          runCommand('insertHTML', prepared.html || insert)
          persistFromEditor()
        }}
      />
      {sizeError ? <p className="text-xs text-red-700">{sizeError}</p> : null}
      <p className="text-xs text-slate-500">
        Paste from Word is supported. Unsupported markup and unsafe links are removed.
      </p>
    </div>
  )
}

function ToolbarButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      className="h-8 w-8 p-0 text-slate-700"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  )
}
