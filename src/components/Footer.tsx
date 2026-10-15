const CURRENT_YEAR = new Date().getFullYear();

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top-container">
        <div className="footer-col brand-col">
          <div className="footer-brand">
            <span className="brand-logo-icon">🎟️</span>
            <div className="brand-text-wrap">
              <span className="brand-name">YOZIGO</span>
              <span className="brand-sub">CINEMAS</span>
            </div>
          </div>
          <p className="footer-bio">
            India’s fastest-growing cinematic entertainment booking platform. Uniting movie lovers with IMAX, 4DX, and Dolby Atmos screens nationwide.
          </p>
          <div className="social-links-row">
            <a href="#social" className="social-chip" aria-label="Twitter">Twitter</a>
            <a href="#social" className="social-chip" aria-label="Instagram">Instagram</a>
            <a href="#social" className="social-chip" aria-label="YouTube">YouTube</a>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Cinemas & Formats</h4>
          <ul className="footer-list">
            <li><a href="#movies">IMAX 70mm & 3D</a></li>
            <li><a href="#movies">4DX Motion Seats</a></li>
            <li><a href="#movies">Dolby Cinema & Atmos</a></li>
            <li><a href="#movies">PVR INOX Megaplex</a></li>
            <li><a href="#movies">Cinépolis Luxury</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-list">
            <li><a href="#movies">Now Showing</a></li>
            <li><a href="#movies">Advance Bookings</a></li>
            <li><a href="#offers">Bank Offers & Promos</a></li>
            <li><a href="#giftcards">Yozigo Gift Vouchers</a></li>
            <li><a href="#corporate">Corporate Bulk Bookings</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Support & Security</h4>
          <ul className="footer-list">
            <li><a href="#help">Help & Contact Center</a></li>
            <li><a href="#cancellation">Cancellation & Refund Policy</a></li>
            <li><a href="#terms">Terms and Conditions</a></li>
            <li><a href="#privacy">Privacy & Cookie Policy</a></li>
            <li><span className="security-tag">🔒 256-bit SSL Secure Checkout</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div className="footer-bottom-inner">
          <p>© {CURRENT_YEAR} Yozigo Entertainment Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="footer-milestone-badge">
            <span className="badge-glow-dot" />
            <span>Milestone 1 — Frontend Cinema Display</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
