import React, { useState } from "react";
import { ArrowLeft, Home, Play, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Banner from "../assets/banner.png";
import { useEffect } from "react";
import { getTournamentsBySeason } from "../api/seasonApi";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import TournamentDetailComponent from "../components/TournamentDetailComponent";
// Tournament Detail Screen
export default function TournamentDetail() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const { state } = useLocation();
  useEffect(() => {
    // Fetch tournaments based on seasonID from state
    const fetchTournaments = async () => {
      setLoading(true);
      try {
        const response = await getTournamentsBySeason(state.seasonID);
        setTournaments(response);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchTournaments();
  }, []);

  return (
    <TournamentDetailComponent option="season" navigate={navigate} name={state.seasonName} tournaments={tournaments} seasonID={state.seasonID} loading={loading} />
  );
}
