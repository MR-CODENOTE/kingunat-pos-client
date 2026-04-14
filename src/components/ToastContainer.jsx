import React from 'react';
import { useToast } from '../context/ToastContext';
import { CheckCircle, Info, AlertCircle } from 'lucide-react';

const ToastContainer = () => {
  const { toasts } = useToast();

  const getToastClasses = (type) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'info': return 'bg-blue-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-700';
    }
  };

  const getToastIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'info': return <Info className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[999] space-y-2 flex flex-col items-end pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${getToastClasses(toast.type)} text-white px-4 py-3 rounded shadow-lg transform transition-all duration-300 translate-x-0 opacity-100 flex items-center gap-2 pointer-events-auto`}
          style={{ transitionProperty: 'transform, opacity' }}
        >
          {getToastIcon(toast.type)}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
