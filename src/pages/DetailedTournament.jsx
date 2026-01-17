
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { getTournamentOverviewApi } from '../api/tournamentAPi';
import LoadingSpinner from '../components/LoadingSpinner';
export default function DetailedTournament() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [overview, setOverview] = useState({
    "teams": 0,
    "playerType": "",
    "startDate": "",
    "top": []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {

    fetchTournamentOverview();

  }, []);
  const fetchTournamentOverview = async () => {
    try {
      setLoading(true);
      console.log(state.tournamentId);
      const response = await getTournamentOverviewApi(state.tournamentId);
      setOverview(response.data);
    } catch (error) {
      console.error('Error fetching tournament overview:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="">
      <div className="">
        {/* Header */}
        <div className="bg-red-600 p-6">
          <div className="flex items-center gap-3">
            <ArrowLeft className="text-white cursor-pointer" size={24} onClick={() => navigate(-1)} />
            <h1 className="text-white font-bold text-2xl">{state.tournamentName || 'Tournament'}</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {['overview', 'fixtures', 'teams', 'stats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-lg font-semibold capitalize ${activeTab === tab
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <LoadingSpinner size="large" />
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-100 rounded-xl p-4 text-center">
                  <div className="text-xl font-semibold text-500 mb-1">Total Teams</div>
                  <div className="text-2xl font-bold">{overview?.teams}</div>
                </div>
                <div className="bg-gray-100 rounded-xl p-4 text-center">
                  <div className="text-xl font-semibold text-500 mb-1">PlayerType</div>
                  <div className="text-xl font-bold">{overview?.playerType.toUpperCase()}</div>
                </div>
                <div className="bg-gray-100 rounded-xl p-4 text-center">
                  <div className="text-xl font-semibold text-500 mb-1">StartDate</div>
                  <div className="text-xl font-bold">{overview?.startDate}</div>
                </div>
              </div>

              {/* Top 3 Teams */}
              <div className="bg-white">
                <h2 className="text-xl font-bold mb-4">Top 3</h2>
                <div className="space-y-3">
                  {overview.top.length > 0 ? overview?.top.map((team) => (
                    <div
                      key={team.rank}
                      className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl font-bold text-red-600">{team.rank}.</span>
                        <span className="font-semibold">{team.name}</span>
                      </div>
                      <span className={`font-bold text-red-600`}>
                        ({team.points} pts)
                      </span>
                    </div>
                  )) : <h2 className="text-center text-gray-600">No Teams Found</h2>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};