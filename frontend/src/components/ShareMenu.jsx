import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaShareAlt, FaWhatsapp, FaSave } from "react-icons/fa";
import { LuMessageSquareText } from "react-icons/lu";

export default function ShareMenu({
  workerSlip,
  shareImageOnWhatsApp,
  shareOnWhatsApp,
  generatePDFForSharing,
}) {
  const [open, setOpen] = useState(false);

  const options = [
    {
      label: "Image",
      icon: <FaWhatsapp className="text-green-500 text-2xl" />,
      action: () => shareImageOnWhatsApp(workerSlip),
    },
    {
      label: "Text",
      icon: <LuMessageSquareText className="text-yellow-400 text-2xl" />,
      action: () => shareOnWhatsApp(workerSlip),
    },
    {
      label: "PDF",
      icon: <FaSave className="text-blue-400 text-2xl" />,
      action: () => generatePDFForSharing(),
    },
  ];

  return (
    <div className="relative inline-block">
      {/* Main Share Button */}
      <motion.button
        whileHover={{ scale: 1.15, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
      >
        <FaShareAlt className="text-xl" />
      </motion.button>

      {/* Share Options */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 flex gap-4 bg-black backdrop-blur-lg p-4 rounded-2xl shadow-2xl"
          >
            {options.map((opt, i) => (
              <motion.div
                key={opt.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center gap-1"
              >
                <motion.button
                  whileHover={{ scale: 1.2, rotate: 8 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    opt.action();
                    setOpen(false);
                  }}
                  className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center shadow-md hover:bg-white/20"
                >
                  {opt.icon}
                </motion.button>
                <span className="text-xs text-white">{opt.label}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
