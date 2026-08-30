export function searchSpots(query, spots) {
  if (!query || query.trim() === '') return spots;
  const q = query.toLowerCase().trim();

  return spots.filter(s =>
    (s.name && s.name.toLowerCase().includes(q)) ||
    (s.name_en && s.name_en.toLowerCase().includes(q)) ||
    (s.address && s.address.toLowerCase().includes(q)) ||
    (s.area && s.area.toLowerCase().includes(q))
  );
}
