import React, { useEffect, useState } from "react";
import { getTournamentPointsApi } from "../../../api/tournamentAPi";
import LoadingSpinner from "../../common/LoadingSpinner";

export default function TournamentPoints({ tournamentId }) {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        setLoading(true);
        const response = await getTournamentPointsApi(tournamentId);
        setPoints(response.data || []);
      } catch (error) {
        console.error("Error fetching points table:", error);
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      fetchPoints();
    }
  }, [tournamentId]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!points || points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
        <p className="text-lg font-medium">No points data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white rounded-xl shadow border border-gray-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-red-600 text-white">
              <th className="p-4 font-semibold text-sm uppercase tracking-wide rounded-tl-xl">
                Team
              </th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wide text-center">
                P
              </th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wide text-center">
                W
              </th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wide text-center">
                L
              </th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wide text-center">
                Pts
              </th>
              <th className="p-4 font-semibold text-sm uppercase tracking-wide text-center rounded-tr-xl">
                NRR
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {points.map((team, index) => (
              <tr
                key={team.teamId || index}
                className="hover:bg-red-50 transition-colors duration-150 even:bg-gray-50"
              >
                <td className="p-4 font-medium text-gray-900">
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
                <td className="p-4 text-center text-gray-900 font-bold">
                  {team.points}
                </td>
                <td className="p-4 text-center text-gray-600 font-mono text-sm">
                  {team.nrr}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
