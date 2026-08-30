export function filterSpots(spots, filters) {
  const { categories, accessibility, searchQuery, openNow } = filters;

  return spots.filter(spot => {
    // 1. カテゴリフィルタ
    if (categories && categories.length > 0) {
      if (!categories.includes(spot.category)) return false;
    }

    // 2. バリアフリー属性フィルタ
    if (accessibility && accessibility.length > 0) {
      const spotAcc = spot.accessibility || {};
      for (const attr of accessibility) {
        if (!spotAcc[attr]) return false;
      }
    }

    // 3. 検索クエリ
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const matchName = (spot.name || '').toLowerCase().includes(q);
      const matchNameEn = (spot.name_en || '').toLowerCase().includes(q);
      const matchAddress = (spot.address || '').toLowerCase().includes(q);
      const matchArea = (spot.area || '').toLowerCase().includes(q);

      if (!matchName && !matchNameEn && !matchAddress && !matchArea) return false;
    }

    // 4. 営業中フィルタ
    if (openNow) {
      if (!isOpenNow(spot)) return false;
    }

    return true;
  });
}

function isOpenNow(spot) {
  if (!spot.opening_hours) return true; // 24時間または記載なしは表示

  const now = new Date();
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const todayKey = days[now.getDay()];
  const todayHours = spot.opening_hours[todayKey];

  if (!todayHours || todayHours.length === 0) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const timeRange of todayHours) {
    const [start, end] = timeRange.split('-');
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    if (currentMinutes >= startTotal && currentMinutes <= endTotal) {
      return true;
    }
  }

  return false;
}
