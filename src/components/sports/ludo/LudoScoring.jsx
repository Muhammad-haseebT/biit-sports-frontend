import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { getPlayersByTeamId } from "../../../api/teamApi";
// import FavouritePlayerModal from "../football/modals/FavouritePlayerModal";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";

const EV = {
  HOME_RUN: { icon: "🏠", label: "Home Run" },
  CAPTURE: { icon: "⚔️", label: "Capture" },
  WIN: { icon: "🏆", label: "Win" },
  END_MATCH: { icon: "🏁", label: "Match End" },
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
  const [activeModal, setActiveModal] = useState(null); // "homeRun" | "capture" | "win" | null
  const [wizStep, setWizStep] = useState(1);
  const [selTeam, setSelTeam] = useState(null);
  const [selPlayer, setSelPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState("Scoring");
  const [toast, setToast] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [showFav, setShowFav] = useState(false);

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

  const closeModal = () => {
    setActiveModal(null);
    setWizStep(1);
    setSelTeam(null);
    setSelPlayer(null);
  };

  const submitEvent = (type, skipPlayer = false) => {
    if (!selTeam) return;
    const p = { eventType: type, teamId: selTeam };
    if (selPlayer && !skipPlayer) p.playerId = selPlayer;
    send(p);
    closeModal();
  };

  const activePlayers = () => (selTeam === team1Id ? team1P : team2P);
  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isCompleted = score.status === "COMPLETED";

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

  // Wizard: team select → player select
  const TeamPlayerWizard = ({ title, eventType }) => (
    <div className="bg-red-600 p-3 rounded-xl shadow-md">
      <WizardHeader title={title} />
      <div className="flex flex-col gap-3">
        {wizStep === 1 && (
          <select
            className={selectCls}
            onChange={(e) => {
              setSelTeam(Number(e.target.value));
              setWizStep(2);
            }}
          >
            <option value="">Select Team</option>
            <option value={team1Id}>{team1Name}</option>
            <option value={team2Id}>{team2Name}</option>
          </select>
        )}
        {wizStep === 2 && (
          <>
            <select
              className={selectCls}
              onChange={(e) => setSelPlayer(Number(e.target.value))}
            >
              <option value="">Select Player (Optional)</option>
              {activePlayers().map((p) => (
                <option key={p.id ?? p.playerId} value={p.id ?? p.playerId}>
                  {p.name ?? p.playerName}
                </option>
              ))}
            </select>
            <button
              className={confirmBtn}
              onClick={() => submitEvent(eventType, false)}
            >
              CONFIRM
            </button>
            <button
              className="w-full bg-gray-100 text-gray-600 p-3 rounded-lg text-base font-bold shadow-sm active:bg-gray-200 border border-gray-300"
              onClick={() => submitEvent(eventType, true)}
            >
              Skip Player
            </button>
            <button className={backBtn} onClick={() => setWizStep(1)}>
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );

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
          <PanelHeading title="🎲 Ludo" />

          {isCompleted ? (
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

              {/* Recent events */}
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

              {/* Action panel */}
              {!activeModal && isAdmin.current && (
                <div
                  className={`bg-red-600 p-3 rounded-xl shadow-md flex flex-col gap-3 ${waiting ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <button
                    className={primaryBtn}
                    onClick={() => {
                      setActiveModal("homeRun");
                      setWizStep(1);
                    }}
                  >
                    🏠 Record Home Run
                  </button>
                  <button
                    className={primaryBtn}
                    onClick={() => {
                      setActiveModal("capture");
                      setWizStep(1);
                    }}
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

              {activeModal === "homeRun" && isAdmin.current && (
                <TeamPlayerWizard
                  title="🏠 Record Home Run"
                  eventType="HOME_RUN"
                />
              )}
              {activeModal === "capture" && isAdmin.current && (
                <TeamPlayerWizard
                  title="⚔️ Record Capture"
                  eventType="CAPTURE"
                />
              )}

              {/* Win wizard */}
              {activeModal === "win" && isAdmin.current && (
                <div className="bg-red-600 p-3 rounded-xl shadow-md">
                  <WizardHeader title="🏆 Declare Winner" />
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
      {/* 
      {showFav && (
        <FavouritePlayerModal matchId={matchId} team1Id={team1Id} team2Id={team2Id}
          team1Name={team1Name} team2Name={team2Name}
          team1Players={team1P} team2Players={team2P}
          onClose={() => setShowFav(false)} />
      )} */}
    </div>
  );
}
