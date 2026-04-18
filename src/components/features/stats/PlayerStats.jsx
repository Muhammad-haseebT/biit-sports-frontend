import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import Cookies from "js-cookie";
import LoadingSpinner from "../../common/LoadingSpinner";
import CricketPlayerStats from "./CricketPlayerStats";
import FutsalPlayerStats from "./FutsalPlayerStats";
import VolleyballPlayerStats from "./VolleyballPlayerStats";
import {
  getPlayerStats,
  getPlayerTournamentStats,
  getTournamentNamesandIds,
} from "../../../api/statsApi";

const SPORTS = [
  { key: "cricket", label: "Cricket", emoji: "🏏" },
  { key: "futsal", label: "Futsal", emoji: "⚽" },
  { key: "volleyball", label: "Volleyball", emoji: "🏐" }, // ✅ NEW
];

export default function PlayerStats() {
  const [overallStats, setOverallStats] = useState(null);
  const [tournamentStats, setTournamentStats] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [loading, setLoading] = useState(true);
  const [tournamentLoading, setTournamentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [activeView, setActiveView] = useState("overall");
  const [manualSport, setManualSport] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const account = JSON.parse(Cookies.get("account"));
        const currentPlayerId = account.playerId;
        setPlayerId(currentPlayerId);

        const [statsResponse, tournamentsResponse] = await Promise.all([
          getPlayerStats(currentPlayerId),
          getTournamentNamesandIds(),
        ]);

        setOverallStats(statsResponse);

        const transformedTournaments = tournamentsResponse.map((item) => {
          const id = Object.keys(item)[0];
          const name = item[id];
          return { id, name };
        });
        setTournaments(transformedTournaments);
      } catch (err) {
        setError("Failed to load player statistics");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTournamentChange = async (tournamentId) => {
    if (!tournamentId) {
      setTournamentStats(null);
      setSelectedTournament("");
      return;
    }
    try {
      setTournamentLoading(true);
      setSelectedTournament(tournamentId);
      const stats = await getPlayerTournamentStats(playerId, tournamentId);
      setTournamentStats(stats);
    } catch (err) {
      setError("Failed to load tournament statistics");
    } finally {
      setTournamentLoading(false);
    }
  };

  const handleSportChange = async (sport) => {
    setManualSport(sport);
    if (activeView === "overall" && playerId) {
      try {
        const stats = await getPlayerStats(playerId, sport);
        setOverallStats(stats);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );

  const stats = activeView === "overall" ? overallStats : tournamentStats;
  const detectedSport = stats?.sport || "cricket";
  const activeSport =
    activeView === "overall" && manualSport ? manualSport : detectedSport;

  return (
    <div className="space-y-6">
      {/* ── View Selector ── */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveView("overall")}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === "overall"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Overall Stats
          </button>
          <button
            onClick={() => setActiveView("tournament")}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === "tournament"
                ? "bg-red-500 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            By Tournament
          </button>
        </div>
      </div>

      {/* ── Sport Chips (overall view only) ── */}
      {activeView === "overall" && overallStats && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">
            Sport
          </label>
          <div className="flex gap-3 overflow-x-auto">
            {SPORTS.map(({ key, label, emoji }) => (
              <button
                key={key}
                onClick={() => handleSportChange(key)}
                className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap border-2 flex items-center gap-2 ${
                  activeSport === key
                    ? "bg-red-500 text-white border-red-500"
                    : "bg-white text-gray-700 border-gray-200 hover:border-red-300"
                }`}
              >
                <span>{emoji}</span> {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Tournament Selector ── */}
      {activeView === "tournament" && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Tournament
          </label>
          <select
            value={selectedTournament}
            onChange={(e) => handleTournamentChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none bg-white"
          >
            <option value="">Choose a tournament...</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {tournamentStats?.sport && (
            <p className="text-xs text-gray-400 mt-2">
              Sport:{" "}
              <span className="font-semibold capitalize">
                {tournamentStats.sport}
              </span>
            </p>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {tournamentLoading && (
        <div className="flex justify-center items-center min-h-[200px]">
          <LoadingSpinner size="medium" />
        </div>
      )}

      {/* ── Empty State ── */}
      {activeView === "tournament" &&
        !selectedTournament &&
        !tournamentLoading && (
          <div className="bg-white rounded-lg shadow-md p-6 md:p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Select a Tournament
            </h3>
            <p className="text-gray-500">
              Choose a tournament to view your stats
            </p>
          </div>
        )}

      {/* ── Stats Display — routes by sport ── */}
      {stats && !tournamentLoading && (
        <>
          {activeSport.toLowerCase() === "volleyball" ? (
            <VolleyballPlayerStats stats={stats} /> // ✅ NEW
          ) : activeSport.toLowerCase() === "futsal" ? (
            <FutsalPlayerStats stats={stats} />
          ) : (
            <CricketPlayerStats stats={stats} />
          )}
        </>
      )}
    </div>
  );
}
