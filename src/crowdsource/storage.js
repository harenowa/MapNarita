const STORAGE_KEY = 'narita_map_user_reports';

export function getReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveReport(reportData) {
  const reports = getReports();
  const newReport = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString().split('T')[0],
    ...reportData
  };
  reports.push(newReport);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  return newReport;
}
