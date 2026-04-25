import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { getPlayersByTeamId } from "../../../api/teamApi";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";

// ─── Event config ──────────────────────────────────────────────────
const EV = {
  HOME_RUN: { icon: "🏠", label: "Home Run" },
  CAPTURE: { icon: "⚔️", label: "Capture" },
  WIN: { icon: "🏆", label: "Win" },
  END_MATCH: { icon: "🏁", label: "Match End" },
};

// ─── Timer ─────────────────────────────────────────────────────────
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
  return {
    mins: String(Math.floor(elapsed / 60)).padStart(2, "0"),
    secs: String(elapsed % 60).padStart(2, "0"),
  };
}

function PanelWrapper({ children }) {
  return <div className="mt-2 mb-2 px-4">{children}</div>;
}
function PanelHeading({ title }) {
  return (
    <h1 className="text-2xl font-semibold text-red-600 mt-2 mb-4">{title}</h1>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export default function LudoScoring({
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
    team1HomeRuns: 0,
    team2HomeRuns: 0,
    team1Captures: 0,
    team2Captures: 0,
    status: "LIVE",
    matchStartTime: null,
    ludoEvents: [],
    comment: "",
  });

  const [team1P, setTeam1P] = useState([]);
  const [team2P, setTeam2P] = useState([]);

  // ── Modal state ─────────────────────────────────────────────────
  // activeModal: null | "homeRun" | "capture" | "win"
  const [activeModal, setActiveModal] = useState(null);
  const [wizStep, setWizStep] = useState(1); // 1=team, 2=player
  const [selTeam, setSelTeam] = useState(null);
  const [selPlayer, setSelPlayer] = useState(null);
  // Which eventType the current wizard is for
  const [wizEventType, setWizEventType] = useState(null);

  const [activeTab, setActiveTab] = useState("Scoring");
  const [toast, setToast] = useState(null);
  const [waiting, setWaiting] = useState(false);

  const timer = useMatchTimer(score.matchStartTime, score.status);

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
    setActiveModal(null);
    setWizStep(1);
    setSelTeam(null);
    setSelPlayer(null);
    setWizEventType(null);
  };

  // Open homeRun or capture wizard
  const openWizard = (eventType) => {
    setWizEventType(eventType);
    setWizStep(1);
    setSelTeam(null);
    setSelPlayer(null);
    setActiveModal("wizard");
  };

  const submitEvent = (skipPlayer = false) => {
    if (!selTeam || !wizEventType) return;
    const p = { eventType: wizEventType, teamId: selTeam };
    if (selPlayer && !skipPlayer) p.playerId = selPlayer;
    send(p);
    closeModal();
  };

  // ✅ Team select: update state only, do NOT advance step here
  // Step advances only via explicit button click or onChange + setTimeout
  const handleTeamChange = (e) => {
    const val = Number(e.target.value);
    if (!val) return;
    setSelTeam(val);
  };

  const activePlayers = () => (selTeam === team1Id ? team1P : team2P);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isCompleted = score.status === "COMPLETED";

  // ── Styles ──────────────────────────────────────────────────────
  const selectCls =
    "w-full p-3 rounded-lg text-xl sm:text-2xl bg-white text-red-600 font-bold border border-red-200 shadow-sm";
  const primaryBtn =
    "w-full bg-white text-red-600 p-3 rounded-lg text-2xl sm:text-3xl font-black shadow-md flex items-center justify-center active:bg-gray-200 transition-colors border border-red-200";
  const confirmBtn =
    "w-full bg-emerald-500 text-white p-3 rounded-lg text-2xl sm:text-3xl font-black shadow-md flex items-center justify-center active:bg-emerald-400 transition-colors disabled:opacity-50";
  const backBtn =
    "w-full bg-gray-100 text-gray-700 p-3 rounded-lg text-xl font-bold shadow-sm flex items-center justify-center active:bg-gray-200 transition-colors border border-gray-300";

  const wizTitle =
    wizEventType === "HOME_RUN"
      ? "🏠 Record Home Run"
      : wizEventType === "CAPTURE"
        ? "⚔️ Record Capture"
        : "";

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Toast */}
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

      {/* Header */}
      <div className="flex items-center bg-red-600 h-16 px-4">
        <ArrowLeft
          className="w-6 h-6 text-white cursor-pointer"
          onClick={() => navigate(-1)}
        />
        <h1 className="text-white font-semibold text-2xl ml-2">Match Center</h1>
      </div>

      {/* Tabs */}
      <div className="flex justify-between mt-4 px-4 gap-2">
        {["Scoring", "Events", "Info"].map((item) => (
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

      {/* ══ SCORING TAB ══════════════════════════════════════════ */}
      {activeTab === "Scoring" && (
        <PanelWrapper>
          <PanelHeading title="🎲 Ludo" />

          {isCompleted ? (
            /* ── Completed ── */
            <div className="flex flex-col items-center justify-center bg-gradient-to-b from-yellow-50 to-white border border-yellow-200 rounded-2xl p-6 shadow-md mb-4 gap-4">
              <Trophy className="text-yellow-500 w-16 h-16" />
              <h2 className="text-2xl font-black text-red-600">
                Match Completed!
              </h2>
              <div className="flex items-center gap-8 text-center">
                <div>
                  <p className="font-bold text-blue-600 mb-1">{team1Name}</p>
                  <p className="text-4xl font-black text-blue-600">
                    {score.team1HomeRuns}
                  </p>
                  <p className="text-xs text-gray-400">Home Runs</p>
                </div>
                <span className="text-3xl font-black text-gray-400">vs</span>
                <div>
                  <p className="font-bold text-rose-600 mb-1">{team2Name}</p>
                  <p className="text-4xl font-black text-rose-600">
                    {score.team2HomeRuns}
                  </p>
                  <p className="text-xs text-gray-400">Home Runs</p>
                </div>
              </div>
              <div className="bg-yellow-400 text-yellow-900 font-black text-xl px-6 py-3 rounded-full shadow-md">
                🏆{" "}
                {(score.team1HomeRuns || 0) >= (score.team2HomeRuns || 0)
                  ? team1Name
                  : team2Name}{" "}
                Wins!
              </div>
            </div>
          ) : (
            <>
              {/* Timer */}
              <div className="text-center mb-4">
                <p className="text-lg font-bold text-gray-500">
                  Match Time: {timer.mins}:{timer.secs}
                </p>
              </div>

              {/* Scoreboard */}
              <div className="flex w-full items-stretch justify-between mb-4 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="flex-1 bg-blue-50 p-4 flex flex-col items-center gap-2">
                  <p className="font-bold text-blue-600 truncate">
                    {team1Name}
                  </p>
                  <p className="text-4xl font-black text-blue-600">
                    {score.team1HomeRuns}
                  </p>
                  <p className="text-xs text-gray-500">🏠 Home Runs</p>
                  <p className="text-sm font-semibold text-blue-400">
                    ⚔️ {score.team1Captures} captures
                  </p>
                </div>
                <div className="flex items-center px-3 bg-white">
                  <span className="text-2xl font-black text-gray-400">VS</span>
                </div>
                <div className="flex-1 bg-rose-50 p-4 flex flex-col items-center gap-2">
                  <p className="font-bold text-rose-600 truncate">
                    {team2Name}
                  </p>
                  <p className="text-4xl font-black text-rose-600">
                    {score.team2HomeRuns}
                  </p>
                  <p className="text-xs text-gray-500">🏠 Home Runs</p>
                  <p className="text-sm font-semibold text-rose-400">
                    ⚔️ {score.team2Captures} captures
                  </p>
                </div>
              </div>

              {/* Recent events strip */}
              <div
                className="flex flex-row overflow-x-auto w-full border border-gray-200 rounded-xl p-2 bg-gray-50 shadow-inner space-x-2 mb-4"
                style={{ maxHeight: 120 }}
              >
                {score.ludoEvents
                  ?.slice(-8)
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
                        <span className="font-bold text-gray-700 text-xs text-center truncate w-full">
                          {ev.playerName || ev.teamName || cfg.label}
                        </span>
                      </div>
                    );
                  })}
                {(!score.ludoEvents || score.ludoEvents.length === 0) && (
                  <div className="text-center text-gray-400 py-4 text-sm w-full">
                    No events yet
                  </div>
                )}
              </div>

              {/* ── ACTION PANEL ── */}
              {!activeModal && isAdmin.current && (
                <div
                  className={`bg-red-600 p-3 rounded-xl shadow-md flex flex-col gap-3 ${waiting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <button
                    className={primaryBtn}
                    onClick={() => openWizard("HOME_RUN")}
                  >
                    🏠 Record Home Run
                  </button>
                  <button
                    className={primaryBtn}
                    onClick={() => openWizard("CAPTURE")}
                  >
                    ⚔️ Record Capture
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                      onClick={() => setActiveModal("win")}
                    >
                      🏆 Declare Winner
                    </button>
                    <button
                      className="bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                      onClick={() => send({ eventType: "END_MATCH" })}
                    >
                      🏁 End Match
                    </button>
                  </div>
                  <button
                    className="w-full bg-white text-red-600 p-3 rounded-lg text-lg font-black shadow-md flex items-center justify-center active:bg-gray-200 border border-red-200"
                    onClick={() => send({ undo: true })}
                  >
                    <RotateCcw size={18} className="mr-2" /> UNDO LAST EVENT
                  </button>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────
                  HOME RUN / CAPTURE WIZARD
                  ✅ FIX: Inline JSX — no sub-component defined inside
                     parent, so no remount on re-render → dropdown stays open
                  ───────────────────────────────────────────────────── */}
              {activeModal === "wizard" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-red-600 bg-white px-2 py-1 rounded">
                      {wizTitle}
                    </h2>
                    <button
                      className="text-white text-sm border border-white/40 px-3 py-1 rounded-lg hover:bg-white/20"
                      onClick={closeModal}
                    >
                      ✕ Close
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Step 1 — Select Team */}
                    {wizStep === 1 && (
                      <>
                        <p className="text-white text-sm font-semibold text-center mb-1">
                          Select team
                        </p>
                        {/* ✅ Two explicit buttons instead of <select>
                            to avoid any auto-close issues on mobile */}
                        <button
                          className={`w-full p-3 rounded-lg text-xl font-black border-2 transition-colors ${
                            selTeam === team1Id
                              ? "bg-blue-600 border-blue-400 text-white"
                              : "bg-white text-red-600 border-red-200"
                          }`}
                          onClick={() => setSelTeam(team1Id)}
                        >
                          🔵 {team1Name}
                        </button>
                        <button
                          className={`w-full p-3 rounded-lg text-xl font-black border-2 transition-colors ${
                            selTeam === team2Id
                              ? "bg-rose-600 border-rose-400 text-white"
                              : "bg-white text-red-600 border-red-200"
                          }`}
                          onClick={() => setSelTeam(team2Id)}
                        >
                          🔴 {team2Name}
                        </button>

                        <button
                          disabled={!selTeam}
                          className={confirmBtn}
                          onClick={() => setWizStep(2)}
                        >
                          NEXT → Select Player
                        </button>
                      </>
                    )}

                    {/* Step 2 — Select Player */}
                    {wizStep === 2 && (
                      <>
                        <p className="text-white text-sm font-semibold text-center mb-1">
                          {selTeam === team1Id ? team1Name : team2Name} — select
                          player
                        </p>

                        {/* ✅ Player list as buttons — no <select> dropdown */}
                        <div className="max-h-48 overflow-y-auto flex flex-col gap-2 rounded-lg">
                          {activePlayers().map((p) => {
                            const pid = p.id ?? p.playerId;
                            const pname = p.name ?? p.playerName;
                            return (
                              <button
                                key={pid}
                                className={`w-full p-2.5 rounded-lg text-base font-bold border-2 transition-colors ${
                                  selPlayer === pid
                                    ? "bg-emerald-600 border-emerald-400 text-white"
                                    : "bg-white text-gray-800 border-gray-200 hover:border-emerald-300"
                                }`}
                                onClick={() => setSelPlayer(pid)}
                              >
                                {pname}
                              </button>
                            );
                          })}
                        </div>

                        <button
                          className={confirmBtn}
                          onClick={() => submitEvent(false)}
                          disabled={!selPlayer}
                        >
                          CONFIRM {selPlayer ? "WITH PLAYER" : ""}
                        </button>
                        <button
                          className="w-full bg-white/80 text-gray-700 p-3 rounded-lg text-base font-bold shadow-sm active:bg-gray-200 border border-gray-300"
                          onClick={() => submitEvent(true)}
                        >
                          Skip Player & Confirm
                        </button>
                        <button
                          className={backBtn}
                          onClick={() => setWizStep(1)}
                        >
                          ← Back
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ── WIN WIZARD ── */}
              {activeModal === "win" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">
                      🏆 Declare Winner
                    </h2>
                    <button
                      className="text-white text-sm border border-white/40 px-3 py-1 rounded-lg hover:bg-white/20"
                      onClick={closeModal}
                    >
                      ✕ Close
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    <p className="text-white text-sm text-center font-semibold mb-2">
                      Which team won?
                    </p>
                    <button
                      className={confirmBtn}
                      onClick={() => {
                        send({ eventType: "WIN", teamId: team1Id });
                        closeModal();
                      }}
                    >
                      🔵 {team1Name}
                    </button>
                    <button
                      className={confirmBtn}
                      onClick={() => {
                        send({ eventType: "WIN", teamId: team2Id });
                        closeModal();
                      }}
                    >
                      🔴 {team2Name}
                    </button>
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

      {/* ══ EVENTS TAB ════════════════════════════════════════════ */}
      {activeTab === "Events" && (
        <PanelWrapper>
          <PanelHeading title="Event Timeline" />
          <div className="space-y-2">
            {score.ludoEvents
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
                        {ev.playerName ? `${ev.playerName} ` : ""}
                        {ev.teamName ? `(${ev.teamName})` : ""}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-700">{mins}'</p>
                  </div>
                );
              })}
            {(!score.ludoEvents || score.ludoEvents.length === 0) && (
              <div className="text-center text-gray-400 py-8 font-semibold">
                No events yet
              </div>
            )}
          </div>
        </PanelWrapper>
      )}

      {/* ══ INFO TAB ══════════════════════════════════════════════ */}
      {activeTab === "Info" && (
        <PanelWrapper>
          <PanelHeading title="Match Info" />
          <table className="w-full border border-gray-300 rounded-xl overflow-hidden shadow-sm">
            <tbody>
              {[
                { label: "Match ID", value: matchId },
                { label: "Status", value: score.status },
                { label: "Timer", value: `${timer.mins}:${timer.secs}` },
                { label: `${team1Name} Home Runs`, value: score.team1HomeRuns },
                { label: `${team2Name} Home Runs`, value: score.team2HomeRuns },
                { label: `${team1Name} Captures`, value: score.team1Captures },
                { label: `${team2Name} Captures`, value: score.team2Captures },
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
    </div>
  );
}
