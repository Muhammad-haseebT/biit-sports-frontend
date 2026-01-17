import React, { useState } from "react";
import { ChevronLeft, Home, Play, Plus } from "react-feather";
import { useNavigate, useLocation } from "react-router-dom";
import Banner from "../assets/banner.png";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect } from "react";
import { getTournamentsBySeason } from "../api/seasonApi";

// Tournament Detail Screen
export default function TournamentDetail() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const { state } = useLocation();
  useEffect(() => {
    // Fetch tournaments based on seasonID from state
    const fetchTournaments = async () => {
      const response = await getTournamentsBySeason(state.seasonID);
      setTournaments(response);
    };
    fetchTournaments();
  }, []);

  return (
    <div>
      <div className="">
        {/* Header */}
        <div className="bg-red-600 p-2 relative">
          
            <button
              className="absolute top-4 left-4 bg-[#E31212] text-white p-2 rounded-full hover:bg-opacity-90 transition-colors shadow-md z-10"
              onClick={() => navigate("/seasons")}
            >
              <FaArrowLeft size={20} />
            </button>
            <span className="text-white font-bold text-lg text-center mt-2 block">
              {state.seasonName}
            </span>
          
          <div className="flex justify-between gap-3 mb-4 mt-10 px-12">
            <Home className="text-white" size={24} />
            <Play className="text-white" size={24} />
          </div>

          {/* Image */}
          <div className="w-full h-32 bg-green-700 rounded-lg overflow-hidden">
            <img
              src={Banner}
              alt="Sports"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Profile Section */}
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-bold mt-4">{state.seasonName}</h2>
          </div>

          {/* Tournament List */}
          <div className="space-y-3">
            {tournaments.map((tournament) => (
              <div
                key={tournament.sportId}
                className="bg-gray-100 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-gray-200 transition"
              >
                <span className="font-semibold text-gray-800">
                  {tournament.name}
                </span>
                
                  <span className="text-gray-600 font-bold">
                    {tournament.tournamentCount}
                  </span>
                
              </div>
            ))}
          </div>

          {/* Add Button */}
          <div className="mt-4">
            <button
              className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition-colors fixed bottom-4 right-4 shadow-md
                font-bold text-2xl  pt-1
                "
              onClick={() => navigate("/sports-selection", { state: { seasonID: state.seasonID, seasonName: state.seasonName } })}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
