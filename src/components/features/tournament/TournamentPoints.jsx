import React, { useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "../../common/LoadingSpinner";

const url = import.meta.env.VITE_BASE_URL;

async function getTournamentPoints(tournamentId) {
  const res = await axios.get(`${url}/tournament/${tournamentId}/points`);
  return res.data;
}

export default function TournamentPoints({ tournamentId, sport = "cricket" }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detectedSport, setDetectedSport] = useState(sport);
  console.log(detectedSport);

  useEffect(() => {
    if (!tournamentId) return;
    (async () => {
      try {
        setLoading(true);
        const data = await getTournamentPoints(tournamentId);
        const list = Array.isArray(data) ? data : [];
        setPoints(list);
        // Detect sport from first row if goalDifference exists
        console.log(list[0]);
        if (list[0]?.sport == "futsal") setDetectedSport("futsal");
        else setDetectedSport("cricket");
      } catch (err) {
        console.error("Error fetching points table:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [tournamentId]);

  if (loading) return <LoadingSpinner />;

  if (!points.length)
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-lg font-medium">No points data available</p>
      </div>
    );

  return detectedSport.toLowerCase() === "futsal" ? (
    <FutsalTable rows={points} />
  ) : (
    <CricketTable rows={points} />
  );
}

// ─── CRICKET TABLE ────────────────────────────────────────────────
// Columns: Team | P | W | L | Pts | NRR
function CricketTable({ rows }) {
  return (
    <div className="overflow-hidden bg-white rounded-xl shadow border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-red-600 text-white">
              <Th first>Team</Th>
              <Th center>P</Th>
              <Th center>W</Th>
              <Th center>L</Th>
              <Th center>Pts</Th>
              <Th center last>
                NRR
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((team, i) => (
              <tr
                key={team.teamId || i}
                className="hover:bg-red-50 transition-colors duration-150 even:bg-gray-50"
              >
                <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                  <RankDot rank={i + 1} />
                  {team.teamName}
                </td>
                <td className="p-4 text-center text-gray-600 font-medium">
                  {team.played}
                </td>
                <td className="p-4 text-center text-green-600 font-semibold">
                  {team.wins}
                </td>
                <td className="p-4 text-center text-red-500 font-semibold">
                  {team.losses}
                </td>
                <td className="p-4 text-center text-gray-900 font-bold text-lg">
                  {team.points}
                </td>
                <td className="p-4 text-center font-mono text-sm">
                  <NrrBadge nrr={team.nrr} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── FUTSAL TABLE ─────────────────────────────────────────────────
// Columns: Team | P | W | D | L | GF | GA | GD | Pts
function FutsalTable({ rows }) {
  return (
    <div className="overflow-hidden bg-white rounded-xl shadow border border-gray-100">
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse"
          style={{ minWidth: 560 }}
        >
          <thead>
            <tr className="bg-emerald-600 text-white">
              <Th first>Team</Th>
              <Th center>P</Th>
              <Th center>W</Th>
              <Th center>D</Th>
              <Th center>L</Th>
              <Th center>GF</Th>
              <Th center>GA</Th>
              <Th center>GD</Th>
              <Th center last>
                Pts
              </Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((team, i) => {
              const gd =
                (team.goalDifference ?? team.goalsFor - team.goalsAgainst) || 0;
              return (
                <tr
                  key={team.teamId || i}
                  className="hover:bg-emerald-50 transition-colors duration-150 even:bg-gray-50"
                >
                  <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                    <RankDot rank={i + 1} />
                    {team.teamName}
                  </td>
                  <td className="p-4 text-center text-gray-600 font-medium">
                    {team.played}
                  </td>
                  <td className="p-4 text-center text-green-600 font-semibold">
                    {team.wins}
                  </td>
                  <td className="p-4 text-center text-amber-500 font-semibold">
                    {team.draws ?? 0}
                  </td>
                  <td className="p-4 text-center text-red-500 font-semibold">
                    {team.losses}
                  </td>
                  <td className="p-4 text-center text-gray-600">
                    {team.goalsFor ?? 0}
                  </td>
                  <td className="p-4 text-center text-gray-600">
                    {team.goalsAgainst ?? 0}
                  </td>
                  <td className="p-4 text-center font-mono font-semibold">
                    <GdBadge gd={gd} />
                  </td>
                  <td className="p-4 text-center text-gray-900 font-bold text-lg">
                    {team.points}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Legend */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex gap-4 flex-wrap">
        <span>P=Played</span>
        <span>W=Win</span>
        <span>D=Draw</span>
        <span>L=Loss</span>
        <span>GF=Goals For</span>
        <span>GA=Goals Against</span>
        <span>GD=Goal Diff</span>
        <span>Pts=Points</span>
      </div>
    </div>
  );
}

// ─── SHARED SUB COMPONENTS ────────────────────────────────────────

function Th({ children, center, first, last }) {
  return (
    <th
      className={`p-4 font-semibold text-sm uppercase tracking-wide ${center ? "text-center" : ""} ${first ? "rounded-tl-xl" : ""} ${last ? "rounded-tr-xl" : ""}`}
    >
      {children}
    </th>
  );
}

function RankDot({ rank }) {
  const colors = ["bg-yellow-400", "bg-gray-300", "bg-orange-400"];
  const bg = colors[rank - 1] ?? "bg-gray-200";
  return (
    <span
      className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] font-black text-white flex-shrink-0 ${bg}`}
    >
      {rank}
    </span>
  );
}

function NrrBadge({ nrr }) {
  const val = Number(nrr) || 0;
  const color =
    val > 0 ? "text-green-600" : val < 0 ? "text-red-500" : "text-gray-500";
  return (
    <span className={`font-mono font-semibold ${color}`}>
      {val > 0 ? "+" : ""}
      {val.toFixed(3)}
    </span>
  );
}

function GdBadge({ gd }) {
  const color =
    gd > 0 ? "text-green-600" : gd < 0 ? "text-red-500" : "text-gray-500";
  return (
    <span className={color}>
      {gd > 0 ? "+" : ""}
      {gd}
    </span>
  );
}
