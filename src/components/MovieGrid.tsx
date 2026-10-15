import type { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  movies: Movie[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  availableGenres: string[];
  onBookTickets: (movie: Movie) => void;
}

export const MovieGrid = ({
  movies,
  selectedGenre,
  onSelectGenre,
  availableGenres,
  onBookTickets,
}: MovieGridProps) => {
  return (
    <section id="movies" className="movie-section" aria-label="Movies Now Showing">
      <div className="section-header">
        <div className="section-title-wrap">
          <h2 className="section-title">Now Showing</h2>
          <span className="movie-count">({movies.length} {movies.length === 1 ? 'Movie' : 'Movies'})</span>
        </div>

        {/* Genre filter buttons */}
        <div className="genre-filters" role="tablist" aria-label="Genre Filters">
          {availableGenres.map((genre) => (
            <button
              key={genre}
              type="button"
              role="tab"
              aria-selected={selectedGenre === genre}
              className={`filter-btn ${selectedGenre === genre ? 'active' : ''}`}
              onClick={() => onSelectGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {movies.length > 0 ? (
        <div className="movie-grid">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onBookTickets={onBookTickets}
            />
          ))}
        </div>
      ) : (
        <div className="no-movies">
          <div className="no-movies-icon">🎬</div>
          <h3>No movies found</h3>
          <p>Try adjusting your search query or selecting a different genre.</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onSelectGenre('All')}
          >
            Show All Movies
          </button>
        </div>
      )}
    </section>
  );
};
