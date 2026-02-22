import { Routes, Route, Navigate } from "react-router-dom";

// Pages
import Welcome from "../pages/auth/Welcome";
import Login from "../pages/auth/Login";
import Home from "../pages/Home";
import Sports from "../pages/sport/Sports";
import Seasons from "../pages/seasons/Seasons";
import Matches from "../pages/match/Matches";
import ManageAccounts from "../pages/admin/ManageAccounts";
import MyScorer from "../pages/match/MyScorer";
import DetailedTournament from "../pages/tournament/DetailedTournament";
import CreateTournament from "../pages/tournament/CreateTournament";
import SportSelection from "../pages/sport/SportSelection";
import TournamentDetail from "../pages/tournament/TournamentDetail";
import SportTournamentDetail from "../pages/tournament/sport_tournamentDetail";
import Request from "../pages/requests/Request";
import Stats from "../pages/stats/Stats";
import MatchScoreRoute from "../pages/match/MatchScoreRoute";

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
      <Route path="/tournament-detail" element={<TournamentDetail />} />
      <Route path="/detailed-tournament" element={<DetailedTournament />} />
      <Route path="/create-tournament" element={<CreateTournament />} />
      <Route path="/sports-selection" element={<SportSelection />} />
      <Route
        path="/sport-tournament-detail"
        element={<SportTournamentDetail />}
      />
      <Route path="/stats" element={<Stats />} />
      <Route path="/request" element={<Request />} />
      <Route path="/match" element={<MatchScoreRoute />} />
    </Routes>
  );
}

export default AppRoutes;
