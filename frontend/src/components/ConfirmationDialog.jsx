import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmationDialog({ 
  isOpen, 
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning' // 'warning' | 'danger' | 'info'
}) {
  const colors = {
    warning: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-500',
      hover: 'hover:bg-yellow-600'
    },
    danger: {
      bg: 'bg-red-500',
      text: 'text-red-500',
      hover: 'hover:bg-red-600'
    },
    info: {
      bg: 'bg-blue-500',
      text: 'text-blue-500',
      hover: 'hover:bg-blue-600'
    }
  };

  const color = colors[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }} 
            exit={{ scale: 0.95, opacity: 0, y: 20 }} 
            transition={{ duration: 0.2 }} 
            className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-gray-700"
          >
            <div className="flex flex-col items-center text-center">
              <div className={`p-3 ${color.bg} rounded-full mb-4`}>
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              
              <h2 className="text-xl font-semibold mb-2 text-white">{title}</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white 
                    font-medium transition-colors duration-200"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg ${color.bg} ${color.hover} text-white 
                    font-medium transition-colors duration-200`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}