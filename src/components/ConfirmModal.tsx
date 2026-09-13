"use client";

import { useEffect } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close confirmation"
        className="absolute inset-0 bg-[#173C34]/30 backdrop-blur-sm"
        onClick={() => {
          if (!loading) onCancel();
        }}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-[#DDE6D7] bg-[#F5F2E8] p-7 shadow-2xl">
        {/* Icon */}
        <div
          className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${
            danger
              ? "bg-red-100 text-red-700"
              : "bg-[#E8EEDB] text-[#214F43]"
          }`}
        >
          {danger ? (
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v4m0 4h.01M10.3 4.7 2.8 18a2 2 0 0 0 1.74 3h14.92a2 2 0 0 0 1.74-3L13.7 4.7a2 2 0 0 0-3.4 0Z"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          )}
        </div>

        {/* Title */}
        <h2
          id="confirm-modal-title"
          className="text-2xl font-bold tracking-tight text-[#173C34]"
        >
          {title}
        </h2>

        {/* Description */}
        <p className="mt-3 text-sm leading-6 text-[#5F7168]">
          {description}
        </p>

        {/* Actions */}
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-2xl border border-[#DDE6D7] bg-white/70 px-5 py-3 text-sm font-semibold text-[#5F7168] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-2xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#214F43] hover:bg-[#173C34]"
            }`}
          >
            {loading ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}