import { useCallback, useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";

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

const INITIAL_AUDIT_LOGS = [
  { id: 1, action: "Account Authenticated", details: "Kisii University Admin signed in successfully", time: "Just now", user: "in170008323@kisiiuniversity.ac.ke" },
  { id: 2, action: "Showtime Updated", details: "Dune Part Two schedule updated for Westlands IMAX", time: "14 mins ago", user: "System Automator" },
  { id: 3, action: "Manual Refund Issued", details: "Booking #849201 refunded KSh 1,900 to customer wallet", time: "1 hour ago", user: "in170008323@kisiiuniversity.ac.ke" },
  { id: 4, action: "Movie Entry Created", details: "Gladiator II added to Coming Soon catalog", time: "3 hours ago", user: "admin@cinemax.com" },
];

export default function AdminDashboard({ customer, onBack, onLogout }) {
  const isSuperAdmin = customer?.role === "SUPER_ADMIN";

  const [activeSection, setActiveSection] = useState("overview");

  // Data states
  const [moviesList, setMoviesList] = useState(MOCK_MOVIES);
  const [bookingsList, setBookingsList] = useState(MOCK_BOOKINGS);
  const [auditLogs, setAuditLogs] = useState(INITIAL_AUDIT_LOGS);
  const [administrators, setAdministrators] = useState([
    { id: 1, name: "Kisii University Admin", email: "in170008323@kisiiuniversity.ac.ke", role: "SUPER_ADMIN", status: "Active", createdAt: "2026-11-01" },
    { id: 2, name: "Dr. Jane Kibet", email: "jane.kibet@kisiiuniversity.ac.ke", role: "ADMIN", status: "Active", createdAt: "2026-11-03" },
    { id: 3, name: "System Operations", email: "admin@cinemax.com", role: "FINANCE", status: "Active", createdAt: "2026-11-04" },
  ]);

  // Search queries for DataTables
  const [bookingSearch, setBookingSearch] = useState("");
  const [movieSearch, setMovieSearch] = useState("");
  const [globalSearch, setGlobalSearch] = useState("");

  // Feedback states
  const [notice, setNotice] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // CRUD Modals state
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [movieTitle, setMovieTitle] = useState("");
  const [movieGenre, setMovieGenre] = useState("Action / Sci-Fi");
  const [movieDuration, setMovieDuration] = useState(120);
  const [movieStatus, setMovieStatus] = useState("Now Showing");
  const [moviePoster, setMoviePoster] = useState("https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80");

  // Create new Admin state with RBAC & Password Eye Toggle
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminRole, setAdminRole] = useState("ADMIN");
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Helper log generator
  function addAuditLog(action, details) {
    const newLog = {
      id: Date.now(),
      action,
      details,
      time: "Just now",
      user: customer?.email || "in170008323@kisiiuniversity.ac.ke",
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  }

  // KPI CALCULATIONS
  const totalRevenueToday = useMemo(() => {
    return bookingsList
      .filter((b) => b.status === "CONFIRMED")
      .reduce((sum, b) => sum + Number(b.totalPrice || 0), 482500);
  }, [bookingsList]);

  const activeBookingsCount = useMemo(() => {
    return bookingsList.filter((b) => b.status === "CONFIRMED").length + 1280;
  }, [bookingsList]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    const query = (bookingSearch || globalSearch).trim().toLowerCase();
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
  }, [bookingsList, bookingSearch, globalSearch]);

  // Filtered Movies
  const filteredMovies = useMemo(() => {
    const query = (movieSearch || globalSearch).trim().toLowerCase();
    if (!query) return moviesList;

    return moviesList.filter((m) =>
      m.title.toLowerCase().includes(query) ||
      m.genre.toLowerCase().includes(query)
    );
  }, [moviesList, movieSearch, globalSearch]);

  // MOVIE CRUD ACTIONS
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
      addAuditLog("Movie Entry Updated", `Modified metadata for "${movieTitle}"`);
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
      addAuditLog("Movie Entry Created", `Added "${movieTitle}" to feature catalog`);
    }

    setShowMovieModal(false);
  }

  function handleDeleteMovie(id, title) {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      setMoviesList((prev) => prev.filter((m) => m.id !== id));
      setNotice(`🗑️ Deleted movie "${title}"`);
      addAuditLog("Movie Deleted", `Removed "${title}" from database`);
    }
  }

  // DISPUTE REFUND ACTIONS
  function handleProcessRefund(bookingId) {
    if (window.confirm(`Process manual refund for Booking #${bookingId}?`)) {
      setBookingsList((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "REFUNDED" } : b))
      );
      setNotice(`💸 Manual Refund processed for Booking #${bookingId}. Customer credited.`);
      addAuditLog("Dispute Refund Issued", `Issued KSh 1,900 refund for Booking #${bookingId}`);
    }
  }

  function handleCancelBooking(bookingId) {
    if (window.confirm(`Cancel reservation for Booking #${bookingId}?`)) {
      setBookingsList((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "CANCELLED" } : b))
      );
      setNotice(`❌ Reservation for Booking #${bookingId} cancelled. Seats released.`);
      addAuditLog("Booking Cancelled", `Cancelled Booking #${bookingId} and released seats`);
    }
  }

  // CREATE ADMIN WITH RBAC
  function handleCreateAdmin(e) {
    e.preventDefault();
    if (!adminEmail.trim() || !adminName.trim()) return;

    const newAdmin = {
      id: Date.now(),
      name: adminName.trim(),
      email: adminEmail.trim(),
      role: adminRole,
      status: "Active",
      createdAt: new Date().toLocaleDateString("en-KE"),
    };

    setAdministrators((prev) => [newAdmin, ...prev]);
    addAuditLog("Admin Account Created", `Created ${adminRole} account for ${adminName} (${adminEmail})`);
    setAdminName("");
    setAdminEmail("");
    setAdminPassword("");
    setNotice(`✅ Admin account created for ${adminName} (${adminRole})`);
  }

  function handleRevokeAdmin(id, name) {
    if (window.confirm(`Revoke administrator access for ${name}?`)) {
      setAdministrators((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "Revoked" } : a))
      );
      setNotice(`🛑 Revoked admin access for ${name}`);
      addAuditLog("Admin Access Revoked", `Revoked access for ${name}`);
    }
  }

  return (
    <div className="admin-portal-shell">
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar-v2">
        <div className="sidebar-brand-v2">
          <span className="brand-mark sm">CX</span>
          <div>
            <strong>CINEMAX ADMIN</strong>
            <small>PORTAL V2.4 (RBAC)</small>
          </div>
        </div>

        <nav className="sidebar-nav-v2">
          <button
            type="button"
            className={activeSection === "overview" ? "nav-item-v2 active" : "nav-item-v2"}
            onClick={() => setActiveSection("overview")}
          >
            <span className="nav-icon">📊</span>
            <span>Overview &amp; KPIs</span>
          </button>

          <button
            type="button"
            className={activeSection === "movies" ? "nav-item-v2 active" : "nav-item-v2"}
            onClick={() => setActiveSection("movies")}
          >
            <span className="nav-icon">🎬</span>
            <span>Movie Catalog CRUD</span>
          </button>

          <button
            type="button"
            className={activeSection === "showtimes" ? "nav-item-v2 active" : "nav-item-v2"}
            onClick={() => setActiveSection("showtimes")}
          >
            <span className="nav-icon">📅</span>
            <span>Showtime Calendar</span>
          </button>

          <button
            type="button"
            className={activeSection === "bookings" ? "nav-item-v2 active" : "nav-item-v2"}
            onClick={() => setActiveSection("bookings")}
          >
            <span className="nav-icon">🎟️</span>
            <span>Bookings &amp; Refunds</span>
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              className={activeSection === "admins" ? "nav-item-v2 active" : "nav-item-v2"}
              onClick={() => setActiveSection("admins")}
            >
              <span className="nav-icon">👤</span>
              <span>Admin Accounts (RBAC)</span>
            </button>
          )}
        </nav>

        <div className="sidebar-footer-v2">
          <div className="admin-session-box">
            <span className="session-dot"></span>
            <div>
              <strong>{customer?.name || "Kisii University Admin"}</strong>
              <small>Last Login: Today at 02:15 PM</small>
            </div>
          </div>

          <button type="button" className="secondary-button compact full-width mt-2" onClick={onBack}>
            ← Customer Portal
          </button>
          <button type="button" className="text-button full-width mt-1" onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN CONTENT AREA */}
      <main className="admin-main-v2">
        {/* ENHANCED HEADER BAR */}
        <header className="admin-header-v2">
          <div className="global-admin-search">
            <span className="search-icon">🔍</span>
            <input
              type="search"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Global Admin Search (Movies, Booking IDs, Emails)..."
            />
          </div>

          <div className="header-right-controls">
            <div className="notifications-dropdown-wrapper">
              <button
                type="button"
                className="notif-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                title="System Notifications"
              >
                🔔
                <span className="notif-dot"></span>
              </button>

              {showNotifications && (
                <div className="notifications-popover">
                  <div className="notif-header">
                    <strong>System Alerts</strong>
                    <button type="button" onClick={() => setShowNotifications(false)}>✕</button>
                  </div>
                  <div className="notif-item">
                    <span>⚡ STK Push Gateway operating at 100% SLA</span>
                    <small>2 mins ago</small>
                  </div>
                  <div className="notif-item">
                    <span>🎟️ Westlands Hall 1 reached 92% occupancy</span>
                    <small>15 mins ago</small>
                  </div>
                </div>
              )}
            </div>

            <div className="admin-profile-pill-v2">
              <span className="admin-avatar-circle">{customer?.name?.charAt(0) || "K"}</span>
              <div className="admin-profile-text">
                <strong>{customer?.name || "Kisii University Admin"}</strong>
                <span className="role-chip">{customer?.role || "SUPER_ADMIN"}</span>
              </div>
            </div>
          </div>
        </header>

        {notice && (
          <div className="admin-notice-banner">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")}>×</button>
          </div>
        )}

        {/* SECTION 1: OVERVIEW & KPIS */}
        {activeSection === "overview" && (
          <section className="admin-section-v2">
            <div className="kpi-cards-grid-v2">
              <article className="kpi-card-v2">
                <div className="kpi-card-top">
                  <span>Total Revenue Today</span>
                  <span className="kpi-icon-badge">💰</span>
                </div>
                <strong className="kpi-big-num">KES {money(totalRevenueToday)}</strong>
                <small className="trend-green">▲ +14.2% vs yesterday</small>
              </article>

              <article className="kpi-card-v2">
                <div className="kpi-card-top">
                  <span>Total Active Bookings</span>
                  <span className="kpi-icon-badge">🎟️</span>
                </div>
                <strong className="kpi-big-num">{activeBookingsCount.toLocaleString()}</strong>
                <small className="trend-green">▲ +8.5% capacity filled</small>
              </article>

              <article className="kpi-card-v2">
                <div className="kpi-card-top">
                  <span>Global Occupancy Rate</span>
                  <span className="kpi-icon-badge">💺</span>
                </div>
                <strong className="kpi-big-num">84.6%</strong>
                <small className="trend-amber">Across 12 Kenyan Branches</small>
              </article>

              <article className="kpi-card-v2">
                <div className="kpi-card-top">
                  <span>New User Registrations</span>
                  <span className="kpi-icon-badge">👤</span>
                </div>
                <strong className="kpi-big-num">342 Today</strong>
                <small className="trend-green">▲ +22 new accounts/hr</small>
              </article>
            </div>

            {/* CHART & AUDIT TRAIL GRID */}
            <div className="overview-split-grid">
              <div className="admin-chart-card">
                <div className="card-header-row">
                  <h3>📊 Revenue Breakdown by Feature Film</h3>
                  <span className="sub-badge">Chart.js Analytics Engine</span>
                </div>

                <div className="chart-bars-list">
                  {moviesList.slice(0, 5).map((m) => {
                    const pct = Math.min(100, Math.round((m.revenue / 160000) * 100));
                    return (
                      <div key={m.id} className="chart-bar-row-v2">
                        <span className="bar-film-title">{m.title}</span>
                        <div className="bar-track-v2">
                          <div className="bar-fill-v2" style={{ width: `${pct}%` }}></div>
                        </div>
                        <span className="bar-amt">KES {money(m.revenue)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTIVITY AUDIT TRAIL WIDGET */}
              <div className="audit-trail-card">
                <div className="card-header-row">
                  <h3>📜 Real-Time Audit Log</h3>
                  <span className="sub-badge green">Live Security Trail</span>
                </div>

                <div className="audit-logs-list">
                  {auditLogs.slice(0, 4).map((log) => (
                    <div key={log.id} className="audit-log-item">
                      <div className="audit-log-top">
                        <strong className="log-action">{log.action}</strong>
                        <small className="log-time">{log.time}</small>
                      </div>
                      <p className="log-details">{log.details}</p>
                      <small className="log-user">By: {log.user}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: MOVIE CATALOG CRUD */}
        {activeSection === "movies" && (
          <section className="admin-section-v2">
            <div className="section-toolbar-v2">
              <div className="table-search-box">
                🔍
                <input
                  type="search"
                  value={movieSearch}
                  onChange={(e) => setMovieSearch(e.target.value)}
                  placeholder="Filter movies by title or genre..."
                />
              </div>

              <button type="button" className="primary-button compact glow-btn" onClick={openAddMovie}>
                ➕ Add New Movie Entry
              </button>
            </div>

            <div className="datatable-card-v2">
              <table className="admin-table-v2">
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
                      <td><img src={m.posterUrl} alt={m.title} className="tbl-thumb" /></td>
                      <td><strong>{m.title}</strong></td>
                      <td>{m.genre}</td>
                      <td>⏱️ {m.duration}m</td>
                      <td>
                        <span className={`status-pill ${m.status === "Coming Soon" ? "pending" : "confirmed"}`}>
                          {m.status}
                        </span>
                      </td>
                      <td>
                        <div className="dt-actions-group">
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
          <section className="admin-section-v2">
            <div className="section-toolbar-v2">
              <h3>📅 Screening Schedule &amp; Hall Calendar</h3>
            </div>

            <div className="datatable-card-v2">
              <table className="admin-table-v2">
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Movie</th>
                    <th>Cinema Branch &amp; Hall</th>
                    <th>Screening Time</th>
                    <th>Ticket Price</th>
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

        {/* SECTION 4: BOOKINGS & REFUNDS DATATABLE */}
        {activeSection === "bookings" && (
          <section className="admin-section-v2">
            <div className="section-toolbar-v2">
              <div className="table-search-box">
                🔍
                <input
                  type="search"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search Booking ID (#CNX-849201), customer email, or movie..."
                />
              </div>
            </div>

            <div className="datatable-card-v2">
              <table className="admin-table-v2">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer Name &amp; Email</th>
                    <th>Movie Session</th>
                    <th>Seats</th>
                    <th>Paid</th>
                    <th>Status</th>
                    <th>Dispute Resolution Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.id}>
                      <td><strong>#CNX-{b.id}</strong></td>
                      <td>
                        <strong>{b.user?.name}</strong>
                        <br />
                        <small className="muted-email">{b.user?.email}</small>
                      </td>
                      <td>
                        <strong>{b.showtime?.movie?.title}</strong>
                        <br />
                        <small className="muted-email">📍 {b.showtime?.hall?.cinema?.name}</small>
                      </td>
                      <td>{b.seats?.map((s) => s.seat?.seatNumber).join(", ")}</td>
                      <td>KES {money(b.totalPrice)}</td>
                      <td>
                        <span className={`status-pill ${b.status.toLowerCase()}`}>
                          {b.status}
                        </span>
                      </td>
                      <td>
                        <div className="dt-actions-group">
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
                          {b.status === "CANCELLED" && <span className="muted-email font-bold">Cancelled</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SECTION 5: ADMIN ACCOUNTS & RBAC */}
        {activeSection === "admins" && isSuperAdmin && (
          <section className="admin-section-v2">
            {/* QUICK METRICS WIDGETS FOR ADMIN TAB */}
            <div className="admin-metrics-grid">
              <div className="metric-widget">
                <span>Total Administrators</span>
                <strong>{administrators.length}</strong>
              </div>
              <div className="metric-widget">
                <span>Active Sessions</span>
                <strong className="green-text">12 Live</strong>
              </div>
              <div className="metric-widget">
                <span>Security Audit Logs</span>
                <strong>{auditLogs.length} Entries</strong>
              </div>
              <div className="metric-widget">
                <span>Pending Approvals</span>
                <strong className="amber-text">0 Pending</strong>
              </div>
            </div>

            {/* CREATE ADMIN FORM IN PERFECT 3-COLUMN GRID & ACTIVE ADMINS TABLE */}
            <div className="admin-rbac-layout">
              {/* CREATE ADMIN FORM CONTAINER WITH PERFECT ALIGNED 3-COLUMN GRID */}
              <div className="create-admin-card-v2">
                <h3>👤 Create Administrator Account (RBAC)</h3>
                <form onSubmit={handleCreateAdmin}>
                  <div className="admin-form-3col-grid">
                    <div className="form-input-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        className="admin-input-v2"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        placeholder="e.g. Dr. Jane Kibet"
                        required
                      />
                    </div>

                    <div className="form-input-group">
                      <label>Official Email</label>
                      <input
                        type="email"
                        className="admin-input-v2"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="jane.kibet@kisiiuniversity.ac.ke"
                        required
                      />
                    </div>

                    <div className="form-input-group">
                      <label>Password</label>
                      <div className="pwd-eye-input-wrapper">
                        <input
                          type={showAdminPassword ? "text" : "password"}
                          className="admin-input-v2 pwd-input"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          className="pwd-toggle-eye"
                          onClick={() => setShowAdminPassword(!showAdminPassword)}
                        >
                          {showAdminPassword ? "🙈" : "👁️"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="admin-form-2col-row mt-3">
                    <div className="form-input-group flex-1">
                      <label>Assign Role (Role-Based Access Control)</label>
                      <select
                        className="admin-select-v2"
                        value={adminRole}
                        onChange={(e) => setAdminRole(e.target.value)}
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN (Full System Controls)</option>
                        <option value="ADMIN">ADMIN (Catalog &amp; Showtimes Manager)</option>
                        <option value="MODERATOR">MODERATOR (Disputes &amp; Bookings)</option>
                        <option value="FINANCE">FINANCE (Audits &amp; Financial Statements)</option>
                      </select>
                    </div>

                    <button type="submit" className="primary-button glow-btn align-self-end">
                      Create Administrator Account
                    </button>
                  </div>
                </form>
              </div>

              {/* ACTIVE ADMINISTRATORS TABLE WITH ACTIONS */}
              <div className="active-admins-card-v2">
                <h3>📋 Active Administrators Directory</h3>
                <div className="datatable-card-v2">
                  <table className="admin-table-v2">
                    <thead>
                      <tr>
                        <th>Administrator</th>
                        <th>Email Address</th>
                        <th>Assigned Role</th>
                        <th>Status</th>
                        <th>Created Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {administrators.map((a) => (
                        <tr key={a.id}>
                          <td><strong>{a.name}</strong></td>
                          <td>{a.email}</td>
                          <td><span className={`role-badge-pill ${a.role.toLowerCase()}`}>{a.role}</span></td>
                          <td><span className={`status-pill ${a.status === "Active" ? "confirmed" : "pending"}`}>{a.status}</span></td>
                          <td>{a.createdAt}</td>
                          <td>
                            <div className="dt-actions-group">
                              {a.status === "Active" && a.role !== "SUPER_ADMIN" && (
                                <button type="button" className="danger-button compact" onClick={() => handleRevokeAdmin(a.id, a.name)}>
                                  🛑 Revoke
                                </button>
                              )}
                              {a.role === "SUPER_ADMIN" && <span className="muted-email">System Protected</span>}
                            </div>
                          </td>
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

              <div className="dt-actions-group mt-3">
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
