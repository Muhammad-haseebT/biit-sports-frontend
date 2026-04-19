import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import Cookies from "js-cookie";
import LoadingSpinner from "../../common/LoadingSpinner";
import CricketPlayerStats from "./CricketPlayerStats";
import FutsalPlayerStats from "./FutsalPlayerStats";
import VolleyballPlayerStats from "./VolleyballPlayerStats";
import BadmintonPlayerStats from "./BadmintonPlayerStats";
import TableTennisPlayerStats from "./TableTennisPlayerStats";
import TugOfWarPlayerStats from "./TugOfWarPlayerStats";
import {
  getPlayerStats,
  getPlayerTournamentStats,
  getTournamentNamesandIds,
} from "../../../api/statsApi";

const SPORTS = [
  { key: "cricket", label: "Cricket", emoji: "🏏" },
  { key: "futsal", label: "Futsal", emoji: "⚽" },
  { key: "volleyball", label: "Volleyball", emoji: "🏐" },
  { key: "badminton", label: "Badminton", emoji: "🏸" },
  { key: "table tennis", label: "Table Tennis", emoji: "🏓" },
  { key: "tug of war", label: "Tug of War", emoji: "🪢" },
];

function StatsComponent({ activeSport, stats }) {
  const s = activeSport?.toLowerCase();
  if (s === "futsal") return <FutsalPlayerStats stats={stats} />;
  if (s === "volleyball") return <VolleyballPlayerStats stats={stats} />;
  if (s === "badminton") return <BadmintonPlayerStats stats={stats} />;
  if (s === "table tennis" || s === "tabletennis")
    return <TableTennisPlayerStats stats={stats} />;
  if (s === "tug of war" || s === "tugofwar")
    return <TugOfWarPlayerStats stats={stats} />;
  return <CricketPlayerStats stats={stats} />;
}

export default function PlayerStats() {
  const [overallStats, setOverallStats] = useState(null);
  const [tournamentStats, setTournamentStats] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [loading, setLoading] = useState(true);
  const [tournamentLoading, setTournamentLoading] = useState(false);
  const [sportLoading, setSportLoading] = useState(false); // ✅ new
  const [error, setError] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [activeView, setActiveView] = useState("overall");
  const [manualSport, setManualSport] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const account = JSON.parse(Cookies.get("account"));
        const pid = account.playerId;
        setPlayerId(pid);
        const [statsRes, toursRes] = await Promise.all([
          getPlayerStats(pid),
          getTournamentNamesandIds(),
        ]);
        setOverallStats(statsRes);
        setTournaments(
          toursRes.map((item) => {
            const id = Object.keys(item)[0];
            return { id, name: item[id] };
          }),
        );
      } catch {
        setError("Failed to load player statistics");
      } finally {
        setLoading(false);
      }
    })();
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
      setTournamentStats(
        await getPlayerTournamentStats(playerId, tournamentId),
      );
    } catch {
      setError("Failed to load tournament statistics");
    } finally {
      setTournamentLoading(false);
    }
  };

  // ✅ Sport chip click — loading jab tak data na aaye
  const handleSportChange = async (sport) => {
    setManualSport(sport);
    if (activeView === "overall" && playerId) {
      try {
        setSportLoading(true);
        setOverallStats(await getPlayerStats(playerId, sport));
      } catch (err) {
        console.error(err);
      } finally {
        setSportLoading(false);
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
  const detected = stats?.sport?.toLowerCase() || "cricket";
  const activeSport =
    activeView === "overall" && manualSport ? manualSport : detected;

  return (
    <div className="space-y-6">
      {/* View tabs */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-3 overflow-x-auto">
          {[
            ["overall", "Overall Stats"],
            ["tournament", "By Tournament"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeView === v
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Sport chips — overall only */}
      {activeView === "overall" && overallStats && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">
            Sport
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 flex-wrap">
            {SPORTS.map(({ key, label, emoji }) => {
              const isActive = activeSport === key;
              const isThisLoading = sportLoading && isActive;
              return (
                <button
                  key={key}
                  onClick={() => handleSportChange(key)}
                  disabled={sportLoading}
                  className={`px-3 py-2 rounded-full font-medium transition-all whitespace-nowrap border-2 flex items-center gap-1.5 flex-shrink-0 text-sm ${
                    isActive
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-700 border-gray-200 hover:border-red-300"
                  } ${sportLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {/* ✅ Spinner sirf active chip pe, emoji baaki chips pe */}
                  {isThisLoading ? (
                    <svg
                      className="animate-spin w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      />
                    </svg>
                  ) : (
                    <span>{emoji}</span>
                  )}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tournament selector */}
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

      {tournamentLoading && (
        <div className="flex justify-center items-center min-h-[200px]">
          <LoadingSpinner size="medium" />
        </div>
      )}

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

      {/* ✅ Sport switch loading — stats hide karo jab tak naya data na aaye */}
      {sportLoading && activeView === "overall" ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <LoadingSpinner size="medium" />
        </div>
      ) : (
        stats &&
        !tournamentLoading && (
          <StatsComponent activeSport={activeSport} stats={stats} />
        )
      )}
    </div>
  );
}
