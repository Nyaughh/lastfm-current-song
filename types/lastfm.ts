export interface CurrentTrack {
  artist: string;
  title: string;
  album?: string;
  image?: string;
  url?: string;
  isNowPlaying: boolean;
  timestamp?: string;
}

export interface UserTrack {
  username: string;
  currentTrack: CurrentTrack | null;
  error?: string;
} 