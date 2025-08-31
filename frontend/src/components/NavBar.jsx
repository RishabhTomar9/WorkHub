import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

export default function NavBar() {
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut(auth);
    localStorage.removeItem("firebase_id_token");
    navigate("/login");
  }

  return (
    <nav className="bg-white shadow p-4 flex justify-between items-center">
      <div className="space-x-4">
        <Link to="/">Dashboard</Link>
        <Link to="/workers">Workers</Link>
        <Link to="/attendance">Attendance</Link>
      </div>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </nav>
  );
}
