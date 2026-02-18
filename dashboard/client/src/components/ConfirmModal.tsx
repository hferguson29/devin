import { AlertTriangle, X } from "lucide-react";

interface ConfirmModalProps {
  flagName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  flagName,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Remove Feature Flag
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to remove{" "}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-900">
                {flagName}
              </code>
              ? This will open a PR to delete all references to this flag.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
          >
            Confirm Removal
          </button>
        </div>
      </div>
    </div>
  );
}
