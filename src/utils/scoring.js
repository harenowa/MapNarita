/**
 * 要件書 5項に基づく信頼性スコア計算
 * S(i) = α * G(i) + β * V(i) + γ * log(1 + U(i))
 */
export function calculateTrustScore(spot) {
  const alpha = 0.5; // 行政データ
  const beta = 0.3;  // 現地確認済み
  const gamma = 0.2; // ユーザー検証数

  const G = (spot.source === 'narita_city' || spot.source === 'narita_airport' || spot.source === 'mlit_p14') ? 1 : 0;
  const V = spot.verified_on ? 1 : 0;
  const U = spot.userReportsCount || 0;

  const score = alpha * G + beta * V + gamma * Math.log1p(U);
  return Math.min(1.0, Math.round(score * 100) / 100);
}

export function getTrustBadgeInfo(score) {
  if (score >= 0.85) {
    return { label: '高信頼', class: 'trust-high', icon: '⭐' };
  } else if (score >= 0.5) {
    return { label: '確認済', class: 'trust-mid', icon: '✅' };
  } else {
    return { label: '要確認', class: 'trust-low', icon: '⚠️' };
  }
}
