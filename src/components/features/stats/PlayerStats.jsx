import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import Cookies from "js-cookie";
import LoadingSpinner from "../../common/LoadingSpinner";
import CricketPlayerStats from "./CricketPlayerStats";
import {
  getPlayerStats,
  getPlayerTournamentStats,
  getTournamentNamesandIds,
} from "../../../api/statsApi";

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
  const [selectedSport, setSelectedSport] = useState("cricket");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const account = JSON.parse(Cookies.get("account"));
        const currentPlayerId = account.playerId;
        setPlayerId(currentPlayerId);

        // Fetch overall stats and tournament list
        const [statsResponse, tournamentsResponse] = await Promise.all([
          getPlayerStats(currentPlayerId),
          getTournamentNamesandIds(),
        ]);

        setOverallStats(statsResponse);

        // Transform tournaments array from [{id: name}] to [{id, name}]
        const transformedTournaments = tournamentsResponse.map((item) => {
          const id = Object.keys(item)[0];
          const name = item[id];
          return { id, name };
        });
        setTournaments(transformedTournaments);
      } catch (err) {
        console.error("Error fetching player stats:", err);
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
      console.error("Error fetching tournament stats:", err);
      setError("Failed to load tournament statistics");
    } finally {
      setTournamentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const stats = activeView === "overall" ? overallStats : tournamentStats;

  return (
    <div className="space-y-6">
      {/* View Selector */}
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

      {/* Sport Chips - Only show in Overall view */}
      {activeView === "overall" && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-3">
            Select Sport
          </label>
          <div className="flex gap-3 overflow-x-auto">
            <button
              onClick={() => setSelectedSport("cricket")}
              className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap border-2 flex items-center gap-2 ${
                selectedSport === "cricket"
                  ? "bg-red-500 text-white border-red-500"
                  : "bg-white text-gray-700 border-gray-200 hover:border-red-300"
              }`}
            >
              <span>🏏</span> Cricket
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-full font-medium whitespace-nowrap border-2 bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed flex items-center gap-2 opacity-60"
            >
              <span>⚽</span> Football
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-full font-medium whitespace-nowrap border-2 bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed flex items-center gap-2 opacity-60"
            >
              <span>🏀</span> Basketball
            </button>
            <button
              disabled
              className="px-4 py-2 rounded-full font-medium whitespace-nowrap border-2 bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed flex items-center gap-2 opacity-60"
            >
              <span>🏐</span> Volleyball
            </button>
          </div>
        </div>
      )}

      {/* Tournament Selector */}
      {activeView === "tournament" && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Select Tournament
          </label>
          <select
            value={selectedTournament}
            onChange={(e) => handleTournamentChange(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none transition-colors bg-white"
          >
            <option value="">Choose a tournament...</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading State for Tournament */}
      {tournamentLoading && (
        <div className="flex justify-center items-center min-h-[200px]">
          <LoadingSpinner size="medium" />
        </div>
      )}

      {/* No Tournament Selected */}
      {activeView === "tournament" &&
        !selectedTournament &&
        !tournamentLoading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Select a Tournament
            </h3>
            <p className="text-gray-500">
              Choose a tournament from the dropdown to view your stats
            </p>
          </div>
        )}

      {/* Stats Display */}
      {stats && !tournamentLoading && (
        <>
          {selectedSport === "cricket" ? (
            <CricketPlayerStats stats={stats} />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">🏃‍♂️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Coming Soon!
              </h3>
              <p className="text-gray-500">
                Stats for {selectedSport} will be available soon
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
