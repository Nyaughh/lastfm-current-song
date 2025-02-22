import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLastFmApiUrl } from '../config/lastfm';
import { CurrentTrack, UserTrack } from '../types/lastfm';

const STORAGE_KEY = '@lastfm_usernames';

const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const date = new Date(timestamp * 1000);
  const diffInMinutes = Math.floor((now - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes === 1) return '1 minute ago';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours === 1) return '1 hour ago';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString();
};

export const useLastFm = () => {
  const [usernames, setUsernames] = useState<string[]>([]);
  const [userTracks, setUserTracks] = useState<UserTrack[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsernames();
  }, []);

  useEffect(() => {
    if (usernames.length > 0) {
      const interval = setInterval(() => {
        fetchAllCurrentTracks();
      }, 30000); // Update every 30 seconds

      fetchAllCurrentTracks(); // Initial fetch
      return () => clearInterval(interval);
    }
  }, [usernames]);

  const loadUsernames = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUsernames(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading usernames:', error);
    }
  };

  const saveUsernames = async (newUsernames: string[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUsernames));
    } catch (error) {
      console.error('Error saving usernames:', error);
    }
  };

  const addUsername = async (username: string) => {
    if (!usernames.includes(username)) {
      const newUsernames = [...usernames, username];
      setUsernames(newUsernames);
      await saveUsernames(newUsernames);
      fetchCurrentTrack(username);
    }
  };

  const removeUsername = async (username: string) => {
    const newUsernames = usernames.filter(u => u !== username);
    setUsernames(newUsernames);
    await saveUsernames(newUsernames);
    setUserTracks(prev => prev.filter(track => track.username !== username));
  };

  const fetchCurrentTrack = async (username: string) => {
    try {
      console.log('Fetching tracks for:', username);
      const url = getLastFmApiUrl('user.getrecenttracks', username);
      console.log('API URL:', url);
      
      const response = await axios.get(url);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
      if (response.data.error) {
        throw new Error(response.data.message || 'Last.fm API error');
      }

      const track = response.data.recenttracks?.track?.[0];
      
      if (track) {
        const currentTrack: CurrentTrack = {
          artist: track.artist['#text'],
          title: track.name,
          album: track.album['#text'],
          image: track.image?.[2]?.['#text'],
          url: track.url,
          isNowPlaying: !!track['@attr']?.nowplaying,
          timestamp: track.date?.uts ? formatTimestamp(parseInt(track.date.uts)) : undefined
        };

        setUserTracks(prev => {
          const existing = prev.findIndex(ut => ut.username === username);
          if (existing !== -1) {
            const newTracks = [...prev];
            newTracks[existing] = { username, currentTrack };
            return newTracks;
          }
          return [...prev, { username, currentTrack }];
        });
      } else {
        throw new Error('No recent tracks found');
      }
    } catch (error) {
      console.error(`Error fetching track for ${username}:`, error);
      const errorMessage = error instanceof Error ? error.message : 
        ((error as AxiosError)?.response?.data as any)?.message || 'Failed to fetch current track';
      
      setUserTracks(prev => {
        const existing = prev.findIndex(ut => ut.username === username);
        if (existing !== -1) {
          const newTracks = [...prev];
          newTracks[existing] = { 
            username, 
            currentTrack: null, 
            error: errorMessage
          };
          return newTracks;
        }
        return [...prev, { 
          username, 
          currentTrack: null, 
          error: errorMessage
        }];
      });
    }
  };

  const fetchAllCurrentTracks = async () => {
    setLoading(true);
    await Promise.all(usernames.map(username => fetchCurrentTrack(username)));
    setLoading(false);
  };

  return {
    usernames,
    userTracks,
    loading,
    addUsername,
    removeUsername,
    refreshTracks: fetchAllCurrentTracks
  };
}; 