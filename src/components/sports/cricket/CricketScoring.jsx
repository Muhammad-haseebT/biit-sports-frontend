import { useEffect, useState, useRef } from "react";
import Cookies from "js-cookie";
import { ArrowLeft, Dot, Camera, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BiCricketBall } from "react-icons/bi";
import { handleRuns, handleUndo } from "./scoring";
import { getPlayersByTeamId } from "../../../api/teamApi";
import Extras from "./modals/Extras";
import Out from "./modals/Out";

export default function CricketScoring({
  matchId,
  status,
  team1Id,
  team2Id,
  battingTeamId,
  team1Name,
  team2Name,
  battingTeamName,
  inningsId,
}) {
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const nav = ["Scoring", "Scoreboard", "Balls", "Info"];
  const [activeTab, setActiveTab] = useState("Scoring");

  const [user, setUser] = useState("");
  const [strikerId, setStrikerId] = useState(null);
  const [nonStrikerId, setNonStrikerId] = useState(null);
  const [bowlerId, setBowlerId] = useState(null);
  const [fielderId, setFielderId] = useState(null);
  const [outPlayerId, setOutPlayerId] = useState(null);
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);

  // ✅ Fixed row positions - NEVER change after match start
  const player1IdRef = useRef(null); // Row 1 player
  const player2IdRef = useRef(null); // Row 2 player
  const socketRef = useRef(null);

  //modals view ki logic hai
  const [mainModal, setMainModal] = useState(false);
  const [playerSelectModal, setPlayerSelectModal] = useState(false);
  const [bowlerModal, setBowlerModal] = useState(false);
  const [batsmanModal, setBatsmanModal] = useState(false);

  const [data, setData] = useState({
    runs: 0,
    overs: 0,
    wickets: 0,
    balls: 0,
    status: "LIVE",
    target: 0,
    extras: 0,
    teamId: 1,
    matchId: 1,
    inningsId: inningsId,
    batsmanId: null,
    nonStrikerId: null,
    bowlerId: null,
    fielderId: null,
    outPlayerId: null,
    runsOnThisBall: 0,
    extrasThisBall: 0,
    extra: 0,
    extraType: null,
    event: null,
    eventType: null,
    dismissalType: null,
    isLegal: null,
    undo: false,
    four: false,
    six: false,
    firstInnings: true,
    crr: 0.0,
    rrr: 0.0,
    comment: null,
    mediaId: null,
    batsman1Stats: null,
    batsman2Stats: null,
    bowlerStats: null,
  });

  const [extraModal, setExtraModal] = useState(false);
  const [outModal, setOutModal] = useState(false);

  useEffect(() => {
    try {
      const account = Cookies.get("account");
      if (account) {
        const parsedUser = JSON.parse(account);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error parsing user cookie:", error);
    }
  }, []);

  const fetchTeamPlayers = async () => {
    const team1Players = await getPlayersByTeamId(battingTeamId);
    if (team1Id == battingTeamId) {
      const team2Players = await getPlayersByTeamId(team2Id);
      setTeam1Players(team1Players);
      setTeam2Players(team2Players);
    } else {
      const team2Players = await getPlayersByTeamId(team1Id);
      setTeam1Players(team1Players);
      setTeam2Players(team2Players);
    }
  };

  // ✅ Normalize: rows fixed, sirf batsmanId (star) change hota hai
  const normalizeStats = (receivedData) => {
    const stats1 = receivedData.batsman1Stats;
    const stats2 = receivedData.batsman2Stats;

    // Pehli baar - positions lock karo
    if (!player1IdRef.current && stats1?.playerId) {
      player1IdRef.current = stats1.playerId;
      player2IdRef.current = stats2?.playerId;
      return receivedData;
    }

    // Agar backend ne swap kar diya toh wapas fix karo
    if (
      stats1?.playerId != null &&
      stats2?.playerId != null &&
      stats1.playerId == player2IdRef.current &&
      stats2.playerId == player1IdRef.current
    ) {
      return {
        ...receivedData,
        batsman1Stats: stats2, // Player1 wapas row 1
        batsman2Stats: stats1, // Player2 wapas row 2
      };
    }

    return receivedData;
  };

  // WebSocket setup
  useEffect(() => {
    fetchTeamPlayers();

    if (status === "LIVE") {
      const socketUrl = import.meta.env.VITE_SOCKET_URL + "?matchId=" + matchId;
      const ws = new WebSocket(socketUrl);

      ws.onopen = () => {
        console.log("Connected to WebSocket server");
        socketRef.current = ws;
      };

      ws.onmessage = (event) => {
        const receivedData = JSON.parse(event.data);
        console.log("Received data:", receivedData);

        // ✅ Normalize BEFORE setting data
        const normalized = normalizeStats(receivedData);
        setData(normalized);
        handleModalLogic(normalized);
      };

      ws.onclose = () => {
        console.log("Disconnected from WebSocket server");
        socketRef.current = null;
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    }
  }, []);

  const handleModalLogic = (receivedData) => {
    if (
      receivedData.balls === 0 &&
      receivedData.overs === 0 &&
      receivedData.wickets === 0 &&
      receivedData.runs === 0
    ) {
      setMainModal(false);
      setPlayerSelectModal(true);
      setBowlerModal(false);
      setBatsmanModal(false);
    } else {
      setMainModal(true);
      setPlayerSelectModal(false);
      setBowlerModal(false);
      setBatsmanModal(false);
    }
    if (receivedData.matchStatus == "END_FIRST") {
      setBattingTeamId(battingTeamId == team1Id ? team2Id : team1Id);
      setMainModal(false);
      setPlayerSelectModal(true);
    }
    if (receivedData.balls == 0 && receivedData.overs != 0) {
      setMainModal(false);
      setPlayerSelectModal(false);
      setBowlerModal(true);
    }
    if (receivedData.firstInnings) {
      if (battingTeamId == team1Id) {
        setBattingTeamId(team2Id);
      } else {
        setBattingTeamId(team1Id);
      }
    }
  };

  const handleStartMatch = () => {
    if (!strikerId || !nonStrikerId || !bowlerId) {
      alert("Please select all players!");
      return;
    }

    const player1 = team1Players.find((p) => p.id == strikerId);
    const player2 = team1Players.find((p) => p.id == nonStrikerId);
    const bowlerPlayer = team2Players.find((p) => p.id == bowlerId);

    // ✅ Lock row positions ONCE
    player1IdRef.current = Number(strikerId);
    player2IdRef.current = Number(nonStrikerId);

    setData((prev) => ({
      ...prev,
      batsmanId: Number(strikerId),
      nonStrikerId: Number(nonStrikerId),
      bowlerId: Number(bowlerId),
      batsman1Stats: {
        playerId: Number(strikerId),
        playerName: player1?.name || "Batsman 1",
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
      },
      batsman2Stats: {
        playerId: Number(nonStrikerId),
        playerName: player2?.name || "Batsman 2",
        runs: 0,
        ballsFaced: 0,
        fours: 0,
        sixes: 0,
      },
      bowlerStats: {
        playerId: Number(bowlerId),
        playerName: bowlerPlayer?.name || "Bowler",
        wickets: 0,
        runs: 0,
        ballsBowled: 0,
      },
    }));

    setPlayerSelectModal(false);
    setMainModal(true);
  };

  useEffect(() => {
    if (data.batsmanId) setStrikerId(data.batsmanId);
    if (data.nonStrikerId) setNonStrikerId(data.nonStrikerId);
    if (data.bowlerId) setBowlerId(data.bowlerId);
  }, [data.batsmanId, data.nonStrikerId, data.bowlerId]);

  const handleExtraModal = (extraType) => {
    setExtraModal(true);
    setMainModal(false);
    setData((prev) => ({
      ...prev,
      extraType: extraType,
    }));
  };

  const handleOutModal = () => {
    setOutModal(true);
    setMainModal(false);
  };

  return (
    <>
      <div className="flex items-center bg-red-600 h-16 ">
        <ArrowLeft
          className="w-6 h-6 text-white"
          size={24}
          onClick={() => navigate(-1)}
        />
        <h1 className="text-white font-semibold text-2xl ml-2">Match Center</h1>
      </div>

      <div className="flex justify-between mt-4">
        {status != "LIVE"
          ? nav
              .filter((item) => item !== "Scoring")
              .map((item) => (
                <button
                  key={item}
                  className="mx-2 bg-red-600 p-1 rounded-lg text-white w-32 font-semibold text-xl"
                  onClick={() => setActiveTab(item)}
                >
                  {item}
                </button>
              ))
          : nav.map((item) => (
              <button
                key={item}
                className="mx-2 bg-red-600 p-1 rounded-lg text-white w-32 font-semibold text-xl"
                onClick={() => setActiveTab(item)}
              >
                {item}
              </button>
            ))}
      </div>

      <hr className="my-4" />

      <div>
        {activeTab == "Scoring" && (
          <div>
            <h1 className="text-3xl font-semibold text-red-600">
              {battingTeamName}
            </h1>
            <h2 className="text-xl font-semibold mt-2">
              {data.firstInnings ? "First Innings" : "Second Innings"}
            </h2>
            <h3 className="text-3xl font-semibold mt-2">
              {data.runs}/{data.wickets}
            </h3>
            <hr />
            <span className="flex justify-around mt-2 mb-2">
              <h3 className="text-xl font-semibold">
                Extras {data.extra || 0}
              </h3>
              <h3 className="text-xl font-semibold">
                Overs {data.overs}.{data.balls}
              </h3>
              <h3 className="text-xl font-semibold">
                CRR {data.crr != "NaN" ? data.crr : "0"}
              </h3>
            </span>
            <hr />

            <div className="mt-2 mb-2">
              <h1 className="text-2xl font-semibold text-red-600 mt-2 mb-2">
                Batting
              </h1>
              <table className="w-full border border-gray-500">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>R</th>
                    <th>B</th>
                    <th>4s</th>
                    <th>6s</th>
                    <th>SR</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1 - FIXED position */}
                  <tr>
                    <td>
                      {data.batsman1Stats?.playerId == data.batsmanId && (
                        <Star
                          size={16}
                          className="inline text-yellow-500 mr-1"
                        />
                      )}
                      {data.batsman1Stats?.playerName || "Batsman 1"}
                    </td>
                    <td>{data.batsman1Stats?.runs || 0}</td>
                    <td>{data.batsman1Stats?.ballsFaced || 0}</td>
                    <td>{data.batsman1Stats?.fours || 0}</td>
                    <td>{data.batsman1Stats?.sixes || 0}</td>
                    <td>
                      {data.batsman1Stats?.ballsFaced > 0
                        ? (
                            (data.batsman1Stats.runs /
                              data.batsman1Stats.ballsFaced) *
                            100
                          ).toFixed(2)
                        : "0.00"}
                    </td>
                  </tr>

                  {/* Row 2 - FIXED position */}
                  <tr>
                    <td>
                      {data.batsman2Stats?.playerId == data.batsmanId && (
                        <Star
                          size={16}
                          className="inline text-yellow-500 mr-1"
                        />
                      )}
                      {data.batsman2Stats?.playerName || "Batsman 2"}
                    </td>
                    <td>{data.batsman2Stats?.runs || 0}</td>
                    <td>{data.batsman2Stats?.ballsFaced || 0}</td>
                    <td>{data.batsman2Stats?.fours || 0}</td>
                    <td>{data.batsman2Stats?.sixes || 0}</td>
                    <td>
                      {data.batsman2Stats?.ballsFaced > 0
                        ? (
                            (data.batsman2Stats.runs /
                              data.batsman2Stats.ballsFaced) *
                            100
                          ).toFixed(2)
                        : "0.00"}
                    </td>
                  </tr>
                </tbody>
              </table>

              <h1 className="text-2xl font-semibold text-red-600 mt-2 mb-2">
                Bowling
              </h1>
              <table className="w-full border border-gray-500">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>O</th>
                    <th>W</th>
                    <th>EC</th>
                    <th>RC</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      {data.bowlerStats?.playerName ||
                        team2Players.find(
                          (player) => player.id == data.bowlerId,
                        )?.name}
                    </td>
                    <td>
                      {data.bowlerStats?.ballsBowled != null
                        ? `${Math.floor(data.bowlerStats.ballsBowled / 6)}.${data.bowlerStats.ballsBowled % 6}`
                        : "-"}
                    </td>
                    <td>{data.bowlerStats?.wickets || 0}</td>
                    <td>
                      {data.bowlerStats?.economy
                        ? data.bowlerStats.economy.toFixed(2)
                        : "0"}
                    </td>
                    <td>{data.bowlerStats?.runsConceded || "0"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab == "Scoring" && mainModal && user.role == "ADMIN" && (
          <div className="mt-5">
            <div className="bg-red-600 p-3 h-89.5">
              <div className="grid grid-cols-5 space-y-2 space-x-2 mt-5">
                {["1", "2", "3", "4", "6"].map((run) => (
                  <button
                    key={run}
                    className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20"
                    onClick={() => {
                      socketRef.current.send(
                        JSON.stringify(
                          handleRuns(
                            data,
                            run,
                            "run",
                            data.batsmanId,
                            data.bowlerId,
                          ),
                        ),
                      );
                    }}
                  >
                    {run}
                  </button>
                ))}

                <button
                  className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20"
                  onClick={() => handleExtraModal("legbye")}
                >
                  LB
                </button>
                <button
                  className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20"
                  onClick={() => handleExtraModal("bye")}
                >
                  BYE
                </button>
                <button
                  className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20"
                  onClick={() => handleExtraModal("wide")}
                >
                  Wide
                </button>
                <button
                  className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20"
                  onClick={() => handleExtraModal("noball")}
                >
                  NB
                </button>
                <button
                  className="bg-white flex items-center justify-center text-red-600 p-1 rounded-lg h-20"
                  onClick={() => {
                    socketRef.current.send(
                      JSON.stringify(
                        handleRuns(
                          data,
                          "0",
                          "run",
                          data.batsmanId,
                          data.bowlerId,
                        ),
                      ),
                    );
                  }}
                >
                  <Dot size={50} />
                </button>
                <button className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20">
                  MORE
                </button>
                <button className="bg-white text-red-600 p-1 rounded-lg text-2xl flex items-center justify-center h-20">
                  <BiCricketBall size={50} />
                </button>
                <button className="bg-white text-red-600 p-1 rounded-lg text-2xl flex items-center justify-center">
                  <Camera size={50} />
                </button>
                <button
                  className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20"
                  onClick={() => {
                    socketRef.current.send(JSON.stringify(handleUndo(data)));
                  }}
                >
                  UNDO
                </button>
                <button
                  className="bg-white text-red-600 p-1 rounded-lg text-2xl h-20"
                  onClick={() => {
                    handleOutModal();
                  }}
                >
                  Out
                </button>
              </div>
            </div>
          </div>
        )}

        {playerSelectModal && (
          <div className="mt-5">
            <div className="bg-red-600 p-3 h-89.5">
              <div className="flex flex-col space-y-2 space-x-2 mt-5">
                <select
                  onChange={(e) => setStrikerId(e.target.value)}
                  className="p-2 rounded-lg h-20 text-2xl bg-white text-red-600"
                >
                  <option>Select Batsman 1</option>
                  {team1Players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
                <select
                  onChange={(e) => setNonStrikerId(e.target.value)}
                  className="p-2 rounded-lg h-20 text-2xl bg-white text-red-600"
                >
                  <option>Select Batsman 2</option>
                  {team1Players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
                <select
                  onChange={(e) => setBowlerId(e.target.value)}
                  className="p-2 rounded-lg h-20 text-2xl bg-white text-red-600"
                >
                  <option>Select Bowler</option>
                  {team2Players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
                <button
                  className="bg-white text-red-600 p-1 rounded-lg text-2xl h-10"
                  onClick={handleStartMatch}
                >
                  Start Match
                </button>
              </div>
            </div>
          </div>
        )}

        {bowlerModal && (
          <div className="mt-5">
            <div className="bg-red-600 p-3 h-89.5">
              <div className="flex flex-col space-y-2 space-x-2 mt-5">
                <select
                  onChange={(e) => setBowlerId(e.target.value)}
                  className="p-2 rounded-lg h-20 text-2xl bg-white text-red-600"
                >
                  <option>Select Bowler</option>
                  {team2Players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.name}
                    </option>
                  ))}
                </select>
                <button
                  className="bg-white text-red-600 p-1 rounded-lg text-2xl h-10"
                  onClick={handleStartMatch}
                >
                  Start Match
                </button>
              </div>
            </div>
          </div>
        )}

        {extraModal && (
          <Extras
            mainModal={setMainModal}
            extraType={data.extraType}
            setExtraModal={setExtraModal}
            setData={setData}
            socket={socketRef.current}
          />
        )}

        {outModal && (
          <Out
            mainModal={setMainModal}
            outModal={setOutModal}
            setData={setData}
            socket={socketRef.current}
            strikerId={strikerId}
            nonStrikerId={nonStrikerId}
            team1Players={team1Players}
            team2Players={team2Players}
            battingTeamId={battingTeamId}
            team1Id={team1Id}
            team2Id={team2Id}
          />
        )}
      </div>
    </>
  );
}
