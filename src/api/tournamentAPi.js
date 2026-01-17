
import axios from "axios";
const API_URL = import.meta.env.VITE_BASE_URL;
export const createTournamentAPi = (formData) => {
    return axios.post(`${API_URL}/tournament`, formData);
};
export const getTournamentOverviewApi = (tournamentId) => {
    return axios.get(`${API_URL}/tournament/overview/${tournamentId}`);
}