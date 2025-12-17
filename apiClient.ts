// Google Sheets as a Database Client

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
  const url = getApiConfig();
  if (!url) return [];

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data; // Expected [{ rank, nickname, score, date }, ...]
  } catch (error) {
    console.error("Failed to fetch leaderboard:", error);
    return [];
  }
};

export const submitScore = async (nickname: string, score: number) => {
  const url = getApiConfig();
  if (!url) return { success: false };

  try {
    // Google Apps Script requires text/plain for CORS simple requests to avoid preflight issues
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Important: Google Script opaque response
      headers: {
        'Content-Type': 'text/plain', 
      },
      body: JSON.stringify({ nickname, score })
    });
    
    // Because of 'no-cors', we can't read the response body or status correctly in standard browser JS.
    // We assume success if no network error occurred.
    return { success: true };
  } catch (error) {
    console.error("Failed to submit score:", error);
    return { success: false };
  }
};