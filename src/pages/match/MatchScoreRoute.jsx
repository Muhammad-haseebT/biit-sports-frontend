import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import TugOfWarScoring from "../../components/sports/TugOfWar/TugOfWarScoring.jsx";
import LudoScoring from "../../components/sports/ludo/LudoScoring.jsx";
import ChessScoring from "../../components/sports/chess/ChessScoring.jsx";
// Sport index matches DB sportId
const SPORTS = [
  "Cricket", // 1
  "Futsal", // 2
  "Volleyball", // 3
  "Table Tennis", // 4
  "Badminton", // 5
  "Ludo", // 6
  "Tug Of War", // 7
  "Chess", // 8
];

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

  // Toss / scorer
  const [tossWinner, setTossWinner] = useState(null);
  const [tossWinnerId, setTossWinnerId] = useState(null);
  const [decision, setDecision] = useState(null);
  const [starting, setStarting] = useState(false);
  const [scorerUsername, setScorerUsername] = useState("");

  // Volleyball config
  const [vbSets, setVbSets] = useState(3);
  const [vbPointsPerSet, setVbPointsPerSet] = useState(25);
  const [vbFinalSetPoints, setVbFinalSetPoints] = useState(15);

  // ✅ Badminton config (scorable — user picks values)
  const [bdGames, setBdGames] = useState(2);
  const [bdPointsPerGame, setBdPointsPerGame] = useState(21);
  const [bdMaxPoints, setBdMaxPoints] = useState(30);

  // Table Tennis config
  const [ttGames, setTtGames] = useState(4);
  const [ttPointsPerGame, setTtPointsPerGame] = useState(11);

  // Tug of War config
  const [towRounds, setTowRounds] = useState(3);

  const currentSport = SPORTS[sportId - 1];
  const isCricket = currentSport === "Cricket";
  const isFutsal = currentSport === "Futsal";
  const isVB = currentSport === "Volleyball";
  const isBD = currentSport === "Badminton";
  const isTT = currentSport === "Table Tennis";
  const isTOW = currentSport === "Tug Of War";
  const isLudo = currentSport === "Ludo";
  const isChess = currentSport === "Chess";
  if (!location.state) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
        No match data found.
      </div>
    );
  }

  const handleAbandon = () =>
    Swal.fire({
      title: "Are you sure?",
      text: "Match will be abandoned",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, abandon it!",
    }).then((r) => {
      if (r.isConfirmed)
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

  // ── Reusable components ───────────────────────────────────────
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

  const TeamHeader = ({ shadow, vs, subtitle, c1, c2 }) => (
    <div
      className={`bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl ${shadow} border border-slate-100 dark:border-slate-700 relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <Trophy size={64} />
      </div>
      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col items-center flex-1">
          <div
            className={`w-16 h-16 rounded-2xl ${c1} flex items-center justify-center font-bold text-2xl mb-2 border`}
          >
            {team1Name?.substring(0, 2).toUpperCase()}
          </div>
          <h3 className="text-sm font-bold text-center line-clamp-1">
            {team1Name}
          </h3>
        </div>
        <div className="px-4 flex flex-col items-center">
          <div
            className={`${vs} text-white text-xs font-black px-3 py-1 rounded-full mb-1`}
          >
            VS
          </div>
          <div className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
            {subtitle}
          </div>
        </div>
        <div className="flex flex-col items-center flex-1">
          <div
            className={`w-16 h-16 rounded-2xl ${c2} flex items-center justify-center font-bold text-2xl mb-2 border`}
          >
            {team2Name?.substring(0, 2).toUpperCase()}
          </div>
          <h3 className="text-sm font-bold text-center line-clamp-1">
            {team2Name}
          </h3>
        </div>
      </div>
    </div>
  );

  const TossButtons = ({ accentActive, hoverBorder }) => (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <Zap size={14} className={accentActive} />
        <span className={accentActive}>Who Serves / Starts?</span>
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
                ? `${accentActive.replace("text-", "bg-").replace("-600", "-600")} border-current text-white shadow-lg`
                : `bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 ${hoverBorder}`
            }`}
          >
            {team}
          </button>
        ))}
      </div>
    </div>
  );

  const ScorerInput = ({ focusColor }) => (
    <div className="space-y-2">
      <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
        <User size={14} /> Scorer Username
      </label>
      <input
        type="text"
        value={scorerUsername}
        onChange={(e) => setScorerUsername(e.target.value)}
        className={`w-full py-3 px-4 rounded-2xl text-sm font-bold border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 ${focusColor}`}
        placeholder="Enter scorer username"
      />
    </div>
  );

  const StartBtn = ({ label, bg, shadow, disabled: dis, onClick }) => (
    <div className="pt-2 flex flex-col gap-2">
      <button
        disabled={dis || starting}
        onClick={onClick}
        className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
          !dis && !starting
            ? `${bg} text-white shadow-xl ${shadow} hover:-translate-y-1 active:scale-95`
            : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
        }`}
      >
        {starting ? (
          <Spinner />
        ) : (
          <>
            {label} <ChevronRight size={18} />
          </>
        )}
      </button>
      <button
        className="w-full py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2"
        onClick={handleAbandon}
      >
        <AlertTriangle size={14} /> Abandon Match
      </button>
    </div>
  );

  return (
    <div className="h-screen w-full bg-[#f8f9fa] dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] overflow-hidden flex flex-col">
      {/* ══ CRICKET ══════════════════════════════════════════════ */}
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
          <TeamHeader
            shadow="shadow-red-500/10"
            vs="bg-red-600"
            subtitle="Match Setup"
            c1="bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100 dark:border-red-900/30"
            c2="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30"
          />
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
            className={`space-y-2 transition-all duration-500 ${tossWinner ? "opacity-100" : "opacity-30 pointer-events-none"}`}
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
          <ScorerInput focusColor="focus:border-green-500 focus:ring-2 focus:ring-green-500/20" />
          <StartBtn
            label="Start Match"
            bg="bg-red-600"
            shadow="shadow-red-500/40"
            disabled={!tossWinner || !decision}
            onClick={async () => {
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
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      {/* ══ FUTSAL ════════════════════════════════════════════════ */}
      {isFutsal && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <FutsalScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
          />
        </div>
      )}
      {isFutsal && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-emerald-500/10"
            vs="bg-emerald-600"
            subtitle="Futsal Setup"
            c1="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30"
            c2="bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-900/30"
          />
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
          <TossButtons
            accentActive="text-emerald-600"
            hoverBorder="hover:border-emerald-200"
          />
          <ScorerInput focusColor="focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
          <StartBtn
            label="⚽ Start Futsal Match"
            bg="bg-emerald-600"
            shadow="shadow-emerald-500/40"
            disabled={!tossWinner}
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
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      {/* ══ VOLLEYBALL ════════════════════════════════════════════ */}
      {isVB && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <VolleyballScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
          />
        </div>
      )}
      {isVB && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-violet-500/10"
            vs="bg-violet-600"
            subtitle="Volleyball Setup"
            c1="bg-violet-50 dark:bg-violet-900/20 text-violet-600 border-violet-100 dark:border-violet-900/30"
            c2="bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-900/30"
          />
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
              Best of {vbSets * 2 - 1} · {vbPointsPerSet} pts ·{" "}
              {vbFinalSetPoints} pts tiebreak
            </p>
          </div>
          <TossButtons
            accentActive="text-violet-600"
            hoverBorder="hover:border-violet-200"
          />
          <ScorerInput focusColor="focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
          <StartBtn
            label="🏐 Start Volleyball Match"
            bg="bg-violet-600"
            shadow="shadow-violet-500/40"
            disabled={!tossWinner}
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "SERVE",
                  scorerId: scorerUsername,
                  sportId,
                  sets: vbSets,
                  pointsPerSet: vbPointsPerSet,
                  finalSetPoints: vbFinalSetPoints,
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      {/* ══ BADMINTON ═════════════════════════════════════════════ */}
      {isBD && (status === "LIVE" || status === "COMPLETED") && (
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
      {isBD && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-violet-500/10"
            vs="bg-violet-600"
            subtitle="Badminton Setup"
            c1="bg-violet-50 dark:bg-violet-900/20 text-violet-600 border-violet-100 dark:border-violet-900/30"
            c2="bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-900/30"
          />
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
              value={`Best of ${bdGames * 2 - 1}`}
              accent="text-violet-500"
            />
          </div>
          {/* ✅ Badminton config — user picks values (same pattern as volleyball) */}
          <div className="space-y-1">
            <p className="text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} /> Match Configuration
            </p>
            <div className="grid grid-cols-3 gap-2">
              <NumStepper
                label="Games to Win"
                value={bdGames}
                onChange={setBdGames}
                min={1}
                accent="text-violet-600"
              />
              <NumStepper
                label="Points/Game"
                value={bdPointsPerGame}
                onChange={setBdPointsPerGame}
                min={5}
                accent="text-violet-600"
              />
              <NumStepper
                label="Max Pts (Deuce)"
                value={bdMaxPoints}
                onChange={setBdMaxPoints}
                min={bdPointsPerGame + 1}
                accent="text-violet-600"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-1">
              Best of {bdGames * 2 - 1} · {bdPointsPerGame} pts · Deuce cap:{" "}
              {bdMaxPoints}
            </p>
          </div>
          <TossButtons
            accentActive="text-violet-600"
            hoverBorder="hover:border-violet-200"
          />
          <ScorerInput focusColor="focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" />
          <StartBtn
            label="🏸 Start Badminton Match"
            bg="bg-violet-600"
            shadow="shadow-violet-500/40"
            disabled={!tossWinner}
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "SERVE",
                  scorerId: scorerUsername,
                  sportId,
                  sets: bdGames,
                  pointsPerSet: bdPointsPerGame,
                  finalSetPoints: bdMaxPoints,
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      {/* ══ TABLE TENNIS ══════════════════════════════════════════ */}
      {isTT && (status === "LIVE" || status === "COMPLETED") && (
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
      {isTT && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-blue-500/10"
            vs="bg-blue-600"
            subtitle="Table Tennis Setup"
            c1="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30"
            c2="bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-900/30"
          />
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
              Best of {ttGames * 2 - 1} · {ttPointsPerGame} pts · True deuce (no
              cap)
            </p>
          </div>
          <TossButtons
            accentActive="text-blue-600"
            hoverBorder="hover:border-blue-200"
          />
          <ScorerInput focusColor="focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
          <StartBtn
            label="🏓 Start Table Tennis Match"
            bg="bg-blue-600"
            shadow="shadow-blue-500/40"
            disabled={!tossWinner}
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "SERVE",
                  scorerId: scorerUsername,
                  sportId,
                  sets: ttGames,
                  pointsPerSet: ttPointsPerGame,
                  finalSetPoints: 0,
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      {/* ══ TUG OF WAR ════════════════════════════════════════════ */}
      {isTOW && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <TugOfWarScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
          />
        </div>
      )}
      {isTOW && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-amber-500/10"
            vs="bg-amber-600"
            subtitle="Tug of War Setup"
            c1="bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100 dark:border-amber-900/30"
            c2="bg-red-50 dark:bg-red-900/20 text-red-600 border-red-100 dark:border-red-900/30"
          />
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-amber-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-amber-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-amber-500"
            />
            <DetailCard
              icon={Hash}
              label="Format"
              value={`Best of ${towRounds * 2 - 1}`}
              accent="text-amber-500"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
              <Hash size={14} /> Rounds Configuration
            </p>
            <NumStepper
              label="Rounds to Win"
              value={towRounds}
              onChange={setTowRounds}
              min={1}
              accent="text-amber-600"
            />
            <p className="text-[10px] text-slate-400 text-center pt-1">
              Best of {towRounds * 2 - 1} rounds
            </p>
          </div>
          <TossButtons
            accentActive="text-amber-600"
            hoverBorder="hover:border-amber-200"
          />
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className={`w-full py-3 px-4 rounded-2xl text-sm font-bold border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300`}
              placeholder="Enter scorer username"
            />
          </div>
          <StartBtn
            label="💪 Start Tug of War"
            bg="bg-amber-600"
            shadow="shadow-amber-500/40"
            disabled={!tossWinner}
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "PULL",
                  scorerId: scorerUsername,
                  sportId,
                  sets: towRounds,
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      {/* ══ LUDO ══════════════════════════════════════════════════ */}
      {isLudo && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <LudoScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
          />
        </div>
      )}
      {isLudo && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-orange-500/10"
            vs="bg-orange-600"
            subtitle="Ludo Setup"
            c1="bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-900/30"
            c2="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-100 dark:border-blue-900/30"
          />
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-orange-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-orange-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-orange-500"
            />
            <DetailCard
              icon={Hash}
              label="Sport"
              value="🎲 Ludo"
              accent="text-orange-500"
            />
          </div>
          <TossButtons
            accentActive="text-orange-600"
            hoverBorder="hover:border-orange-200"
          />
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <User size={14} /> Scorer Username
            </label>
            <input
              type="text"
              value={scorerUsername}
              onChange={(e) => setScorerUsername(e.target.value)}
              className={`w-full py-3 px-4 rounded-2xl text-sm font-bold border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300`}
              placeholder="Enter scorer username"
            />
          </div>
          <StartBtn
            label="🎲 Start Ludo Match"
            bg="bg-orange-600"
            shadow="shadow-orange-500/40"
            disabled={!tossWinner}
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "START",
                  scorerId: scorerUsername,
                  sportId,
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
      //{" "}
      {isChess && (status === "LIVE" || status === "COMPLETED") && (
        <div className="flex-1 overflow-auto">
          <ChessScoring
            matchId={matchId}
            status={status}
            team1Id={team1Id}
            team2Id={team2Id}
            team1Name={team1Name}
            team2Name={team2Name}
          />
        </div>
      )}
      ══ CHESS UPCOMING ═══════════════════════════════════════════════
      {isChess && status === "UPCOMING" && (
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4 overflow-auto">
          <TeamHeader
            shadow="shadow-slate-500/10"
            vs="bg-slate-700"
            subtitle="Chess Setup"
            c1="bg-slate-50 dark:bg-slate-900/20 text-slate-700 border-slate-100 dark:border-slate-900/30"
            c2="bg-gray-50 dark:bg-gray-900/20 text-gray-700 border-gray-100 dark:border-gray-900/30"
          />
          <div className="grid grid-cols-2 gap-3">
            <DetailCard
              icon={MapPin}
              label="Venue"
              value={venue}
              accent="text-slate-500"
            />
            <DetailCard
              icon={Calendar}
              label="Date"
              value={match?.date?.split("T")[0]}
              accent="text-slate-500"
            />
            <DetailCard
              icon={Clock}
              label="Time"
              value={match?.time}
              accent="text-slate-500"
            />
            <DetailCard
              icon={Hash}
              label="Sport"
              value="♟️ Chess"
              accent="text-slate-500"
            />
          </div>
          <TossButtons
            accentActive="text-slate-700"
            hoverBorder="hover:border-slate-300"
          />
          <ScorerInput focusColor="focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20" />
          <StartBtn
            label="♟️ Start Chess Match"
            bg="bg-slate-700"
            shadow="shadow-slate-500/40"
            disabled={!tossWinner}
            onClick={async () => {
              setStarting(true);
              try {
                await startmatch(matchId, {
                  tossWinnerId,
                  decision: "WHITE",
                  scorerId: scorerUsername,
                  sportId,
                });
                navigate(-1);
              } catch (err) {
                Swal.fire({
                  title: "Error",
                  text: err?.response?.data?.message || "Failed.",
                  icon: "error",
                });
              } finally {
                setStarting(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
