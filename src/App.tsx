import { useState, useMemo } from 'react';
import type { Movie } from './types/movie';
import { MOVIES_DATA } from './data/movies';
import { Navbar } from './components/Navbar';
import { FeaturedMovie } from './components/FeaturedMovie';
import { MovieGrid } from './components/MovieGrid';
import { BookingNoticeModal } from './components/BookingNoticeModal';
import { Footer } from './components/Footer';
import './App.css';

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedMovieForBooking, setSelectedMovieForBooking] = useState<Movie | null>(null);

  // Identify featured movie for the hero banner
  const featuredMovie = useMemo(() => {
    return MOVIES_DATA.find((m) => m.isFeatured) ?? MOVIES_DATA[0];
  }, []);

  // Compute unique list of genres from movie data
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    for (const movie of MOVIES_DATA) {
      for (const g of movie.genre) {
        genreSet.add(g);
      }
    }
    return ['All', ...Array.from(genreSet)];
  }, []);

  // Filter movies based on selected genre and search query
  const filteredMovies = useMemo(() => {
    return MOVIES_DATA.filter((movie) => {
      const matchesGenre =
        selectedGenre === 'All' || movie.genre.includes(selectedGenre);

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        movie.title.toLowerCase().includes(query) ||
        movie.genre.some((g) => g.toLowerCase().includes(query)) ||
        movie.language.toLowerCase().includes(query);

      return matchesGenre && matchesSearch;
    });
  }, [selectedGenre, searchQuery]);

  const handleBookTickets = (movie: Movie) => {
    setSelectedMovieForBooking(movie);
  };

  const handleCloseModal = () => {
    setSelectedMovieForBooking(null);
  };

  return (
    <div className="app-container">
      {/* 1. Header Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
      />

      {/* 2. Featured Movie Hero Banner */}
      <main>
        <FeaturedMovie
          movie={featuredMovie}
          onBookTickets={handleBookTickets}
        />

        {/* 3. Movie Grid with Genre Filters */}
        <MovieGrid
          movies={filteredMovies}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          availableGenres={availableGenres}
          onBookTickets={handleBookTickets}
        />
      </main>

      {/* 4. Footer */}
      <Footer />

      {/* 5. Booking Notice Modal (Frontend Feedback for Milestone 1) */}
      <BookingNoticeModal
        movie={selectedMovieForBooking}
        onClose={handleCloseModal}
      />
    </div>
  );
}

export default App;
