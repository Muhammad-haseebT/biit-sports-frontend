import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import SportFilter from "../components/SportFilter";
import MatchCard from "../components/MatchCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { getMatchByStatus, getMatchBySportAndStatus } from "../api/matchApi";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const [live, setLive] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [username, setUsername] = useState("");
  const [searchLive, setSearchLive] = useState([]);
  const [searchUpcoming, setSearchUpcoming] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      try {
        let response = await getMatchBySportAndStatus("All", "LIVE");
        setLive(response.data);
        setSearchLive(response.data);

        response = await getMatchBySportAndStatus("All", "UPCOMING");
        setUpcoming(response.data);
        setUsername(JSON.parse(Cookies.get("account")).name);
        setSearchUpcoming(response.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, []);

  const handleSportFilter = async (sport) => {
    setLoading(true);
    try {
      let live, upcomming;
      live = await getMatchBySportAndStatus(sport, "LIVE");
      upcomming = await getMatchBySportAndStatus(sport, "UPCOMING");
      console.log(live.data);
      console.log(upcomming.data);
      setLive(live.data);
      setUpcoming(upcomming.data);
      setSearchLive(live.data);
      setSearchUpcoming(upcomming.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const onSearch = (search) => {
    try {
      if (!search || search.trim() === "") {
        setSearchLive(live);
        setSearchUpcoming(upcoming);
        return;
      }

      const searchLower = search.toLowerCase();

      setSearchLive(
        live.filter(
          (match) =>
            match.team1Name?.toLowerCase().includes(searchLower) ||
            match.team2Name?.toLowerCase().includes(searchLower),
        ),
      );

      setSearchUpcoming(
        upcoming.filter(
          (match) =>
            match.team1Name?.toLowerCase().includes(searchLower) ||
            match.team2Name?.toLowerCase().includes(searchLower),
        ),
      );
    } catch (err) {
      console.error("Search error:", err);
    }
  };
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
    <div className="bg-gray-100 min-h-screen">
      <Navbar username={username} onSearch={onSearch} />
      <div className="p-4 md:p-6">
        <SportFilter onFilter={handleSportFilter} />

        {loading ? (
          <LoadingSpinner size="large" />
        ) : (
          <>
            <h3 className="text-xl font-bold mb-4">Live Matches</h3>
            <div className="overflow-x-auto mb-8">
              <div>
                {searchLive.slice(0, 3).map((match) => (
                  <MatchCard
                    key={match.id}
                    title={match.tournamentName}
                    team1={match.team1Name}
                    team2={match.team2Name}
                    extra={match.status}
                    live={true}
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
            </div>

            <h3 className="text-xl font-bold mb-4">Upcoming Matches</h3>
            <div>
              {searchUpcoming.map((match) => (
                <MatchCard
                  key={match.id}
                  title={match.tournamentName}
                  team1={match.team1Name}
                  team2={match.team2Name}
                  team1Id={match.team1Id}
                  team2Id={match.team2Id}
                  extra={match.date + " " + match.time}
                  live={false}
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
          </>
        )}
      </div>
    </div>
  );
}
