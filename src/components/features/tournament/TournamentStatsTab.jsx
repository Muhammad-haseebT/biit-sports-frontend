import { useState, useEffect } from "react";
import {
  Trophy,
  Award,
  TrendingUp,
  Target,
  Crown,
  ShieldAlert,
} from "lucide-react";
import LoadingSpinner from "../../common/LoadingSpinner";
import { getTournamentStats } from "../../../api/statsApi";

export default function TournamentStatsTab({ tournamentId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tournamentId) return;
    (async () => {
      try {
        setLoading(true);
        setStats(await getTournamentStats(tournamentId));
      } catch (err) {
        setError("Failed to load tournament statistics");
      } finally {
        setLoading(false);
      }
    })();
  }, [tournamentId]);

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

  if (!stats)
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Stats Yet
        </h3>
      </div>
    );

  // ✅ Auto-route based on sport from API
  return stats.sport === "futsal" ? (
    <FutsalTournamentStats stats={stats} />
  ) : (
    <CricketTournamentStats stats={stats} />
  );
}

// ─── CRICKET ─────────────────────────────────────────────────────

function CricketTournamentStats({ stats }) {
  return (
    <div className="space-y-6">
      {/* Man of Tournament */}
      {stats.manOfTournament && (
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8" />
            <h3 className="text-lg font-semibold">Man of the Tournament</h3>
          </div>
          <div className="text-3xl font-bold">
            {stats.manOfTournament.playerName}
          </div>
          <p className="text-yellow-100 mt-1">Outstanding Performance</p>
        </div>
      )}

      {/* Awards grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <AwardCard
          title="Best Batsman"
          icon={<TrendingUp className="w-5 h-5" />}
          name={stats.bestBatsman?.playerName}
          detail={stats.bestBatsman?.reason}
        />
        <AwardCard
          title="Best Bowler"
          icon={<Target className="w-5 h-5" />}
          name={stats.bestBowler?.playerName}
          detail={stats.bestBowler?.reason}
        />
        <AwardCard
          title="Best Fielder"
          icon={<Award className="w-5 h-5" />}
          name={stats.bestFielder?.playerName}
          detail={stats.bestFielder?.reason}
        />
      </div>

      {/* Top Batsmen */}
      {stats.topRunScorers?.length > 0 && (
        <LeaderboardTable
          title="Top Batsmen"
          icon={<TrendingUp className="w-5 h-5" />}
          columns={["Runs", "Balls", "4s", "6s", "POM"]}
          rows={stats.topRunScorers.map((p) => ({
            name: p.playerName,
            cols: [
              p.runs,
              p.ballsFaced,
              p.fours,
              p.sixes,
              p.playerOfMatchCount || 0,
            ],
          }))}
        />
      )}

      {/* Top Bowlers */}
      {stats.topBowlers?.length > 0 && (
        <LeaderboardTable
          title="Top Bowlers"
          icon={<Target className="w-5 h-5" />}
          columns={["Wkts", "Runs", "Balls", "Eco", "POM"]}
          rows={stats.topBowlers.map((p) => ({
            name: p.playerName,
            cols: [
              p.wickets,
              p.runsConceded ?? 0,
              p.ballsBowled,
              p.economy != null ? Number(p.economy).toFixed(2) : "—",
              p.playerOfMatchCount || 0,
            ],
          }))}
        />
      )}
    </div>
  );
}

// ─── FUTSAL ──────────────────────────────────────────────────────

function FutsalTournamentStats({ stats }) {
  return (
    <div className="space-y-6">
      {/* Man of Tournament */}
      {stats.manOfTournament && (
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-8 h-8" />
            <h3 className="text-lg font-semibold">Man of the Tournament</h3>
          </div>
          <div className="text-3xl font-bold">
            {stats.manOfTournament.playerName}
          </div>
          <p className="text-yellow-100 mt-1">Outstanding Performance</p>
        </div>
      )}

      {/* Awards */}
      <div className="grid md:grid-cols-2 gap-4">
        <AwardCard
          title="Top Scorer"
          icon={<span className="text-xl">⚽</span>}
          name={stats.topScorer?.playerName}
          detail={stats.topScorer?.reason}
          color="emerald"
        />
        <AwardCard
          title="Top Assist"
          icon={<span className="text-xl">🤝</span>}
          name={stats.topAssist?.playerName}
          detail={stats.topAssist?.reason}
          color="blue"
        />
      </div>

      {/* Top Goal Scorers */}
      {stats.topGoalScorers?.length > 0 && (
        <LeaderboardTable
          title="Top Scorers"
          icon={<span className="text-xl">⚽</span>}
          columns={["Goals", "Assists", "G+A", "🟨", "🟥"]}
          accentColor="emerald"
          rows={stats.topGoalScorers.map((p) => ({
            name: p.playerName,
            cols: [
              p.goals,
              p.assists,
              (p.goals || 0) + (p.assists || 0),
              p.yellowCards || 0,
              p.redCards || 0,
            ],
          }))}
          highlightCol={0}
        />
      )}

      {/* Top Assisters */}
      {stats.topAssisters?.length > 0 && (
        <LeaderboardTable
          title="Top Assisters"
          icon={<span className="text-xl">🤝</span>}
          columns={["Assists", "Goals", "G+A"]}
          accentColor="blue"
          rows={stats.topAssisters.map((p) => ({
            name: p.playerName,
            cols: [p.assists, p.goals, (p.goals || 0) + (p.assists || 0)],
          }))}
          highlightCol={0}
        />
      )}

      {/* Per-match POMs */}
      {stats.allAwards?.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white px-6 py-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Trophy className="w-5 h-5" /> Player of the Match Awards
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {stats.allAwards.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-3"
              >
                <span className="font-semibold text-gray-800">
                  {a.playerName}
                </span>
                <span className="text-xs text-gray-400">{a.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SHARED SUB COMPONENTS ────────────────────────────────────────

function AwardCard({ title, icon, name, detail, color = "red" }) {
  const colors = {
    red: "text-red-500",
    emerald: "text-emerald-500",
    blue: "text-blue-500",
  };
  return (
    <div className="bg-white rounded-lg shadow-md p-5">
      <div className={`flex items-center gap-2 ${colors[color]} mb-3`}>
        {icon}
        <h4 className="font-semibold">{title}</h4>
      </div>
      <div className="text-2xl font-bold text-gray-800">{name || "TBD"}</div>
      {detail && <div className="text-gray-500 text-sm mt-1">{detail}</div>}
    </div>
  );
}

function LeaderboardTable({
  title,
  icon,
  columns,
  rows,
  accentColor = "red",
  highlightCol = 0,
}) {
  const accent =
    accentColor === "emerald"
      ? "from-emerald-500 to-emerald-600"
      : accentColor === "blue"
        ? "from-blue-500 to-blue-600"
        : "from-red-500 to-red-600";
  const textAccent =
    accentColor === "emerald"
      ? "text-emerald-500"
      : accentColor === "blue"
        ? "text-blue-500"
        : "text-red-500";

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className={`bg-gradient-to-r ${accent} text-white px-6 py-4`}>
        <h3 className="text-lg font-bold flex items-center gap-2">
          {icon} {title}
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: 400 }}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-0 bg-gray-50">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase sticky left-12 bg-gray-50">
                Player
              </th>
              {columns.map((c, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 sticky left-0 bg-white">
                  <RankBadge rank={i + 1} />
                </td>
                <td className="px-4 py-3 font-semibold text-gray-800 text-sm sticky left-12 bg-white">
                  {row.name}
                </td>
                {row.cols.map((v, j) => (
                  <td
                    key={j}
                    className={`px-4 py-3 text-center text-sm ${j === highlightCol ? `font-bold ${textAccent}` : "text-gray-600"}`}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankBadge({ rank }) {
  const color =
    rank === 1
      ? "bg-gradient-to-br from-yellow-400 to-yellow-500 text-white"
      : rank === 2
        ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
        : rank === 3
          ? "bg-gradient-to-br from-orange-400 to-orange-500 text-white"
          : "bg-gray-200 text-gray-700";
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${color}`}
    >
      {rank}
    </div>
  );
}
