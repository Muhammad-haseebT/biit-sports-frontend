import axios from "axios";
const API_URL = import.meta.env.VITE_BASE_URL;
export const getSeasons = async () => {
    const response = await axios.get(`${API_URL}/season`);
    return response.data;
};