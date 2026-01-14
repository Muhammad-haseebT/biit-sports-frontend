function MatchCard({ title, team1, team2, extra }) {
  return (
    <div className="border-2 border-red-400 rounded-lg p-4 m-4 mt-6 shadow-sm bg-white">
      <h3 className="text-lg font-semibold text-red-600">{title}</h3>
      <p className="text-gray-700 mt-1">
        {team1} <span className="font-bold">vs</span> {team2}
      </p>
      <small className="text-gray-500">{extra}</small>
    </div>
  );
}

export default MatchCard;
