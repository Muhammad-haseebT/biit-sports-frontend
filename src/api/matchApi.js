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

export const getMatchesByTournamentId = (tournamentId) => {
  const r = axios.get(`${BASE_URL}/match/tournament/${tournamentId}`);
  if (r.status === 200) {
    return r.data;
  }
  else {
    return [];
  }
};
