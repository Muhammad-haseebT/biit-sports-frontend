import axios from "axios";

const url = import.meta.env.VITE_BASE_URL;

export const getTeamsByTournamentId = async (tournamentId) => {
    const r = await axios.get(`${url}/team/tournament/${tournamentId}`);
    return r.data ?? []; // array
};

export const getMyTeamByTournamentIdAndPlayerId = async (tournamentId, playerId) => {
    const r = await axios.get(`${url}/team/tournament/account/${tournamentId}/${playerId}`);
    return r.data; // object
};
export const createTeam = async (teamData, playerId, tournamentId) => {
    const r = await axios.post(`${url}/team/${tournamentId}/${playerId}`, teamData);
    return r.data; // object
};

