import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import Cookies from "js-cookie";
import {
    getTeamsByTournamentId,
    getMyTeamByTournamentIdAndPlayerId,
} from "../api/teamApi";
import { createTeam } from "../api/teamApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Loading from "../components/LoadingSpinner";

export const PlayerRow = ({ player }) => (
    <div className="bg-gray-100 rounded-xl p-3 flex items-center justify-between border border-red-600">
        <div className="font-medium">{player.name}</div>
        <div className="text-sm text-gray-700">{player.status}</div>
    </div>
);

export default function TournamentTeams({ tournamentId, onCreateTeam }) {
    const [tab, setTab] = useState("teams"); // 'teams' | 'myTeam'
    const [loading, setLoading] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const [teams, setTeams] = useState([]);
    const [form, setForm] = useState({
        name: "",
    });

    // myTeam response: { teamName, players: [...] } OR null
    const [myTeam, setMyTeam] = useState(null);

    useEffect(() => {
        if (!tournamentId) return;
        fetchTeams();
        fetchMyTeam();
    }, [tournamentId]); // refetch when tournament changes [web:162]

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const res = await getTeamsByTournamentId(tournamentId);
            setTeams(res ?? []);
        } catch (e) {
            setTeams([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyTeam = async () => {
        try {
            setLoading(true);
            const playerId = JSON.parse(Cookies.get("account")).playerId;

            if (!playerId) {
                setMyTeam(null);
                return;
            }

            const res = await getMyTeamByTournamentIdAndPlayerId(
                tournamentId,
                playerId,
            );

            setMyTeam(res ?? null);
        } catch (e) {
            setMyTeam(null);
        } finally {
            setLoading(false);
        }
    };
    const handleCreateTeam = async () => {
        try {
            setLoading(true);
            const playerId = JSON.parse(Cookies.get("account")).playerId;
            const res = await createTeam(form, playerId, tournamentId);
            toast.success("Team created successfully");
            setTeams([...teams, res]);
            setCreateModalOpen(false);
            fetchMyTeam();
            fetchTeams();
        } catch (e) {
            console.error("Error creating team:", e);
            toast.error("Error creating team");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <ToastContainer />
            {/* Tabs */}
            <div className="flex gap-3 mb-4 justify-center">
                <button
                    className={`px-3 py-1 rounded-full border border-red-600 w-1/2 ${tab === "myTeam" ? "bg-red-600 text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setTab("myTeam")}
                >
                    My Team
                </button>

                <button
                    className={`px-3 py-1 rounded-full border border-red-600 w-1/2 ${tab === "teams" ? "bg-red-600 text-white" : "bg-gray-200"
                        }`}
                    onClick={() => setTab("teams")}
                >
                    Teams
                </button>
            </div>

            {/* Content */}
            {tab === "myTeam" ? (
                myTeam ? (
                    <div className="space-y-4 h-max-96 overflow-y-auto pb-16 relative">
                        {/* Team card */}
                        <div className="bg-gray-100 rounded-xl p-3 border border-red-600">
                            <div className="text-sm text-gray-600">My Team</div>
                            <div className="text-lg font-bold">{myTeam.teamName}</div>
                        </div>

                        {/* Search + plus (future request add player) */}
                        <div className="bg-gray-100 rounded-xl p-1 flex items-center gap-3">
                            <input
                                className="flex-1 bg-transparent outline-none border border-red-600 p-3 rounded-xl"
                                placeholder="Search player by username / arid no"
                            />
                            <button className="bg-red-600 text-white rounded-full p-1 shadow-lg">
                                <Plus size={24} className="font-bold" />
                            </button>
                        </div>

                        {/* Players */}
                        <div className="space-y-3">
                            {(myTeam.players ?? []).map((p) => (
                                <PlayerRow key={p.id} player={p} />
                            ))}
                        </div>
                        <button className="bg-red-600 text-white rounded-full p-3 shadow-lg absolute bottom-0 left-1/2 transform -translate-x-1/2 w-11/12 mb-4">
                            Send Request
                        </button>
                    </div>
                ) : (
                    // No team => Center big plus button
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
                        <button
                            className="pointer-events-auto bg-red-600 text-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg"
                            title="Create Team"
                            onClick={() => setCreateModalOpen(true)}
                        >
                            <Plus size={40} />
                        </button>
                    </div>
                )
            ) : (
                // Teams tab list
                <div className="space-y-3">
                    {teams.map((team) => (
                        <div
                            key={team.id}
                            className="bg-gray-100 rounded-xl p-3 border border-red-600"
                        >
                            {team.name}
                        </div>
                    ))}
                </div>
            )}

            {loading && <Loading />}
            {createModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 transition-opacity duration-300">
                    <div
                        className={`bg-white p-6 rounded shadow-lg w-96 transform transition-all duration-300 ease-out relative
                        }`}
                    >
                        <div
                            className="relative mb-4 text-right cursor-pointer"
                            onClick={() => setCreateModalOpen(false)}
                        >
                            <span className="text-gray-500 hover:text-gray-700 text-2xl font-bold">
                                &times;
                            </span>
                        </div>
                        <h2 className="text-xl font-bold mb-4">Create New Team</h2>
                        {/* Form fields for creating a new team */}
                        <input
                            type="text"
                            name=""
                            id=""
                            placeholder="Enter Team Name"
                            className="w-full border border-gray-300 rounded-md p-2 mb-4"
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                        <div className="flex justify-end mt-4">
                            <button
                                className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
                                onClick={handleCreateTeam}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
