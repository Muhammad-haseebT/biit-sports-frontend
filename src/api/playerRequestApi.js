import axios from "axios";
const API_URL = import.meta.env.VITE_BASE_URL;

export const createPlayerRequest = (playerRequest) => {
    return axios.post(`${API_URL}/playerRequest`, playerRequest);
}