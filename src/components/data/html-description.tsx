import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { cn } from '@/lib/utils'

const LOOKS_LIKE_HTML = /<[a-z][\s\S]*>/i

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return doc.body.textContent ?? ''
}

function sanitize(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a',
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'ul',
      'ol',
      'li',
      'span',
      'div',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  })
}

/**
 * Renders a plain-text version of a possibly-HTML description, truncated via CSS.
 */
export function PlainDescription({
  html,
  className,
}: {
  html: string
  className?: string
}) {
  const text = useMemo(
    () => (LOOKS_LIKE_HTML.test(html) ? stripHtml(html) : html),
    [html],
  )
  return <p className={className}>{text}</p>
}

/**
 * Renders a sanitized HTML description with basic prose styling.
 */
export function HtmlDescription({
  html,
  className,
}: {
  html: string
  className?: string
}) {
  const clean = useMemo(
    () => (LOOKS_LIKE_HTML.test(html) ? sanitize(html) : null),
    [html],
  )

  if (!clean) {
    return <p className={className}>{html}</p>
  }

  return (
    <div
      className={cn(
        'prose-description [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
        '[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4',
        '[&_li]:mt-0.5 [&_p]:mt-1 [&_p:first-child]:mt-0',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  )
}
