import type { HTMLAttributes, PropsWithChildren } from 'react'

export function Card({ className = '', children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <div className={`ui-card ui-card--padded ${className}`.trim()} {...props}>{children}</div>
}
