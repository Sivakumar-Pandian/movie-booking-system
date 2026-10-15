export const CinemaPerks = () => {
  const perks = [
    {
      icon: '⚡',
      title: 'Instant M-Tickets',
      desc: 'Zero queues. Scan your digital QR code directly at the cinema gate.',
    },
    {
      icon: '🛡️',
      title: 'Cancellation Shield',
      desc: 'Get 100% refund on tickets up to 2 hours before the movie showtime.',
    },
    {
      icon: '🍿',
      title: 'Seat-Delivered Snacks',
      desc: 'Pre-order hot popcorn, nachos, and craft drinks right to your recliner.',
    },
    {
      icon: '🎟️',
      title: 'Exclusive Rewards',
      desc: 'Earn Yozigo Stars on every booking and redeem for free movie passes.',
    },
  ];

  return (
    <section className="cinema-perks-section" aria-label="Why Book with Yozigo">
      <div className="perks-container">
        {perks.map((p) => (
          <div key={p.title} className="perk-card">
            <span className="perk-icon" aria-hidden="true">{p.icon}</span>
            <div className="perk-text">
              <h4 className="perk-title">{p.title}</h4>
              <p className="perk-desc">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
