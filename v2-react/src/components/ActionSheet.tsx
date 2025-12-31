import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
export function ActionSheet({
  isOpen,
  onClose,
  title,
  children
}: ActionSheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  return <AnimatePresence>
      {isOpen && <>
          {/* Backdrop */}
          <motion.div initial={{
        opacity: 0
      }} animate={{
        opacity: 1
      }} exit={{
        opacity: 0
      }} transition={{
        duration: 0.2
      }} onClick={onClose} className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />

          {/* Sheet */}
          <motion.div initial={{
        y: '100%'
      }} animate={{
        y: 0
      }} exit={{
        y: '100%'
      }} transition={{
        type: 'spring',
        damping: 25,
        stiffness: 300
      }} className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] shadow-2xl overflow-hidden max-w-md mx-auto">
            {/* Handle bar for visual affordance */}
            <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>

            <div className="px-6 pb-28 pt-2">
              {title && <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {title}
                  </h3>
                  <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100">
                    <X size={20} />
                  </button>
                </div>}

              <div className="space-y-2">{children}</div>
            </div>
          </motion.div>
        </>}
    </AnimatePresence>;
}
interface ActionSheetOptionProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  description?: string;
  rightIcon?: React.ReactNode;
}
export function ActionSheetOption({
  icon,
  label,
  onClick,
  description,
  rightIcon
}: ActionSheetOptionProps) {
  return <button onClick={onClick} className="w-full flex items-center p-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors group text-left">
      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-900 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-gray-200">
        {icon}
      </div>

      <div className="ml-4 flex-1">
        <div className="font-semibold text-gray-900 text-base">{label}</div>
        {description && <div className="text-sm text-gray-500 mt-0.5">{description}</div>}
      </div>

      {rightIcon && <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
          {rightIcon}
        </div>}
    </button>;
}