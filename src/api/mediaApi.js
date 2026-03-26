import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

//take match id and file(multipart image)
export const createMedia = async (matchId, ballId, file) => {
  // ✅ Pehle check karo
  console.log("createMedia called:", { matchId, ballId, file });

  if (!matchId || !ballId || !file) {
    console.error("Missing params:", { matchId, ballId, file });
    throw new Error("matchId, ballId ya file missing hai");
  }

  try {
    const formData = new FormData();
    formData.append("file", file); // sirf file FormData mein

    // ✅ matchId aur ballId URL query params mein — Spring @RequestParam yahan se padha ta hai
    const response = await axios.post(
      `${BASE_URL}/media?matchId=${matchId}&ballId=${ballId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    console.log("Upload response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Upload error:", error.response?.data || error.message);
    throw error;
  }
};
//get by tournament id
export const getMediaBySportId = async (sportId, page, size) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/media/sport/${sportId}/${page}/${size}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching media:", error);
    throw error;
  }
};
//get by season id
export const getMediaBySeasonId = async (seasonId, page, size) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/media/season/${seasonId}/${page}/${size}`,
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching media:", error);
    throw error;
  }
};
//get by tournament id
export const getMediaByTournamentId = async (tournamentId, page, size) => {
  try {
    const response = await axios.get(
      `${BASE_URL}/media/tournament/${tournamentId}/${page}/${size}`,
    );
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
