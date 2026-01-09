import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Welcome from "../pages/Welcome";
import Login from "../pages/Login";
import Home from "../pages/Home";

function AppRoutes() {
  return (
    <Routes>
      {/* Default / Welcome */}
      <Route path="/" element={<Welcome />} />

      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Home (after login) */}
      <Route path="/home" element={<Home />} />

      {/* Fallback: agar ghalat URL ho */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default AppRoutes;
