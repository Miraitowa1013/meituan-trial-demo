import type { PropsWithChildren } from 'react'

type DrawerProps = PropsWithChildren<{ open: boolean; title: string; onClose: () => void }>

export function Drawer({ open, title, onClose, children }: DrawerProps) {
  if (!open) return null
  return <div className="ui-drawer__scrim" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="ui-drawer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ui-drawer__handle" />
      <header className="ui-drawer__header"><h2>{title}</h2><button className="ui-drawer__close" type="button" aria-label="关闭" onClick={onClose}>×</button></header>
      {children}
    </section>
  </div>
}
