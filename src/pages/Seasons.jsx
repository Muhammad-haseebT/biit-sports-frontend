import { useEffect } from "react";
import { getSeasons } from "../api/seasonApi";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
export default function Seasons() {
    const navigate = useNavigate();
    const [seasons, setSeasons] = useState([]);

    useEffect(() => {
        const fetchSeasons = async () => {
            const response = await getSeasons();
            setSeasons(response);
        };
        fetchSeasons();
    }, []);
    return (
        <div className="p-4 pb-24">
            {/* back arrow button  at corner */}
            <button
                className="absolute top-4 left-4 bg-[#E31212] text-white p-2 rounded-full hover:bg-opacity-90 transition-colors shadow-md z-10"
                onClick={() => navigate("/home")}
            >
                <FaArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-center mb-6 text-[#E31212]">Seasons</h1>
            <div className="flex flex-col items-center">
                {seasons.map((season, index) => (
                    <div
                        key={index}
                        className="group bg-white rounded-xl shadow-md p-6 flex items-center justify-center border border-red-500 hover:bg-red-600 hover:scale-105 transition-all duration-300 cursor-pointer w-1/2 mb-4"
                    >
                        <span className="text-lg font-bold text-red-600 group-hover:text-white text-center transition-colors duration-300">
                            {season.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}