export function Toast({ message }: { message: string | null }) {
  return (
    <div className={`toast${message ? ' visible' : ''}`} role="status" aria-live="polite">
      {message ?? ''}
    </div>
  );
}
