// Google Sheets API Client
// Hardcoded with the provided URL for permanent connection.

const HARDCODED_URL = 'https://script.google.com/macros/s/AKfycbwcviVtE4MCeiRVSZhWS1YmNp39cCNZcFsgs_FAgAgKXo_Yw9hu3q_hHOc6tzq_PfNjwQ/exec';

// Helper: Returns the hardcoded Google Script URL
export const getApiConfig = () => {
  return HARDCODED_URL;
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