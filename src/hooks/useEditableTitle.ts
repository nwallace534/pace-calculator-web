import { useCallback, useState } from "react";

export type EditableTitle = {
  customTitle: string | null;
  editing: boolean;
  draftTitle: string;
  setDraftTitle: (next: string) => void;
  startEdit: () => void;
  finishEdit: () => void;
};

export const TITLE_MAX_LENGTH = 50;

// State is per-mount on purpose: nothing persists to the store, closing the
// card discards the edit.
export function useEditableTitle({
  maxLength = TITLE_MAX_LENGTH,
}: { maxLength?: number } = {}): EditableTitle {
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");

  const startEdit = useCallback(() => {
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
