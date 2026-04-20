import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import Swal from "sweetalert2";
import { startmatch } from "../../api/matchApi";
import {
  Trophy,
  MapPin,
  Calendar,
  Clock,
  Hash,
  User,
  AlertTriangle,
  ChevronRight,
  Zap,
} from "lucide-react";
import CricketScoring from "../../components/sports/cricket/CricketScoring";
import FutsalScoring from "../../components/sports/football/FutsalScoring.jsx";
import VolleyballScoring from "../../components/sports/volleyBall/VolleyballScoring.jsx";
import BadmintonScoring from "../../components/sports/badminton/BadmintonScoring.jsx";
import TableTennisScoring from "../../components/sports/tabletennis/TableTennisScoring.jsx";

export default function MatchScoreRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    matchId,
    status,
    team1Id,
    team2Id,
    battingTeamId,
    team1Name,
    team2Name,
    battingTeamName,
    sportId,
    inningsId,
    venue,
    match,
  } = location.state || {};

  const [tossWinner, setTossWinner] = useState(null);
  const [tossWinnerId, setTossWinnerId] = useState(null);
  const [decision, setDecision] = useState(null);
  const [starting, setStarting] = useState(false);
  const [scorerUsername, setScorerUsername] = useState("");

  // ── Volleyball-specific setup fields ──────────────────────────
  const [vbSets, setVbSets] = useState(3);
  const [vbPointsPerSet, setVbPointsPerSet] = useState(25);
  const [vbFinalSetPoints, setVbFinalSetPoints] = useState(15);
  const [ttGames, setTtGames] = useState(4); // best of 7 → 4 to win
  const [ttPointsPerGame, setTtPointsPerGame] = useState(11);
  const sports = [
    "Cricket",
    "Futsal",
    "Volleyball",
    "Table Tennis",
    "Badminton",
    "Ludo",
    "Tug Of War",
    "Chess",
  ];

  const isCricket = sports[sportId - 1] === "Cricket";
  const isFutsal = sports[sportId - 1] === "Futsal";
  const isVolleyball = sports[sportId - 1] === "Volleyball";
  const isBadminton = sports[sportId - 1] === "Badminton";
  const isTableTennis = sports[sportId - 1] === "Table Tennis";

  if (!location.state) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
        No match data found.
      </div>
    );
  }

  const handleStartMatch = async () => {
    setStarting(true);
    try {
      await startmatch(matchId, {
        tossWinnerId,
        decision,
        scorerId: scorerUsername,
        sportId,
        inningsId,
        overs: match?.overs,
      });
      navigate(-1);
    } catch (err) {
      console.error("Failed to start match:", err);
      Swal.fire({
        title: "Error",
        text:
          err?.response?.data?.message ||
          "Failed to start match. Please try again.",
        icon: "error",
      });
    } finally {
      setStarting(false);
    }
  };

  const handleAbandon = () =>
    Swal.fire({
      title: "Are you sure?",
      text: "Match will be abandoned",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, abandon it!",
      cancelButtonText: "No, cancel!",
    }).then((result) => {
      if (result.isConfirmed)
        Swal.fire("Abandoned!", "Match has been abandoned", "success");
    });

  const Spinner = () => (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
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
  );

  // ── Reusable detail grid item ──────────────────────────────────
  const DetailCard = ({ icon: Icon, label, value, accent }) => (
    <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-3 border border-slate-100 dark:border-slate-700 flex items-center gap-3">
      <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
        <Icon size={16} className={accent} />
      </div>
      <div>
        <p className="text-[10px] text-slate-400 uppercase font-bold">
          {label}
        </p>
        <p className="text-xs font-semibold">{value}</p>
      </div>
    </div>
  );

  // ── Number stepper input ───────────────────────────────────────
  const NumStepper = ({ label, value, onChange, min = 1, accent }) => (
    <div className="bg-white/50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-100 dark:border-slate-700">
      <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 font-black text-lg flex items-center justify-center active:scale-90"
        >
          −
        </button>
        <span className={`flex-1 text-center text-xl font-black ${accent}`}>
          {value}
        </span>
        <button
          onClick={() => onChange(value + 1)}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 font-black text-lg flex items-center justify-center active:scale-90"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#f8f9fa] dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] overflow-hidden flex flex-col">
      {/* ══════════════════════════════════════════════════════
          CRICKET
         ══════════════════════════════════════════════════════ */}
      {isCricket && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <CricketScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            bTeamId={battingTeamId}
            team1Name={team1Name}
            team2Name={team2Name}
            battingTeamName={battingTeamName}
            inningsId={inningsId}
          />
        </div>
      )}
      {isCricket && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-red-500/10 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Trophy size={64} className="text-red-600" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 font-bold text-2xl mb-2 border border-red-100 dark:border-red-900/30">
                  {team1Name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-sm font-bold text-center line-clamp-1">
                  {team1Name}
                </h3>
              </div>
              <div className="px-4 flex flex-col items-center">
                <div className="bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full mb-1">
                  VS
                </div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                  Match Setup
                </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-2xl mb-2 border border-blue-100 dark:border-blue-900/30">
                  {team2Name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-sm font-bold text-center line-clamp-1">
                  {team2Name}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-red-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-red-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-red-500"
            />
            <DetailCard
              icon={Hash}
              label="Overs"
              value={`${match?.overs} Overs`}
              accent="text-red-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-red-600" />
              <span className="text-red-600">Who Won The Toss?</span>
            </label>
            <div className="flex gap-2">
              {[team1Name, team2Name].map((team, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTossWinnerId(team === team1Name ? team1Id : team2Id);
                    setTossWinner(team);
                  }}
                  className={`flex-1 py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${tossWinner === team ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/30" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-200"}`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>

          <div
            className={`space-y-2 transition-all duration-500 ${tossWinner ? "opacity-100 translate-y-0" : "opacity-30 pointer-events-none translate-y-2"}`}
          >
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Trophy size={14} className="text-green-500" /> {tossWinner}{" "}
              Decided To?
            </label>
            <div className="flex gap-2">
              {["Bat", "Bowl"].map((choice, idx) => (
                <button
                  key={idx}
                  onClick={() => setDecision(choice)}
                  className={`flex-1 py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${decision === choice ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/30" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-green-200"}`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-green-500" /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              disabled={!tossWinner || !decision || starting}
              className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${tossWinner && decision && !starting ? "bg-red-600 text-white shadow-xl shadow-red-500/40 hover:-translate-y-1 active:scale-95" : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"}`}
              onClick={handleStartMatch}
            >
              {starting ? (
                <Spinner />
              ) : (
                <>
                  Start Match <ChevronRight size={18} />
                </>
              )}
            </button>
            <button
              className="w-full py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2 transition-all"
              onClick={handleAbandon}
            >
              <AlertTriangle size={14} /> Abandon Match
            </button>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════
          FUTSAL
         ══════════════════════════════════════════════════════ */}
      {isFutsal && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <FutsalScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
            winnerTeamName={
              status === "COMPLETED" ? match?.winnerTeamName : undefined
            }
          />
        </div>
      )}
      {isFutsal && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-emerald-500/10 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Trophy size={64} className="text-emerald-600" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-2xl mb-2 border border-blue-100 dark:border-blue-900/30">
                  {team1Name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-sm font-bold text-center line-clamp-1">
                  {team1Name}
                </h3>
              </div>
              <div className="px-4 flex flex-col items-center">
                <div className="bg-emerald-600 text-white text-xs font-black px-3 py-1 rounded-full mb-1">
                  VS
                </div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                  Futsal Setup
                </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 font-bold text-2xl mb-2 border border-rose-100 dark:border-rose-900/30">
                  {team2Name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-sm font-bold text-center line-clamp-1">
                  {team2Name}
                </h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-emerald-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-emerald-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-emerald-500"
            />
            <DetailCard
              icon={Hash}
              label="Half Duration"
              value="25 min"
              accent="text-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-emerald-600" />
              <span className="text-emerald-600">Who Kicks Off?</span>
            </label>
            <div className="flex gap-2">
              {[team1Name, team2Name].map((team, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTossWinnerId(team === team1Name ? team1Id : team2Id);
                    setTossWinner(team);
                  }}
                  className={`flex-1 py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${tossWinner === team ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/30" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-200"}`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-emerald-500" /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Enter scorer username"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              disabled={!tossWinner || starting}
              className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${tossWinner && !starting ? "bg-emerald-600 text-white shadow-xl shadow-emerald-500/40 hover:-translate-y-1 active:scale-95" : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"}`}
              onClick={async () => {
                setStarting(true);
                try {
                  await startmatch(matchId, {
                    tossWinnerId,
                    decision: "KICKOFF",
                    scorerId: scorerUsername,
                    sportId,
                  });
                  navigate(-1);
                } catch (err) {
                  Swal.fire({
                    title: "Error",
                    text:
                      err?.response?.data?.message || "Failed to start match.",
                    icon: "error",
                  });
                } finally {
                  setStarting(false);
                }
              }}
            >
              {starting ? (
                <Spinner />
              ) : (
                <>
                  ⚽ Start Futsal Match <ChevronRight size={18} />
                </>
              )}
            </button>
            <button
              className="w-full py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2 transition-all"
              onClick={handleAbandon}
            >
              <AlertTriangle size={14} /> Abandon Match
            </button>
          </div>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════
          VOLLEYBALL
         ══════════════════════════════════════════════════════ */}
      {isVolleyball && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <VolleyballScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
            winnerTeamName={
              status === "COMPLETED" ? match?.winnerTeamName : undefined
            }
          />
        </div>
      )}
      {isVolleyball && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-violet-500/10 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Trophy size={64} className="text-violet-600" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 font-bold text-2xl mb-2 border border-violet-100 dark:border-violet-900/30">
                  {team1Name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-sm font-bold text-center line-clamp-1">
                  {team1Name}
                </h3>
              </div>
              <div className="px-4 flex flex-col items-center">
                <div className="bg-violet-600 text-white text-xs font-black px-3 py-1 rounded-full mb-1">
                  VS
                </div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                  Volleyball Setup
                </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 font-bold text-2xl mb-2 border border-orange-100 dark:border-orange-900/30">
                  {team2Name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-sm font-bold text-center line-clamp-1">
                  {team2Name}
                </h3>
              </div>
            </div>
          </div>

          {/* Match details */}
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-violet-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-violet-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-violet-500"
            />
            <DetailCard
              icon={Hash}
              label="Format"
              value={`Best of ${vbSets * 2 - 1}`}
              accent="text-violet-500"
            />
          </div>

          {/* ── VOLLEYBALL CONFIG (NEW) ──────────────────────── */}
          <div className="space-y-1">
            <p className="text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} /> Match Configuration
            </p>
            <div className="grid grid-cols-3 gap-2">
              <NumStepper
                label="Sets to Win"
                value={vbSets}
                onChange={setVbSets}
                min={1}
                accent="text-violet-600"
              />
              <NumStepper
                label="Points/Set"
                value={vbPointsPerSet}
                onChange={setVbPointsPerSet}
                min={5}
                accent="text-violet-600"
              />
              <NumStepper
                label="Final Set Pts"
                value={vbFinalSetPoints}
                onChange={setVbFinalSetPoints}
                min={5}
                accent="text-violet-600"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-1">
              Best of {vbSets * 2 - 1} sets · {vbPointsPerSet} pts each ·{" "}
              {vbFinalSetPoints} pts tiebreak
            </p>
          </div>

          {/* Who serves first */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-violet-600" />
              <span className="text-violet-600">Who Serves First?</span>
            </label>
            <div className="flex gap-2">
              {[team1Name, team2Name].map((team, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTossWinnerId(team === team1Name ? team1Id : team2Id);
                    setTossWinner(team);
                  }}
                  className={`flex-1 py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${tossWinner === team ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/30" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-200"}`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>

          {/* Scorer */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-violet-500" /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Enter scorer username"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              disabled={!tossWinner || starting}
              className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${tossWinner && !starting ? "bg-violet-600 text-white shadow-xl shadow-violet-500/40 hover:-translate-y-1 active:scale-95" : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"}`}
              onClick={async () => {
                setStarting(true);
                try {
                  await startmatch(matchId, {
                    tossWinnerId,
                    decision: "SERVE",
                    scorerId: scorerUsername,
                    sportId,
                    // ── volleyball config fields ──
                    sets: vbSets,
                    pointsPerSet: vbPointsPerSet,
                    finalSetPoints: vbFinalSetPoints,
                  });
                  navigate(-1);
                } catch (err) {
                  Swal.fire({
                    title: "Error",
                    text:
                      err?.response?.data?.message || "Failed to start match.",
                    icon: "error",
                  });
                } finally {
                  setStarting(false);
                }
              }}
            >
              {starting ? (
                <Spinner />
              ) : (
                <>
                  🏐 Start Volleyball Match <ChevronRight size={18} />
                </>
              )}
            </button>
            <button
              className="w-full py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2 transition-all"
              onClick={handleAbandon}
            >
              <AlertTriangle size={14} /> Abandon Match
            </button>
          </div>
        </div>
      )}
      {isBadminton && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <BadmintonScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
          />
        </div>
      )}
      {/* ══════════════════════════════════════════════════════
    BADMINTON — UPCOMING (match setup)
   ══════════════════════════════════════════════════════ */}
      {isBadminton && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-violet-500/10 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Trophy size={64} className="text-violet-600" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-violet-600 font-bold text-2xl mb-2 border border-violet-100 dark:border-violet-900/30">
                  {team1Name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-sm font-bold text-center line-clamp-1">
                  {team1Name}
                </h3>
              </div>
              <div className="px-4 flex flex-col items-center">
                <div className="bg-violet-600 text-white text-xs font-black px-3 py-1 rounded-full mb-1">
                  VS
                </div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                  Badminton Setup
                </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 font-bold text-2xl mb-2 border border-orange-100 dark:border-orange-900/30">
                  {team2Name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-sm font-bold text-center line-clamp-1">
                  {team2Name}
                </h3>
              </div>
            </div>
          </div>

          {/* Match details */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: MapPin, label: "Venue", value: venue },
              {
                icon: Calendar,
                label: "Date",
                value: match?.date?.split("T")[0],
              },
              { icon: Clock, label: "Time", value: match?.time },
              {
                icon: Hash,
                label: "Format",
                value: `Best of ${(match?.sets || 2) * 2 - 1}`,
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-3 border border-slate-100 dark:border-slate-700 flex items-center gap-3"
              >
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                  <item.icon size={16} className="text-violet-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">
                    {item.label}
                  </p>
                  <p className="text-xs font-semibold">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Who serves first */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-violet-600" />
              <span className="text-violet-600">Who Serves First?</span>
            </label>
            <div className="flex gap-2">
              {[team1Name, team2Name].map((team, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTossWinnerId(team === team1Name ? team1Id : team2Id);
                    setTossWinner(team);
                  }}
                  className={`flex-1 py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${
                    tossWinner === team
                      ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/30"
                      : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-violet-200"
                  }`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>

          {/* Scorer */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-violet-500" /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              placeholder="Enter scorer username"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              disabled={!tossWinner || starting}
              className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                tossWinner && !starting
                  ? "bg-violet-600 text-white shadow-xl shadow-violet-500/40 hover:-translate-y-1 active:scale-95"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
              onClick={async () => {
                setStarting(true);
                try {
                  await startmatch(matchId, {
                    tossWinnerId,
                    decision: "SERVE",
                    scorerId: scorerUsername,
                    sportId,
                    sets: match?.sets || 2, // games to win
                    pointsPerSet: match?.pointsPerSet || 21, // points per game
                    finalSetPoints: match?.finalSetPoints || 30, // max points (deuce cap)
                  });
                  navigate(-1);
                } catch (err) {
                  Swal.fire({
                    title: "Error",
                    text:
                      err?.response?.data?.message || "Failed to start match.",
                    icon: "error",
                  });
                } finally {
                  setStarting(false);
                }
              }}
            >
              {starting ? (
                <Spinner />
              ) : (
                <>
                  {" "}
                  🏸 Start Badminton Match <ChevronRight size={18} />
                </>
              )}
            </button>
            <button
              className="w-full py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2 transition-all"
              onClick={handleAbandon}
            >
              <AlertTriangle size={14} /> Abandon Match
            </button>
          </div>
        </div>
      )}
      {isTableTennis && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <TableTennisScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
          />
        </div>
      )}

      {isTableTennis && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-blue-500/10 border border-slate-100 dark:border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <Trophy size={64} className="text-blue-600" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-2xl mb-2 border border-blue-100 dark:border-blue-900/30">
                  {team1Name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-sm font-bold text-center line-clamp-1">
                  {team1Name}
                </h3>
              </div>
              <div className="px-4 flex flex-col items-center">
                <div className="bg-blue-600 text-white text-xs font-black px-3 py-1 rounded-full mb-1">
                  VS
                </div>
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                  Table Tennis Setup
                </div>
              </div>
              <div className="flex flex-col items-center flex-1">
                <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 font-bold text-2xl mb-2 border border-orange-100 dark:border-orange-900/30">
                  {team2Name?.substring(0, 2).toUpperCase()}
                </div>
                <h3 className="text-sm font-bold text-center line-clamp-1">
                  {team2Name}
                </h3>
              </div>
            </div>
          </div>

          {/* Match details */}
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-blue-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-blue-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-blue-500"
            />
            <DetailCard
              icon={Hash}
              label="Format"
              value={`Best of ${ttGames * 2 - 1}`}
              accent="text-blue-500"
            />
          </div>

          {/* Config */}
          <div className="space-y-1">
            <p className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} /> Match Configuration
            </p>
            <div className="grid grid-cols-2 gap-2">
              <NumStepper
                label="Games to Win"
                value={ttGames}
                onChange={setTtGames}
                min={1}
                accent="text-blue-600"
              />
              <NumStepper
                label="Points/Game"
                value={ttPointsPerGame}
                onChange={setTtPointsPerGame}
                min={5}
                accent="text-blue-600"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-1">
              Best of {ttGames * 2 - 1} · {ttPointsPerGame} pts each · True
              deuce (no cap)
            </p>
          </div>

          {/* Who serves first */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Zap size={14} className="text-blue-600" />
              <span className="text-blue-600">Who Serves First?</span>
            </label>
            <div className="flex gap-2">
              {[team1Name, team2Name].map((team, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setTossWinnerId(team === team1Name ? team1Id : team2Id);
                    setTossWinner(team);
                  }}
                  className={`flex-1 py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${
                    tossWinner === team
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30"
                      : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-200"
                  }`}
                >
                  {team}
                </button>
              ))}
            </div>
          </div>

          {/* Scorer */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} className="text-blue-500" /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className="w-full py-3 px-4 rounded-2xl text-sm font-bold transition-all duration-300 border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter scorer username"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              disabled={!tossWinner || starting}
              className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                tossWinner && !starting
                  ? "bg-blue-600 text-white shadow-xl shadow-blue-500/40 hover:-translate-y-1 active:scale-95"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
              onClick={async () => {
                setStarting(true);
                try {
                  await startmatch(matchId, {
                    tossWinnerId,
                    decision: "SERVE",
                    scorerId: scorerUsername,
                    sportId,
                    sets: ttGames, // games to win
                    pointsPerSet: ttPointsPerGame, // points per game
                    finalSetPoints: 0, // 0 = true deuce (no cap)
                  });
                  navigate(-1);
                } catch (err) {
                  Swal.fire({
                    title: "Error",
                    text:
                      err?.response?.data?.message || "Failed to start match.",
                    icon: "error",
                  });
                } finally {
                  setStarting(false);
                }
              }}
            >
              {starting ? (
                <Spinner />
              ) : (
                <>
                  {" "}
                  🏓 Start Table Tennis Match <ChevronRight size={18} />
                </>
              )}
            </button>
            <button
              className="w-full py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2 transition-all"
              onClick={handleAbandon}
            >
              <AlertTriangle size={14} /> Abandon Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
