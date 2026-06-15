import { useEffect } from "react";

const COPY_TOAST_DURATION_MS = 3000;

// Self-dismissing so the parent only owns toast content, not lifetime.
export function CopyToast({
  message,
  url,
  onDismiss,
}: {
  message: string;
  url?: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const id = setTimeout(onDismiss, COPY_TOAST_DURATION_MS);
    return () => clearTimeout(id);
  }, [onDismiss, message, url]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="position-fixed start-50 translate-middle-x summary-copy-toast"
    >
      <div className="shadow rounded-3 px-3 py-2 summary-copy-toast-card">
        <div className="fw-bold text-smallish">✓ {message}</div>
        {url && (
          <div className="text-muted text-small font-monospace text-truncate summary-copy-toast-url">
            {url}
          </div>
        )}
      </div>
    </div>
  );
}
