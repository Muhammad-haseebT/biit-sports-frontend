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

  const sports = [
    "Cricket",
    "Futsal",
    "Badminton",
    "Table Tennis",
    "Volleyball",
    "Ludo",
    "Tug Of War",
    "Chess",
  ];

  const isCricket = sports[sportId - 1] === "Cricket";
  const [scorerUsername, setScorerUsername] = useState("");

  if (!location.state) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
        No match data found.
      </div>
    );
  }

  const handleStartMatch = () => {
    startmatch(matchId, {
      tossWinnerId,
      decision,
      scorerId: scorerUsername,
      sportId,
      inningsId,
    });
  };
  return (
    <div className="h-screen w-full bg-[#f8f9fa] dark:bg-[#0f172a] text-[#1e293b] dark:text-[#f1f5f9] overflow-hidden flex flex-col">
      {isCricket && status === "LIVE" && (
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
        <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full space-y-4">
          {/* Header Card */}
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

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: MapPin, label: "Venue", value: venue },
              {
                icon: Calendar,
                label: "Date",
                value: match?.date?.split("T")[0],
              },
              { icon: Clock, label: "Time", value: match?.time },
              { icon: Hash, label: "Overs", value: `${match?.overs} Overs` },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-3 border border-slate-100 dark:border-slate-700 flex items-center gap-3"
              >
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl">
                  <item.icon size={16} className="text-red-500" />
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

          {/* Action Sections */}
          <div className="flex-1 space-y-4">
            {/* Toss Section */}
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
                      setTossWinnerId(team == team1Name ? team1Id : team2Id);
                      console.log(tossWinnerId);
                      setTossWinner(team);
                    }}
                    className={`flex-1 py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${
                      tossWinner === team
                        ? "bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/30"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-200"
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>

            {/* Decision Section */}
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
                    className={`flex-1 py-3 px-2 rounded-2xl text-xs font-bold transition-all duration-300 border-2 ${
                      decision === choice
                        ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/30"
                        : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-green-200"
                    }`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* scorer username */}
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

          {/* Bottom Actions */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              disabled={!tossWinner || !decision}
              className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-300 ${
                tossWinner && decision
                  ? "bg-red-600 text-white shadow-xl shadow-red-500/40 hover:-translate-y-1 active:scale-95"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
              }`}
              onClick={() => {
                handleStartMatch();
              }}
            >
              Start Match <ChevronRight size={18} />
            </button>
            <button
              className="w-full py-3 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center justify-center gap-2 transition-all"
              onClick={() =>
                //are you sure
                Swal.fire({
                  title: "Are you sure?",
                  text: "Match will be abandoned",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonText: "Yes, abandon it!",
                  cancelButtonText: "No, cancel!",
                }).then((result) => {
                  if (result.isConfirmed) {
                    Swal.fire(
                      "Abandoned!",
                      "Match has been abandoned",
                      "success",
                    );
                  }
                })
              }
            >
              <AlertTriangle size={14} /> Abandon Match
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
