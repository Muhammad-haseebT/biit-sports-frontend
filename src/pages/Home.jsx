import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import SportFilter from "../components/SportFilter";
import MatchCard from "../components/MatchCard";
import { getMatchByStatus, getMatchBySportAndStatus } from "../api/matchApi";
import Cookies from "js-cookie";

export default function Home() {
  const [live, setLive] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [username, setUsername] = useState("");
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        let response = await getMatchByStatus("LIVE");
        setLive(response.data);

        response = await getMatchByStatus("UPCOMING");
        setUpcoming(response.data);
        setUsername(JSON.parse(Cookies.get("account")).name);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMatches();
  }, []);



  const handleSportFilter = async (sport) => {
    try {
      let live, upcomming;
      if (sport === "All") {
        live = await getMatchByStatus("LIVE");
        upcomming = await getMatchByStatus("UPCOMING")
      } else {
        live = await getMatchBySportAndStatus(sport, "LIVE")
        upcomming = await getMatchBySportAndStatus(sport, "UPCOMING")
      }
      console.log(live.data);
      console.log(upcomming.data);
      setLive(live.data);
      setUpcoming(upcomming.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar username={username} />
      <div className="p-4 md:p-6">
        <SportFilter onFilter={handleSportFilter} />

        <h3 className="text-xl font-bold mb-4">Live Matches</h3>
        <div className="overflow-x-auto mb-8">
          <div className="flex space-x-4 min-w-max px-2">
            {live.slice(0, 3).map((match) => (
              <MatchCard
                key={match.id}
                title={match.tournamentName}
                team1={match.team1Name}
                team2={match.team2Name}
                extra={match.status}
                live={true}
              />
            ))}
          </div>
        </div>

        <h3 className="text-xl font-bold mb-4">Upcoming Matches</h3>
        <div>
          {upcoming.map((match) => (
            <MatchCard
              key={match.id}
              title={match.tournamentName}
              team1={match.team1Name}
              team2={match.team2Name}
              extra={match.date + " " + match.time}
              live={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
