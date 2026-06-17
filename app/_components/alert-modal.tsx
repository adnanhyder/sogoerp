import { AlertCircle, CheckCircle2, Info, Trash } from "lucide-react";
import React from "react";

export type AlertModalType = "danger" | "success" | "info" | "delete";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: AlertModalType;
  isLoading?: boolean;
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "info",
  isLoading = false,
}: AlertModalProps) {
  if (!isOpen) return null;

  let Icon = Info;
  let iconColor = "text-[#FAC54D]";
  let iconBg = "bg-[#FAC54D]/10";
  let confirmBg = "bg-[#FAC54D] hover:bg-[#e0b040] focus:ring-[#FAC54D]/20 text-gray-900";

  if (type === "danger" || type === "delete") {
    Icon = type === "delete" ? Trash : AlertCircle;
    iconColor = "text-red-600";
    iconBg = "bg-red-100";
    confirmBg = "bg-red-600 hover:bg-red-700 focus:ring-red-600/20 text-white";
  } else if (type === "success") {
    Icon = CheckCircle2;
    iconColor = "text-green-600";
    iconBg = "bg-green-100";
    confirmBg = "bg-green-600 hover:bg-green-700 focus:ring-green-600/20 text-white";
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
      <div className="w-full max-w-[360px] rounded-[24px] bg-white p-6 text-center shadow-2xl animate-[slideUpFade_0.3s_ease-out_both]">
        <div className={`mx-auto mb-4 flex size-12 items-center justify-center rounded-full ${iconBg} ${iconColor}`}>
          <Icon className="size-6" />
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
        <p className="mb-6 text-[13px] font-medium text-gray-500">{description}</p>
        <div className="flex gap-3">
          {onClose && (
            <button
              className="flex-1 rounded-[12px] border border-gray-200 bg-white py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 focus:ring-4 focus:ring-gray-100 disabled:opacity-50"
              disabled={isLoading}
              onClick={onClose}
              type="button"
            >
              {cancelText}
            </button>
          )}
          {onConfirm && (
            <button
              className={`flex-1 rounded-[12px] py-3 text-sm font-bold transition focus:ring-4 disabled:opacity-50 disabled:cursor-wait ${confirmBg}`}
              disabled={isLoading}
              onClick={onConfirm}
              type="button"
            >
              {isLoading ? "Processing..." : confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

