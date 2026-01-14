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
  const [searchLive, setSearchLive] = useState([]);
  const [searchUpcoming, setSearchUpcoming] = useState([]);
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        let response = await getMatchByStatus("LIVE");
        setLive(response.data);
        setSearchLive(response.data);

        response = await getMatchByStatus("UPCOMING");
        setUpcoming(response.data);
        setUsername(JSON.parse(Cookies.get("account")).name);
        setSearchUpcoming(response.data);
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
      setSearchLive(live.data);
      setSearchUpcoming(upcomming.data);
    } catch (err) {
      console.error(err);
    }
  }
  const onSearch = (search) => {
    try {
      if (!search || search.trim() === "") {
        setSearchLive(live);
        setSearchUpcoming(upcoming);
        return;
      }

      const searchLower = search.toLowerCase();

      setSearchLive(
        live.filter((match) =>
          match.team1Name?.toLowerCase().includes(searchLower) ||
          match.team2Name?.toLowerCase().includes(searchLower)
        )
      );

      setSearchUpcoming(
        upcoming.filter((match) =>
          match.team1Name?.toLowerCase().includes(searchLower) ||
          match.team2Name?.toLowerCase().includes(searchLower)
        )
      );
    } catch (err) {
      console.error("Search error:", err);
    }
  }
  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar username={username} onSearch={onSearch} />
      <div className="p-4 md:p-6">
        <SportFilter onFilter={handleSportFilter} />

        <h3 className="text-xl font-bold mb-4">Live Matches</h3>
        <div className="overflow-x-auto mb-8">
          <div className="flex space-x-4 min-w-max px-2">
            {searchLive.slice(0, 3).map((match) => (
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
          {searchUpcoming.map((match) => (
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

