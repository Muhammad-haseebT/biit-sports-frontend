export default function SportFilter({ onFilter }) {
  const sports = [
    "All",
    "Cricket",
    "Futsal",
    "VolleyBall",
    "TableTennis",
    "Badminton",
    "TugOfWar",
    "Ludo",
    "Chess",
  ];

  return (
    <div className="overflow-x-auto py-2 mb-6 no-scrollbar">
      <div className="flex space-x-3 min-w-max px-2">
        {sports.map((sport) => (
          <button
            onClick={() => onFilter(sport)}
            key={sport}
            className="shrink-0 min-w-[5rem] px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition whitespace-nowrap flex justify-center items-center text-sm font-medium"
          >
            {sport}
          </button>
        ))}
      </div>
    </div>
  );
}
