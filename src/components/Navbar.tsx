interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
}

export const Navbar = ({
  searchQuery,
  onSearchChange,
  selectedCity,
  onCityChange,
}: NavbarProps) => {
  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="nav-brand">
          <span className="brand-icon" aria-hidden="true">🎬</span>
          <span className="brand-name">Yozigo</span>
          <span className="brand-badge">CINEMAS</span>
        </div>

        {/* Location selector */}
        <div className="nav-location">
          <span className="location-icon" aria-hidden="true">📍</span>
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
          </select>
        </div>

        {/* Search Input */}
        <div className="nav-search">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Search movies, genres..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
            aria-label="Search movies"
          />
        </div>

        {/* Navigation links & action */}
        <nav className="nav-links">
          <a href="#movies" className="nav-link active">Movies</a>
          <a href="#theaters" className="nav-link">Theaters</a>
          <a href="#offers" className="nav-link">Offers</a>
          <button
            type="button"
            className="btn btn-secondary nav-btn"
            onClick={() => alert('Sign In functionality will be added in upcoming milestones!')}
          >
            Sign In
          </button>
        </nav>
      </div>
    </header>
  );
};
