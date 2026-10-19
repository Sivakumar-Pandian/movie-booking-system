import { useState, useMemo, useEffect, useCallback } from 'react';
import type { Movie } from './types/movie';
import type { BookingSelection, BookingConfirmation } from './types/booking';
import type { AuthUser } from './types/auth';
import { fetchMoviesFromApi } from './services/movieApi';
import { getStoredUser, getStoredToken, clearStoredAuth, fetchMeApi } from './services/authApi';
import { Navbar } from './components/Navbar';
import { FeaturedMovie } from './components/FeaturedMovie';
import { MovieGrid } from './components/MovieGrid';
import { CinemaPerks } from './components/CinemaPerks';
import { ShowtimeSelection } from './components/ShowtimeSelection';
import { SeatSelection } from './components/SeatSelection';
import { BookingSummary } from './components/BookingSummary';
import { BookingConfirmationView } from './components/BookingConfirmationView';
import { TrailerModal } from './components/TrailerModal';
import { AuthModal } from './components/AuthModal';
import { MyBookingsModal } from './components/MyBookingsModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Footer } from './components/Footer';
import './App.css';

// The 5 views in our booking workflow
type AppView = 'LISTING' | 'SHOWTIMES' | 'SEAT_SELECTION' | 'BOOKING_SUMMARY' | 'CONFIRMATION';

function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<AppView>('LISTING');

  // Authentication & User States
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMessage, setAuthModalMessage] = useState<string | undefined>();
  const [isBookingsModalOpen, setIsBookingsModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Backend Live Movie Data States
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Booking Data States
  const [selectedMovieForBooking, setSelectedMovieForBooking] = useState<Movie | null>(null);
  const [activeBookingSelection, setActiveBookingSelection] = useState<BookingSelection | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatSelectionError, setSeatSelectionError] = useState<string | null>(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [activeConfirmation, setActiveConfirmation] = useState<BookingConfirmation | null>(null);

  // Search, City & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedFormat, setSelectedFormat] = useState('All Formats');
  const [sortBy, setSortBy] = useState('featured');

  // Modal State for Video Trailers
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);

  // Fetch movies on initial mount
  useEffect(() => {
    let isMounted = true;

    fetchMoviesFromApi()
      .then((data) => {
        if (isMounted) {
          setMovies(data);
          setIsLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const message =
            err instanceof Error
              ? err.message
              : 'Unable to connect to the backend server. Please verify FastAPI is running.';
          setFetchError(message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Validate active session token with backend /api/auth/me
  useEffect(() => {
    if (getStoredToken()) {
      fetchMeApi()
        .then((user) => setCurrentUser(user))
        .catch(() => setCurrentUser(null));
    }
  }, []);

  const handleOpenAuth = (msg?: string) => {
    setAuthModalMessage(msg);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    clearStoredAuth();
    setCurrentUser(null);
  };

  const handleAdminMoviesChange = useCallback((updatedMovies: Movie[]) => {
    setMovies(updatedMovies);
    setSelectedMovieForBooking((current) =>
      current ? updatedMovies.find((movie) => movie.id === current.id) ?? null : null,
    );
    setTrailerMovie((current) =>
      current ? updatedMovies.find((movie) => movie.id === current.id) ?? null : null,
    );
  }, []);

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setIsAuthModalOpen(false);
  };

  // Explicit user-triggered retry
  const handleRetry = () => {
    setIsLoading(true);
    setFetchError(null);

    fetchMoviesFromApi()
      .then((data) => {
        setMovies(data);
        setIsLoading(false);
      })
      .catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to connect to the backend server. Please verify FastAPI is running.';
        setFetchError(message);
        setIsLoading(false);
      });
  };

  // Featured movies derived from live backend data
  const featuredList = useMemo(() => {
    const featured = movies.filter((m) => m.isFeatured);
    return featured.length > 0 ? featured : movies;
  }, [movies]);

  // Active movie for hero banner
  const [selectedFeaturedId, setSelectedFeaturedId] = useState<string | null>(null);

  const activeFeaturedMovie = useMemo(() => {
    if (selectedFeaturedId) {
      const found = featuredList.find((m) => m.id === selectedFeaturedId);
      if (found) return found;
    }
    return featuredList[0] ?? null;
  }, [featuredList, selectedFeaturedId]);

  // Computed Genre & Format list derived from fetched movies
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    for (const movie of movies) {
      for (const g of movie.genre) {
        genreSet.add(g);
      }
    }
    return ['All', ...Array.from(genreSet)];
  }, [movies]);

  const availableFormats = useMemo(() => {
    return ['All Formats', 'IMAX 3D', '4DX', 'Dolby Cinema', '2D'];
  }, []);

  // Filtered & Sorted Movie List
  const displayedMovies = useMemo(() => {
    const result = movies.filter((movie) => {
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
  }, [movies, selectedGenre, selectedFormat, searchQuery, sortBy]);

  // Handler: When user clicks "Book Tickets" on any movie
  const handleStartBooking = (movie: Movie) => {
    setSelectedMovieForBooking(movie);
    setSelectedSeats([]); // reset seats for fresh booking
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

  // Handler: Toggle a seat in the lifted selectedSeats state
  const handleToggleSeat = (seatId: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        setSeatSelectionError(null);
        return prev.filter((id) => id !== seatId);
      }
      if (prev.length >= 6) {
        setSeatSelectionError('You can select a maximum of 6 seats per booking.');
        return prev;
      }
      setSeatSelectionError(null);
      return [...prev, seatId];
    });
  };

  // Handler: From seat selection, go back to change showtime
  const handleBackToShowtimes = () => {
    setCurrentView('SHOWTIMES');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: User confirms seat choices and proceeds to summary
  const handleProceedToSummary = () => {
    setCurrentView('BOOKING_SUMMARY');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: From summary, go back to edit seats (preserving selections)
  const handleBackToSeats = () => {
    setCurrentView('SEAT_SELECTION');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Simulated payment success
  const handlePaymentSuccess = (confirmation: BookingConfirmation) => {
    setActiveConfirmation(confirmation);
    setCurrentView('CONFIRMATION');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler: Start another booking / return to listing
  const handleBookAnother = () => {
    setSelectedMovieForBooking(null);
    setActiveBookingSelection(null);
    setSelectedSeats([]);
    setActiveConfirmation(null);
    setCurrentView('LISTING');
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
        currentUser={currentUser}
        onOpenAuth={() => handleOpenAuth()}
        onOpenBookings={() => {
          if (!currentUser) {
            handleOpenAuth('Sign in to view your booked tickets');
          } else {
            setIsBookingsModalOpen(true);
          }
        }}
        onLogout={handleLogout}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <main className="main-content">
        {/* VIEW 1: Movie Listing Homepage with Live API Data */}
        {currentView === 'LISTING' && (
          <>
            {/* Case A: Loading State */}
            {isLoading && (
              <div className="api-status-banner api-loading-banner" role="status">
                <span className="api-spinner" />
                <div className="status-text-wrap">
                  <h3>Connecting to Yozigo FastAPI Backend...</h3>
                  <p>Fetching the latest movie listings from <code>/api/movies</code></p>
                </div>
              </div>
            )}

            {/* Case B: Error State with Retry Button */}
            {!isLoading && fetchError && (
              <div className="api-status-banner api-error-banner" role="alert">
                <span className="status-icon">⚠️</span>
                <div className="status-text-wrap">
                  <h3>Failed to Load Movies from Backend</h3>
                  <p className="error-detail">{fetchError}</p>
                  <p className="error-hint">
                    Check that the backend server is running and reachable.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary retry-btn"
                  onClick={handleRetry}
                >
                  ↻ Retry Connection
                </button>
              </div>
            )}

            {/* Case C: Empty Movies List */}
            {!isLoading && !fetchError && movies.length === 0 && (
              <div className="api-status-banner api-empty-banner" role="status">
                <span className="status-icon">🎬</span>
                <div className="status-text-wrap">
                  <h3>No Movies in Catalog</h3>
                  <p>The backend endpoint returned an empty list of movies.</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleRetry}
                >
                  Refresh
                </button>
              </div>
            )}

            {/* Case D: Loaded Movies Successfully */}
            {!isLoading && !fetchError && movies.length > 0 && (
              <>
                {activeFeaturedMovie && (
                  <FeaturedMovie
                    featuredMovies={featuredList}
                    activeMovie={activeFeaturedMovie}
                    onSelectMovie={(movie) => setSelectedFeaturedId(movie.id)}
                    onBookTickets={handleStartBooking}
                    onWatchTrailer={(movie) => setTrailerMovie(movie)}
                  />
                )}

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

        {/* VIEW 3: Interactive Seat Selection */}
        {currentView === 'SEAT_SELECTION' && activeBookingSelection && (
          <>
          <SeatSelection
            booking={activeBookingSelection}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
            onBackToShowtimes={handleBackToShowtimes}
            onProceedToSummary={handleProceedToSummary}
            currentUser={currentUser}
            onRequestAuth={() => handleOpenAuth('Please sign in to hold seats for five minutes.')}
            onHoldCreated={setHoldExpiresAt}
          />
          {seatSelectionError && <p className="seat-selection-limit" role="alert">{seatSelectionError}</p>}
          </>
        )}

        {/* VIEW 4: Booking Summary & Mock Payment Gateway */}
        {currentView === 'BOOKING_SUMMARY' && activeBookingSelection && (
          <BookingSummary
            selection={activeBookingSelection}
            selectedSeats={selectedSeats}
            currentUser={currentUser}
            onRequestAuth={() =>
              handleOpenAuth('Please sign in or create an account to confirm your ticket booking.')
            }
            onBackToSeats={handleBackToSeats}
            onPaymentSuccess={handlePaymentSuccess}
            holdExpiresAt={holdExpiresAt}
          />
        )}

        {/* VIEW 5: Digital Ticket Confirmation */}
        {currentView === 'CONFIRMATION' && activeConfirmation && (
          <BookingConfirmationView
            confirmation={activeConfirmation}
            onBookAnother={handleBookAnother}
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

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        message={authModalMessage}
      />

      {/* My Bookings History Modal */}
      <MyBookingsModal
        isOpen={isBookingsModalOpen}
        onClose={() => setIsBookingsModalOpen(false)}
        currentUser={currentUser}
      />
      <AdminDashboard
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onMoviesChange={handleAdminMoviesChange}
      />
    </div>
  );
}

export default App;
