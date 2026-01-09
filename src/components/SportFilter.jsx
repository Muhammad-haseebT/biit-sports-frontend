export default function SportFilter() {
  const sports = [
    "All",
    "Cricket",
    "Futsal",
    "Volleyball",
    "Table Tennis",
    "Badminton",
    "Tug of war",
    "Ludo",
    "Chess",
  ];

  return (
    <div className="overflow-x-auto py-2 mb-6">
      <div className="flex space-x-3 min-w-max px-2">
        {sports.map((sport) => (
          <button
            key={sport}
            className="shrink-0 px-4 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition whitespace-nowrap"
          >
            {sport}
          </button>
        ))}
      </div>
    </div>
  );
}
