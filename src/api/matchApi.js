import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;
export const getMatches = () => {
  return axios.get(`${BASE_URL}/match`);
};
export const getMatchByStatus = (status) => {
  return axios.get(`${BASE_URL}/match/status/${status}`);
};

//sport is optional and status is required bot are passed as parameters
export const getMatchBySportAndStatus = (sport, status) => {
  const params = { status };

  if (sport !== "All") {
    console.log(sport);
    params.name = sport;
  }

  return axios.get(`${BASE_URL}/match/sport`, { params });
};

export const getMatchScorer = (s) => {
  return axios.get(`${BASE_URL}/match/scorer/${s}`);
};

export const getMatchesByTournamentId = async (tournamentId) => {
  try {
    const r = await axios.get(`${BASE_URL}/match/tournament/${tournamentId}`);
    return r.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return []; // silently ignore 404
    }
    throw error; // rethrow other errors
  }
};

export const createMatch = async (matchData) => {
  const r = await axios.post(`${BASE_URL}/match`, matchData);
  return r.data; // object
};

export const updateMatch = async (matchData, matchId) => {
  const r = await axios.put(`${BASE_URL}/match/${matchId}`, matchData);
  return r.data; // object
};

export const getScoreCard = async (matchId, teamId) => {
  const r = await axios.get(`${BASE_URL}/match/scoreCard/${matchId}/${teamId}`);
  return r.data;
};
export const startmatch = async (matchId, data) => {
  const r = await axios.put(`${BASE_URL}/match/start/${matchId}`, data);
  return r.data;
};
