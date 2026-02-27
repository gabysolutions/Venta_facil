import { useEffect } from "react";
import { X } from "lucide-react";

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmModal({
  open,
  title = "Confirmar acción",
  description = "¿Estás seguro?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  // Cerrar con ESC
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative h-full w-full grid place-items-center p-4">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f172a] text-slate-100 shadow-2xl animate-[fadeIn_.15s_ease-out]">
          
          {/* Header */}
          <div className="p-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-slate-400 mt-1">{description}</p>
            </div>

            {/* Botón X */}
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="h-9 w-9 rounded-lg bg-white/5 hover:bg-white/10 grid place-items-center transition"
            >
              <X className="h-4 w-4 text-slate-300" />
            </button>
          </div>

          {/* Actions */}
          <div className="p-5 pt-0 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 py-2.5 text-sm font-medium transition"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0b1220] py-2.5 text-sm font-semibold transition"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>

      {/* Animación */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}
