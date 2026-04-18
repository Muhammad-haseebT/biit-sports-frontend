import { Trophy, Zap, Star, Shield } from "lucide-react";

export default function VolleyballPlayerStats({ stats }) {
  if (!stats) return null;

  const points = stats.goals ?? 0;
  const aces = stats.assists ?? 0;
  const blocks = stats.futsalFouls ?? stats.fouls ?? 0;
  const attackErrors = stats.yellowCards ?? 0;
  const serviceErrors = stats.redCards ?? 0;
  const pomCount = stats.pomCount ?? 0;
  const matches = stats.volleyballMatchesPlayed ?? stats.matchesPlayed ?? 0;

  return (
    <>
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {stats.playerName?.charAt(0) ?? "P"}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{stats.playerName}</h2>
            <p className="text-violet-200">🏐 Volleyball Player</p>
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStat
          icon={<span className="text-3xl">🏐</span>}
          value={matches}
          label="Matches"
        />
        <QuickStat
          icon={<Zap className="w-8 h-8 text-violet-500" />}
          value={points}
          label="Points Scored"
        />
        <QuickStat
          icon={<Star className="w-8 h-8 text-sky-500" />}
          value={aces}
          label="Aces"
        />
        <QuickStat
          icon={<Trophy className="w-8 h-8 text-amber-500" />}
          value={pomCount}
          label="Man of Match"
        />
      </div>

      {/* ── Attack & Serving ── */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white px-6 py-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Zap className="w-5 h-5" /> Attack &amp; Serving
          </h3>
        </div>
        <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-6">
          <StatItem label="Points Scored" value={points} highlight />
          <StatItem label="Aces" value={aces} color="sky" />
          <StatItem label="Blocks" value={blocks} color="emerald" />
        </div>
      </div>

      {/* ── Errors ── */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5" /> Errors
          </h3>
        </div>
        <div className="p-6 grid grid-cols-2 gap-6">
          <StatItem label="Attack Errors" value={attackErrors} warn />
          <StatItem label="Service Errors" value={serviceErrors} danger />
        </div>
      </div>

      {/* ── Cross-sport note ── */}
      {(stats.cricketMatchesPlayed > 0 || stats.futsalMatchesPlayed > 0) && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 text-sm text-violet-700">
          {stats.cricketMatchesPlayed > 0 && (
            <p>
              🏏 Also played <strong>{stats.cricketMatchesPlayed}</strong>{" "}
              cricket match{stats.cricketMatchesPlayed !== 1 ? "es" : ""}.
              Switch sport to see those stats.
            </p>
          )}
          {stats.futsalMatchesPlayed > 0 && (
            <p>
              ⚽ Also played <strong>{stats.futsalMatchesPlayed}</strong> futsal
              match{stats.futsalMatchesPlayed !== 1 ? "es" : ""}. Switch sport
              to see those stats.
            </p>
          )}
        </div>
      )}
    </>
  );
}

function QuickStat({ icon, value, label }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 text-center">
      <div className="flex justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}

function StatItem({ label, value, highlight, color, warn, danger }) {
  const colorClass = danger
    ? "text-red-600"
    : warn
      ? "text-yellow-600"
      : highlight
        ? "text-violet-600"
        : color === "sky"
          ? "text-sky-600"
          : color === "emerald"
            ? "text-emerald-600"
            : "text-gray-800";
  return (
    <div className="flex flex-col">
      <span className="text-sm text-gray-600 mb-1">{label}</span>
      <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
    </div>
  );
}
