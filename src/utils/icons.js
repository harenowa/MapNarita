export function getCategoryIconSVG(category) {
  const icons = {
    toilet: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 12h10M12 7v10M9 21h6"/></svg>`,
    nurseryRoom: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5z"/></svg>`,
    shop: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
    facility: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>`,
    airport: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.8-.2-1.6.1-2.1.7l-.7.7 5.7 3.6-3.6 3.6-2.4-.6-.7.7 2.8 2.8 2.8 2.8.7-.7-.6-2.4 3.6-3.6 3.6 5.7.7-.7c.6-.5.9-1.3.7-2.1z"/></svg>`,
    busStop: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6M15 6v6M4 11h16M2 18h20M7 22v-4M17 22v-4"/></svg>`
  };
  return icons[category] || icons.facility;
}

export function getAttrIconSVG(attr) {
  const icons = {
    wheelchair: `♿`,
    ostomate: `🚾`,
    babyChanging: `👶`,
    nursingRoom: `🍼`,
    elevator: `🛗`,
    handrail: `🦯`,
    westernStyle: `🚽`,
    maleUsableNursing: `👨‍🍼`
  };
  return icons[attr] || `✨`;
}
