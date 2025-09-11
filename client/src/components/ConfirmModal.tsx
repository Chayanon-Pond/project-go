import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = "Are you sure?",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" aria-modal="true">
      <div className="bg-base-100 text-base-content rounded-xl p-6 w-full max-w-md border border-slate-600/30">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onCancel} className="btn btn-sm">x</button>
        </div>
        {description && <p className="text-sm mb-4 text-base-content/70">{description}</p>}
        <div className="flex gap-3 justify-end">
          <button className="btn btn-ghost" onClick={onCancel}>{cancelText}</button>
          <button className="btn btn-error" onClick={() => void onConfirm()}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
