export interface ItunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
  releaseDate?: string;
}

export interface ItunesSearchResponse {
  resultCount: number;
  results: ItunesTrack[];
}
