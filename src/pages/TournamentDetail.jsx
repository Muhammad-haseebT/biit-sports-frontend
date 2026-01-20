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
/* imports... */
import MediaViewer from "../components/MediaViewer";
import { getMediaBySeasonId } from "../api/mediaApi";

export default function TournamentDetail() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mediaData, setMediaData] = useState([]);
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

    const fetchMedia = async () => {
      try {
        const response = await getMediaBySeasonId(state.seasonID);
        // Filter response to match format if needed, but assuming API returns array
        // User requested format: [{ "mode": "imagekit", "id": 1, "fileType": "image/png", "url": "..." }]
        // We'll trust the API returns this structure or similar enough for the viewer.
        setMediaData(response);
      } catch (error) {
        console.error("Error fetching media:", error);
      }
    }

    fetchTournaments();
    fetchMedia();
  }, []);

  return (
    <TournamentDetailComponent
      option="season"
      navigate={navigate}
      name={state.seasonName}
      tournaments={tournaments}
      seasonID={state.seasonID}
      loading={loading}
      mediaData={mediaData}
    />
  );
}
