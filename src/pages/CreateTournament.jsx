
import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

export default function CreateTournament() {
  const [formData, setFormData] = useState({
    name: 'Cricket',
    startDate: '12/10/2025',
    endDate: '12/12/2025',
    stage: 'roundRobin',
    playerType: 'male',
    tournamentType: 'hard',
    email: 'abc@biit.edu.pk'
  });

  const handleSubmit = () => {
    console.log('Tournament Data:', formData);
    // API call yahan implement karein
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-red-600 p-6">
          <div className="flex items-center gap-3 mb-4">
            <ChevronLeft className="text-white" size={24} />
            <h1 className="text-white font-bold text-xl">Create Tournament</h1>
          </div>
          {/* Image */}
          <div className="w-full h-32 bg-green-700 rounded-lg overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=200&fit=crop" 
              alt="Sports"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Tournament Name */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tournament Name</label>
            <input 
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-gray-100 rounded-lg px-4 py-3 text-right"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
              <input 
                type="text"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full bg-gray-100 rounded-lg px-4 py-3 text-right text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">End Date</label>
              <input 
                type="text"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full bg-gray-100 rounded-lg px-4 py-3 text-right text-sm"
              />
            </div>
          </div>

          {/* Tournament Stages */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Tournament Stages</label>
            <div className="space-y-2">
              {[
                { value: 'roundRobin', label: 'Round Robin' },
                { value: 'roundRobinKnockout', label: 'Round Robin + Knock out Rounds' },
                { value: 'knockOut', label: 'Knock Out Rounds' },
                { value: 'league', label: 'League' }
              ].map(option => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="radio"
                    name="stage"
                    value={option.value}
                    checked={formData.stage === option.value}
                    onChange={(e) => setFormData({...formData, stage: e.target.value})}
                    className="w-5 h-5"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Player Type */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Tournament Player Type</label>
            <div className="space-y-2">
              {[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' }
              ].map(option => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="radio"
                    name="playerType"
                    value={option.value}
                    checked={formData.playerType === option.value}
                    onChange={(e) => setFormData({...formData, playerType: e.target.value})}
                    className="w-5 h-5"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tournament Type */}
          <div>
            <label className="text-sm font-semibold mb-2 block">Tournament Type</label>
            <div className="space-y-2">
              {[
                { value: 'hard', label: 'Hard' },
                { value: 'tennis', label: 'Tennis' }
              ].map(option => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="radio"
                    name="tournamentType"
                    value={option.value}
                    checked={formData.tournamentType === option.value}
                    onChange={(e) => setFormData({...formData, tournamentType: e.target.value})}
                    className="w-5 h-5"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Enter Organizer Email/AridNo</label>
            <input 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-gray-100 rounded-lg px-4 py-3"
            />
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition mt-6"
          >
            Create Tournament
          </button>
        </div>
      </div>
    </div>
  );
};