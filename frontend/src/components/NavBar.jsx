import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { HiMenu, HiX } from "react-icons/hi";
import {
  FaHome,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaSignOutAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: FaHome },
    { path: "/attendance", label: "Attendance", icon: FaCalendarAlt },
    { path: "/payouts", label: "Payouts", icon: FaMoneyBillWave },
  ];

  async function handleLogout() {
    await signOut(auth);
    navigate("/login");
  }

  return (
    <nav className="backdrop-blur-md bg-gradient-to-r from-blue-600/95 to-indigo-600/95 text-white shadow-lg sticky top-0 z-50 border-b border-white/10 print:hidden">
      <div className="container flex justify-between items-center py-3 px-6">
        {/* LEFT: Logo + Branding */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3"
        >
          <Link to="/" className="flex items-center gap-3">
            <motion.img
              src="/vite.svg"
              alt="WorkHub Logo"
              className="h-10 w-10 drop-shadow-lg rounded-2xl"
              whileHover={{ rotate: 10, scale: 1.1 }}
              whileTap={{ rotate: -10 }}
            />
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent font-extrabold text-2xl tracking-tight">
              WorkHub
            </span>
          </Link>
        </motion.div>

        {/* RIGHT: Desktop Menu */}
        <div className="hidden md:flex gap-2 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <motion.div
                key={item.path}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to={item.path}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                    isActive
                      ? "bg-white/20 text-white shadow-lg"
                      : "hover:bg-white/10 text-blue-100 hover:text-white"
                  }`}
                >
                  <Icon className="text-lg" />
                  <span className="font-medium text-base">{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white/20 rounded-lg -z-10"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}

          {/* Logout Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 bg-red-500/90 hover:bg-red-600 px-4 py-2 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <FaSignOutAlt />
            <span className="font-medium text-base">Logout</span>
          </motion.button>
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setOpen(!open)}
        >
          {open ? <HiX className="text-2xl" /> : <HiMenu className="text-2xl" />}
        </motion.button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-blue-700/95 backdrop-blur-md border-t border-white/10 overflow-hidden"
          >
            <div className="flex flex-col px-6 py-4 gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "hover:bg-white/10 text-blue-100 hover:text-white"
                      }`}
                    >
                      <Icon className="text-lg" />
                      <span className="font-medium text-base">
                        {item.label}
                      </span>
                    </Link>
                  </motion.div>
                );
              })}
              <motion.button
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={handleLogout}
                className="flex items-center gap-3 w-full bg-red-500/90 hover:bg-red-600 px-4 py-3 rounded-lg transition-all duration-300 mt-2"
              >
                <FaSignOutAlt />
                <span className="font-medium text-base">Logout</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
