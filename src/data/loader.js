import toiletsData from '../../public/data/toilets.json';
import nurseryData from '../../public/data/nursery-rooms.json';
import shopsData from '../../public/data/shops.json';
import facilitiesData from '../../public/data/facilities.json';
import airportData from '../../public/data/airport.json';
import busStopsData from '../../public/data/bus-stops.json';

import { calculateTrustScore } from '../utils/scoring';
import { getReports } from '../crowdsource/storage';

let allSpots = [];

export async function loadAllData() {
  try {
    const staticSpots = [
      ...toiletsData,
      ...nurseryData,
      ...shopsData,
      ...facilitiesData,
      ...airportData,
      ...busStopsData
    ];

    // ユーザー投稿データ（LocalStorage）とマージ
    const userReports = getReports();
    const userSpots = userReports.map(report => ({
      id: `user_${report.id}`,
      name: report.name,
      name_en: report.name,
      category: report.category,
      lat: parseFloat(report.lat),
      lng: parseFloat(report.lng),
      address: report.address || 'ユーザー投稿スポット',
      address_en: 'User contributed spot',
      source: 'user_contributed',
      accessibility: report.accessibility || {},
      details: { comment: report.comment },
      verified_on: report.timestamp,
      userReportsCount: 1,
      trustScore: calculateTrustScore({ source: 'user_contributed', verified_on: report.timestamp, userReportsCount: 1 })
    }));

    allSpots = [...staticSpots, ...userSpots].map(spot => ({
      ...spot,
      trustScore: spot.trustScore || calculateTrustScore(spot)
    }));

    return allSpots;
  } catch (err) {
    console.error('Data load error:', err);
    return [];
  }
}

export function getAllSpots() {
  return allSpots;
}

export function getSpotById(id) {
  return allSpots.find(s => s.id === id);
}
