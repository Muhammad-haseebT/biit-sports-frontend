
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { getTournamentsBySport } from "../api/seasonApi";
import TournamentDetailComponent from "../components/TournamentDetailComponent";
import { useState } from "react";
import MediaViewer from "../components/MediaViewer";
import { getMediaBySportId } from "../api/mediaApi";

export default function SportTournamentDetail() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mediaData, setMediaData] = useState([]);

    useEffect(() => {

        const fetchTournaments = async () => {
            setLoading(true);
            try {
                const response = await getTournamentsBySport(state.sportID, state.seasonID);
                setTournaments(response);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        const fetchMedia = async () => {
            try {
                // Using sportID as inferred tournamentID based on user context
                const response = await getMediaBySportId(state.sportID);
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
            option="sport"
            navigate={navigate}
            name={state.seasonName}
            tournaments={tournaments}
            seasonID={state.seasonID}
            loading={loading}
            sportID={state.sportID}
            mediaData={mediaData}
        />
    );
}