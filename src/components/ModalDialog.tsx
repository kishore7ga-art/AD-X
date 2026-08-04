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
          iconBg: "bg-rose-500/20 text-rose-400 border-rose-500/30",
          btnBg: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50",
          borderGlow: "border-rose-500/30 shadow-[0_0_30px_rgba(244,63,94,0.15)]",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          iconBg: "bg-amber-500/20 text-amber-400 border-amber-500/30",
          btnBg: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/50",
          borderGlow: "border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]",
        };
      case "success":
        return {
          icon: CheckCircle2,
          iconBg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
          btnBg: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50",
          borderGlow: "border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]",
        };
      default:
        return {
          icon: type === "prompt" ? Lock : Info,
          iconBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
          btnBg: "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-950/50",
          borderGlow: "border-blue-500/30 shadow-[0_0_30px_rgba(59,130,246,0.15)]",
        };
    }
  };

  const style = getVariantStyles();
  const IconComponent = style.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-night/85 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md bg-night-card border ${style.borderGlow} rounded-3xl p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 text-chalk`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${style.iconBg} flex items-center justify-center shrink-0`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-chalk tracking-tight">{title}</h3>
              <p className="text-xs text-chalk-dim/70 mt-0.5 leading-relaxed">{message}</p>
            </div>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="text-chalk-dim/50 hover:text-chalk p-1 transition cursor-pointer"
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
                className="w-full bg-night border border-night-line rounded-xl px-4 py-3 text-xs font-semibold text-chalk outline-none focus:border-chalk transition shadow-inner"
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
              className="px-5 py-2.5 rounded-xl border border-night-line text-xs font-bold text-chalk-dim hover:text-chalk hover:border-chalk-dim/40 transition cursor-pointer"
            >
              {cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={() => handleConfirm()}
            disabled={type === "prompt" && !inputVal.trim()}
            className={`px-6 py-2.5 rounded-xl text-xs font-black shadow-lg transition cursor-pointer disabled:opacity-50 ${style.btnBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
