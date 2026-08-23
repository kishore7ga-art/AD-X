import { useState, useEffect } from "react";
import { AlertTriangle, Lock, Trash2, CheckCircle2, Info, X } from "lucide-react";

export type ModalDialogState = {
  isOpen: boolean;
  type: "confirm" | "prompt" | "alert";
  variant?: "danger" | "warning" | "success" | "info";
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (inputValue?: string) => void;
  onCancel?: () => void;
};

export function ModalDialog({
  isOpen,
  type,
  variant = "info",
  title,
  message,
  placeholder = "",
  defaultValue = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ModalDialogState) {
  const [inputVal, setInputVal] = useState(defaultValue);

  useEffect(() => {
    setInputVal(defaultValue);
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (type === "prompt" && !inputVal.trim()) {
      return;
    }
    onConfirm(type === "prompt" ? inputVal : undefined);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: Trash2,
          iconBg: "bg-rose-50 text-rose-600 border-rose-200",
          btnBg: "bg-rose-600 hover:bg-rose-700 text-white",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconBg: "bg-amber-50 text-amber-600 border-amber-200",
          btnBg: "bg-amber-600 hover:bg-amber-700 text-white",
        };
      case "success":
        return {
          icon: CheckCircle2,
          iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200",
          btnBg: "bg-emerald-600 hover:bg-emerald-700 text-white",
        };
      default:
        return {
          icon: type === "prompt" ? Lock : Info,
          iconBg: "bg-accent/10 text-accent border-blue-200",
          btnBg: "bg-accent hover:bg-accent-hover text-white",
        };
    }
  };

  const style = getVariantStyles();
  const IconComponent = style.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-chalk/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white border border-night-line rounded-xl p-6 shadow-lg space-y-5 animate-in zoom-in-95 duration-150 text-chalk"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg border ${style.iconBg} flex items-center justify-center shrink-0`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-chalk tracking-tight">{title}</h3>
              {/*
                Callers pass messages with blank lines between paragraphs, and
                one of them is an activation URL long enough to overflow the
                dialog. Without `whitespace-pre-line` every message collapsed to
                one run-on line; without `break-words` the URL pushed the modal
                sideways instead of wrapping.
              */}
              <p className="text-xs text-chalk-dim mt-0.5 leading-relaxed whitespace-pre-line break-words">
                {message}
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="text-chalk-dim hover:text-chalk p-1 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Input field for Prompt Dialog */}
        {type === "prompt" && (
          <form onSubmit={handleConfirm} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                autoFocus
                placeholder={placeholder || "Enter text..."}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full bg-night border border-night-line rounded-lg px-4 py-3 text-xs font-semibold text-chalk outline-none focus:border-chalk focus:bg-white transition"
              />
            </div>
          </form>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-night-line">
          {type !== "alert" && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-night-line text-xs font-bold text-chalk-dim hover:bg-night transition cursor-pointer"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleConfirm()}
            disabled={type === "prompt" && !inputVal.trim()}
            className={`px-5 py-2 rounded-md text-xs font-semibold transition cursor-pointer disabled:opacity-50 ${style.btnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
