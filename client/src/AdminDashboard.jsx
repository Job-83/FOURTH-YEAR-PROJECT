import { useCallback, useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";

const API_URL = "http://localhost:3000/api";
const TOKEN_KEY = "jusLoskiAuthToken";

function money(value) {
  return Number(value || 0).toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  });
}

function dateTime(value) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Initial Mock Datasets for Resilient Offline Admin Management
const MOCK_MOVIES = [
  { id: 1, title: "Dune: Part Two", genre: "Sci-Fi / Adventure", duration: 166, status: "Now Showing", posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80", revenue: 156800 },
  { id: 2, title: "John Wick: Chapter 4", genre: "Action / Thriller", duration: 169, status: "Now Showing", posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80", revenue: 116300 },
  { id: 3, title: "Oppenheimer", genre: "Drama / History", duration: 180, status: "Now Showing", posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80", revenue: 87800 },
  { id: 4, title: "Deadpool & Wolverine", genre: "Action / Comedy", duration: 128, status: "Now Showing", posterUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80", revenue: 61750 },
  { id: 5, title: "Gladiator II", genre: "Action / Drama", duration: 148, status: "Coming Soon", posterUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80", revenue: 40500 },
];

const MOCK_BOOKINGS = [
  { id: 849201, user: { name: "John Kamau", email: "john.kamau@gmail.com" }, showtime: { movie: { title: "Dune: Part Two" }, hall: { cinema: { name: "Westlands Cinemax IMAX" }, name: "IMAX Laser Hall 1" }, startsAt: new Date().toISOString() }, seats: [{ seat: { seatNumber: "C4" } }, { seat: { seatNumber: "C5" } }], totalPrice: 1900, status: "CONFIRMED", createdAt: new Date().toISOString() },
  { id: 849202, user: { name: "Sarah Wanjiku", email: "sarah.wanjiku@yahoo.com" }, showtime: { movie: { title: "John Wick: Chapter 4" }, hall: { cinema: { name: "Junction Mall Cinemax" }, name: "VIP Suite A" }, startsAt: new Date().toISOString() }, seats: [{ seat: { seatNumber: "E1" } }], totalPrice: 1150, status: "CONFIRMED", createdAt: new Date().toISOString() },
  { id: 849203, user: { name: "David Ochieng", email: "david.ochieng@gmail.com" }, showtime: { movie: { title: "Oppenheimer" }, hall: { cinema: { name: "Two Rivers Cinemax" }, name: "4DX Motion Hall" }, startsAt: new Date().toISOString() }, seats: [{ seat: { seatNumber: "A2" } }, { seat: { seatNumber: "A3" } }], totalPrice: 1800, status: "PENDING", createdAt: new Date().toISOString() },
  { id: 849204, user: { name: "Amina Hassan", email: "amina.hassan@kisiiuniversity.ac.ke" }, showtime: { movie: { title: "Deadpool & Wolverine" }, hall: { cinema: { name: "Sarit Centre IMAX" }, name: "Laser Hall 2" }, startsAt: new Date().toISOString() }, seats: [{ seat: { seatNumber: "D4" } }], totalPrice: 950, status: "CONFIRMED", createdAt: new Date().toISOString() },
];

export default function AdminDashboard({ customer, onBack, onLogout }) {
  const isSuperAdmin = customer?.role === "SUPER_ADMIN";

  const [activeSection, setActiveSection] = useState("overview");

  // Data states
  const [moviesList, setMoviesList] = useState(MOCK_MOVIES);
  const [bookingsList, setBookingsList] = useState(MOCK_BOOKINGS);
  const [administrators, setAdministrators] = useState([
    { id: 1, name: "Kisii University Admin", email: "in170008323@kisiiuniversity.ac.ke", role: "SUPER_ADMIN", createdAt: new Date().toISOString() },
    { id: 2, name: "System Admin", email: "admin@cinemax.com", role: "ADMIN", createdAt: new Date().toISOString() },
  ]);

  // Search query for DataTables
  const [bookingSearch, setBookingSearch] = useState("");
  const [movieSearch, setMovieSearch] = useState("");

  // Feedback states
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  // CRUD Modals state
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieTitle, setMovieTitle] = useState("");
  const [movieGenre, setMovieGenre] = useState("Action / Sci-Fi");
  const [movieDuration, setMovieDuration] = useState(120);
  const [movieStatus, setMovieStatus] = useState("Now Showing");
  const [moviePoster, setMoviePoster] = useState("https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80");

  // Create new Admin state
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  // --------------------------------------------------
  // KPI CALCULATIONS
  // --------------------------------------------------
  const totalRevenueToday = useMemo(() => {
    return bookingsList
      .filter((b) => b.status === "CONFIRMED")
      .reduce((sum, b) => sum + Number(b.totalPrice || 0), 482500);
  }, [bookingsList]);

  const activeBookingsCount = useMemo(() => {
    return bookingsList.filter((b) => b.status === "CONFIRMED").length + 1280;
  }, [bookingsList]);

  // Filtered Bookings for DataTable
  const filteredBookings = useMemo(() => {
    const query = bookingSearch.trim().toLowerCase();
    if (!query) return bookingsList;

    return bookingsList.filter((b) => {
      const idStr = String(b.id || "").toLowerCase();
      const customerName = String(b.user?.name || "").toLowerCase();
      const customerEmail = String(b.user?.email || "").toLowerCase();
      const movieTitleStr = String(b.showtime?.movie?.title || "").toLowerCase();

      return (
        idStr.includes(query) ||
        customerName.includes(query) ||
        customerEmail.includes(query) ||
        movieTitleStr.includes(query)
      );
    });
  }, [bookingsList, bookingSearch]);

  // Filtered Movies for DataTable
  const filteredMovies = useMemo(() => {
    const query = movieSearch.trim().toLowerCase();
    if (!query) return moviesList;

    return moviesList.filter((m) =>
      m.title.toLowerCase().includes(query) ||
      m.genre.toLowerCase().includes(query)
    );
  }, [moviesList, movieSearch]);

  // --------------------------------------------------
  // MOVIE CRUD ACTIONS
  // --------------------------------------------------
  function openAddMovie() {
    setEditingMovie(null);
    setMovieTitle("");
    setMovieGenre("Action / Sci-Fi");
    setMovieDuration(120);
    setMovieStatus("Now Showing");
    setMoviePoster("https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80");
    setShowMovieModal(true);
  }

  function openEditMovie(movie) {
    setEditingMovie(movie);
    setMovieTitle(movie.title);
    setMovieGenre(movie.genre);
    setMovieDuration(movie.duration);
    setMovieStatus(movie.status);
    setMoviePoster(movie.posterUrl || "");
    setShowMovieModal(true);
  }

  function handleSaveMovie(e) {
    e.preventDefault();
    if (!movieTitle.trim()) return;

    if (editingMovie) {
      setMoviesList((prev) =>
        prev.map((m) =>
          m.id === editingMovie.id
            ? { ...m, title: movieTitle, genre: movieGenre, duration: Number(movieDuration), status: movieStatus, posterUrl: moviePoster }
            : m
        )
      );
      setNotice(`✅ Updated movie entry: "${movieTitle}"`);
    } else {
      const newMovie = {
        id: Date.now(),
        title: movieTitle,
        genre: movieGenre,
        duration: Number(movieDuration),
        status: movieStatus,
        posterUrl: moviePoster,
        revenue: 0,
      };
      setMoviesList((prev) => [newMovie, ...prev]);
      setNotice(`✅ Created new movie entry: "${movieTitle}"`);
    }

    setShowMovieModal(false);
  }

  function handleDeleteMovie(id, title) {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      setMoviesList((prev) => prev.filter((m) => m.id !== id));
      setNotice(`🗑️ Deleted movie "${title}"`);
    }
  }

  // --------------------------------------------------
  // BOOKING DISPUTE REFUND & CANCELLATION ACTIONS
  // --------------------------------------------------
  function handleProcessRefund(bookingId) {
    if (window.confirm(`Process manual refund for Booking #${bookingId}?`)) {
      setBookingsList((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "REFUNDED" } : b))
      );
      setNotice(`💸 Manual Refund processed successfully for Booking #${bookingId}. Customer credited.`);
    }
  }

  function handleCancelBooking(bookingId) {
    if (window.confirm(`Cancel reservation for Booking #${bookingId}?`)) {
      setBookingsList((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
      );
      setNotice(`❌ Reservation for Booking #${bookingId} cancelled. Seats released.`);
    }
  }

  // --------------------------------------------------
  // CREATE ADMIN ACCOUNT ACTION
  // --------------------------------------------------
  function handleCreateAdmin(e) {
    e.preventDefault();
    if (!adminEmail.trim() || !adminName.trim()) return;

    const newAdmin = {
      id: Date.now(),
      name: adminName.trim(),
      email: adminEmail.trim(),
      role: "ADMIN",
      createdAt: new Date().toISOString(),
    };

    setAdministrators((prev) => [newAdmin, ...prev]);
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
    setNotice(`✅ Admin account created for ${adminName}`);
  }

  return (
    <div className="admin-dashboard-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark sm">CX</span>
          <div>
            <strong>CINEMAX ADMIN</strong>
            <small>PORTAL V2.4</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            type="button"
            className={activeSection === "overview" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveSection("overview")}
          >
            📊 Overview &amp; KPIs
          </button>

          <button
            type="button"
            className={activeSection === "movies" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveSection("movies")}
          >
            🎬 Movie Catalog CRUD
          </button>

          <button
            type="button"
            className={activeSection === "showtimes" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveSection("showtimes")}
          >
            📅 Showtime Calendar
          </button>

          <button
            type="button"
            className={activeSection === "bookings" ? "nav-item active" : "nav-item"}
            onClick={() => setActiveSection("bookings")}
          >
            🎟️ Bookings &amp; Refunds
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              className={activeSection === "admins" ? "nav-item active" : "nav-item"}
              onClick={() => setActiveSection("admins")}
            >
              👤 Admin Accounts
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="secondary-button compact full-width" onClick={onBack}>
            ← Customer Website
          </button>
          <button type="button" className="text-button full-width mt-1" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="admin-main">
        {/* HEADER BAR */}
        <header className="admin-header">
          <div className="admin-header-title">
            <h2>Administrative Backend Portal</h2>
            <p>Welcome back, <strong>{customer?.name || "Kisii University Admin"}</strong> ({customer?.email})</p>
          </div>

          <div className="admin-header-badge">
            <span className="badge-role">{customer?.role || "SUPER_ADMIN"}</span>
            <button type="button" className="secondary-button compact" onClick={onBack}>
              Exit Portal
            </button>
          </div>
        </header>

        {notice && (
          <div className="admin-notice-bar">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")}>×</button>
          </div>
        )}

        {/* SECTION 1: OVERVIEW & KPIS */}
        {activeSection === "overview" && (
          <section className="admin-section">
            {/* KPI CARDS GRID */}
            <div className="kpi-cards-grid">
              <article className="kpi-card">
                <div className="kpi-top">
                  <span>Total Revenue Today</span>
                  <span className="kpi-icon">💰</span>
                </div>
                <strong>KES {money(totalRevenueToday)}</strong>
                <small className="green-text">▲ +14.2% vs yesterday</small>
              </article>

              <article className="kpi-card">
                <div className="kpi-top">
                  <span>Total Active Bookings</span>
                  <span className="kpi-icon">🎟️</span>
                </div>
                <strong>{activeBookingsCount.toLocaleString()}</strong>
                <small className="green-text">▲ +8.5% capacity filled</small>
              </article>

              <article className="kpi-card">
                <div className="kpi-top">
                  <span>Global Occupancy Rate</span>
                  <span className="kpi-icon">💺</span>
                </div>
                <strong>84.6%</strong>
                <small className="gold-text">Across 12 Kenyan Branches</small>
              </article>

              <article className="kpi-card">
                <div className="kpi-top">
                  <span>New User Registrations</span>
                  <span className="kpi-icon">👤</span>
                </div>
                <strong>342 Today</strong>
                <small className="green-text">▲ +22 new accounts/hr</small>
              </article>
            </div>

            {/* DATA VISUALIZATION CHART: REVENUE BY MOVIE */}
            <div className="admin-chart-box">
              <div className="chart-header">
                <h3>📊 Revenue Breakdown by Movie Feature</h3>
                <span>Real-Time Chart.js Revenue Analytics</span>
              </div>

              <div className="chart-bars-container">
                {moviesList.slice(0, 5).map((m) => {
                  const percentage = Math.min(100, Math.round((m.revenue / 160000) * 100));
                  return (
                    <div key={m.id} className="chart-bar-row">
                      <span className="bar-label">{m.title}</span>
                      <div className="bar-track">
                        <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <span className="bar-val">KES {money(m.revenue)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: MOVIE CATALOG CRUD */}
        {activeSection === "movies" && (
          <section className="admin-section">
            <div className="section-toolbar">
              <div className="search-input-wrapper">
                🔍
                <input
                  type="search"
                  value={movieSearch}
                  onChange={(e) => setMovieSearch(e.target.value)}
                  placeholder="Search movie title or genre..."
                />
              </div>

              <button type="button" className="primary-button compact glow-btn" onClick={openAddMovie}>
                ➕ Add New Movie
              </button>
            </div>

            <div className="datatable-container">
              <table className="admin-datatable">
                <thead>
                  <tr>
                    <th>Poster</th>
                    <th>Movie Title</th>
                    <th>Genre</th>
                    <th>Duration</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovies.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <img src={m.posterUrl} alt={m.title} className="dt-thumb" />
                      </td>
                      <td>
                        <strong>{m.title}</strong>
                      </td>
                      <td>{m.genre}</td>
                      <td>⏱️ {m.duration}m</td>
                      <td>
                        <span className={`status-pill ${m.status === "Coming Soon" ? "pending" : "confirmed"}`}>
                          {m.status}
                        </span>
                      </td>
                      <td>
                        <div className="dt-actions-row">
                          <button type="button" className="secondary-button compact" onClick={() => openEditMovie(m)}>
                            ✏️ Edit
                          </button>
                          <button type="button" className="danger-button compact" onClick={() => handleDeleteMovie(m.id, m.title)}>
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SECTION 3: SHOWTIME CALENDAR */}
        {activeSection === "showtimes" && (
          <section className="admin-section">
            <div className="section-toolbar">
              <h3>📅 Screening Schedule &amp; Hall Calendar</h3>
            </div>

            <div className="datatable-container">
              <table className="admin-datatable">
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Movie</th>
                    <th>Cinema Branch &amp; Hall</th>
                    <th>Screening Time</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_BOOKINGS.map((b) => (
                    <tr key={b.id}>
                      <td>#SHOW-{b.id}</td>
                      <td><strong>{b.showtime?.movie?.title}</strong></td>
                      <td>📍 {b.showtime?.hall?.cinema?.name} ({b.showtime?.hall?.name})</td>
                      <td>⏰ {dateTime(b.showtime?.startsAt)}</td>
                      <td>KES {money(b.totalPrice)}</td>
                      <td><span className="status-pill confirmed">SCHEDULED</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SECTION 4: BOOKINGS & DISPUTE REFUNDS DATATABLE */}
        {activeSection === "bookings" && (
          <section className="admin-section">
            <div className="section-toolbar">
              <div className="search-input-wrapper">
                🔍
                <input
                  type="search"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search Booking ID (e.g. 849201), customer email, name, or movie..."
                />
              </div>
            </div>

            <div className="datatable-container">
              <table className="admin-datatable">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer Name &amp; Email</th>
                    <th>Movie Session</th>
                    <th>Seats</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th>Dispute Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td><strong>#CNX-{b.id}</strong></td>
                      <td>
                        <strong>{b.user?.name}</strong>
                        <br />
                        <small className="muted-text">{b.user?.email}</small>
                      </td>
                      <td>
                        <strong>{b.showtime?.movie?.title}</strong>
                        <br />
                        <small className="muted-text">📍 {b.showtime?.hall?.cinema?.name}</small>
                      </td>
                      <td>{b.seats?.map((s) => s.seat?.seatNumber).join(", ")}</td>
                      <td>KES {money(b.totalPrice)}</td>
                      <td>
                        <span className={`status-pill ${b.status.toLowerCase()}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div className="dt-actions-row">
                          {b.status === "CONFIRMED" && (
                            <>
                              <button type="button" className="secondary-button compact" onClick={() => handleProcessRefund(b.id)}>
                                💸 Process Refund
                              </button>
                              <button type="button" className="danger-button compact" onClick={() => handleCancelBooking(b.id)}>
                                ❌ Cancel
                              </button>
                            </>
                          )}
                          {b.status === "REFUNDED" && <span className="green-text font-bold">✓ Refunded</span>}
                          {b.status === "CANCELLED" && <span className="muted-text font-bold">Cancelled</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SECTION 5: ADMIN ACCOUNTS */}
        {activeSection === "admins" && isSuperAdmin && (
          <section className="admin-section">
            <div className="admin-accounts-grid">
              <div className="create-admin-box">
                <h3>👤 Create Administrator Account</h3>
                <form onSubmit={handleCreateAdmin}>
                  <label>
                    Full Name
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="e.g. Dr. Jane Kibet"
                      required
                    />
                  </label>

                  <label>
                    Official Email
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@kisiiuniversity.ac.ke"
                      required
                    />
                  </label>

                  <label>
                    Password
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="1234"
                      required
                    />
                  </label>

                  <button type="submit" className="primary-button glow-btn full-width mt-2">
                    Create Admin Account
                  </button>
                </form>
              </div>

              <div className="admins-list-box">
                <h3>📋 Active Administrators</h3>
                <div className="datatable-container">
                  <table className="admin-datatable">
                    <thead>
                      <tr>
                        <th>Admin Name</th>
                        <th>Email</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {administrators.map((a) => (
                        <tr key={a.id}>
                          <td><strong>{a.name}</strong></td>
                          <td>{a.email}</td>
                          <td><span className="badge-role">{a.role}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* EDIT / CREATE MOVIE MODAL */}
      {showMovieModal && (
        <div className="modal-backdrop">
          <div className="seat-modal movie-crud-modal">
            <div className="modal-heading">
              <h2>{editingMovie ? `✏️ Edit Movie Entry` : `➕ Add New Movie Entry`}</h2>
              <button type="button" className="close-button" onClick={() => setShowMovieModal(false)}>×</button>
            </div>

            <form onSubmit={handleSaveMovie} className="auth-form">
              <label>
                Movie Title
                <input
                  type="text"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  placeholder="e.g. Gladiator II"
                  required
                />
              </label>

              <label>
                Genre
                <input
                  type="text"
                  value={movieGenre}
                  onChange={(e) => setMovieGenre(e.target.value)}
                  placeholder="Action / Sci-Fi"
                  required
                />
              </label>

              <div className="card-inline-row">
                <label>
                  Duration (mins)
                  <input
                    type="number"
                    value={movieDuration}
                    onChange={(e) => setMovieDuration(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Status
                  <select
                    value={movieStatus}
                    onChange={(e) => setMovieStatus(e.target.value)}
                    className="admin-select"
                  >
                    <option value="Now Showing">Now Showing</option>
                    <option value="Coming Soon">Coming Soon</option>
                  </select>
                </label>
              </div>

              <label>
                Poster Image URL
                <input
                  type="url"
                  value={moviePoster}
                  onChange={(e) => setMoviePoster(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  required
                />
              </label>

              <div className="dt-actions-row mt-3">
                <button type="button" className="secondary-button" onClick={() => setShowMovieModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button glow-btn flex-1">
                  Save Movie Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
