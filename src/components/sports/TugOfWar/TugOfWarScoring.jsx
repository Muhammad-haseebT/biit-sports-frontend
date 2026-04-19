import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Media from "../cricket/modals/Media";
// import FavouritePlayerModal from "./modals/FavouritePlayerModal";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";
import { getPlayersByTeamId } from "../../../api/teamApi";

function useRoundTimer(roundStartTime, status) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!roundStartTime || status !== "LIVE") {
      setElapsed(0);
      return;
    }
    const tick = () =>
      setElapsed(Math.floor((Date.now() - roundStartTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [roundStartTime, status]);
  return {
    mins: String(Math.floor(elapsed / 60)).padStart(2, "0"),
    secs: String(elapsed % 60).padStart(2, "0"),
    elapsed,
  };
}

// Round circles
function RoundCircles({ roundsWon, roundsToWin, color }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: roundsToWin }).map((_, i) => (
        <div
          key={i}
          className={`w-6 h-6 rounded-full border-2 transition-all duration-500 flex items-center justify-center ${
            i < roundsWon
              ? color === "blue"
                ? "bg-blue-500 border-blue-600 shadow-lg shadow-blue-500/50 scale-110"
                : "bg-rose-500 border-rose-600 shadow-lg shadow-rose-500/50 scale-110"
              : "bg-gray-100 border-gray-300"
          }`}
        >
          {i < roundsWon && (
            <span className="text-white text-xs font-black">✓</span>
          )}
        </div>
      ))}
    </div>
  );
}

function PanelWrapper({ children }) {
  return <div className="mt-2 mb-2 px-4">{children}</div>;
}
function PanelHeading({ title }) {
  return (
    <h1 className="text-2xl font-semibold text-red-600 mt-2 mb-4">{title}</h1>
  );
}

export default function TugOfWarScoring({
  matchId,
  status,
  team1Id,
  team2Id,
  team1Name,
  team2Name,
}) {
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const isAdmin = useRef(false);

  const [score, setScore] = useState({
    team1Rounds: 0,
    team2Rounds: 0,
    currentRound: 1,
    roundsToWin: 3,
    totalRounds: 5,
    status: "LIVE",
    roundStartTime: null,
    tugOfWarEvents: [],
    comment: "",
  });

  const [team1P, setTeam1P] = useState([]);
  const [team2P, setTeam2P] = useState([]);
  const [activeTab, setActiveTab] = useState("Scoring");
  const [toast, setToast] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [mediaId, setMediaId] = useState(null);
  const [showFav, setShowFav] = useState(false);
  const [confirm, setConfirm] = useState(null); // teamId to confirm round win

  const timer = useRoundTimer(score.roundStartTime, score.status);

  useEffect(() => {
    try {
      const u = JSON.parse(Cookies.get("account") || "{}");
      if (u.role === "ADMIN" || u.role === "SCORER") isAdmin.current = true;
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      const [a, b] = await Promise.all([
        getPlayersByTeamId(team1Id),
        getPlayersByTeamId(team2Id),
      ]);
      setTeam1P(a || []);
      setTeam2P(b || []);
    })();
  }, [team1Id, team2Id]);

  useEffect(() => {
    const ws = new WebSocket(
      import.meta.env.VITE_SOCKET_URL + "?matchId=" + matchId,
    );
    ws.onopen = () => {
      wsRef.current = ws;
      showToast("🔴 Live connected", "success");
    };
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      setScore((p) => ({ ...p, ...d }));
      setWaiting(false);
      if (d.comment === "UNDO") showToast("↩ Undo done", "info");
      if (d.status === "COMPLETED") {
        showToast("🏆 Match Complete!", "info");
        setTimeout(() => setShowFav(true), 1500);
      }
    };
    ws.onerror = () => showToast("WebSocket error", "error");
    ws.onclose = () => (wsRef.current = null);
    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  const send = (payload) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      showToast("Not connected", "error");
      return;
    }
    setWaiting(true);
    wsRef.current.send(JSON.stringify({ matchId, ...payload }));
  };

  const recordRoundWin = (teamId) => {
    send({ eventType: "ROUND_WIN", winnerTeamId: teamId });
    setConfirm(null);
  };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isCompleted = score.status === "COMPLETED";
  const rtw = score.roundsToWin || 3;
  const totalR = score.totalRounds || rtw * 2 - 1;
  const roundLabel = `Round ${score.currentRound} of ${totalR}`;
  const winnerName =
    (score.team1Rounds || 0) >= rtw
      ? team1Name
      : (score.team2Rounds || 0) >= rtw
        ? team2Name
        : null;

  // Rope tension visualization
  const t1Pct = Math.min(100, ((score.team1Rounds || 0) / rtw) * 100);
  const t2Pct = Math.min(100, ((score.team2Rounds || 0) / rtw) * 100);

  const primaryBtn =
    "w-full bg-white text-red-600 p-3 rounded-lg text-2xl sm:text-3xl font-black shadow-md flex items-center justify-center active:bg-gray-200 transition-colors border border-red-200";
  const confirmBtn =
    "w-full bg-emerald-500 text-white p-3 rounded-lg text-2xl sm:text-3xl font-black shadow-md flex items-center justify-center active:bg-emerald-400 transition-colors disabled:opacity-50";
  const backBtn =
    "w-full bg-gray-100 text-gray-700 p-3 rounded-lg text-xl font-bold shadow-sm flex items-center justify-center active:bg-gray-200 transition-colors border border-gray-300";

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-2xl text-sm font-bold shadow-2xl text-white ${
            toast.type === "error"
              ? "bg-red-500"
              : toast.type === "success"
                ? "bg-green-500"
                : "bg-slate-700"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="flex items-center bg-red-600 h-16 px-4">
        <ArrowLeft
          className="w-6 h-6 text-white cursor-pointer"
          onClick={() => navigate(-1)}
        />
        <h1 className="text-white font-semibold text-2xl ml-2">Match Center</h1>
      </div>

      <div className="flex justify-between mt-4 px-4 gap-2">
        {["Scoring", "Events", "Info"].map((item) => (
          <button
            key={item}
            className={`flex-1 py-2 rounded-lg font-semibold text-base transition-colors ${activeTab === item ? "bg-red-600 text-white shadow" : "bg-gray-100 text-gray-600 border border-gray-200"}`}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <hr className="my-3 border-gray-200" />

      {activeTab === "Scoring" && (
        <PanelWrapper>
          <PanelHeading title="Tug of War" />

          {isCompleted ? (
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 rounded-2xl p-6 shadow-md mb-4 gap-4">
              <Trophy className="text-yellow-500 w-16 h-16" />
              <h2 className="text-2xl font-black text-red-600">
                Match Completed!
              </h2>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-600 mb-2">
                    {team1Name}
                  </p>
                  <RoundCircles
                    roundsWon={score.team1Rounds || 0}
                    roundsToWin={rtw}
                    color="blue"
                  />
                </div>
                <div className="text-4xl font-black text-gray-800">
                  {score.team1Rounds} – {score.team2Rounds}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-rose-600 mb-2">
                    {team2Name}
                  </p>
                  <RoundCircles
                    roundsWon={score.team2Rounds || 0}
                    roundsToWin={rtw}
                    color="rose"
                  />
                </div>
              </div>
              {winnerName && (
                <div className="bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-full shadow-md">
                  💪 {winnerName} Wins!
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Timer + Round label */}
              <div className="text-center mb-4">
                <p className="text-lg font-bold text-gray-500">{roundLabel}</p>
                <p className="text-3xl font-black text-amber-600 tabular-nums">
                  {timer.mins}:{timer.secs}
                </p>
              </div>

              {/* Scoreboard */}
              <div className="flex w-full items-center justify-between mb-4 border border-gray-200 rounded-xl px-3 pt-4 pb-3 bg-gray-50 shadow-sm">
                <div className="flex flex-col items-center flex-1 gap-2">
                  <p className="text-base sm:text-xl font-bold text-blue-600 truncate">
                    {team1Name}
                  </p>
                  <RoundCircles
                    roundsWon={score.team1Rounds || 0}
                    roundsToWin={rtw}
                    color="blue"
                  />
                  <p className="text-3xl font-black text-blue-600">
                    {score.team1Rounds}
                  </p>
                </div>
                <div className="flex flex-col items-center px-2">
                  <span className="text-2xl font-black text-gray-400">vs</span>
                  <span className="text-xs font-bold text-gray-400 mt-1">
                    rounds
                  </span>
                </div>
                <div className="flex flex-col items-center flex-1 gap-2">
                  <p className="text-base sm:text-xl font-bold text-rose-600 truncate">
                    {team2Name}
                  </p>
                  <RoundCircles
                    roundsWon={score.team2Rounds || 0}
                    roundsToWin={rtw}
                    color="rose"
                  />
                  <p className="text-3xl font-black text-rose-600">
                    {score.team2Rounds}
                  </p>
                </div>
              </div>

              {/* Rope visualization */}
              <div className="relative h-8 bg-gray-100 rounded-full overflow-hidden border border-gray-200 mb-2">
                <div
                  className="absolute left-0 top-0 h-full bg-blue-400 transition-all duration-700 rounded-l-full"
                  style={{ width: `${t1Pct / 2}%` }}
                />
                <div
                  className="absolute right-0 top-0 h-full bg-rose-400 transition-all duration-700 rounded-r-full"
                  style={{ width: `${t2Pct / 2}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-gray-600">
                    🪢 ROPE
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mb-4">
                First to {rtw} rounds wins
              </p>

              {/* Action panel */}
              {!confirm && isAdmin.current && (
                <div
                  className={`bg-red-600 p-3 rounded-xl shadow-md flex flex-col gap-3 ${waiting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <p className="text-white font-black text-center text-lg mb-1">
                    💪 Who Won This Round?
                  </p>
                  <button
                    className={primaryBtn}
                    onClick={() => setConfirm(team1Id)}
                  >
                    🔵 {team1Name} Won Round
                  </button>
                  <button
                    className={primaryBtn}
                    onClick={() => setConfirm(team2Id)}
                  >
                    🔴 {team2Name} Won Round
                  </button>
                  <button
                    className="w-full bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                    onClick={() => send({ undo: true })}
                  >
                    <RotateCcw size={18} className="mr-2" /> UNDO LAST ROUND
                  </button>
                  <button
                    className="w-full bg-white text-red-600 p-2 rounded-lg text-base font-bold shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                    onClick={() => send({ eventType: "END_MATCH" })}
                  >
                    🏁 End Match
                  </button>
                </div>
              )}

              {/* Confirm dialog */}
              {confirm && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md flex flex-col gap-3">
                  <p className="text-white font-black text-center text-lg">
                    Confirm:{" "}
                    <span className="text-yellow-300">
                      {confirm === team1Id ? team1Name : team2Name}
                    </span>{" "}
                    won this round?
                  </p>
                  <button
                    className={confirmBtn}
                    onClick={() => recordRoundWin(confirm)}
                  >
                    ✅ YES — Record Round Win
                  </button>
                  <button className={backBtn} onClick={() => setConfirm(null)}>
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </PanelWrapper>
      )}

      {activeTab === "Events" && (
        <PanelWrapper>
          <PanelHeading title="Match Timeline" />
          <div className="space-y-2">
            {score.tugOfWarEvents
              ?.slice()
              .reverse()
              .map((ev, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center border border-gray-200 rounded-xl p-3 bg-gray-50 shadow-sm"
                >
                  <div>
                    <p className="font-bold text-red-600 text-base">
                      {ev.eventType === "ROUND_WIN"
                        ? "💪 Round Win"
                        : ev.eventType === "END_MATCH"
                          ? "🏁 Match End"
                          : ev.eventType}
                    </p>
                    {ev.winnerTeamName && (
                      <p className="text-sm text-gray-600 font-semibold">
                        {ev.winnerTeamName}
                      </p>
                    )}
                    {ev.roundDurationSeconds && (
                      <p className="text-xs text-gray-400">
                        Duration: {Math.floor(ev.roundDurationSeconds / 60)}m{" "}
                        {ev.roundDurationSeconds % 60}s
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-700">
                      Round {ev.roundNumber}
                    </p>
                  </div>
                </div>
              ))}
            {(!score.tugOfWarEvents || score.tugOfWarEvents.length === 0) && (
              <div className="text-center text-gray-400 py-8 font-semibold">
                No events yet
              </div>
            )}
          </div>
        </PanelWrapper>
      )}

      {activeTab === "Info" && (
        <PanelWrapper>
          <PanelHeading title="Match Info" />
          <table className="w-full border border-gray-300 rounded-xl overflow-hidden shadow-sm">
            <tbody>
              {[
                { label: "Match ID", value: matchId },
                { label: "Status", value: score.status },
                { label: "Current Round", value: score.currentRound },
                { label: "Rounds to Win", value: rtw },
                { label: "Best of", value: totalR },
                { label: "Timer", value: `${timer.mins}:${timer.secs}` },
              ].map(({ label, value }) => (
                <tr key={label}>
                  <td className="border border-gray-300 p-3 font-bold bg-gray-50 text-gray-600 w-1/3 text-sm">
                    {label}
                  </td>
                  <td className="border border-gray-300 p-3 text-gray-800 font-medium">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelWrapper>
      )}

      {mediaId && (
        <Media
          ballId={mediaId}
          matchId={matchId}
          onClose={() => setMediaId(null)}
        />
      )}
      {/* {showFav && (
        <FavouritePlayerModal matchId={matchId} team1Id={team1Id} team2Id={team2Id}
          team1Name={team1Name} team2Name={team2Name}
          team1Players={team1P} team2Players={team2P}
          onClose={() => setShowFav(false)} />
      )} */}
    </div>
  );
}
