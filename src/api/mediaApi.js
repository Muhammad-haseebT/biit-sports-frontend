import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

//take match id and file(multipart image)

export const createMedia = async (matchId, file) => {
    try {
        const response = await axios.post(`${BASE_URL}/media/upload`, { file, matchId }, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading media:", error);
        throw error;
    }
};
//get by tournament id
export const getMediaBySportId = async (sportId, page, size) => {
    try {
        const response = await axios.get(`${BASE_URL}/media/sport/${sportId}/${page}/${size}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching media:", error);
        throw error;
    }
};
//get by season id
export const getMediaBySeasonId = async (seasonId, page, size) => {
    try {
        const response = await axios.get(`${BASE_URL}/media/season/${seasonId}/${page}/${size}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching media:", error);
        throw error;
    }
};
//get by tournament id
export const getMediaByTournamentId = async (tournamentId, page, size) => {
    try {
        const response = await axios.get(`${BASE_URL}/media/tournament/${tournamentId}/${page}/${size}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching media:", error);
        throw error;
    }
};
//get all
// export const getAllMedia = async () => {
//     try {
//         const response = await axios.get(`${BASE_URL}/media`);
//         return response.data;
//     } catch (error) {
//         console.error("Error fetching media:", error);
//         throw error;
//     }
// };
