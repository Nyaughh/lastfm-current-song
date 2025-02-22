import { Platform } from 'react-native';
import Constants from 'expo-constants';

// You can replace this with your API key directly if you're not using environment variables
export const LASTFM_API_KEY = 'd45eb9ca97772a4c7face8a85884b879';
export const LASTFM_BASE_URL = 'https://ws.audioscrobbler.com/2.0/';

export const getLastFmApiUrl = (method: string, username: string) => {
  const params = new URLSearchParams({
    method: method,
    user: username,
    api_key: LASTFM_API_KEY,
    format: 'json',
    limit: '1'  // We only need the most recent track
  });
  
  return `${LASTFM_BASE_URL}?${params.toString()}`;
}; 