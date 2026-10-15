export interface Movie {
  id: string;
  title: string;
  genre: string[];
  duration: string; // e.g. "2h 49m"
  rating: number; // e.g. 8.9
  votes: string; // e.g. "142.5K"
  certification: string; // e.g. "UA 16+", "PG-13"
  formats: string[]; // e.g. ["2D", "3D", "IMAX 3D", "4DX"]
  releaseYear: number;
  language: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl?: string;
  isFeatured?: boolean;
  director?: string;
  cast?: string[];
  trailerYoutubeId?: string; // e.g. YouTube ID for trailer preview
}
