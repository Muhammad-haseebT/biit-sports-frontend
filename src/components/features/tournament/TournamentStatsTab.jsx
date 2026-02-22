import { useState, useEffect } from "react";
import { Trophy, Award, TrendingUp, Target, Crown } from "lucide-react";
import LoadingSpinner from "../../common/LoadingSpinner";
import { getTournamentStats } from "../../../api/statsApi";

export default function TournamentStatsTab({
  tournamentId,
  sport = "cricket",
}) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const tournamentStats = await getTournamentStats(tournamentId);
        setStats(tournamentStats);
      } catch (err) {
        console.error("Error fetching tournament stats:", err);
        setError("Failed to load tournament statistics");
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      fetchStats();
    }
  }, [tournamentId]);

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

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Stats Available
        </h3>
        <p className="text-gray-500">
          Statistics for this tournament are not available yet
        </p>
      </div>
    );
  }

  // Show cricket stats or coming soon for other sports
  if (sport.toLowerCase() !== "cricket") {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <div className="text-6xl mb-4">
          {sport.toLowerCase() === "football" && "⚽"}
          {sport.toLowerCase() === "basketball" && "🏀"}
          {sport.toLowerCase() === "volleyball" && "🏐"}
          {sport.toLowerCase() !== "football" &&
            sport.toLowerCase() !== "basketball" &&
            sport.toLowerCase() !== "volleyball" &&
            "🏃‍♂️"}
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Coming Soon!
        </h3>
        <p className="text-gray-500">
          Stats for {sport} tournaments will be available soon
        </p>
      </div>
    );
  }

  // Cricket stats display
  return (
    <div className="space-y-6">
      {/* Man of the Tournament Card */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8" />
          <h3 className="text-lg font-semibold">Man of the Tournament</h3>
        </div>
        <div className="text-3xl font-bold">{stats.manOfTournamentName}</div>
        <p className="text-yellow-100 mt-1">Outstanding Performance</p>
      </div>

      {/* Top Performers Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Best Batsman */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center gap-2 text-red-500 mb-3">
            <TrendingUp className="w-5 h-5" />
            <h4 className="font-semibold">Best Batsman</h4>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {stats.bestBatsmanName}
          </div>
          <div className="text-gray-600 mt-1">{stats.bestBatsmanRuns} runs</div>
        </div>

        {/* Best Bowler */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center gap-2 text-red-500 mb-3">
            <Target className="w-5 h-5" />
            <h4 className="font-semibold">Best Bowler</h4>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {stats.bestBowlerName}
          </div>
          <div className="text-gray-600 mt-1">
            {stats.bestBowlerWickets} wickets
          </div>
        </div>

        {/* Highest Scorer */}
        <div className="bg-white rounded-lg shadow-md p-5">
          <div className="flex items-center gap-2 text-red-500 mb-3">
            <Award className="w-5 h-5" />
            <h4 className="font-semibold">Highest Score</h4>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {stats.highestScorerName}
          </div>
          <div className="text-gray-600 mt-1">{stats.highestRuns} runs</div>
        </div>
      </div>

      {/* Top Batsmen Leaderboard */}
      {stats.topBatsmen && stats.topBatsmen.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 md:px-6 py-3 md:py-4">
            <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5" />
              Top Batsmen
            </h3>
          </div>
          {/* Mobile scroll hint */}
          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200 md:hidden">
            👉 Swipe to see all columns
          </div>
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full" style={{ minWidth: "600px" }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10">
                    Rank
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-12 bg-gray-50 z-10">
                    Player
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Runs
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Balls
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    4s
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    6s
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    POM
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.topBatsmen.map((player, index) => (
                  <tr
                    key={player.playerId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-2 md:px-4 py-3 md:py-4 sticky left-0 bg-white">
                      <RankBadge rank={index + 1} />
                    </td>
                    <td className="px-2 md:px-4 py-3 md:py-4 font-semibold text-gray-800 text-sm sticky left-12 bg-white">
                      {player.playerName}
                    </td>
                    <td className="px-2 md:px-4 py-3 md:py-4 text-center font-bold text-red-500 text-sm">
                      {player.runs}
                    </td>
                    <td className="px-2 md:px-4 py-3 md:py-4 text-center text-gray-600 text-sm">
                      {player.ballsFaced}
                    </td>
                    <td className="px-2 md:px-4 py-3 md:py-4 text-center text-gray-600 text-sm">
                      {player.fours}
                    </td>
                    <td className="px-2 md:px-4 py-3 md:py-4 text-center text-gray-600 text-sm">
                      {player.sixes}
                    </td>
                    <td className="px-2 md:px-4 py-3 md:py-4 text-center">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        {player.pomCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Bowlers Leaderboard */}
      {stats.topBowlers && stats.topBowlers.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 md:px-6 py-3 md:py-4">
            <h3 className="text-base md:text-lg font-bold flex items-center gap-2">
              <Target className="w-4 h-4 md:w-5 md:h-5" />
              Top Bowlers
            </h3>
          </div>
          {/* Mobile scroll hint */}
          <div className="px-4 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200 md:hidden">
            👉 Swipe to see all columns
          </div>
          <div className="overflow-x-auto overflow-y-visible">
            <table className="w-full" style={{ minWidth: "650px" }}>
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50 z-10">
                    Rank
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-12 bg-gray-50 z-10">
                    Player
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Wickets
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Runs
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Balls
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Economy
                  </th>
                  <th className="px-2 md:px-4 py-2 md:py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    POM
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.topBowlers.map((player, index) => (
                  <tr
                    key={player.playerId}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-2 md:px-4 py-3 md:py-4 sticky left-0 bg-white">
                      <RankBadge rank={index + 1} />
                    </td>
                    <td className="px-2 md:px-4 py-3 md:py-4 font-semibold text-gray-800 text-sm sticky left-12 bg-white">
                      {player.playerName}
                    </td>
                    <td className="px-2 md:px-4 py-3 md:py-4 text-center font-bold text-red-500 text-sm">
                      {player.wickets}
                    </td>
                    <td className="px-2 md:px-4 py-3 md:py-4 text-center text-gray-600 text-sm">
                      {player.runsConceded}
                    </td>
                    <td className="px-2 md:px-4 py-3 md:py-4 text-center text-gray-600 text-sm">
                      {player.ballsBowled}
                    </td>
                    <td className="px-2 md:px-4 py-3 md:py-4 text-center text-gray-600 text-sm">
                      {player.economy?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-2 md:px-4 py-3 md:py-4 text-center">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                        {player.pomCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Rank Badge Component
function RankBadge({ rank }) {
  const getBadgeColor = (rank) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white";
      case 2:
        return "bg-gradient-to-br from-gray-300 to-gray-400 text-white";
      case 3:
        return "bg-gradient-to-br from-orange-400 to-orange-500 text-white";
      default:
        return "bg-gray-200 text-gray-700";
    }
  };

  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${getBadgeColor(
        rank,
      )}`}
    >
      {rank}
    </div>
  );
}
