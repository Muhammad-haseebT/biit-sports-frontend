import React, { useState } from "react";
import { ArrowLeft, Home, Play, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import Banner from "../assets/banner.png";
import { useEffect } from "react";
import { getTournamentsBySeason } from "../api/seasonApi";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LoadingSpinner from "./LoadingSpinner";

export default function TournamentDetailComponent({ option, navigate, name, tournaments, seasonID, loading, sportID }) {

    const handleAddSports = () => {
        navigate("/sports-selection", { state: { seasonID: seasonID } });
    }
    const handleAddTournament = () => {
        navigate("/create-tournament", { state: { seasonID: seasonID, sportID: sportID } });
    }
    return (
        <div>
            <ToastContainer />
            <div className="">
                {/* Header */}
                <div className="bg-red-600 p-2 relative">

                    <button
                        className="absolute top-4 left-4 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors shadow-md z-10"
                        onClick={() => navigate(-1)}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="text-white font-bold text-lg text-center mt-2 block">
                        {name}
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
                        <h2 className="text-xl font-bold mt-4">{name}</h2>
                    </div>

                    {/* Tournament List */}
                    <div className="space-y-3">
                        {loading ? (
                            <LoadingSpinner size="large" />
                        ) : tournaments.length > 0 ? tournaments.map((tournament) => (

                            <div
                                key={option == "season" ? tournament.sportId : tournament.id}
                                className="border border-red-300 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-red-50 transition-all duration-300"
                                onClick={() => option == "season" ? navigate("/sport-tournament-detail", { state: { sportID: tournament.sportId, seasonID: seasonID, seasonName: name } }) : navigate("/detailed-tournament", { state: { tournamentId: tournament.id, tournamentName: tournament.name } })}
                            >
                                {console.log(tournament.id)}
                                <span className="font-semibold text-gray-800">
                                    {tournament.name}
                                </span>
                                {
                                    option == "season" ?
                                        <span className="text-gray-600 font-bold">
                                            {tournament.tournamentCount}
                                        </span>
                                        :
                                        null
                                }

                            </div>
                        )) : <h2 className="text-center text-gray-600">No Tournaments Found</h2>}
                    </div>

                    {/* Add Button */}
                    <div className="mt-4">
                        <button
                            className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700 transition-colors fixed bottom-4 right-4 shadow-lg"
                            onClick={() => option == "season" ? handleAddSports() : handleAddTournament()}
                        >
                            <Plus size={28} strokeWidth={3} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}