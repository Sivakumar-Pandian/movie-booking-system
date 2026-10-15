import type { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';

interface MovieGridProps {
  movies: Movie[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  availableGenres: string[];
  selectedFormat: string;
  onSelectFormat: (format: string) => void;
  availableFormats: string[];
  sortBy: string;
  onSortChange: (sort: string) => void;
  onBookTickets: (movie: Movie) => void;
  onWatchTrailer: (movie: Movie) => void;
  onResetFilters: () => void;
}

export const MovieGrid = ({
  movies,
  selectedGenre,
  onSelectGenre,
  availableGenres,
  selectedFormat,
  onSelectFormat,
  availableFormats,
  sortBy,
  onSortChange,
  onBookTickets,
  onWatchTrailer,
  onResetFilters,
}: MovieGridProps) => {
  return (
    <section id="movies" className="cinema-catalog-section" aria-label="Movies Catalog">
      <div className="catalog-container">
        {/* Top Control Bar */}
        <div className="catalog-header">
          <div className="catalog-title-box">
            <h2 className="catalog-title">Now Showing in Cinemas</h2>
            <p className="catalog-subtitle">
              Explore {movies.length} {movies.length === 1 ? 'blockbuster' : 'blockbusters'} currently running on big screens
            </p>
          </div>

          {/* Sort By Dropdown */}
          <div className="catalog-sort-box">
            <label htmlFor="sort-select" className="sort-label">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="sort-dropdown"
            >
              <option value="featured">Featured / Trending</option>
              <option value="rating">Top Rated (Highest first)</option>
              <option value="title">Alphabetical (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Filters Bar: Formats & Genres */}
        <div className="filters-strip">
          {/* Format Chips (IMAX, 4DX, 2D) */}
          <div className="filter-group format-chips" role="group" aria-label="Cinema Format Filter">
            {availableFormats.map((fmt) => (
              <button
                key={fmt}
                type="button"
                className={`format-chip ${selectedFormat === fmt ? 'active' : ''}`}
                onClick={() => onSelectFormat(fmt)}
              >
                {fmt}
              </button>
            ))}
          </div>

          <div className="filter-divider" />

          {/* Genre Tabs */}
          <div className="filter-group genre-tabs" role="tablist" aria-label="Genre Filter">
            {availableGenres.map((genre) => (
              <button
                key={genre}
                type="button"
                role="tab"
                aria-selected={selectedGenre === genre}
                className={`genre-tab-btn ${selectedGenre === genre ? 'active' : ''}`}
                onClick={() => onSelectGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Movies Grid */}
        {movies.length > 0 ? (
          <div className="movies-responsive-grid">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onBookTickets={onBookTickets}
                onWatchTrailer={onWatchTrailer}
              />
            ))}
          </div>
        ) : (
          <div className="catalog-empty-state">
            <div className="empty-icon">🎞️</div>
            <h3>No movies match your filters</h3>
            <p>
              We couldn't find any films matching the selected format or genre in this city.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onResetFilters}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
