import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Welcome from "../pages/Welcome";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Sports from "../pages/Sports";
import Seasons from "../pages/Seasons";
import Matches from "../pages/Matches";
import ManageAccounts from "../pages/ManageAccounts";
import MyScorer from "../pages/MyScorer";

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
      <Route path="/logout" element={<Navigate to="/" />} />
      <Route path="/sports" element={<Sports />} />
      <Route path="/seasons" element={<Seasons />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/manage-accounts" element={<ManageAccounts />} />
      <Route path="/my-scorer" element={<MyScorer />} />
    </Routes>
  );
}

export default AppRoutes;
