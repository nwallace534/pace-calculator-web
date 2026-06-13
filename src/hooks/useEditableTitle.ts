import { useCallback, useState } from "react";

// Ephemeral title-editing state for the summary card. `customTitle` is the
// committed value (null when the user hasn't typed anything); `draftTitle`
// tracks the in-flight input. State stays per-mount on purpose: closing the
// card discards the edit, and nothing persists to the store.
export type EditableTitle = {
  customTitle: string | null;
  editing: boolean;
  draftTitle: string;
  setDraftTitle: (next: string) => void;
  startEdit: () => void;
  finishEdit: () => void;
};

export const TITLE_MAX_LENGTH = 50;

export function useEditableTitle({
  maxLength = TITLE_MAX_LENGTH,
}: { maxLength?: number } = {}): EditableTitle {
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  const startEdit = useCallback(() => {
    // Seed the input with whatever the user last committed (or empty so the
    // placeholder shows up for a first-time edit).
    setDraftTitle(customTitle ?? "");
    setEditing(true);
  }, [customTitle]);

  const finishEdit = useCallback(() => {
    const trimmed = draftTitle.trim().slice(0, maxLength);
    setCustomTitle(trimmed.length > 0 ? trimmed : null);
    setEditing(false);
  }, [draftTitle, maxLength]);

  return {
    customTitle,
    editing,
    draftTitle,
    setDraftTitle,
    startEdit,
    finishEdit,
  };
}
