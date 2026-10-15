const CURRENT_YEAR = new Date().getFullYear();

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="brand-icon" aria-hidden="true">🎬</span>
            <span className="brand-name">Yozigo</span>
          </div>
          <p className="footer-tagline">
            Your premier destination for hassle-free movie ticket bookings. Experience cinema at its finest.
          </p>
        </div>

        <div className="footer-links-group">
          <h4>Explore</h4>
          <ul>
            <li><a href="#movies">Now Showing</a></li>
            <li><a href="#movies">Upcoming Releases</a></li>
            <li><a href="#theaters">Cinemas & IMAX</a></li>
            <li><a href="#offers">Exclusive Offers</a></li>
          </ul>
        </div>

        <div className="footer-links-group">
          <h4>Help & Support</h4>
          <ul>
            <li><a href="#faq">Frequently Asked Questions</a></li>
            <li><a href="#terms">Terms of Service</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
            <li><a href="#contact">Contact Support</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {CURRENT_YEAR} Yozigo Movies Pvt Ltd. All rights reserved.</p>
        <p className="footer-build-tag">Milestone 1 • Built with React & TypeScript</p>
      </div>
    </footer>
  );
};
