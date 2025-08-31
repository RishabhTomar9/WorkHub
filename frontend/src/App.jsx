import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/auth/Login";
import Dashboard from "./pages/Dashboard";
import WorkersList from "./pages/Workers/WorkersList";
import Attendance from "./pages/Attendance/Attendance";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";

function ProtectedLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <NavBar />
      <main className="container py-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes with NavBar */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/workers"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <WorkersList />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Attendance />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
