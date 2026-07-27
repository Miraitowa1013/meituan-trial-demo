import type { PropsWithChildren } from 'react'

type DemoStageProps = PropsWithChildren<{ step: number; total?: number; onPrevious?: () => void; onNext?: () => void; onReset?: () => void }>

export function DemoStage({ step, total = 9, onPrevious, onNext, onReset, children }: DemoStageProps) {
  return <main className="demo-stage">
    <section className="demo-stage__device" aria-label="试新产品演示"><div className="demo-stage__notch" /><div className="demo-stage__content">{children}</div></section>
    <nav className="demo-stage__control" aria-label="演示控制">
      <button type="button" onClick={onPrevious} disabled={!onPrevious}>上一步</button>
      <span className="demo-stage__step">{String(step).padStart(2, '0')} / {String(total - 1).padStart(2, '0')}</span>
      <button type="button" onClick={onNext} disabled={!onNext}>下一步</button>
      <button type="button" onClick={onReset}>重置</button>
    </nav>
  </main>
}
