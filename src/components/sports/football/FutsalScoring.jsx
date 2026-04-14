import { useEffect, useState, useRef, useCallback } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { getPlayersByTeamId } from "../../../api/teamApi";
import Media from "../cricket/modals/Media";
import {
  ArrowLeft,
  Camera,
  ShieldAlert,
  XCircle,
  CheckCircle,
  ChevronRight,
  Trophy,
} from "lucide-react";

const FOUL_LIMIT = 5;

const EVENT_CONFIG = {
  GOAL: { icon: "⚽", label: "Goal" },
  OWN_GOAL: { icon: "🔴", label: "Own Goal" },
  FOUL: { icon: "⚠️", label: "Foul" },
  YELLOW_CARD: { icon: "🟨", label: "Yellow Card" },
  RED_CARD: { icon: "🟥", label: "Red Card" },
  SUBSTITUTION: { icon: "↔", label: "Substitution" },
  END_HALF: { icon: "🔔", label: "End Half" },
  EXTRA_TIME: { icon: "⏱", label: "Extra Time" },
  TIMEOUT: { icon: "⏸", label: "Timeout" },
};

function useMatchTimer(halfStartTime, halfDurationMinutes, status) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!halfStartTime || status !== "LIVE") {
      setElapsed(0);
      return;
    }
    const tick = () =>
      setElapsed(Math.floor((Date.now() - halfStartTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [halfStartTime, status]);

  const totalSec = (halfDurationMinutes || 25) * 60;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return { mins, secs, elapsed, totalSec };
}

function PanelWrapper({ children }) {
  return <div className="mt-2 mb-2 px-4">{children}</div>;
}

function PanelHeading({ title }) {
  return (
    <h1 className="text-2xl font-semibold text-red-600 mt-2 mb-4">{title}</h1>
  );
}

export default function FutsalScoring({
  matchId,
  status,
  team1Id,
  team2Id,
  team1Name,
  team2Name,
  winnerTeamName,
}) {
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const isAdminRef = useRef(false);

  const [score, setScore] = useState({
    team1Score: 0,
    team2Score: 0,
    team1Fouls: 0,
    team2Fouls: 0,
    team1YellowCards: 0,
    team2YellowCards: 0,
    team1RedCards: 0,
    team2RedCards: 0,
    currentHalf: 1,
    status: "LIVE",
    inExtraTime: false,
    halfStartTime: null,
    halfDurationMinutes: 25,
    futsalEvents: [],
    comment: "",
  });

  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [activeModal, setActiveModal] = useState(null);

  const [goalStep, setGoalStep] = useState(1);
  const [selTeamId, setSelTeamId] = useState(null);
  const [selGoalType, setSelGoalType] = useState(null);
  const [selPlayerId, setSelPlayerId] = useState(null);
  const [selAssistId, setSelAssistId] = useState(null);

  const [foulStep, setFoulStep] = useState(1);
  const [selCardType, setSelCardType] = useState(null);

  const [subStep, setSubStep] = useState(1);
  const [selOutId, setSelOutId] = useState(null);
  const [selInId, setSelInId] = useState(null);

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [activeTab, setActiveTab] = useState("Scoring");
  const [toast, setToast] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);

  const timer = useMatchTimer(
    score.halfStartTime,
    score.halfDurationMinutes,
    score.status,
  );

  useEffect(() => {
    try {
      const acc = Cookies.get("account");
      if (acc) {
        const u = JSON.parse(acc);
        if (u.role === "ADMIN" || u.role === "SCORER")
          isAdminRef.current = true;
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (score.status === "COMPLETED") setActiveTab("Scoring");
  }, [score.status]);

  const fetchPlayers = useCallback(async () => {
    const [p1, p2] = await Promise.all([
      getPlayersByTeamId(team1Id),
      getPlayersByTeamId(team2Id),
    ]);
    setTeam1Players(p1 || []);
    setTeam2Players(p2 || []);
  }, [team1Id, team2Id]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    const ws = new WebSocket(
      import.meta.env.VITE_SOCKET_URL + "?matchId=" + matchId,
    );
    ws.onopen = () => {
      socketRef.current = ws;
      showToast("🔴 Live connected", "success");
    };
    ws.onmessage = (e) => {
      const d = JSON.parse(e.data);
      setScore((prev) => ({ ...prev, ...d }));
      console.log(d);
      setIsWaiting(false);
      if (d.comment === "UNDO") showToast("↩ Undo successful", "info");
      if (d.status === "HALF_TIME") showToast("🔔 Half Time!", "info");
      if (d.status === "EXTRA_TIME") showToast("⏱ Draw! Extra Time?", "info");
      if (d.status === "COMPLETED") showToast("🏆 Match Completed!", "info");
    };
    ws.onerror = () => showToast("WebSocket error", "error");
    ws.onclose = () => {
      socketRef.current = null;
    };
    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, []);

  const send = (payload) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      showToast("Not connected", "error");
      return;
    }
    setIsWaiting(true);
    socketRef.current.send(JSON.stringify({ matchId, ...payload }));
  };

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const closeModal = () => {
    setActiveModal(null);
    setGoalStep(1);
    setFoulStep(1);
    setSubStep(1);
    setSelTeamId(null);
    setSelGoalType(null);
    setSelPlayerId(null);
    setSelAssistId(null);
    setSelCardType(null);
    setSelOutId(null);
    setSelInId(null);
  };

  const activePlayers = () =>
    selTeamId === team1Id ? team1Players : team2Players;
  const opposingPlayers = () =>
    selTeamId === team1Id ? team2Players : team1Players;

  const submitGoal = () => {
    if (!selTeamId || !selGoalType || !selPlayerId) return;
    send({
      eventType: selGoalType === "OWN_GOAL" ? "OWN_GOAL" : "GOAL",
      goalType: selGoalType,
      teamId: selTeamId,
      playerId: selPlayerId,
      assistPlayerId: selAssistId || null,
    });
    closeModal();
  };

  const submitFoul = () => {
    if (!selTeamId || !selPlayerId) return;
    const evType =
      selCardType === "YELLOW"
        ? "YELLOW_CARD"
        : selCardType === "RED"
          ? "RED_CARD"
          : "FOUL";
    send({
      eventType: evType,
      cardType: selCardType,
      teamId: selTeamId,
      playerId: selPlayerId,
    });
    closeModal();
  };

  const submitSub = () => {
    if (!selTeamId || !selOutId || !selInId) return;
    send({
      eventType: "SUBSTITUTION",
      teamId: selTeamId,
      outPlayerId: selOutId,
      inPlayerId: selInId,
    });
    closeModal();
  };

  const isCompleted = score.status === "COMPLETED";
  const isHalfTime = score.status === "HALF_TIME";
  const isExtraTime = score.status === "EXTRA_TIME";

  const selectCls =
    "w-full p-3 rounded-lg text-xl sm:text-2xl bg-white text-red-600 font-bold border border-red-200 shadow-sm";
  const primaryBtn =
    "w-full bg-white text-red-600 p-3 rounded-lg text-2xl sm:text-3xl font-black shadow-md flex items-center justify-center active:bg-gray-200 transition-colors border border-red-200";
  const confirmBtn =
    "w-full bg-emerald-500 text-white p-3 rounded-lg text-2xl sm:text-3xl font-black shadow-md flex items-center justify-center active:bg-emerald-400 transition-colors disabled:opacity-50";
  const backBtn =
    "w-full bg-gray-100 text-gray-700 p-3 rounded-lg text-xl font-bold shadow-sm flex items-center justify-center active:bg-gray-200 transition-colors border border-gray-300";

  const WizardHeader = ({ title }) => (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-red-600">{title}</h2>
      <button
        className="text-gray-500 text-sm border border-gray-300 px-3 py-1 rounded-lg hover:bg-gray-100"
        onClick={closeModal}
      >
        ✕ Close
      </button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-2xl text-sm font-bold shadow-2xl ${
            toast.type === "error"
              ? "bg-red-500"
              : toast.type === "success"
                ? "bg-green-500"
                : "bg-slate-700"
          } text-white`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center bg-red-600 h-16 px-4">
        <ArrowLeft
          className="w-6 h-6 text-white cursor-pointer"
          size={24}
          onClick={() => navigate(-1)}
        />
        <h1 className="text-white font-semibold text-2xl ml-2">Match Center</h1>
      </div>

      {/* Tab Bar */}
      <div className="flex justify-between mt-4 px-4 gap-2">
        {["Scoring", "Summary", "Events", "Info"].map((item) => (
          <button
            key={item}
            className={`flex-1 py-2 rounded-lg font-semibold text-base transition-colors ${
              activeTab === item
                ? "bg-red-600 text-white shadow"
                : "bg-gray-100 text-gray-600 border border-gray-200"
            }`}
            onClick={() => setActiveTab(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <hr className="my-3 border-gray-200" />

      {/* ══════════════════════════════════════════════════════
          SCORING TAB
         ══════════════════════════════════════════════════════ */}
      {activeTab === "Scoring" && (
        <PanelWrapper>
          <PanelHeading title="Live Scoring" />

          {/* ── COMPLETED WINNER SCREEN — sirf yahi dikhta hai ── */}
          {isCompleted ? (
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 rounded-2xl p-6 shadow-md mb-4 gap-3">
              <Trophy className="text-yellow-500 w-16 h-16 mb-1" />
              <h2 className="text-2xl font-black text-red-600 tracking-wide">
                Match Completed!
              </h2>
              <div className="text-5xl font-black text-gray-800">
                {score.team1Score} – {score.team2Score}
              </div>
              <div className="flex gap-3 text-sm text-gray-500 font-semibold">
                <span className="text-blue-600">{team1Name}</span>
                <span>vs</span>
                <span className="text-rose-600">{team2Name}</span>
              </div>

              {winnerTeamName ? (
                <div className="mt-2 bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-full shadow-md text-center">
                  🏆 {winnerTeamName} Wins!
                </div>
              ) : (
                <div className="mt-2 bg-gray-200 text-gray-700 font-bold text-xl px-6 py-3 rounded-full text-center">
                  🤝 Match Drawn
                </div>
              )}

              <div className="w-full mt-3 grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="font-bold text-blue-600 text-sm mb-1">
                    {team1Name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Fouls: <strong>{score.team1Fouls}</strong>
                  </p>
                  <p className="text-xs text-gray-600">
                    🟨 {score.team1YellowCards} &nbsp; 🟥 {score.team1RedCards}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="font-bold text-rose-600 text-sm mb-1">
                    {team2Name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Fouls: <strong>{score.team2Fouls}</strong>
                  </p>
                  <p className="text-xs text-gray-600">
                    🟨 {score.team2YellowCards} &nbsp; 🟥 {score.team2RedCards}
                  </p>
                </div>
              </div>

              <button
                className="mt-2 w-full bg-red-600 text-white font-bold py-3 rounded-xl text-base"
                onClick={() => setActiveTab("Events")}
              >
                View Full Timeline →
              </button>
            </div>
          ) : (
            <>
              {/* Timer */}
              <div className="text-center mb-4">
                <span className="text-lg font-bold text-gray-500">
                  {score.currentHalf === 1
                    ? "1st Half"
                    : score.currentHalf === 2
                      ? "2nd Half"
                      : "Extra Time"}{" "}
                  — {String(timer.mins).padStart(2, "0")}:
                  {String(timer.secs).padStart(2, "0")}
                </span>
              </div>

              {/* Scoreboard */}
              <div className="flex w-full items-center justify-between mb-4 border border-gray-200 rounded-xl p-3 bg-gray-50 shadow-sm">
                <div className="text-base sm:text-xl font-bold flex-1 text-center truncate px-1 text-blue-600">
                  {team1Name}
                </div>
                <div className="text-4xl sm:text-5xl font-black bg-white px-4 py-2 rounded-xl border border-gray-300 shadow-inner flex items-center gap-3">
                  <span>{score.team1Score}</span>
                  <span className="text-red-500 text-3xl">-</span>
                  <span>{score.team2Score}</span>
                </div>
                <div className="text-base sm:text-xl font-bold flex-1 text-center truncate px-1 text-rose-600">
                  {team2Name}
                </div>
              </div>

              {/* Fouls & Status Row */}
              <div className="flex justify-between items-center mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
                <span className="text-base font-semibold text-gray-600">
                  Fouls: <strong>{score.team1Fouls}</strong> –{" "}
                  <strong>{score.team2Fouls}</strong>
                </span>
                <span className="text-base font-semibold text-gray-600">
                  Status:{" "}
                  <strong className="text-red-600">
                    {score.status === "HALF_TIME"
                      ? "HT"
                      : score.status === "COMPLETED"
                        ? "FT"
                        : score.status}
                  </strong>
                </span>
              </div>

              {/* Recent Events Strip */}
              <div className="flex flex-row overflow-x-auto w-full max-h-36 border border-gray-200 rounded-xl p-2 bg-gray-50 shadow-inner space-x-2 mb-4">
                {score.futsalEvents
                  ?.slice(-10)
                  .reverse()
                  .map((ev, index) => (
                    <div
                      key={index}
                      className="flex flex-col flex-shrink-0 min-w-[100px] justify-center items-center text-sm border border-gray-200 rounded-lg p-2 bg-white cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        if (ev.id) setSelectedEventId(ev.id);
                      }}
                    >
                      <div className="flex items-center space-x-1 mb-1">
                        <span className="text-xl">
                          {ev.eventType === "GOAL"
                            ? "⚽"
                            : ev.eventType === "FOUL"
                              ? "🛑"
                              : ev.eventType === "YELLOW_CARD"
                                ? "🟨"
                                : ev.eventType === "RED_CARD"
                                  ? "🟥"
                                  : ev.eventType === "SUBSTITUTION"
                                    ? "🔄"
                                    : ""}
                        </span>
                        <span className="font-semibold text-gray-500 text-xs">
                          {Math.floor(ev.eventTimeSeconds / 60)}'{" "}
                          {ev.half === 3
                            ? "(ET)"
                            : ev.half
                              ? `(H${ev.half})`
                              : ""}
                        </span>
                        {ev.id && <Camera size={12} className="text-sky-500" />}
                      </div>
                      <span className="truncate text-center font-bold text-gray-700 w-full text-xs">
                        {ev.scorerName || ev.playerId
                          ? `${ev.scorerName || ev.playerId}`
                          : ev.eventType?.replace(/_/g, " ") || "Event"}
                      </span>
                    </div>
                  ))}
                {(!score.futsalEvents || score.futsalEvents.length === 0) && (
                  <div className="text-center text-gray-400 py-4 font-semibold text-sm w-full">
                    No recent events
                  </div>
                )}
              </div>

              {/* ── ACTION PANEL ── */}
              {!activeModal && isAdminRef.current && (
                <div
                  className={`bg-red-600 p-3 rounded-xl shadow-md flex flex-col gap-3 ${isWaiting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <button
                    className={primaryBtn}
                    onClick={() => setActiveModal("goal")}
                  >
                    Record Goal
                  </button>
                  <button
                    className={primaryBtn}
                    onClick={() => setActiveModal("foul")}
                  >
                    Record Foul
                  </button>
                  <button
                    className={primaryBtn}
                    onClick={() => setActiveModal("sub")}
                  >
                    Substitution
                  </button>
                  {isHalfTime ? (
                    <button
                      className={confirmBtn}
                      onClick={() => send({ eventType: "START_SECOND_HALF" })}
                    >
                      Start 2nd Half
                    </button>
                  ) : (
                    <button
                      className={primaryBtn}
                      onClick={() => setActiveModal("endHalf")}
                    >
                      End Match / Half
                    </button>
                  )}
                  <button
                    className="w-full bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 transition-colors border border-red-200"
                    onClick={() => send({ undo: true })}
                  >
                    UNDO LAST EVENT
                  </button>
                </div>
              )}

              {/* ── GOAL WIZARD ── */}
              {activeModal === "goal" && isAdminRef.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title="Record Goal" />
                  <div className="flex flex-col gap-3">
                    {goalStep === 1 && (
                      <select
                        className={selectCls}
                        onChange={(e) => {
                          setSelTeamId(Number(e.target.value));
                          setGoalStep(2);
                        }}
                      >
                        <option value="">Select Team</option>
                        <option value={team1Id}>{team1Name}</option>
                        <option value={team2Id}>{team2Name}</option>
                      </select>
                    )}
                    {goalStep === 2 && (
                      <>
                        <select
                          className={selectCls}
                          onChange={(e) => {
                            setSelGoalType(e.target.value);
                            setGoalStep(3);
                          }}
                        >
                          <option value="">Select Goal Type</option>
                          <option value="NORMAL">Normal</option>
                          <option value="PENALTY">Penalty</option>
                          <option value="FREE_KICK">Free Kick</option>
                          <option value="OWN_GOAL">Own Goal</option>
                        </select>
                        <button
                          className={backBtn}
                          onClick={() => setGoalStep(1)}
                        >
                          Back
                        </button>
                      </>
                    )}
                    {goalStep === 3 && (
                      <>
                        <select
                          className={selectCls}
                          onChange={(e) =>
                            setSelPlayerId(Number(e.target.value))
                          }
                        >
                          <option value="">Select Scorer</option>
                          {(selGoalType === "OWN_GOAL"
                            ? opposingPlayers()
                            : activePlayers()
                          ).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <select
                          className={selectCls}
                          onChange={(e) =>
                            setSelAssistId(Number(e.target.value))
                          }
                        >
                          <option value="">Select Assist (Optional)</option>
                          {activePlayers()
                            .filter((p) => p.id !== selPlayerId)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                        <button
                          disabled={!selPlayerId}
                          className={confirmBtn}
                          onClick={submitGoal}
                        >
                          CONFIRM GOAL
                        </button>
                        <button
                          className={backBtn}
                          onClick={() => setGoalStep(2)}
                        >
                          Back
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── FOUL WIZARD ── */}
              {activeModal === "foul" && isAdminRef.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title="Record Foul / Card" />
                  <div className="flex flex-col gap-3">
                    {foulStep === 1 && (
                      <select
                        className={selectCls}
                        onChange={(e) => {
                          setSelTeamId(Number(e.target.value));
                          setFoulStep(2);
                        }}
                      >
                        <option value="">Select Team</option>
                        <option value={team1Id}>{team1Name}</option>
                        <option value={team2Id}>{team2Name}</option>
                      </select>
                    )}
                    {foulStep === 2 && (
                      <>
                        <select
                          className={selectCls}
                          onChange={(e) => {
                            setSelCardType(
                              e.target.value === "null" ? null : e.target.value,
                            );
                            setFoulStep(3);
                          }}
                        >
                          <option value="">Select Card Type</option>
                          <option value="null">Foul (No Card)</option>
                          <option value="YELLOW">Yellow Card</option>
                          <option value="RED">Red Card</option>
                        </select>
                        <button
                          className={backBtn}
                          onClick={() => setFoulStep(1)}
                        >
                          Back
                        </button>
                      </>
                    )}
                    {foulStep === 3 && (
                      <>
                        <select
                          className={selectCls}
                          onChange={(e) =>
                            setSelPlayerId(Number(e.target.value))
                          }
                        >
                          <option value="">Select Player</option>
                          {activePlayers().map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <button
                          disabled={!selPlayerId}
                          className={confirmBtn}
                          onClick={submitFoul}
                        >
                          CONFIRM FOUL
                        </button>
                        <button
                          className={backBtn}
                          onClick={() => setFoulStep(2)}
                        >
                          Back
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── SUB WIZARD ── */}
              {activeModal === "sub" && isAdminRef.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title="Substitution" />
                  <div className="flex flex-col gap-3">
                    {subStep === 1 && (
                      <select
                        className={selectCls}
                        onChange={(e) => {
                          setSelTeamId(Number(e.target.value));
                          setSubStep(2);
                        }}
                      >
                        <option value="">Select Team</option>
                        <option value={team1Id}>{team1Name}</option>
                        <option value={team2Id}>{team2Name}</option>
                      </select>
                    )}
                    {subStep === 2 && (
                      <>
                        <select
                          className={selectCls}
                          onChange={(e) => {
                            setSelOutId(Number(e.target.value));
                            setSubStep(3);
                          }}
                        >
                          <option value="">Select Player OUT</option>
                          {activePlayers().map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                        <button
                          className={backBtn}
                          onClick={() => setSubStep(1)}
                        >
                          Back
                        </button>
                      </>
                    )}
                    {subStep === 3 && (
                      <>
                        <select
                          className={selectCls}
                          onChange={(e) => setSelInId(Number(e.target.value))}
                        >
                          <option value="">Select Player IN</option>
                          {activePlayers()
                            .filter((p) => p.id !== selOutId)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                        <button
                          disabled={!selInId}
                          className={confirmBtn}
                          onClick={submitSub}
                        >
                          CONFIRM SUB
                        </button>
                        <button
                          className={backBtn}
                          onClick={() => setSubStep(2)}
                        >
                          Back
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── END HALF WIZARD ── */}
              {activeModal === "endHalf" && isAdminRef.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title="End Match / End Half" />
                  <div className="flex flex-col gap-3">
                    <button
                      className={confirmBtn}
                      onClick={() => {
                        send({ eventType: "END_HALF" });
                        closeModal();
                      }}
                    >
                      CONFIRM END
                    </button>
                    {isHalfTime && (
                      <button
                        className={confirmBtn}
                        onClick={() => {
                          send({ eventType: "START_SECOND_HALF" });
                          closeModal();
                        }}
                      >
                        Start 2nd Half
                      </button>
                    )}
                    {isExtraTime && (
                      <button
                        className={confirmBtn}
                        onClick={() => {
                          send({ eventType: "EXTRA_TIME" });
                          closeModal();
                        }}
                      >
                        Start Extra Time
                      </button>
                    )}
                    <button className={backBtn} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </PanelWrapper>
      )}

      {/* ══════════════════════════════════════════════════════
          SUMMARY TAB
         ══════════════════════════════════════════════════════ */}
      {activeTab === "Summary" && (
        <PanelWrapper>
          <PanelHeading title="Match Summary" />
          <table className="w-full border border-gray-300 text-center rounded-xl overflow-hidden shadow-sm">
            <thead>
              <tr className="bg-red-50">
                <th className="border border-gray-300 p-2 text-lg text-blue-600 font-bold">
                  {team1Name}
                </th>
                <th className="border border-gray-300 p-2 text-lg text-gray-600 font-bold">
                  Stat
                </th>
                <th className="border border-gray-300 p-2 text-lg text-rose-600 font-bold">
                  {team2Name}
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Goals", t1: score.team1Score, t2: score.team2Score },
                { label: "Fouls", t1: score.team1Fouls, t2: score.team2Fouls },
                {
                  label: "Yellow Cards",
                  t1: score.team1YellowCards,
                  t2: score.team2YellowCards,
                  cls: "text-yellow-600",
                },
                {
                  label: "Red Cards",
                  t1: score.team1RedCards,
                  t2: score.team2RedCards,
                  cls: "text-red-600",
                },
              ].map(({ label, t1, t2, cls = "text-gray-800" }) => (
                <tr key={label}>
                  <td
                    className={`border border-gray-300 p-2 text-xl font-bold ${cls}`}
                  >
                    {t1}
                  </td>
                  <td className="border border-gray-300 p-2 text-base font-semibold text-gray-500 bg-gray-50">
                    {label}
                  </td>
                  <td
                    className={`border border-gray-300 p-2 text-xl font-bold ${cls}`}
                  >
                    {t2}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelWrapper>
      )}

      {/* ══════════════════════════════════════════════════════
          EVENTS TAB
         ══════════════════════════════════════════════════════ */}
      {activeTab === "Events" && (
        <PanelWrapper>
          <PanelHeading title="Event Timeline" />
          <div className="space-y-2">
            {score.futsalEvents
              ?.slice()
              .reverse()
              .map((ev, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center border border-gray-200 rounded-xl p-3 bg-gray-50 shadow-sm"
                >
                  <div>
                    <p className="font-bold text-red-600 text-base">
                      {ev.eventType}{" "}
                      {ev.goalType && ev.goalType !== "NORMAL"
                        ? `(${ev.goalType})`
                        : ""}
                    </p>
                    <p className="text-sm text-gray-600">
                      {ev.scorerName ? `Scorer: ${ev.scorerName} ` : ""}
                      {ev.assistPlayerName
                        ? `(Assist: ${ev.assistPlayerName}) `
                        : ""}
                      {ev.inPlayerName
                        ? `In: ${ev.inPlayerName} Out: ${ev.outPlayerName} `
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-700">
                      {Math.floor(ev.eventTimeSeconds / 60)}'{" "}
                      {ev.half === 3 ? "ET" : ev.half ? `H${ev.half}` : ""}
                    </p>
                    {ev.id && (
                      <button
                        className="text-red-600 mt-1 flex items-center gap-1 justify-end text-sm"
                        onClick={() => setSelectedEventId(ev.id)}
                      >
                        <Camera size={16} /> View
                      </button>
                    )}
                  </div>
                </div>
              ))}
            {(!score.futsalEvents || score.futsalEvents.length === 0) && (
              <div className="text-center text-gray-400 py-8 font-semibold">
                No events yet
              </div>
            )}
          </div>
        </PanelWrapper>
      )}

      {/* ══════════════════════════════════════════════════════
          INFO TAB
         ══════════════════════════════════════════════════════ */}
      {activeTab === "Info" && (
        <PanelWrapper>
          <PanelHeading title="Match Info" />
          <table className="w-full border border-gray-300 rounded-xl overflow-hidden shadow-sm">
            <tbody>
              {[
                { label: "Match ID", value: matchId },
                { label: "Status", value: score.status },
                {
                  label: "Half Duration",
                  value: `${score.halfDurationMinutes} minutes`,
                },
                {
                  label: "Current Time",
                  value: `${timer.mins}:${String(timer.secs).padStart(2, "0")}`,
                },
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

      {/* Media Modal */}
      {selectedEventId && (
        <Media
          ballId={selectedEventId}
          matchId={matchId}
          onClose={() => setSelectedEventId(null)}
        />
      )}
    </div>
  );
}
