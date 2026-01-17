import { useState, useEffect } from "react";
import { getMatches, getMatchBySportAndStatus, getMatchByStatus } from "../api/matchApi";
import SportFilter from "../components/SportFilter";
import StatusFilter from "../components/StatusFilter";
import MatchCard from "../components/MatchCard"; // Assuming MatchCard import is needed
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

export default function Matches() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState([]);
    const [selectedSport, setSelectedSport] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMatches = async () => {
            setLoading(true);
            try {
                let response;

                if (selectedSport === "All" && selectedStatus === "All") {
                    response = await getMatches();
                } else if (selectedStatus !== "All") {
                    if (selectedSport === "All") {
                        response = await getMatchByStatus(selectedStatus);
                    } else {
                        // Both specific -> Use sport + status endpoint
                        response = await getMatchBySportAndStatus(selectedSport, selectedStatus);
                    }
                } else {
                    response = await getMatchBySportAndStatus(selectedSport, selectedStatus);
                }

                console.log(response.data);
                setMatches(response.data);

            } catch (err) {
                console.error(err);
                setMatches([]);
            } finally {
                setLoading(false);
            }
        };
        fetchMatches();
    }, [selectedSport, selectedStatus]);

    return (
        <div className="p-4 pb-24">
            <button
                className="absolute top-4 left-4 bg-[#E31212] text-white p-2 rounded-full hover:bg-opacity-90 transition-colors shadow-md z-10"
                onClick={() => navigate("/home")}
            >
                <FaArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold mb-4">Matches</h1>

            <SportFilter onFilter={setSelectedSport} selectedSport={selectedSport} />
            <StatusFilter onFilter={setSelectedStatus} selectedStatus={selectedStatus} />
            {loading ? (
                <LoadingSpinner size="large" />
            ) : (
                <div className="flex flex-col gap-4">
                    {matches.map((match) => (
                        <MatchCard
                            key={match.id}
                            title={match.tournamentName}
                            team1={match.team1Name}
                            team2={match.team2Name}
                            extra={match.date + " " + match.time}
                            live={match.status === "live" || match.status === "LIVE"}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}