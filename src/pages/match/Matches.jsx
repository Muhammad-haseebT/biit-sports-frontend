import { useState, useEffect } from "react";
import {
  getMatches,
  getMatchBySportAndStatus,
  getMatchByStatus,
} from "../../api/matchApi";
import SportFilter from "../../components/common/SportFilter";
import StatusFilter from "../../components/common/StatusFilter";
import MatchCard from "../../components/common/MatchCard"; // Assuming MatchCard import is needed
import LoadingSpinner from "../../components/common/LoadingSpinner";
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
            response = await getMatchBySportAndStatus(
              selectedSport,
              selectedStatus,
            );
          }
        } else {
          response = await getMatchBySportAndStatus(
            selectedSport,
            selectedStatus,
          );
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

  const handleClick = (
    matchId,
    status,
    team1Id,
    team2Id,
    decision,
    tossWinnerId,
    team1Name,
    team2Name,
    sportId,
    inningsId,
    venue,
    match,
  ) => {
    if (status === "LIVE" && decision == "BAT") {
      let name = "";
      if (tossWinnerId == team1Id) name = team1Name;
      else name = team2Name;

      navigate(`/match`, {
        state: {
          matchId: matchId,
          status: status,
          team1Id: team1Id,
          team2Id: team2Id,
          battingTeamId: tossWinnerId,
          team1Name: team1Name,
          team2Name: team2Name,
          battingTeamName: name,
          sportId: sportId,
          inningsId: inningsId,
          venue: venue,
          match: match,
        },
      });
    } else if (status === "LIVE" && decision == "BOWL") {
      if (tossWinnerId == team1Id) {
        navigate(`/match`, {
          state: {
            matchId: matchId,
            status: status,
            team1Id: team1Id,
            team2Id: team2Id,
            battingTeamId: team2Id,
            team1Name: team1Name,
            team2Name: team2Name,
            battingTeamName: team2Name,
            sportId: sportId,
            inningsId: inningsId,
            venue: venue,
            match: match,
          },
        });
      } else {
        navigate(`/match`, {
          state: {
            matchId: matchId,
            status: status,
            team1Id: team1Id,
            team2Id: team2Id,
            battingTeamId: team1Id,
            team1Name: team1Name,
            team2Name: team2Name,
            battingTeamName: team1Name,
            sportId: sportId,
            inningsId: inningsId,
            venue: venue,
            match: match,
          },
        });
      }
    } else {
      navigate(`/match`, {
        state: {
          matchId: matchId,
          status: status,
          team1Id: team1Id,
          team2Id: team2Id,
          battingTeamId: 0,
          team1Name: team1Name,
          team2Name: team2Name,
          battingTeamName: "",
          sportId: sportId,
          inningsId: 0,
          venue: venue,
          match: match,
        },
      });
    }
  };

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
      <StatusFilter
        onFilter={setSelectedStatus}
        selectedStatus={selectedStatus}
      />
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
              team1Id={match.team1Id}
              team2Id={match.team2Id}
              extra={match.date + " " + match.time}
              live={match.status === "live" || match.status === "LIVE"}
              onClick={() =>
                handleClick(
                  match.id,
                  match.status,
                  match.team1Id,
                  match.team2Id,
                  match.decision,
                  match.tossWinnerId,
                  match.team1Name,
                  match.team2Name,
                  match.sportId,
                  match.inningsId,
                  match.venue,
                  match,
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
