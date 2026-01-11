import axios from "axios";
const BASE_URL = import.meta.env.VITE_BASE_URL;
export const getMatches = () => {
  return axios.get(`${BASE_URL}/match`);
};
export const getMatchByStatus = (status) => {
  return axios.get(`${BASE_URL}/match/status/${status}`);
};
