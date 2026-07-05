'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Info, WarningCircle, X } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const icons = {
  success: <CheckCircle weight="fill" className="text-green-500 w-5 h-5" />,
  error: <XCircle weight="fill" className="text-red-500 w-5 h-5" />,
  info: <Info weight="fill" className="text-blue-500 w-5 h-5" />,
  warning: <WarningCircle weight="fill" className="text-yellow-500 w-5 h-5" />,
};

const bgColors = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-yellow-50 border-yellow-200',
};

export function Toast({ id, title, message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      layout
      className={cn(
        'flex items-start gap-3 p-4 border rounded-xl shadow-lg min-w-[300px] max-w-sm',
        bgColors[type]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {message && <p className="text-sm text-gray-600 mt-1">{message}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
