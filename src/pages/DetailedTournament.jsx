import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getTournamentOverviewApi } from '../api/tournamentAPi';
import LoadingSpinner from '../components/LoadingSpinner';

import TournamentOverview from '../components/TournamentOverview';
import TournamentFixtures from '../components/TournamentFixtures';
import TournamentTeams from '../components/TournamentTeams';
import TournamentPoints from '../components/TournamentPoints';
import { getMediaByTournamentId } from '../api/mediaApi';
import MediaViewer from '../components/MediaViewer';
import { ImageIcon } from 'lucide-react';

export default function DetailedTournament() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [overview, setOverview] = useState({
    teams: 0, playerType: '', startDate: '', top: []
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [mediaData, setMediaData] = useState([]);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  useEffect(() => {
    if (activeTab === 'overview')
      fetchTournamentOverview();
    if (activeTab === 'Media')
      fetchMedia();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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
  const fetchMedia = async () => {
    try {
      setLoading(true);
      const response = await getMediaByTournamentId(state.tournamentId);
      setMediaData(response);
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const openMediaViewer = (index) => {
    setViewerIndex(index);
    setIsViewerOpen(true);
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
      <div className="flex border-b overflow-x-auto whitespace-nowrap no-scrollbar">
        {['overview', 'fixtures', 'teams', 'stats', 'Points', 'Media'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-lg font-semibold capitalize min-w-fit ${activeTab === tab
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-red-400'
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
            {activeTab === 'Media' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mediaData && mediaData.length > 0 ? (
                  mediaData.map((media, index) => (
                    <div
                      key={index}
                      className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-shadow relative group"
                      onClick={() => openMediaViewer(index)}
                    >
                      <img
                        src={media.url}
                        alt={`Media ${index}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={32} />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-10 text-center">
                    <div className="flex justify-center mb-3">
                      <ImageIcon className="text-gray-300" size={48} />
                    </div>
                    <h3 className="text-gray-500 font-medium">No media available</h3>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      <MediaViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        mediaData={mediaData}
        initialIndex={viewerIndex}
      />
    </div>
  );
}
