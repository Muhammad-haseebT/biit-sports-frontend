import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTournamentOverviewApi } from '../api/tournamentAPi';
import LoadingSpinner from '../components/LoadingSpinner';

import TournamentOverview from '../components/TournamentOverview';
import TournamentFixtures from '../components/TournamentFixtures';
import TournamentTeams from '../components/TournamentTeams';
import TournamentPoints from '../components/TournamentPoints';

export default function DetailedTournament() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [overview, setOverview] = useState({
    teams: 0, playerType: '', startDate: '', top: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchTournamentOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTournamentOverview = async () => {
    try {
      setLoading(true);
      const response = await getTournamentOverviewApi(state.tournamentId);
      setOverview(response.data);
    } catch (error) {
      console.error('Error fetching tournament overview:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="bg-red-600 p-6">
        <div className="flex items-center gap-3">
          <ArrowLeft className="text-white cursor-pointer" size={24} onClick={() => navigate(-1)} />
          <h1 className="text-white font-bold text-2xl">{state.tournamentName || 'Tournament'}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {['overview', 'fixtures', 'teams', 'stats', 'Points'].map(tab => (
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
            {activeTab === 'overview' && <TournamentOverview overview={overview} />}

            {activeTab === 'fixtures' && (
              // pass fixtures prop if you fetch them; currently using sample inside component
              <TournamentFixtures tournamentId={state.tournamentId} />
            )}

            {activeTab === 'teams' && (
              <TournamentTeams tournamentId={state.tournamentId} />
            )}

            {activeTab === 'Points' && (
              <TournamentPoints tournamentId={state.tournamentId} />
            )}

            {activeTab === 'stats' && (
              <div>
                <h2 className="text-xl font-bold">Stats</h2>
                <p className="text-gray-600">(Put stats UI here)</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
