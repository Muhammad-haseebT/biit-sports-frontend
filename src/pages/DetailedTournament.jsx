
import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function DetailedTournament() {
  const [activeTab, setActiveTab] = useState('teams');
  const [topTeams] = useState([
    { rank: 1, name: 'Shaheen', points: 69 },
    { rank: 2, name: 'Falcons', points: 65 },
    { rank: 3, name: 'Strickers', points: 60 }
  ]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 p-6">
          <div className="flex items-center gap-3">
            <ChevronLeft className="text-white" size={24} />
            <h1 className="text-white font-bold text-2xl">Cricket</h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {['overview', 'fixtures', 'teams', 'stats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold capitalize ${
                activeTab === tab 
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
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Total Teams</div>
              <div className="text-2xl font-bold">8</div>
            </div>
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Venue</div>
              <div className="text-lg font-bold">DPS</div>
            </div>
            <div className="bg-gray-100 rounded-xl p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Start Date</div>
              <div className="text-xs font-bold">24 Oct 2026</div>
            </div>
          </div>

          {/* Top 3 Teams */}
          <div className="bg-white">
            <h2 className="text-xl font-bold mb-4">Top 3</h2>
            <div className="space-y-3">
              {topTeams.map((team) => (
                <div 
                  key={team.rank}
                  className="bg-gray-50 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-700">{team.rank}.</span>
                    <span className="font-semibold">{team.name}</span>
                  </div>
                  <span className={`font-bold ${team.rank === 2 ? 'text-blue-600' : 'text-gray-600'}`}>
                    ({team.points} pts)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};