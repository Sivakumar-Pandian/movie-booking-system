import type { AuthUser } from '../types/auth';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  currentUser: AuthUser | null;
  onOpenAuth: () => void;
  onOpenBookings: () => void;
  onLogout: () => void;
  onOpenAdmin: () => void;
}

export const Navbar = ({
  searchQuery,
  onSearchChange,
  selectedCity,
  onCityChange,
  currentUser,
  onOpenAuth,
  onOpenBookings,
  onLogout,
  onOpenAdmin,
}: NavbarProps) => {
  return (
    <header className="navbar">
      {/* Top Utility Bar */}
      <div className="navbar-top">
        <div className="navbar-container">
          {/* Brand Logo */}
          <div className="nav-brand">
            <span className="brand-logo-icon">🎟️</span>
            <div className="brand-text-wrap">
              <span className="brand-name">YOZIGO</span>
              <span className="brand-sub">CINEMAS</span>
            </div>
          </div>

          {/* Search Box */}
          <div className="nav-search">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              placeholder="Search movies, genres, actors, or languages..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="search-input"
              aria-label="Search movies"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => onSearchChange('')}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>

          {/* Location Picker & User Actions */}
          <div className="nav-actions">
            <div className="nav-location" title="Select your cinema city">
              <span className="location-pin" aria-hidden="true">📍</span>
              <select
                value={selectedCity}
                onChange={(e) => onCityChange(e.target.value)}
                className="city-select"
                aria-label="Select City"
              >
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi-NCR">Delhi-NCR</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Chennai">Chennai</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Pune">Pune</option>
              </select>
            </div>

            {currentUser ? (
              <div className="nav-user-actions">
                <button
                  type="button"
                  className="btn btn-outline nav-bookings-btn"
                  onClick={onOpenBookings}
                  title="View your booked tickets"
                >
                  🎟️ My Tickets
                </button>
                {currentUser.role === 'ADMIN' && <button type="button" className="btn btn-outline nav-bookings-btn" onClick={onOpenAdmin}>Admin</button>}
                <div className="nav-user-profile" title={currentUser.email}>
                  <span className="avatar-icon">👤</span>
                  <span className="user-name-text">
                    {currentUser.full_name.split(' ')[0]}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary nav-logout-btn"
                  onClick={onLogout}
                  title="Log out of your account"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary nav-signin-btn"
                onClick={onOpenAuth}
              >
                <span className="avatar-icon">👤</span>
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Category Navigation Bar */}
      <div className="navbar-sub">
        <div className="navbar-container sub-container">
          <nav className="sub-nav-links">
            <a href="#movies" className="sub-link active">Now Showing</a>
            <a href="#movies" className="sub-link">Coming Soon</a>
            <a href="#theaters" className="sub-link">Cinemas & IMAX</a>
            <a href="#offers" className="sub-link">Offers & Discounts</a>
            <a href="#giftcards" className="sub-link">Gift Cards</a>
          </nav>
          <div className="sub-nav-perk">
            <span className="live-dot" />
            <span>Over 1,200+ Live Screens Today</span>
          </div>
        </div>
      </div>
    </header>
  );
};
