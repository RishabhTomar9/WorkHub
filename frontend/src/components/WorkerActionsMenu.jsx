import React from 'react';
import {motion, AnimatePresence } from 'framer-motion';
import { FiMoreVertical, FiEdit2, FiTrash2, FiClipboard } from 'react-icons/fi';
import { ImSpinner2 } from 'react-icons/im';

export default function WorkerActionsMenu({ 
  worker, 
  onDelete, 
  onEdit, 
  onViewAttendance, 
  isDeleting,
  isEditing 
}) {
  const [showMenu, setShowMenu] = React.useState(false);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu && !event.target.closest('.worker-actions-menu')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div className="relative worker-actions-menu">
      <motion.button 
        transition={{ duration: 0.2 }}
        onClick={() => setShowMenu(prev => !prev)}
        aria-haspopup="true"
        aria-expanded={showMenu}
        aria-label="Open worker actions"
        className={`rounded-xl hover:bg-white/10 transition-all duration-200 group relative z-10`}
      >
        <motion.div
          transition={{ duration: 0.2 }}
        >
          <FiMoreVertical className="w-5 h-5" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMenu(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[90]"
            />

            {/* Menu */}
              <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ 
                duration: 0.2,
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="absolute right-0 mt-2 w-56 bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-2xl border border-white/10 z-[100] overflow-hidden"
            >
              <motion.button
                whileHover={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onViewAttendance(worker);
                  setShowMenu(false);
                }}
                tabIndex={0}
                className="flex items-center gap-3 w-full px-5 py-3 text-gray-200 hover:text-white transition-all duration-200 group"
              >
                <span className="p-2 rounded-lg bg-gray-700/50 group-hover:bg-gray-600/50 transition-colors">
                  <FiClipboard className="w-4 h-4" />
                </span>
                <span className="font-medium">View Attendance</span>
              </motion.button>

              <motion.button
                whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onEdit(worker);
                  setShowMenu(false);
                }}
                disabled={isEditing}
                tabIndex={0}
                className="flex items-center gap-3 w-full px-5 py-3 text-blue-400 hover:text-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="p-1 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                  <FiEdit2 className="w-4 h-4" />
                </span>
                <span className="font-medium">{isEditing ? 'Editing...' : 'Edit Details'}</span>
              </motion.button>

              <motion.button
                whileHover={{ backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onDelete(worker);
                  setShowMenu(false);
                }}
                disabled={isDeleting}
                tabIndex={0}
                className="flex items-center gap-3 w-full px-5 py-3 text-red-400 hover:text-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="p-1 rounded-lg bg-red-500/20 group-hover:bg-red-500/30 transition-colors">
                  {isDeleting ? <ImSpinner2 className="animate-spin w-4 h-4" /> : <FiTrash2 className="w-4 h-4" />}
                </span>
                <span className="font-medium">{isDeleting ? 'Deleting...' : 'Delete Worker'}</span>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}