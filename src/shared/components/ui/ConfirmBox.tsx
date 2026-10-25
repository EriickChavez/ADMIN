import { Button } from "./Button";

interface ConfirmBoxProps {
  message: string;
  confirmLabel: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmBox({
  message,
  confirmLabel,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmBoxProps) {
  return (
    <div
      role="alertdialog"
      className="rounded-lg border border-amber-200 bg-amber-50 p-3"
    >
      <p className="whitespace-pre-line text-sm text-amber-900">{message}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" onClick={onConfirm} disabled={pending}>
          {confirmLabel}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
