import axios from "axios";
export const getMatches = () => {
  return axios.get("http://localhost:8080/match");
};
export const getMatchByStatus = (status) => {
  return axios.get(`http://localhost:8080/match/status/${status}`);
};
