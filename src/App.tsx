import { useState, useMemo } from 'react';
import type { Movie } from './types/movie';
import { MOVIES_DATA } from './data/movies';
import { Navbar } from './components/Navbar';
import { FeaturedMovie } from './components/FeaturedMovie';
import { MovieGrid } from './components/MovieGrid';
import { CinemaPerks } from './components/CinemaPerks';
import { BookingNoticeModal } from './components/BookingNoticeModal';
import { TrailerModal } from './components/TrailerModal';
import { Footer } from './components/Footer';
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All Formats');
  const [sortBy, setSortBy] = useState('featured');

  // Featured movies for the marquee carousel
  const featuredList = useMemo(() => {
    return MOVIES_DATA.filter((m) => m.isFeatured);
  }, []);

  const [activeFeaturedMovie, setActiveFeaturedMovie] = useState<Movie>(() => {
    return featuredList[0] ?? MOVIES_DATA[0];
  });

  // Modal states
  const [bookingMovie, setBookingMovie] = useState<Movie | null>(null);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);

  // Compute unique genres
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    for (const movie of MOVIES_DATA) {
      for (const g of movie.genre) {
        genreSet.add(g);
      }
    }
    return ['All', ...Array.from(genreSet)];
  }, []);

  // Formats available in modern cinemas
  const availableFormats = useMemo(() => {
    return ['All Formats', 'IMAX 3D', '4DX', 'Dolby Cinema', '2D'];
  }, []);

  // Filter & Sort movies
  const displayedMovies = useMemo(() => {
    const result = MOVIES_DATA.filter((movie) => {
      // 1. Genre filter
      const matchesGenre =
        selectedGenre === 'All' || movie.genre.includes(selectedGenre);

      // 2. Format filter
      const matchesFormat =
        selectedFormat === 'All Formats' ||
        movie.formats.some((f) =>
          f.toLowerCase().includes(selectedFormat.toLowerCase().replace('all formats', ''))
        );

      // 3. Search query (title, genre, cast, director, language)
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q === '' ||
        movie.title.toLowerCase().includes(q) ||
        movie.language.toLowerCase().includes(q) ||
        movie.genre.some((g) => g.toLowerCase().includes(q)) ||
        (movie.director && movie.director.toLowerCase().includes(q)) ||
        (movie.cast && movie.cast.some((actor) => actor.toLowerCase().includes(q)));

      return matchesGenre && matchesFormat && matchesSearch;
    });

    // Sort order
    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [selectedGenre, selectedFormat, searchQuery, sortBy]);

  const handleResetFilters = () => {
    setSelectedGenre('All');
    setSelectedFormat('All Formats');
    setSearchQuery('');
    setSortBy('featured');
  };

  return (
    <div className="yozigo-app">
      {/* 1. Header Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      />

      <main className="main-content">
        {/* 2. Cinematic Featured Hero Marquee */}
        <FeaturedMovie
          featuredMovies={featuredList}
          activeMovie={activeFeaturedMovie}
          onSelectMovie={setActiveFeaturedMovie}
          onBookTickets={(movie) => setBookingMovie(movie)}
          onWatchTrailer={(movie) => setTrailerMovie(movie)}
        />

        {/* 3. Assurance & Perks Strip */}
        <CinemaPerks />

        {/* 4. Movie Catalog Grid */}
        <MovieGrid
          movies={displayedMovies}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          availableGenres={availableGenres}
          selectedFormat={selectedFormat}
          onSelectFormat={setSelectedFormat}
          availableFormats={availableFormats}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onBookTickets={(movie) => setBookingMovie(movie)}
          onWatchTrailer={(movie) => setTrailerMovie(movie)}
          onResetFilters={handleResetFilters}
        />
      </main>

      {/* 5. Footer */}
      <Footer />

      {/* 6. Booking Flow Modal */}
      <BookingNoticeModal
        movie={bookingMovie}
        onClose={() => setBookingMovie(null)}
        selectedCity={selectedCity}
      />

      {/* 7. Trailer Video Modal */}
      <TrailerModal
        movie={trailerMovie}
        onClose={() => setTrailerMovie(null)}
        onBookTickets={(movie) => setBookingMovie(movie)}
      />
    </div>
  );
}

export default App;
