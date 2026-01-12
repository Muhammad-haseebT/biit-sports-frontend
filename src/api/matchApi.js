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
  if (sport) {
    console.log(sport);
    return axios.get(`${BASE_URL}/match/sport`, {
      params: { name: sport, status }
    });
  }
  return axios.get(`${BASE_URL}/match/sport`, {
    params: { status }
  });
};
