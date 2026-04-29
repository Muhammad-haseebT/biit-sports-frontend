import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { getPlayersByTeamId } from "../../../api/teamApi";
// import FavouritePlayerModal from "../football/modals/FavouritePlayerModal";
import { ArrowLeft, Trophy, RotateCcw, Clock } from "lucide-react";
import { PanelWrapper, PanelHeading, WizardHeader, UI_CLASSES } from "../common/ScoringUI";

const EV = {
  MOVE: { icon: "♟️", label: "Move" },
  CHECK: { icon: "⚔️", label: "Check" },
  CHECKMATE: { icon: "♛", label: "Checkmate" },
  RESIGN: { icon: "🏳️", label: "Resign" },
  TIMEOUT: { icon: "⏰", label: "Timeout" },
  STALEMATE: { icon: "🤝", label: "Stalemate" },
  DRAW_AGREED: { icon: "🤝", label: "Draw Agreed" },
  END_MATCH: { icon: "🏁", label: "Match End" },
};

const RESULT_LABELS = {
  CHECKMATE: "Checkmate",
  RESIGN: "Resignation",
  TIMEOUT: "Timeout",
  STALEMATE: "Stalemate",
  DRAW_AGREED: "Draw by Agreement",
  END_MATCH: "Match Ended",
};

function useMatchTimer(startTime, status) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime || status !== "LIVE") {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - startTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime, status]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return h > 0
    ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


export default function ChessScoring({
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
    team1Moves: 0,
    team2Moves: 0,
    team1Checks: 0,
    team2Checks: 0,
    totalMoves: 0,
    status: "LIVE",
    resultType: null,
    isDraw: false,
    currentTurnTeamId: null,
    currentTurnTeamName: null,
    matchStartTime: null,
    currentMoveStartTime: null,
    chessEvents: [],
    comment: "",
  });

  const [team1P, setTeam1P] = useState([]);
  const [team2P, setTeam2P] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [selTeam, setSelTeam] = useState(null);
  const [selPlayer, setSelPlayer] = useState(null);
  const [moveNotation, setMoveNotation] = useState("");
  const [activeTab, setActiveTab] = useState("Scoring");
  const [toast, setToast] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [showFav, setShowFav] = useState(false);

  const matchTimer = useMatchTimer(score.matchStartTime, score.status);

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
        showToast("♟️ Match Complete!", "info");
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

  const closeModal = () => {
    setActiveModal(null);
    setSelTeam(null);
    setSelPlayer(null);
    setMoveNotation("");
  };

  const submitMove = () => {
    const t = selTeam || score.currentTurnTeamId;
    if (!t) return;
    send({
      eventType: "MOVE",
      teamId: t,
      playerId: selPlayer || undefined,
      moveNotation: moveNotation || undefined,
    });
    closeModal();
  };

  const submitCheck = () => {
    const t = selTeam || score.currentTurnTeamId;
    if (!t) return;
    send({
      eventType: "CHECK",
      teamId: t,
      playerId: selPlayer || undefined,
      moveNotation: moveNotation || undefined,
    });
    closeModal();
  };

  const activePlayers = (teamId) =>
    (teamId || selTeam) === team1Id ? team1P : team2P;
  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isCompleted = score.status === "COMPLETED";
  const isCurrentlyT1 = score.currentTurnTeamId === team1Id;
  const currentTurnName = score.currentTurnTeamName || team1Name;

  const dangerBtn =
    "w-full bg-red-50 text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-red-100 border border-red-200";

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

      <div className="flex items-center bg-slate-800 h-16 px-4">
        <ArrowLeft
          className="w-6 h-6 text-white cursor-pointer"
          onClick={() => navigate(-1)}
        />
        <h1 className="text-white font-semibold text-2xl ml-2">
          ♟️ Chess Match
        </h1>
      </div>

      <div className="flex justify-between mt-4 px-4 gap-2">
        {["Scoring", "Moves", "Info"].map((item) => (
          <button
            key={item}
            className={`flex-1 py-2 rounded-lg font-semibold text-base transition-colors ${activeTab === item ? "bg-slate-800 text-white shadow" : "bg-gray-100 text-gray-600 border border-gray-200"}`}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <hr className="my-3 border-gray-200" />

      {/* ══ SCORING TAB ══ */}
      {activeTab === "Scoring" && (
        <PanelWrapper>
          <PanelHeading title="Live Scoring" />

          {isCompleted ? (
            <div className="flex flex-col items-center bg-gradient-to-b from-slate-50 to-white border border-slate-200 rounded-2xl p-6 shadow-md mb-4 gap-4">
              <span className="text-6xl">♟️</span>
              <h2 className="text-2xl font-black text-slate-700">
                Match Completed!
              </h2>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-500 mb-2">
                  {RESULT_LABELS[score.resultType] || score.resultType}
                </p>
              </div>
              {score.isDraw ? (
                <div className="bg-gray-200 text-gray-700 font-black text-xl px-6 py-3 rounded-full shadow-md">
                  🤝 Draw!
                </div>
              ) : (
                <div className="bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-full shadow-md">
                  👑 {score.currentTurnTeamName ? "Match Ended" : team1Name}{" "}
                  Wins!
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 w-full mt-2">
                {[
                  {
                    name: team1Name,
                    moves: score.team1Moves,
                    checks: score.team1Checks,
                    color: "text-blue-600",
                  },
                  {
                    name: team2Name,
                    moves: score.team2Moves,
                    checks: score.team2Checks,
                    color: "text-rose-600",
                  },
                ].map((t, i) => (
                  <div
                    key={i}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center"
                  >
                    <p className={`font-bold text-sm ${t.color} mb-1`}>
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-500">♟️ {t.moves} moves</p>
                    <p className="text-xs text-gray-500">
                      ⚔️ {t.checks} checks
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Total moves: <strong>{score.totalMoves}</strong>
              </p>
            </div>
          ) : (
            <>
              {/* Match timer */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock size={18} className="text-slate-600" />
                <span className="text-2xl font-black text-slate-700 tabular-nums">
                  {matchTimer}
                </span>
              </div>

              {/* Board / Score display */}
              <div className="border-2 border-slate-200 rounded-2xl overflow-hidden mb-4 shadow-sm">
                {/* Chess board pattern header */}
                <div className="grid grid-cols-8 h-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${i % 2 === 0 ? "bg-slate-700" : "bg-slate-100"}`}
                    />
                  ))}
                </div>

                <div className="p-4 bg-white">
                  {/* Current turn indicator */}
                  <div
                    className={`text-center mb-3 py-2 px-4 rounded-full text-sm font-black ${
                      isCurrentlyT1
                        ? "bg-blue-100 text-blue-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {isCurrentlyT1 ? "⬜" : "⬛"} {currentTurnName}&apos;s turn
                    {score.totalMoves > 0 && (
                      <span className="ml-2 font-normal">
                        Move {score.totalMoves + 1}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Team 1 */}
                    <div className="text-center">
                      <p className="font-bold text-blue-600 text-sm truncate mb-2">
                        {team1Name}
                      </p>
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-3xl font-black text-blue-600">
                          {score.team1Moves}
                        </p>
                        <p className="text-xs text-gray-400">moves</p>
                        <p className="text-sm font-semibold text-blue-400 mt-1">
                          ⚔️ {score.team1Checks} checks
                        </p>
                      </div>
                    </div>
                    {/* Team 2 */}
                    <div className="text-center">
                      <p className="font-bold text-rose-600 text-sm truncate mb-2">
                        {team2Name}
                      </p>
                      <div className="bg-rose-50 rounded-xl p-3">
                        <p className="text-3xl font-black text-rose-600">
                          {score.team2Moves}
                        </p>
                        <p className="text-xs text-gray-400">moves</p>
                        <p className="text-sm font-semibold text-rose-400 mt-1">
                          ⚔️ {score.team2Checks} checks
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-3">
                    Total moves: {score.totalMoves}
                  </p>
                </div>

                {/* Chess board pattern footer */}
                <div className="grid grid-cols-8 h-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${i % 2 === 1 ? "bg-slate-700" : "bg-slate-100"}`}
                    />
                  ))}
                </div>
              </div>

              {/* Recent events strip */}
              <div
                className="flex flex-row overflow-x-auto w-full border border-gray-200 rounded-xl p-2 bg-gray-50 shadow-inner space-x-2 mb-4"
                style={{ maxHeight: 100 }}
              >
                {score.chessEvents
                  ?.slice(-10)
                  .reverse()
                  .map((ev, i) => {
                    const cfg = EV[ev.eventType?.toUpperCase()] ?? {
                      icon: "📌",
                      label: ev.eventType,
                    };
                    return (
                      <div
                        key={i}
                        className="flex flex-col flex-shrink-0 min-w-[90px] justify-center items-center text-sm border border-gray-200 rounded-lg p-2 bg-white"
                      >
                        <span className="text-xl">{cfg.icon}</span>
                        <span className="font-bold text-gray-700 text-xs text-center">
                          {ev.moveNotation || ev.teamName || cfg.label}
                        </span>
                        {ev.moveNumber && (
                          <span className="text-[9px] text-gray-400">
                            #{ev.moveNumber}
                          </span>
                        )}
                      </div>
                    );
                  })}
                {(!score.chessEvents || score.chessEvents.length === 0) && (
                  <div className="text-center text-gray-400 py-4 text-sm w-full">
                    No moves yet
                  </div>
                )}
              </div>

              {/* Action panel */}
              {!activeModal && isAdmin.current && (
                <div
                  className={`bg-slate-800 p-3 rounded-xl shadow-md flex flex-col gap-3 ${waiting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <p className="text-white text-center text-sm font-semibold">
                    {isCurrentlyT1 ? "⬜" : "⬛"}{" "}
                    <span className="font-black">{currentTurnName}</span> to
                    move
                  </p>

                  {/* Quick move buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className={UI_CLASSES.primaryBtn}
                      onClick={() => {
                        setSelTeam(team1Id);
                        setActiveModal("move");
                      }}
                    >
                      ⬜ {team1Name}
                    </button>
                    <button
                      className={UI_CLASSES.primaryBtn}
                      onClick={() => {
                        setSelTeam(team2Id);
                        setActiveModal("move");
                      }}
                    >
                      ⬛ {team2Name}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className={dangerBtn}
                      onClick={() => setActiveModal("check")}
                    >
                      ⚔️ Record Check
                    </button>
                    <button
                      className={dangerBtn}
                      onClick={() => setActiveModal("terminal")}
                    >
                      🏆 End Game
                    </button>
                  </div>

                  <button
                    className="w-full bg-white/10 text-white p-3 rounded-lg text-lg font-black flex items-center justify-center active:bg-white/20 border border-white/20"
                    onClick={() => send({ undo: true })}
                  >
                    <RotateCcw size={18} className="mr-2" /> UNDO LAST EVENT
                  </button>
                </div>
              )}

              {/* ── MOVE WIZARD ── */}
              {activeModal === "move" && isAdmin.current && (
                <div className="bg-slate-800 p-3 rounded-xl shadow-md">
                  <WizardHeader title="♟️ Record Move" onClose={closeModal} />
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={moveNotation}
                      onChange={(e) => setMoveNotation(e.target.value)}
                      placeholder="Move notation (e.g. e4, Nf3, O-O) — optional"
                      className="w-full p-3 rounded-lg text-base bg-white text-gray-800 font-bold border border-gray-200"
                    />
                    <select
                      className="w-full p-3 rounded-lg text-base bg-white text-gray-800 font-bold border border-gray-200"
                      onChange={(e) => setSelPlayer(Number(e.target.value))}
                    >
                      <option value="">Select Player (Optional)</option>
                      {activePlayers(selTeam).map((p) => (
                        <option
                          key={p.id ?? p.playerId}
                          value={p.id ?? p.playerId}
                        >
                          {p.name ?? p.playerName}
                        </option>
                      ))}
                    </select>
                    <button className={UI_CLASSES.confirmBtn} onClick={submitMove}>
                      ✅ CONFIRM MOVE —{" "}
                      {selTeam === team1Id
                        ? "⬜ " + team1Name
                        : "⬛ " + team2Name}
                    </button>
                    <button className={UI_CLASSES.backBtn} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── CHECK WIZARD ── */}
              {activeModal === "check" && isAdmin.current && (
                <div className="bg-slate-800 p-3 rounded-xl shadow-md">
                  <WizardHeader title="⚔️ Record Check" onClose={closeModal} />
                  <div className="flex flex-col gap-3">
                    <p className="text-white text-sm font-semibold text-center">
                      Which team delivered check?
                    </p>
                    <button
                      className={UI_CLASSES.confirmBtn}
                      onClick={() => {
                        setSelTeam(team1Id);
                        submitCheck();
                      }}
                    >
                      ⬜ {team1Name} delivered check
                    </button>
                    <button
                      className={UI_CLASSES.confirmBtn}
                      onClick={() => {
                        setSelTeam(team2Id);
                        submitCheck();
                      }}
                    >
                      ⬛ {team2Name} delivered check
                    </button>
                    <button className={UI_CLASSES.backBtn} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── TERMINAL EVENTS ── */}
              {activeModal === "terminal" && isAdmin.current && (
                <div className="bg-slate-800 p-3 rounded-xl shadow-md">
                  <WizardHeader title="End Game" onClose={closeModal} />
                  <div className="flex flex-col gap-2">
                    <p className="text-white text-xs text-center font-semibold mb-2">
                      Select how the game ended:
                    </p>

                    {/* Checkmate */}
                    <p className="text-slate-400 text-xs font-bold uppercase">
                      ♛ Checkmate (select winning team)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={UI_CLASSES.confirmBtn}
                        onClick={() => {
                          send({ eventType: "CHECKMATE", teamId: team1Id });
                          closeModal();
                        }}
                      >
                        ⬜ {team1Name}
                      </button>
                      <button
                        className={UI_CLASSES.confirmBtn}
                        onClick={() => {
                          send({ eventType: "CHECKMATE", teamId: team2Id });
                          closeModal();
                        }}
                      >
                        ⬛ {team2Name}
                      </button>
                    </div>

                    {/* Resign */}
                    <p className="text-slate-400 text-xs font-bold uppercase mt-2">
                      🏳️ Resign (select losing team)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={dangerBtn}
                        onClick={() => {
                          send({ eventType: "RESIGN", teamId: team1Id });
                          closeModal();
                        }}
                      >
                        ⬜ {team1Name} resigns
                      </button>
                      <button
                        className={dangerBtn}
                        onClick={() => {
                          send({ eventType: "RESIGN", teamId: team2Id });
                          closeModal();
                        }}
                      >
                        ⬛ {team2Name} resigns
                      </button>
                    </div>

                    {/* Draws */}
                    <p className="text-slate-400 text-xs font-bold uppercase mt-2">
                      🤝 Draw
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={dangerBtn}
                        onClick={() => {
                          send({ eventType: "STALEMATE" });
                          closeModal();
                        }}
                      >
                        Stalemate
                      </button>
                      <button
                        className={dangerBtn}
                        onClick={() => {
                          send({ eventType: "DRAW_AGREED" });
                          closeModal();
                        }}
                      >
                        Draw Agreed
                      </button>
                    </div>

                    {/* Timeout */}
                    <p className="text-slate-400 text-xs font-bold uppercase mt-2">
                      ⏰ Timeout (select timed-out team)
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        className={dangerBtn}
                        onClick={() => {
                          send({ eventType: "TIMEOUT", teamId: team1Id });
                          closeModal();
                        }}
                      >
                        ⬜ {team1Name}
                      </button>
                      <button
                        className={dangerBtn}
                        onClick={() => {
                          send({ eventType: "TIMEOUT", teamId: team2Id });
                          closeModal();
                        }}
                      >
                        ⬛ {team2Name}
                      </button>
                    </div>

                    <button className={UI_CLASSES.backBtn} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </PanelWrapper>
      )}

      {/* ══ MOVES TAB ══ */}
      {activeTab === "Moves" && (
        <PanelWrapper>
          <PanelHeading title="Move History" />
          {/* Two-column move list like real chess notation */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 mb-4">
            {Array.from({
              length: Math.ceil(
                score.chessEvents?.filter((e) => e.eventType === "MOVE")
                  .length / 2,
              ),
            }).map((_, i) => {
              const moves = score.chessEvents?.filter(
                (e) => e.eventType === "MOVE",
              );
              const w = moves?.[i * 2],
                b = moves?.[i * 2 + 1];
              return (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 text-sm">
                    <span className="text-gray-400 font-bold w-5">
                      {i + 1}.
                    </span>
                    <span className="font-bold text-blue-700">
                      {w?.moveNotation || "—"}
                    </span>
                    <span className="text-gray-400 text-xs ml-auto">
                      {w?.teamName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 text-sm">
                    <span className="font-bold text-rose-700">
                      {b?.moveNotation || "—"}
                    </span>
                    <span className="text-gray-400 text-xs ml-auto">
                      {b?.teamName}
                    </span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
          {/* Other events */}
          <PanelHeading title="Events" />
          <div className="space-y-2">
            {score.chessEvents
              ?.filter((e) => e.eventType !== "MOVE")
              .slice()
              .reverse()
              .map((ev, i) => {
                const cfg = EV[ev.eventType?.toUpperCase()] ?? {
                  icon: "📌",
                  label: ev.eventType,
                };
                return (
                  <div
                    key={i}
                    className="flex justify-between items-center border border-gray-200 rounded-xl p-3 bg-gray-50 shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-slate-700 text-base">
                        {cfg.icon} {cfg.label}
                      </p>
                      <p className="text-sm text-gray-600">
                        {ev.moveNotation ? `"${ev.moveNotation}" ` : ""}
                        {ev.teamName ? `(${ev.teamName})` : ""}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-600 text-sm">
                      {ev.moveNumber ? `#${ev.moveNumber}` : ""}
                    </p>
                  </div>
                );
              })}
            {(!score.chessEvents ||
              score.chessEvents.filter((e) => e.eventType !== "MOVE").length ===
                0) && (
              <div className="text-center text-gray-400 py-8">
                No events yet
              </div>
            )}
          </div>
        </PanelWrapper>
      )}

      {/* ══ INFO TAB ══ */}
      {activeTab === "Info" && (
        <PanelWrapper>
          <PanelHeading title="Match Info" />
          <table className="w-full border border-gray-300 rounded-xl overflow-hidden shadow-sm">
            <tbody>
              {[
                { label: "Match ID", value: matchId },
                { label: "Status", value: score.status },
                {
                  label: "Result",
                  value: RESULT_LABELS[score.resultType] || "—",
                },
                { label: "Timer", value: matchTimer },
                { label: "Total Moves", value: score.totalMoves },
                { label: "Current Turn", value: currentTurnName },
                { label: `${team1Name} Moves`, value: score.team1Moves },
                { label: `${team2Name} Moves`, value: score.team2Moves },
                { label: `${team1Name} Checks`, value: score.team1Checks },
                { label: `${team2Name} Checks`, value: score.team2Checks },
              ].map(({ label, value }) => (
                <tr key={label}>
                  <td className="border border-gray-300 p-3 font-bold bg-gray-50 text-gray-600 w-1/2 text-sm">
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

      {/* {showFav && (
        <FavouritePlayerModal matchId={matchId} team1Id={team1Id} team2Id={team2Id}
          team1Name={team1Name} team2Name={team2Name}
          team1Players={team1P} team2Players={team2P}
          onClose={() => setShowFav(false)} />
      )} */}
    </div>
  );
}
