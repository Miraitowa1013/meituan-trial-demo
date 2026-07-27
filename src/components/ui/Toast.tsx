export function Toast({ message }: { message: string }) {
  return <div className="ui-toast" role="status" aria-live="polite">{message}</div>
}
