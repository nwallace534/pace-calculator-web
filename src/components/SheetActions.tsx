type SheetActionsProps = {
  error: string | null;
  cancelLabel: string;
  saveLabel: string;
  onCancel: () => void;
  onSave: () => void;
  errorStyle?: "text" | "alert";
};

function SheetActions({
  error,
  cancelLabel,
  saveLabel,
  onCancel,
  onSave,
  errorStyle = "alert",
}: SheetActionsProps) {
  return (
    <div className="d-flex justify-content-end align-items-center gap-2 mt-3">
      {error &&
        (errorStyle === "alert" ? (
          <div
            className="alert alert-danger py-2 small mb-0 flex-grow-1 me-auto"
            role="alert"
          >
            {error}
          </div>
        ) : (
          <div className="text-danger small flex-grow-1 me-auto">{error}</div>
        ))}
      <div className="d-flex gap-2 flex-shrink-0">
        <button
          type="button"
          className="btn btn-link btn-link-muted"
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button type="button" className="btn btn-accent" onClick={onSave}>
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

export default SheetActions;
