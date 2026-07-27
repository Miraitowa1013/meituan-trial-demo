import type { HTMLAttributes, PropsWithChildren } from 'react'

type TagProps = PropsWithChildren<HTMLAttributes<HTMLSpanElement> & { tone?: 'neutral' | 'verified' | 'uncertain' | 'risk' }>

export function Tag({ tone = 'neutral', className = '', children, ...props }: TagProps) {
  return <span className={`ui-tag ui-tag--${tone} ${className}`.trim()} {...props}>{children}</span>
}
