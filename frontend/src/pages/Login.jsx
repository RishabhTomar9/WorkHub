import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";
import { motion } from "framer-motion";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) navigate("/");
    });
    return () => unsubscribe();
  }, [navigate]);

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      localStorage.setItem("firebase_id_token", token);
      navigate("/");
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md backdrop-blur-xl bg-transparent border border-white/40 rounded-3xl shadow-2xl p-10 text-center"
      >
        {/* Logo / Branding */}
        <div className="flex flex-col items-center">
        {/* Logo */}
        <motion.img
          src="/vite.svg"
          alt="WorkHub Logo"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-24 h-24 sm:w-28 sm:h-28 mb-4 rounded-full border-[6px] border-white/80 shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform duration-300"
          />

        {/* Title */}
        <motion.h1
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-extrabold text-white/90 drop-shadow-md mb-2"
        >
          WorkHub
        </motion.h1>

        {/* Subtitle */}
        <p className="text-gray-300 mb-8 text-sm sm:text-base">
          Manage your workforce with ease
        </p>
      </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 text-red-200 bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-sm"
          >
            {error}
          </motion.div>
        )}


        {/* Google Sign In */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold flex items-center justify-center gap-3 shadow-lg transition-all duration-300"
        >
          <FcGoogle className="w-6 h-6" />
          {loading ? "Signing in..." : "Sign in with Google"}
        </motion.button>


        {/* Divider */}
        <div className="my-6 flex items-center">
          <div className="flex-grow border-t border-white/20"></div>
          <span className="px-3 text-gray-300 text-sm font-medium">Secure Access</span>
          <div className="flex-grow border-t border-white/20"></div>
        </div>

        {/* Footer Note */}
        {/* <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} WorkHub • All rights reserved
        </p> */}
      </motion.div>
    </div>
  );
}
