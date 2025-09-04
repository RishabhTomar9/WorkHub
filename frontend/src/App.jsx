import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import {Analytics} from "@vercel/analytics/react";
import { setAuthToken } from "./api/api";
import Navbar from "./components/NavBar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import SiteView from "./pages/SiteView";
import Payouts from "./pages/Payouts";
import Attendance from "./pages/Attendance";
import Footer from "./components/Footer";
// Removed unused routes: Workers and Attendance are available within SiteView


// 🔹 Simple Loader Component
function Loader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin">
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setAuthToken(null);
      } else {
        const token = await firebaseUser.getIdToken();
        setAuthToken(token);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || null,
        });
      }
      setCheckingAuth(false);
    });
    return unsub;
  }, []);

  if (checkingAuth) return <Loader />;

  if (!user) return <Login />;

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
        <Routes>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/site/:siteId" element={<SiteView />} />
          <Route path="/payouts" element={<Payouts />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Footer />
        <Analytics />
      </div>
    </>
  );
}
