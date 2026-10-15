import { useState, useMemo } from 'react';
import type { Movie } from './types/movie';
import type { BookingSelection, ConfirmedBooking } from './types/booking';
import { MOVIES_DATA } from './data/movies';
import { Navbar } from './components/Navbar';
import { FeaturedMovie } from './components/FeaturedMovie';
import { MovieGrid } from './components/MovieGrid';
import { CinemaPerks } from './components/CinemaPerks';
import { ShowtimeSelection } from './components/ShowtimeSelection';
import { SeatSelection } from './components/SeatSelection';
import { BookingSummary } from './components/BookingSummary';
import { TrailerModal } from './components/TrailerModal';
import { Footer } from './components/Footer';
import './App.css';

// The 4 main views in our application
type AppView = 'LISTING' | 'SHOWTIMES' | 'SEAT_SELECTION' | 'BOOKING_SUMMARY';

function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<AppView>('LISTING');

  // Booking Data States
  const [selectedMovieForBooking, setSelectedMovieForBooking] = useState<Movie | null>(null);
  const [activeBookingSelection, setActiveBookingSelection] = useState<BookingSelection | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<ConfirmedBooking | null>(null);

  // Search, City & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All Formats');
  const [sortBy, setSortBy] = useState('featured');

  // Featured movies for marquee
  const featuredList = useMemo(() => {
    return MOVIES_DATA.filter((m) => m.isFeatured);
  }, []);

  const [activeFeaturedMovie, setActiveFeaturedMovie] = useState<Movie>(() => {
    return featuredList[0] ?? MOVIES_DATA[0];
  });

  // Modal State for Video Trailers
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);

  // Computed Genre & Format list
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    for (const movie of MOVIES_DATA) {
      for (const g of movie.genre) {
        genreSet.add(g);
      }
    }
    return ['All', ...Array.from(genreSet)];
  }, []);

  const availableFormats = useMemo(() => {
    return ['All Formats', 'IMAX 3D', '4DX', 'Dolby Cinema', '2D'];
  }, []);

  // Filtered & Sorted Movie List
  const displayedMovies = useMemo(() => {
    const result = MOVIES_DATA.filter((movie) => {
      const matchesGenre =
        selectedGenre === 'All' || movie.genre.includes(selectedGenre);

      const matchesFormat =
        selectedFormat === 'All Formats' ||
        movie.formats.some((f) =>
          f.toLowerCase().includes(selectedFormat.toLowerCase().replace('all formats', ''))
        );

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

    if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [selectedGenre, selectedFormat, searchQuery, sortBy]);

  // Handler: When user clicks "Book Tickets" on any movie
  const handleStartBooking = (movie: Movie) => {
    setSelectedMovieForBooking(movie);
    setCurrentView('SHOWTIMES');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Return back to movie catalog
  const handleBackToListing = () => {
    setCurrentView('LISTING');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: User confirms showtime and clicks "Continue to Seats"
  const handleContinueToSeats = (selection: BookingSelection) => {
    setActiveBookingSelection(selection);
    setCurrentView('SEAT_SELECTION');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: From seat selection, go back to change showtime
  const handleBackToShowtimes = () => {
    setCurrentView('SHOWTIMES');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: User confirms seat choices and proceeds to summary
  const handleProceedToSummary = (selectedSeats: string[], totalPrice: number) => {
    if (!activeBookingSelection) return;
    setConfirmedBooking({
      selection: activeBookingSelection,
      selectedSeats,
      pricePerSeat: activeBookingSelection.showtime.price,
      totalPrice,
    });
    setCurrentView('BOOKING_SUMMARY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: From summary, go back to edit seats
  const handleBackToSeats = () => {
    setCurrentView('SEAT_SELECTION');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        {/* VIEW 1: Movie Listing Homepage */}
        {currentView === 'LISTING' && (
          <>
            <FeaturedMovie
              featuredMovies={featuredList}
              activeMovie={activeFeaturedMovie}
              onSelectMovie={setActiveFeaturedMovie}
              onBookTickets={handleStartBooking}
              onWatchTrailer={(movie) => setTrailerMovie(movie)}
            />

            <CinemaPerks />

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
              onBookTickets={handleStartBooking}
              onWatchTrailer={(movie) => setTrailerMovie(movie)}
              onResetFilters={handleResetFilters}
            />
          </>
        )}

        {/* VIEW 2: Movie Details & Showtime Selection */}
        {currentView === 'SHOWTIMES' && selectedMovieForBooking && (
          <ShowtimeSelection
            movie={selectedMovieForBooking}
            selectedCity={selectedCity}
            onBackToListing={handleBackToListing}
            onContinueToSeats={handleContinueToSeats}
          />
        )}

        {/* VIEW 3: Interactive Seat Selection (Milestone 3) */}
        {currentView === 'SEAT_SELECTION' && activeBookingSelection && (
          <SeatSelection
            booking={activeBookingSelection}
            onBackToShowtimes={handleBackToShowtimes}
            onProceedToSummary={handleProceedToSummary}
          />
        )}

        {/* VIEW 4: Booking Summary Preview (Milestone 3) */}
        {currentView === 'BOOKING_SUMMARY' && confirmedBooking && (
          <BookingSummary
            confirmedBooking={confirmedBooking}
            onBackToSeats={handleBackToSeats}
            onBackToListing={handleBackToListing}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Video Trailer Modal */}
      <TrailerModal
        movie={trailerMovie}
        onClose={() => setTrailerMovie(null)}
        onBookTickets={handleStartBooking}
      />
    </div>
  );
}

export default App;
