export function getCategoryIconSVG(category) {
  const icons = {
    toilet: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 12h10M12 7v10M9 21h6"/></svg>`,
    nurseryRoom: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5z"/></svg>`,
    shop: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
    facility: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/></svg>`,
    airport: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.8-.2-1.6.1-2.1.7l-.7.7 5.7 3.6-3.6 3.6-2.4-.6-.7.7 2.8 2.8 2.8 2.8.7-.7-.6-2.4 3.6-3.6 3.6 5.7.7-.7c.6-.5.9-1.3.7-2.1z"/></svg>`,
    busStop: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 6v6M15 6v6M4 11h16M2 18h20M7 22v-4M17 22v-4"/></svg>`,
    coolingShelter: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07M12 6l-2-2m4 0l-2 2M12 18l-2 2m4 0l-2-2M6 12l-2-2m0 4l2-2M18 12l2-2m0 4l-2-2"/></svg>`,
    evacuation: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>`
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
