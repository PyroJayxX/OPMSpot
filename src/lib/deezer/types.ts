export interface DeezerArtist {
  name: string;
}

export interface DeezerAlbum {
  id: number;
  cover_medium: string;
}

export interface DeezerTrack {
  id: number;
  title: string;
  rank: number;
  preview: string;
  artist: DeezerArtist;
  album: DeezerAlbum;
}

export interface DeezerPlaylistTracksResponse {
  data: DeezerTrack[];
  error?: { type: string; message: string; code: number };
}
