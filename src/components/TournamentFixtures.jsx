import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { getMatchesByTournamentId } from '../api/matchApi';
import Loading from '../components/LoadingSpinner';


function FixtureCard({ fixture }) {
    return (
        <div className="bg-gray-100 rounded-xl p-3 mb-3 shadow-sm border border-red-600">
            <div className="flex justify-between items-start">
                <div>
                    <div className="font-semibold">{fixture.team1Name} vs {fixture.team2Name}</div>
                    <div className="text-sm text-gray-500">Date: {fixture.date} {fixture.time}</div>
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
    useEffect(() => {
        fetchFixtures();
    }, []);

    const fetchFixtures = async () => {
        try {
            setLoading(true);
            const response = await getMatchesByTournamentId(tournamentId);
            console.log('Fetched fixtures:', response);
            console.log('Tournament ID:', tournamentId);
            setFixtures(response ?? []);

        } catch (error) {
            console.error('Error fetching fixtures:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3 className="text-500 font-semibold text-2xl mb-3">Fixtures</h3>
            {loading ? <Loading /> : <div className="bg-white p-4 rounded-lg">
                {fixtures.length > 0 ? fixtures.map(f => <FixtureCard key={f.id} fixture={f} />) : <div>No fixtures found</div>}
            </div>}

            <div className="fixed bottom-6 right-6">
                <button className="bg-red-600 text-white  rounded-full p-3  shadow-lg">
                    <Plus size={30} className="font-bold" />
                </button>
            </div>
        </div>
    );
}
