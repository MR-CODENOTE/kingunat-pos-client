import React, { useRef, useEffect } from 'react';
import { useConfirm } from '../context/ConfirmContext';
import { HelpCircle } from 'lucide-react';

const ConfirmModal = () => {
  const { isOpen, title, message, closeConfirm } = useConfirm();
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        closeConfirm(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black bg-opacity-50 p-4 transition-opacity" onClick={() => closeConfirm(false)}>
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 animate-fade-in text-center" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
          <HelpCircle className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg leading-6 font-bold text-gray-900 mb-2" id="confirm-title">{title}</h3>
        <p className="text-sm text-gray-500 mb-6" id="confirm-message">{message}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => closeConfirm(false)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors w-full"
          >
            Cancel
          </button>
          <button
            onClick={() => closeConfirm(true)}
            className="bg-japan-red text-white px-4 py-2 rounded-lg hover:bg-red-800 text-sm font-medium transition-colors w-full"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
