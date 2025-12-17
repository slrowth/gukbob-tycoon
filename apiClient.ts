// Google Sheets API Client
// Updated to prevent caching and ensure real-time data retrieval.

const STORAGE_KEY = '_sys_pref_v1';

// Helper: Decode local storage to get the Google Script URL
export const getApiConfig = () => {
  if (typeof window === 'undefined') return '';
  
  try {
    const encoded = localStorage.getItem(STORAGE_KEY);
    if (!encoded) return '';
    
    const jsonStr = atob(encoded); 
    const config = JSON.parse(jsonStr);
    return config.url || '';
  } catch (e) {
    return '';
  }
};

export const isApiConfigured = () => {
  return !!getApiConfig();
};

export const fetchLeaderboard = async () => {
  const baseUrl = getApiConfig();
  if (!baseUrl) return [];

  try {
    // Add a timestamp to the URL to prevent browser caching (Cache Buster)
    const url = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data; // Expected [{ nickname, score, created_at }, ...]
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return [];
  }
};

export const submitScore = async (nickname: string, score: number) => {
  const url = getApiConfig();
  if (!url) return { success: false };

  try {
    // Google Apps Script requires text/plain for CORS simple requests to avoid preflight issues.
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Important: Google Script opaque response
      headers: {
        'Content-Type': 'text/plain', 
      },
      body: JSON.stringify({ nickname, score })
    });
    
    // In 'no-cors' mode, we cannot read the response, so we assume success.
    return { success: true };
  } catch (error) {
    console.error("Failed to submit score:", error);
    return { success: false };
  }
};