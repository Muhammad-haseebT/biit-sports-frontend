import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { getPlayersByTeamId } from "../../../api/teamApi";
import Media from "../cricket/modals/Media";
import {
  ArrowLeft,
  Camera,
  Trophy,
  RotateCcw,
  Flag,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { PanelWrapper, PanelHeading, WizardHeader, ScoreCircles, UI_CLASSES } from "../common/ScoringUI";

// ─── EVENT CONFIG ─────────────────────────────────────────────────
const EV = {
  POINT: { icon: "🏐", label: "Rally Point" },
  ACE: { icon: "🎯", label: "Service Ace" },
  BLOCK: { icon: "🛡", label: "Block" },
  ATTACK_ERROR: { icon: "❌", label: "Attack Error" },
  SERVICE_ERROR: { icon: "⚡", label: "Service Error" },
  SUBSTITUTION: { icon: "↔", label: "Substitution" },
  TIMEOUT: { icon: "⏸", label: "Timeout" },
  END_SET: { icon: "🔔", label: "Set End" },
};

const POINT_TYPES = [
  { key: "POINT", emoji: "🏐", label: "Rally Point", desc: "Team wins rally" },
  { key: "ACE", emoji: "🎯", label: "Service Ace", desc: "+Point to server" },
  { key: "BLOCK", emoji: "🛡", label: "Block", desc: "+Point to blocker" },
  {
    key: "ATTACK_ERROR",
    emoji: "❌",
    label: "Attack Error",
    desc: "+Point to opponent",
  },
  {
    key: "SERVICE_ERROR",
    emoji: "⚡",
    label: "Service Error",
    desc: "+Point to opponent",
  },
];

// ─── TIMER ───────────────────────────────────────────────────────
function useSetTimer(setStartTime, status) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!setStartTime || status !== "LIVE") {
      setElapsed(0);
      return;
    }
    const tick = () =>
      setElapsed(Math.floor((Date.now() - setStartTime) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [setStartTime, status]);
  return {
    mins: String(Math.floor(elapsed / 60)).padStart(2, "0"),
    secs: String(elapsed % 60).padStart(2, "0"),
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────
export default function VolleyballScoring({
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
    team1Points: 0,
    team2Points: 0,
    team1Sets: 0,
    team2Sets: 0,
    currentSet: 1,
    status: "LIVE",
    team1Timeouts: 0,
    team2Timeouts: 0,
    setStartTime: null,
    setsToWin: 3,
    pointsToWin: 25,
    pointsPerSet: 25,
    finalSetPoints: 15,
    volleyballEvents: [],
    comment: "",
  });

  const [team1P, setTeam1P] = useState([]);
  const [team2P, setTeam2P] = useState([]);

  // modal state
  const [modal, setModal] = useState(null);
  const [step, setStep] = useState(1);
  const [selType, setSelType] = useState(null);
  const [selTeam, setSelTeam] = useState(null);
  const [selPlayer, setSelPlayer] = useState(null);
  const [selOut, setSelOut] = useState(null);
  const [selIn, setSelIn] = useState(null);
  const [subStep, setSubStep] = useState(1);

  const [activeTab, setActiveTab] = useState("Scoring");
  const [toast, setToast] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [mediaId, setMediaId] = useState(null);

  const timer = useSetTimer(score.setStartTime, score.status);

  useEffect(() => {
    try {
      const u = JSON.parse(Cookies.get("account") || "{}");
      if (u.role === "ADMIN" || u.role === "SCORER") isAdmin.current = true;
    } catch {}
  }, []);

  useEffect(() => {
    if (score.status === "COMPLETED") setActiveTab("Scoring");
  }, [score.status]);

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
      console.log(d);
      setScore((p) => ({
        ...p,
        ...d,
        team1Sets: Number(d.team1Sets ?? p.team1Sets),
        team2Sets: Number(d.team2Sets ?? p.team2Sets),
        setsToWin: Number(d.setsToWin ?? p.setsToWin) || 3,
      }));
      setWaiting(false);
      if (d.comment === "UNDO") showToast("↩ Undo successful", "info");
      if (d.status === "COMPLETED") showToast("🏆 Match Complete!", "info");
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
    setModal(null);
    setStep(1);
    setSubStep(1);
    setSelType(null);
    setSelTeam(null);
    setSelPlayer(null);
    setSelOut(null);
    setSelIn(null);
  };

  const submitPoint = (skipPlayer = false) => {
    if (!selType || !selTeam) return;
    const p = { eventType: selType, teamId: selTeam };
    if (selPlayer && !skipPlayer) p.playerId = selPlayer;
    send(p);
    closeModal();
  };

  const submitSub = () => {
    if (!selTeam || !selOut || !selIn) return;
    send({
      eventType: "SUBSTITUTION",
      teamId: selTeam,
      outPlayerId: selOut,
      inPlayerId: selIn,
    });
    closeModal();
  };

  const submitTimeout = (tid) => {
    send({ eventType: "TIMEOUT", teamId: tid });
    closeModal();
  };
  const submitEndSet = () => {
    send({ eventType: "END_SET" });
    closeModal();
  };

  const activePlayers = () => (selTeam === team1Id ? team1P : team2P);
  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isCompleted = score.status === "COMPLETED";
  const stw = Number(score.setsToWin) || 3;
  const maxSets = stw * 2 - 1;
  const totalPlayed =
    (Number(score.team1Sets) || 0) + (Number(score.team2Sets) || 0);
  const setLabel =
    totalPlayed === maxSets - 1 ? "Tiebreak" : `Set ${score.currentSet}`;

  // Futsal-style class strings

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

      {/* ══ SCORING TAB ══ */}
      {activeTab === "Scoring" && (
        <PanelWrapper>
          <PanelHeading title="Live Scoring" />

          {isCompleted ? (
            /* ── COMPLETED SCREEN ── */
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 rounded-2xl p-6 shadow-md mb-4 gap-3">
              <Trophy className="text-yellow-500 w-16 h-16 mb-1" />
              <h2 className="text-2xl font-black text-red-600 tracking-wide">
                Match Completed!
              </h2>

              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm font-bold text-blue-600 mb-1">
                    {team1Name}
                  </p>
                  <ScoreCircles
                    won={Number(score.team1Sets) || 0}
                    toWin={stw}
                    color="blue"
                  />
                </div>
                <div className="text-3xl font-black text-gray-800 px-2">
                  {score.team1Sets} – {score.team2Sets}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-rose-600 mb-1">
                    {team2Name}
                  </p>
                  <ScoreCircles
                    won={Number(score.team2Sets) || 0}
                    toWin={stw}
                    color="rose"
                  />
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((score.team1Points / (score.pointsToWin || 25)) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                <div
                  className="bg-rose-500 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((score.team2Points / (score.pointsToWin || 25)) * 100, 100)}%`,
                  }}
                />
              </div>

              {(Number(score.team1Sets) || 0) >
              (Number(score.team2Sets) || 0) ? (
                <div className="mt-2 bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-full shadow-md text-center">
                  🏆 {team1Name} Wins!
                </div>
              ) : (Number(score.team2Sets) || 0) >
                (Number(score.team1Sets) || 0) ? (
                <div className="mt-2 bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-full shadow-md text-center">
                  🏆 {team2Name} Wins!
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
                    Timeouts: <strong>{score.team1Timeouts}</strong>
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                  <p className="font-bold text-rose-600 text-sm mb-1">
                    {team2Name}
                  </p>
                  <p className="text-xs text-gray-600">
                    Timeouts: <strong>{score.team2Timeouts}</strong>
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
              {/* Timer + Set Label */}
              <div className="text-center mb-4">
                <span className="text-lg font-bold text-gray-500">
                  {setLabel} — {timer.mins}:{timer.secs}
                </span>
              </div>

              {/* Set circles + Scoreboard */}
              <div className="flex w-full items-center justify-between mb-2 border border-gray-200 rounded-xl px-3 pt-3 pb-1 bg-gray-50 shadow-sm">
                <div className="flex flex-col items-center flex-1 gap-1">
                  <p className="text-base sm:text-xl font-bold truncate text-blue-600">
                    {team1Name}
                  </p>
                  <ScoreCircles
                    won={Number(score.team1Sets) || 0}
                    toWin={stw}
                    color="blue"
                  />
                </div>
                <div className="text-4xl sm:text-5xl font-black bg-white px-4 py-2 rounded-xl border border-gray-300 shadow-inner flex items-center gap-3">
                  <span>{score.team1Points}</span>
                  <span className="text-red-500 text-3xl">-</span>
                  <span>{score.team2Points}</span>
                </div>
                <div className="flex flex-col items-center flex-1 gap-1">
                  <p className="text-base sm:text-xl font-bold truncate text-rose-600">
                    {team2Name}
                  </p>
                  <ScoreCircles
                    won={Number(score.team2Sets) || 0}
                    toWin={stw}
                    color="rose"
                  />
                </div>
              </div>

              {/* Timeouts + Status */}
              <div className="flex justify-between items-center mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3 shadow-sm">
                <span className="text-base font-semibold text-gray-600">
                  TOs: <strong>{score.team1Timeouts}</strong> –{" "}
                  <strong>{score.team2Timeouts}</strong>
                </span>
                <span className="text-base font-semibold text-gray-600">
                  Sets:{" "}
                  <strong className="text-red-600">
                    {score.team1Sets}–{score.team2Sets}
                  </strong>
                </span>
              </div>

              {/* Recent Events Strip */}
              <div className="flex flex-row overflow-x-auto w-full max-h-36 border border-gray-200 rounded-xl p-2 bg-gray-50 shadow-inner space-x-2 mb-4">
                {score.volleyballEvents
                  ?.slice(-10)
                  .reverse()
                  .map((ev, index) => {
                    const cfg = EV[ev.eventType?.toUpperCase()] ?? {
                      icon: "📌",
                      label: ev.eventType,
                    };
                    return (
                      <div
                        key={index}
                        className="flex flex-col flex-shrink-0 min-w-[100px] justify-center items-center text-sm border border-gray-200 rounded-lg p-2 bg-white cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          if (ev.id) setMediaId(ev.id);
                        }}
                      >
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="text-xl">{cfg.icon}</span>
                          <span className="font-semibold text-gray-500 text-xs">
                            {ev.eventTimeSeconds != null
                              ? `${Math.floor(ev.eventTimeSeconds / 60)}'`
                              : "—"}
                            {ev.setNumber ? ` (S${ev.setNumber})` : ""}
                          </span>
                          {ev.id && (
                            <Camera size={12} className="text-sky-500" />
                          )}
                        </div>
                        <span className="truncate text-center font-bold text-gray-700 w-full text-xs">
                          {ev.playerName || ev.teamName || cfg.label}
                        </span>
                      </div>
                    );
                  })}
                {(!score.volleyballEvents ||
                  score.volleyballEvents.length === 0) && (
                  <div className="text-center text-gray-400 py-4 font-semibold text-sm w-full">
                    No recent events
                  </div>
                )}
              </div>

              {/* ── ACTION PANEL ── */}
              {!modal && isAdmin.current && (
                <div
                  className={`bg-red-600 p-3 rounded-xl shadow-md flex flex-col gap-3 ${waiting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <button
                    className={UI_CLASSES.primaryBtn}
                    onClick={() => setModal("point")}
                  >
                    Record Point
                  </button>
                  <button
                    className={UI_CLASSES.primaryBtn}
                    onClick={() => setModal("sub")}
                  >
                    Substitution
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                      onClick={() => setModal("timeout")}
                    >
                      ⏸ Timeout
                    </button>
                    <button
                      className="bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                      onClick={() => setModal("endSet")}
                    >
                      🔔 End Set
                    </button>
                  </div>
                  <button
                    className="w-full bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 transition-colors border border-red-200"
                    onClick={() => send({ eventType: "UNDO" })}
                  >
                    UNDO LAST EVENT
                  </button>
                </div>
              )}

              {/* ── POINT WIZARD ── */}
              {modal === "point" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title="Record Point" onClose={closeModal} />
                  <div className="flex flex-col gap-3">
                    {step === 1 && (
                      <select
                        className={UI_CLASSES.selectCls}
                        onChange={(e) => {
                          setSelType(e.target.value);
                          setStep(2);
                        }}
                      >
                        <option value="">Select Point Type</option>
                        {POINT_TYPES.map((pt) => (
                          <option key={pt.key} value={pt.key}>
                            {pt.emoji} {pt.label}
                          </option>
                        ))}
                      </select>
                    )}
                    {step === 2 && (
                      <>
                        <select
                          className={UI_CLASSES.selectCls}
                          onChange={(e) => {
                            setSelTeam(Number(e.target.value));
                            setStep(3);
                          }}
                        >
                          <option value="">
                            {["ATTACK_ERROR", "SERVICE_ERROR"].includes(selType)
                              ? "Team that made the error"
                              : "Team that scored"}
                          </option>
                          <option value={team1Id}>{team1Name}</option>
                          <option value={team2Id}>{team2Name}</option>
                        </select>
                        <button className={UI_CLASSES.backBtn} onClick={() => setStep(1)}>
                          Back
                        </button>
                      </>
                    )}
                    {step === 3 && (
                      <>
                        <select
                          className={UI_CLASSES.selectCls}
                          onChange={(e) => setSelPlayer(Number(e.target.value))}
                        >
                          <option value="">Select Player (Optional)</option>
                          {activePlayers().map((p) => (
                            <option
                              key={p.id ?? p.playerId}
                              value={p.id ?? p.playerId}
                            >
                              {p.name ?? p.playerName}
                            </option>
                          ))}
                        </select>
                        <button
                          className={UI_CLASSES.confirmBtn}
                          onClick={() => submitPoint(false)}
                        >
                          CONFIRM POINT
                        </button>
                        <button
                          className="w-full bg-gray-100 text-gray-600 p-3 rounded-lg text-base font-bold shadow-sm active:bg-gray-200 border border-gray-300"
                          onClick={() => submitPoint(true)}
                        >
                          Skip Player & Confirm
                        </button>
                        <button className={UI_CLASSES.backBtn} onClick={() => setStep(2)}>
                          Back
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── TIMEOUT WIZARD ── */}
              {modal === "timeout" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title="Timeout" onClose={closeModal} />
                  <div className="flex flex-col gap-3">
                    <button
                      className={UI_CLASSES.confirmBtn}
                      disabled={score.team1Timeouts >= 2}
                      onClick={() => submitTimeout(team1Id)}
                    >
                      {team1Name} Timeout
                    </button>
                    <button
                      className={UI_CLASSES.confirmBtn}
                      disabled={score.team2Timeouts >= 2}
                      onClick={() => submitTimeout(team2Id)}
                    >
                      {team2Name} Timeout
                    </button>
                    <button className={UI_CLASSES.backBtn} onClick={closeModal}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── SUB WIZARD ── */}
              {modal === "sub" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title="Substitution" onClose={closeModal} />
                  <div className="flex flex-col gap-3">
                    {subStep === 1 && (
                      <select
                        className={UI_CLASSES.selectCls}
                        onChange={(e) => {
                          setSelTeam(Number(e.target.value));
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
                          className={UI_CLASSES.selectCls}
                          onChange={(e) => {
                            setSelOut(Number(e.target.value));
                            setSubStep(3);
                          }}
                        >
                          <option value="">Select Player OUT</option>
                          {activePlayers().map((p) => (
                            <option
                              key={p.id ?? p.playerId}
                              value={p.id ?? p.playerId}
                            >
                              {p.name ?? p.playerName}
                            </option>
                          ))}
                        </select>
                        <button
                          className={UI_CLASSES.backBtn}
                          onClick={() => setSubStep(1)}
                        >
                          Back
                        </button>
                      </>
                    )}
                    {subStep === 3 && (
                      <>
                        <select
                          className={UI_CLASSES.selectCls}
                          onChange={(e) => setSelIn(Number(e.target.value))}
                        >
                          <option value="">Select Player IN</option>
                          {activePlayers()
                            .filter((p) => (p.id ?? p.playerId) !== selOut)
                            .map((p) => (
                              <option
                                key={p.id ?? p.playerId}
                                value={p.id ?? p.playerId}
                              >
                                {p.name ?? p.playerName}
                              </option>
                            ))}
                        </select>
                        <button
                          disabled={!selIn}
                          className={UI_CLASSES.confirmBtn}
                          onClick={submitSub}
                        >
                          CONFIRM SUB
                        </button>
                        <button
                          className={UI_CLASSES.backBtn}
                          onClick={() => setSubStep(2)}
                        >
                          Back
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── END SET WIZARD ── */}
              {modal === "endSet" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title={`End ${setLabel}?`} onClose={closeModal} />
                  <p className="text-white text-sm text-center mb-3 font-semibold">
                    Current: {score.team1Points} – {score.team2Points}
                  </p>
                  <div className="flex flex-col gap-3">
                    <button className={UI_CLASSES.confirmBtn} onClick={submitEndSet}>
                      CONFIRM END SET
                    </button>
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

      {/* ══ SUMMARY TAB ══ */}
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
                { label: "Sets Won", t1: score.team1Sets, t2: score.team2Sets },
                {
                  label: "Current Points",
                  t1: score.team1Points,
                  t2: score.team2Points,
                },
                {
                  label: "Timeouts Used",
                  t1: score.team1Timeouts,
                  t2: score.team2Timeouts,
                  cls: "text-amber-600",
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

      {/* ══ EVENTS TAB ══ */}
      {activeTab === "Events" && (
        <PanelWrapper>
          <PanelHeading title="Event Timeline" />
          <div className="space-y-2">
            {score.volleyballEvents
              ?.slice()
              .reverse()
              .map((ev, i) => {
                const cfg = EV[ev.eventType?.toUpperCase()] ?? {
                  icon: "📌",
                  label: ev.eventType,
                };
                const mins =
                  ev.eventTimeSeconds != null
                    ? Math.floor(ev.eventTimeSeconds / 60)
                    : "—";
                return (
                  <div
                    key={i}
                    className="flex justify-between items-center border border-gray-200 rounded-xl p-3 bg-gray-50 shadow-sm"
                  >
                    <div>
                      <p className="font-bold text-red-600 text-base">
                        {cfg.icon} {cfg.label}
                      </p>
                      <p className="text-sm text-gray-600">
                        {ev.playerName ? `Player: ${ev.playerName} ` : ""}
                        {ev.teamName ? `(${ev.teamName})` : ""}
                        {ev.inPlayerName
                          ? `In: ${ev.inPlayerName} Out: ${ev.outPlayerName}`
                          : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-700">
                        {mins}' {ev.setNumber ? `S${ev.setNumber}` : ""}
                      </p>
                      {ev.id && (
                        <button
                          className="text-red-600 mt-1 flex items-center gap-1 justify-end text-sm"
                          onClick={() => setMediaId(ev.id)}
                        >
                          <Camera size={16} /> View
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            {(!score.volleyballEvents ||
              score.volleyballEvents.length === 0) && (
              <div className="text-center text-gray-400 py-8 font-semibold">
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
                { label: "Current Set", value: setLabel },
                { label: "Sets to Win", value: stw },
                { label: "Points Per Set", value: score.pointsPerSet },
                { label: "Final Set Points", value: score.finalSetPoints },
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

      {/* Media Modal */}
      {mediaId && (
        <Media
          ballId={mediaId}
          matchId={matchId}
          onClose={() => setMediaId(null)}
        />
      )}
    </div>
  );
}
