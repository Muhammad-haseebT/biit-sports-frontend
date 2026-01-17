
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { getTournamentsBySport } from "../api/seasonApi";
import TournamentDetailComponent from "../components/TournamentDetailComponent";
import { useState } from "react";
export default function SportTournamentDetail() {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(false);
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
        fetchTournaments();
    }, []);

    return (
        <TournamentDetailComponent option="sport" navigate={navigate} name={state.seasonName} tournaments={tournaments} seasonID={state.seasonID} loading={loading} sportID={state.sportID} />
    );
}