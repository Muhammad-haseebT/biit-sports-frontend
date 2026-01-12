import axios from "axios";
const API_URL = import.meta.env.VITE_BASE_URL;
export const getAccounts = () => {
    return axios.get(`${API_URL}/account`);
}
export const updateAccount = (id, account) => {
    return axios.put(`${API_URL}/account/${id}`, account);
}
export const deleteAccount = (id) => {
    return axios.delete(`${API_URL}/account/${id}`);
}