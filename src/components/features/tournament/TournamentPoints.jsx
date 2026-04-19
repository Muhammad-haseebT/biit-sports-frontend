import React, { useEffect, useState } from "react";
import axios from "axios";
import LoadingSpinner from "../../common/LoadingSpinner";

const url = import.meta.env.VITE_BASE_URL;

export default function TournamentPoints({ tournamentId, sport }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ds, setDs] = useState(sport || "cricket");

  useEffect(() => {
    if (!tournamentId) return;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${url}/tournament/${tournamentId}/points`);
        const list = Array.isArray(res.data) ? res.data : [];
        setPoints(list);
        if (sport) {
          setDs(sport.toLowerCase());
          return;
        }
        const hasGD = list[0]?.goalDifference !== undefined;
        const hasDraws = list.some((r) => (r.draws ?? 0) > 0);
        setDs(!hasGD ? "cricket" : hasDraws ? "futsal" : "volleyball");
      } catch (err) {
        console.error(err);
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

  const s = sport?.toLowerCase() || ds;
  console.log(s);
  if (s === "futsal") return <FutsalTable rows={points} />;
  if (s === "volleyball") return <VolleyballTable rows={points} />;
  if (s === "badminton")
    return <SimpleTable rows={points} color="violet" title="Badminton" />;
  if (s === "table tennis" || s === "tabletennis")
    return <SimpleTable rows={points} color="blue" title="Table Tennis" />;
  if (s === "tug of war" || s === "tugofwar")
    return <SimpleTable rows={points} color="amber" title="Tug of War" />;
  return <CricketTable rows={points} />;
}

function CricketTable({ rows }) {
  return (
    <Wrapper>
      <thead>
        <tr className="bg-red-600 text-white">
          <Th first>Team</Th>
          <Th c>P</Th>
          <Th c>W</Th>
          <Th c>L</Th>
          <Th c>Pts</Th>
          <Th c last>
            NRR
          </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((t, i) => (
          <tr key={t.teamId || i} className="hover:bg-red-50 even:bg-gray-50">
            <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
              <Rank r={i + 1} />
              {t.teamName}
            </td>
            <td className="p-4 text-center">{t.played}</td>
            <td className="p-4 text-center text-green-600 font-semibold">
              {t.wins}
            </td>
            <td className="p-4 text-center text-red-500 font-semibold">
              {t.losses}
            </td>
            <td className="p-4 text-center font-bold text-lg">{t.points}</td>
            <td className="p-4 text-center">
              <Nrr v={t.nrr} />
            </td>
          </tr>
        ))}
      </tbody>
    </Wrapper>
  );
}

function FutsalTable({ rows }) {
  return (
    <Wrapper mw={560} legend="P W D L GF GA GD Pts">
      <thead>
        <tr className="bg-emerald-600 text-white">
          <Th first>Team</Th>
          <Th c>P</Th>
          <Th c>W</Th>
          <Th c>D</Th>
          <Th c>L</Th>
          <Th c>GF</Th>
          <Th c>GA</Th>
          <Th c>GD</Th>
          <Th c last>
            Pts
          </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((t, i) => {
          const gd =
            t.goalDifference ?? (t.goalsFor ?? 0) - (t.goalsAgainst ?? 0);
          return (
            <tr
              key={t.teamId || i}
              className="hover:bg-emerald-50 even:bg-gray-50"
            >
              <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                <Rank r={i + 1} />
                {t.teamName}
              </td>
              <td className="p-4 text-center">{t.played}</td>
              <td className="p-4 text-center text-green-600 font-semibold">
                {t.wins}
              </td>
              <td className="p-4 text-center text-amber-500 font-semibold">
                {t.draws ?? 0}
              </td>
              <td className="p-4 text-center text-red-500 font-semibold">
                {t.losses}
              </td>
              <td className="p-4 text-center">{t.goalsFor ?? 0}</td>
              <td className="p-4 text-center">{t.goalsAgainst ?? 0}</td>
              <td className="p-4 text-center font-mono font-semibold">
                <Gd v={gd} />
              </td>
              <td className="p-4 text-center font-bold text-lg">{t.points}</td>
            </tr>
          );
        })}
      </tbody>
    </Wrapper>
  );
}

function VolleyballTable({ rows }) {
  return (
    <Wrapper
      mw={520}
      legend="SW=Sets Won SL=Sets Lost — 3-0/3-1: 3pts | 3-2: 3pts (loser 1pt)"
    >
      <thead>
        <tr className="bg-blue-600 text-white">
          <Th first>Team</Th>
          <Th c>P</Th>
          <Th c>W</Th>
          <Th c>L</Th>
          <Th c>SW</Th>
          <Th c>SL</Th>
          <Th c>SD</Th>
          <Th c last>
            Pts
          </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((t, i) => {
          const sw = t.goalsFor ?? 0,
            sl = t.goalsAgainst ?? 0;
          return (
            <tr
              key={t.teamId || i}
              className="hover:bg-blue-50 even:bg-gray-50"
            >
              <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
                <Rank r={i + 1} />
                {t.teamName}
              </td>
              <td className="p-4 text-center">{t.played}</td>
              <td className="p-4 text-center text-green-600 font-semibold">
                {t.wins}
              </td>
              <td className="p-4 text-center text-red-500 font-semibold">
                {t.losses}
              </td>
              <td className="p-4 text-center text-blue-600">{sw}</td>
              <td className="p-4 text-center">{sl}</td>
              <td className="p-4 text-center font-mono font-semibold">
                <Gd v={sw - sl} />
              </td>
              <td className="p-4 text-center font-bold text-lg">{t.points}</td>
            </tr>
          );
        })}
      </tbody>
    </Wrapper>
  );
}

// Badminton / Table Tennis / Tug of War — simple P W L Pts
function SimpleTable({ rows, color, title }) {
  const bgs = {
    violet: "bg-violet-600",
    blue: "bg-blue-600",
    amber: "bg-amber-600",
  };
  const hovers = {
    violet: "hover:bg-violet-50",
    blue: "hover:bg-blue-50",
    amber: "hover:bg-amber-50",
  };
  const legend = {
    violet: "Win = 2pts",
    blue: "Win = 2pts",
    amber: "Win = 2pts · Best of rounds",
  };
  return (
    <Wrapper legend={legend[color]}>
      <thead>
        <tr className={`${bgs[color] || "bg-gray-700"} text-white`}>
          <Th first>Team</Th>
          <Th c>P</Th>
          <Th c>W</Th>
          <Th c>L</Th>
          <Th c last>
            Pts
          </Th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((t, i) => (
          <tr
            key={t.teamId || i}
            className={`${hovers[color] || ""} even:bg-gray-50 transition-colors`}
          >
            <td className="p-4 font-medium text-gray-900 flex items-center gap-2">
              <Rank r={i + 1} />
              {t.teamName}
            </td>
            <td className="p-4 text-center">{t.played}</td>
            <td className="p-4 text-center text-green-600 font-semibold">
              {t.wins}
            </td>
            <td className="p-4 text-center text-red-500 font-semibold">
              {t.losses}
            </td>
            <td className="p-4 text-center font-bold text-lg">{t.points}</td>
          </tr>
        ))}
      </tbody>
    </Wrapper>
  );
}

function Wrapper({ children, mw = 420, legend }) {
  return (
    <div className="overflow-hidden bg-white rounded-xl shadow border border-gray-100">
      <div className="overflow-x-auto">
        <table
          className="w-full text-left border-collapse"
          style={{ minWidth: mw }}
        >
          {children}
        </table>
      </div>
      {legend && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
          {legend}
        </div>
      )}
    </div>
  );
}
function Th({ children, c, first, last }) {
  return (
    <th
      className={`p-4 font-semibold text-sm uppercase tracking-wide ${c ? "text-center" : ""} ${first ? "rounded-tl-xl" : ""} ${last ? "rounded-tr-xl" : ""}`}
    >
      {children}
    </th>
  );
}
function Rank({ r }) {
  const bg =
    r === 1
      ? "bg-yellow-400"
      : r === 2
        ? "bg-gray-300"
        : r === 3
          ? "bg-orange-400"
          : "bg-gray-200";
  return (
    <span
      className={`inline-flex w-5 h-5 rounded-full items-center justify-center text-[10px] font-black text-white flex-shrink-0 ${bg}`}
    >
      {r}
    </span>
  );
}
function Nrr({ v }) {
  const n = Number(v) || 0,
    c = n > 0 ? "text-green-600" : n < 0 ? "text-red-500" : "text-gray-500";
  return (
    <span className={`font-mono font-semibold ${c}`}>
      {n > 0 ? "+" : ""}
      {n.toFixed(3)}
    </span>
  );
}
function Gd({ v }) {
  const c = v > 0 ? "text-green-600" : v < 0 ? "text-red-500" : "text-gray-500";
  return (
    <span className={c}>
      {v > 0 ? "+" : ""}
      {v}
    </span>
  );
}
