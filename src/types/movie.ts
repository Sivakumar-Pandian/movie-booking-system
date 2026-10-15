export interface Movie {
  id: string;
  title: string;
  genre: string[];
  duration: string; // e.g. "2h 45m"
  rating: number; // e.g. 8.9
  releaseYear: number;
  language: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl?: string;
  isFeatured?: boolean;
}
