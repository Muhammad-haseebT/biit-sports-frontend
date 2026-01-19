import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { getMatchesByTournamentId } from '../api/matchApi';
import Loading from '../components/LoadingSpinner';
import { getTeamsByTournamentId } from '../api/teamApi';

function FixtureCard({ fixture }) {
    return (
        <div className="bg-gray-100 rounded-xl p-3 mb-3 shadow-sm border border-red-600">
            <div className="flex justify-between items-start">
                <div>
                    <div className="font-semibold">{fixture.team1Name} vs {fixture.team2Name}</div>
                    <div className="text-sm text-gray-500">Date: {fixture.date} | Time: {fixture.time}</div>
                    <div className="text-xs text-gray-400">Venue: {fixture.venue} | {fixture.overs} Overs</div>
                </div>
                <div className="ml-2">
                    <button className="bg-red-600 text-white px-2 py-1 rounded">✎</button>
                </div>
            </div>
        </div>
    );
}

export default function TournamentFixtures({ tournamentId }) {
    const [fixtures, setFixtures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [teams, setTeams] = useState([]);

    // Default values set to current date for Spring Boot compatibility
    const [form, setForm] = useState({
        team1Id: '',
        team2Id: '',
        scorerId: '', // Optional
        venue: '',    // Required
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        time: '14:00', // Default 2:00 PM
        overs: '20',   // Required
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting to Spring Boot:", form);
        // Add your API call here (e.g., createMatch(form))
        setModalOpen(false);
    };

    useEffect(() => {
        fetchFixtures();
        fetchTeams();
    }, [tournamentId]);

    const fetchFixtures = async () => {
        try {
            setLoading(true);
            const response = await getMatchesByTournamentId(tournamentId);
            setFixtures(response ?? []);
        } catch (error) {
            console.error('Error fetching fixtures:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await getTeamsByTournamentId(tournamentId);
            setTeams(response ?? []);
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    return (
        <div className="p-4 relative min-h-screen">
            <h3 className="text-gray-800 font-semibold text-2xl mb-3">Fixtures</h3>

            {loading ? <Loading /> : (
                <div className="bg-white p-4 rounded-lg">
                    {fixtures.length > 0 ? fixtures.map(f => <FixtureCard key={f.id} fixture={f} />) : <div>No fixtures found</div>}
                </div>
            )}

            {/* Floating Action Button */}
            <div className="fixed bottom-6 right-6">
                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-red-600 text-white rounded-full p-3 shadow-lg hover:bg-red-700 transition"
                >
                    <Plus size={30} />
                </button>
            </div>

            {/* Modal for Creating Fixture */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Create New Fixture</h2>
                            <button onClick={() => setModalOpen(false)}><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Horizontal Team Selection */}
                            <div className="flex items-center gap-2">
                                <select
                                    name="team1Id" required value={form.team1Id} onChange={handleChange}
                                    className="flex-1 border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500"
                                >

                                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>

                                <span className="font-bold text-red-600">VS</span>

                                <select
                                    name="team2Id" required value={form.team2Id} onChange={handleChange}
                                    className="flex-1 border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-red-500"
                                >

                                    {teams.filter(t => t.id !== form.team1Id).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            {/* Venue & Scorer */}
                            <input
                                type="text" name="venue" placeholder="Venue Name" required
                                value={form.venue} onChange={handleChange}
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                            />

                            <input
                                type="text" name="scorerId" placeholder="Scorer ID (Optional)"
                                value={form.scorerId} onChange={handleChange}
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                            />

                            {/* Date, Time, Overs */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500">Match Date</label>
                                    <input
                                        type="date" name="date" required
                                        value={form.date} onChange={handleChange}
                                        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500">Start Time</label>
                                    <input
                                        type="time" name="time" required
                                        value={form.time} onChange={handleChange}
                                        className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                            </div>

                            <input
                                type="number" name="overs" placeholder="Total Overs" required
                                value={form.overs} onChange={handleChange}
                                className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-red-500"
                            />

                            <button
                                type="submit"
                                className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition shadow-md"
                            >
                                Create Fixture
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}