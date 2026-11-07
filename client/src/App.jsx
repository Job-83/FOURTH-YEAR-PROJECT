import { useEffect, useMemo, useState } from "react";

import {
  getMovies,
  getCinemas,
  getShowtimes,
  getShowtimeSeats,
  createBooking,
  getMyBookings,
} from "./api";

import {
  registerCustomer,
  loginCustomer,
  getCustomerProfile,
} from "./auth";

import AdminDashboard from "./AdminDashboard";
import "./App.css";

const TOKEN_KEY = "jusLoskiAuthToken";
const REMEMBER_EMAIL_KEY = "cinemax_remembered_email";
const MOVIES_PER_PAGE = 24;

const GENRES = [
  "All Genres",
  "Action",
  "Comedy",
  "Horror",
  "Romance",
  "Thriller",
  "Drama",
  "Animation",
  "Adventure",
];

const PROMO_CODES = {
  CINEMAX10: { type: "percent", value: 10, label: "10% Off Promo" },
  CINEMAX20: { type: "percent", value: 20, label: "20% Off Promo" },
  STUDENT: { type: "flat", value: 150, label: "KSh 150 Student Discount" },
  VIP50: { type: "flat", value: 300, label: "KSh 300 VIP Special" },
};

const SNACK_ADDONS = [
  { id: "popcorn", name: "🍿 Large Popcorn & Soda Combo", price: 350 },
  { id: "nachos", name: "🧀 Loaded Nachos & Melted Cheese", price: 400 },
  { id: "candy", name: "🍫 Candy & Ice Slushie Combo", price: 250 },
];

function formatDate(date) {
  if (!date) return "Date unavailable";
  return new Date(date).toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date) {
  if (!date) return "Time unavailable";
  return new Date(date).toLocaleTimeString("en-KE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatPrice(price) {
  return Number(price || 0).toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  });
}

function getErrorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback;
}

function getAgeRating(id) {
  const ratings = ["PG-13", "16+", "R-18", "PG", "18+"];
  return ratings[id % ratings.length];
}

function getFormatTag(id) {
  const formats = ["IMAX 3D", "DOLBY ATMOS", "4DX 3D", "2D VIP", "STANDARD 2D"];
  return formats[id % formats.length];
}

function getCastDirector(id) {
  const castList = [
    { cast: "Timothée Chalamet, Zendaya, Rebecca Ferguson", director: "Denis Villeneuve" },
    { cast: "Keanu Reeves, Donnie Yen, Bill Skarsgård", director: "Chad Stahelski" },
    { cast: "Tom Cruise, Miles Teller, Jennifer Connelly", director: "Joseph Kosinski" },
    { cast: "Margot Robbie, Ryan Gosling, America Ferrera", director: "Greta Gerwig" },
  ];
  return castList[id % castList.length];
}

// Crisp Vector SVG QR Code
function QRCodeSVG({ value }) {
  const gridSize = 25;
  const cellSize = 4;
  const margin = 4;
  const size = gridSize * cellSize + margin * 2; // 108x108 viewBox

  const modules = useMemo(() => {
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

    let hash = 0;
    const str = String(value || "CNX-DEFAULT-2026");
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }

    const addFinder = (row, col) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const mr = row + r;
          const mc = col + c;
          if (mr >= 0 && mr < gridSize && mc >= 0 && mc < gridSize) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            grid[mr][mc] = isBorder || isCenter;
          }
        }
      }
    };

    addFinder(0, 0); // Top-Left
    addFinder(0, gridSize - 7); // Top-Right
    addFinder(gridSize - 7, 0); // Bottom-Left

    for (let i = 7; i < gridSize - 7; i++) {
      grid[6][i] = i % 2 === 0;
      grid[i][6] = i % 2 === 0;
    }

    const alignR = 18;
    const alignC = 18;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isB = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isC = r === 0 && c === 0;
        grid[alignR + r][alignC + c] = isB || isC;
      }
    }

    let pseudo = Math.abs(hash);
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const inTL = r < 8 && c < 8;
        const inTR = r < 8 && c >= gridSize - 8;
        const inBL = r >= gridSize - 8 && c < 8;
        const inTiming = r === 6 || c === 6;
        const inAlign = Math.abs(r - alignR) <= 2 && Math.abs(c - alignC) <= 2;
        const inCenterLogo = r >= 10 && r <= 14 && c >= 10 && c <= 14;

        if (!inTL && !inTR && !inBL && !inTiming && !inAlign && !inCenterLogo) {
          pseudo = (pseudo * 1664525 + 1013904223) % 4294967296;
          grid[r][c] = (pseudo % 3 === 0) || ((r + c + (hash % 5)) % 2 === 0);
        }
      }
    }

    return grid;
  }, [value]);

  return (
    <div className="qr-code-wrapper">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="qr-code-svg"
        aria-label={`QR Code for ${value}`}
        role="img"
      >
        <rect width={size} height={size} fill="#ffffff" rx="6" />
        {modules.map((row, rIdx) =>
          row.map((cell, cIdx) => {
            if (!cell) return null;
            return (
              <rect
                key={`${rIdx}-${cIdx}`}
                x={margin + cIdx * cellSize}
                y={margin + rIdx * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#0b0c10"
                rx="0.5"
              />
            );
          })
        )}
      </svg>
      <div className="qr-center-emblem">CX</div>
    </div>
  );
}

// Client-side HTML5 Canvas Generator for Downloading High-Res E-Ticket PNG Image
function downloadDesignedTicketImage(booking) {
  if (!booking) return;

  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 960;
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = "#0b0c10";
  ctx.fillRect(0, 0, 640, 960);

  // Outer Gold Border
  ctx.strokeStyle = "#f5b83d";
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 620, 940);

  // Header Banner Gradient
  const grad = ctx.createLinearGradient(0, 0, 640, 0);
  grad.addColorStop(0, "#1e1b4b");
  grad.addColorStop(1, "#31103f");
  ctx.fillStyle = grad;
  ctx.fillRect(10, 10, 620, 150);

  // Status Badge
  ctx.fillStyle = "#10b981";
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(220, 30, 200, 32, 16);
  } else {
    ctx.rect(220, 30, 200, 32);
  }
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 13px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✓ BOOKING CONFIRMED", 320, 51);

  // Title
  ctx.font = "bold 24px system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("CINEMAX DIGITAL MOVIE TICKET", 320, 98);
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillStyle = "#c7d2fe";
  ctx.fillText("Scan QR code at cinema entrance turnstile", 320, 125);

  // Ticket Body Card
  ctx.fillStyle = "#171a26";
  ctx.fillRect(30, 180, 580, 750);
  ctx.strokeStyle = "#2a2c3a";
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 180, 580, 750);

  // Logo & Ref
  ctx.textAlign = "left";
  ctx.fillStyle = "#f5b83d";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillText("CX  CINEMAX TICKETING", 55, 220);

  ctx.textAlign = "right";
  ctx.fillStyle = "#9e9eb0";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("Booking Ref", 585, 212);
  ctx.fillStyle = "#f5b83d";
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillText(`#CNX-${booking.id}-2026`, 585, 234);

  // Divider Line
  ctx.strokeStyle = "#2a2c3a";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(55, 255);
  ctx.lineTo(585, 255);
  ctx.stroke();

  // Customer Info Box
  ctx.textAlign = "left";
  ctx.fillStyle = "#9e9eb0";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("CUSTOMER NAME", 55, 285);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 18px system-ui, sans-serif";
  ctx.fillText(booking.user?.name || "Valued Customer", 55, 312);

  ctx.fillStyle = "#9e9eb0";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("EMAIL ADDRESS", 340, 285);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px system-ui, sans-serif";
  ctx.fillText(booking.user?.email || "customer@cinemax.com", 340, 312);

  // Movie Details Box
  ctx.fillStyle = "#9e9eb0";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("MOVIE TITLE", 55, 360);
  ctx.fillStyle = "#f5b83d";
  ctx.font = "bold 24px system-ui, sans-serif";
  ctx.fillText(booking.showtime?.movie?.title || "Movie Session", 55, 390);

  ctx.fillStyle = "#d1d5db";
  ctx.font = "14px system-ui, sans-serif";
  ctx.fillText(`📍 ${booking.showtime?.hall?.cinema?.name || "Cinemax Branch"} (${booking.showtime?.hall?.name || "Main Screen"})`, 55, 420);

  // Date & Showtime Grid Box
  ctx.fillStyle = "#11131c";
  ctx.fillRect(55, 445, 530, 70);
  ctx.strokeStyle = "#3f4258";
  ctx.strokeRect(55, 445, 530, 70);

  ctx.fillStyle = "#9e9eb0";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("SCREENING DATE", 75, 470);
  ctx.fillText("SHOWTIME", 340, 470);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillText(formatDate(booking.showtime?.startsAt), 75, 495);
  ctx.fillText(formatTime(booking.showtime?.startsAt), 340, 495);

  // Reserved Seats & Payment Box
  const seatsStr = booking.seats
    ? booking.seats.map((s) => s.seat?.seatNumber).join(", ")
    : "Reserved Seats";

  ctx.fillStyle = "#9e9eb0";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("RESERVED SEAT(S)", 55, 550);
  ctx.fillStyle = "#f5b83d";
  ctx.font = "bold 24px system-ui, sans-serif";
  ctx.fillText(seatsStr, 55, 582);

  ctx.fillStyle = "#9e9eb0";
  ctx.font = "12px system-ui, sans-serif";
  ctx.fillText("PAYMENT METHOD & TOTAL", 340, 550);
  ctx.fillStyle = "#10b981";
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.fillText(`PAID: KSh ${formatPrice(booking.totalPrice)}`, 340, 582);

  // Dashed Tear Line & Circular Side Notches
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = "#3f4258";
  ctx.beginPath();
  ctx.moveTo(30, 630);
  ctx.lineTo(610, 630);
  ctx.stroke();
  ctx.setLineDash([]);

  // Notches
  ctx.fillStyle = "#0b0c10";
  ctx.beginPath();
  ctx.arc(30, 630, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(610, 630, 16, 0, Math.PI * 2);
  ctx.fill();

  // QR CODE BOX
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(200, 660, 240, 240);
  ctx.strokeStyle = "#f5b83d";
  ctx.lineWidth = 3;
  ctx.strokeRect(200, 660, 240, 240);

  const drawCanvasFinder = (fx, fy) => {
    ctx.fillStyle = "#0b0c10";
    ctx.fillRect(fx, fy, 42, 42);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(fx + 6, fy + 6, 30, 30);
    ctx.fillStyle = "#0b0c10";
    ctx.fillRect(fx + 12, fy + 12, 18, 18);
  };

  drawCanvasFinder(215, 675); // Top-Left
  drawCanvasFinder(383, 675); // Top-Right
  drawCanvasFinder(215, 843); // Bottom-Left

  ctx.fillStyle = "#0b0c10";
  let hashVal = booking.id || 849201;
  for (let r = 0; r < 21; r++) {
    for (let c = 0; c < 21; c++) {
      const inTL = r < 7 && c < 7;
      const inTR = r < 7 && c >= 14;
      const inBL = r >= 14 && c < 7;
      const inCenter = r >= 9 && r <= 11 && c >= 9 && c <= 11;
      if (!inTL && !inTR && !inBL && !inCenter) {
        hashVal = (hashVal * 1664525 + 1013904223) % 4294967296;
        if (hashVal % 3 === 0 || (r + c) % 2 === 0) {
          ctx.fillRect(215 + c * 9, 675 + r * 9, 7, 7);
        }
      }
    }
  }

  // Center Emblem on QR Code Canvas
  ctx.fillStyle = "#f5b83d";
  ctx.fillRect(296, 756, 48, 48);
  ctx.fillStyle = "#0b0c10";
  ctx.font = "bold 16px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("CX", 320, 786);

  // Footer Label
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("SCAN AT CINEMA TURNSTILE ENTRANCE", 320, 915);

  // Export to PNG Image Download
  const imageURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imageURL;
  link.download = `Cinemax_Ticket_CNX-${booking.id}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function App() {
  // Main data
  const [movies, setMovies] = useState([]);
  const [cinemas, setCinemas] = useState([]);
  const [showtimes, setShowtimes] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Watchlist & Favorites
  const [watchlist, setWatchlist] = useState([]);

  // Booking Flow: Step 1 (Seats), Step 2 (Checkout & Snacks)
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [seatData, setSeatData] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [seatLoading, setSeatLoading] = useState(false);
  const [seatError, setSeatError] = useState("");

  // Micro-interaction states for Seat Grid
  const [hoveredRow, setHoveredRow] = useState(null);
  const [shakingSeatId, setShakingSeatId] = useState(null);

  // Snacks & Addons selection
  const [selectedSnacks, setSelectedSnacks] = useState([]);

  // Checkout Step
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("0712345678");
  const [cardNumber, setCardNumber] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [stkPushProcessing, setStkPushProcessing] = useState(false);

  // Digital Wallet State
  const [walletBalance, setWalletBalance] = useState(2500);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState(1000);
  const [depositPhone, setDepositPhone] = useState("0712345678");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositNotice, setDepositNotice] = useState("");
  const [walletTransactions, setWalletTransactions] = useState([
    { id: 101, type: "M-PESA STK DEPOSIT", amount: 2500, date: new Date().toLocaleDateString("en-KE"), status: "SUCCESS" },
  ]);

  // Tracking Location Map State
  const [selectedMapBranch, setSelectedMapBranch] = useState(0);
  const [showMapModal, setShowMapModal] = useState(false);

  // Email Ticket State
  const [emailInput, setEmailInput] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState("");

  // PWA & App Download State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState("");

  // Digital Ticket & Customer History
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [showMyBookings, setShowMyBookings] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [myBookingsLoading, setMyBookingsLoading] = useState(false);

  // Movie Details & Specific Video Trailers
  const [movieDetail, setMovieDetail] = useState(null);
  const [trailerData, setTrailerData] = useState(null); // { title, url }

  // Customer Auth
  const [customer, setCustomer] = useState(null);
  const [authMode, setAuthMode] = useState(null); // 'login' or 'register'
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPhone, setAuthPhone] = useState("0712345678");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirmPassword, setAuthConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  // Admin Dashboard
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // PWA beforeinstallprompt listener
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  // Load movies, cinemas, and showtimes
  useEffect(() => {
    let cancelled = false;

    async function loadWebsiteData() {
      setLoading(true);
      setError("");

      try {
        const [movieData, cinemaData, showtimeData] = await Promise.all([
          getMovies(),
          getCinemas(),
          getShowtimes(),
        ]);

        if (cancelled) return;

        setMovies(Array.isArray(movieData) ? movieData : []);
        setCinemas(Array.isArray(cinemaData) ? cinemaData : []);
        setShowtimes(Array.isArray(showtimeData) ? showtimeData : []);
      } catch (err) {
        if (!cancelled) {
          setError(
            getErrorMessage(
              err,
              "Unable to load cinema information. Please try again."
            )
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadWebsiteData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Restore session & remembered email
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (savedEmail) {
        setAuthEmail(savedEmail);
      }

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) return;

      try {
        const profile = await getCustomerProfile(token);
        if (!cancelled) {
          setCustomer(profile);
          setEmailInput(profile.email || "");
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY);
          setCustomer(null);
        }
      }
    }

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter movies across 500+ dataset
  const filteredMovies = useMemo(() => {
    const query = search.trim().toLowerCase();

    return movies.filter((movie) => {
      const matchesSearch =
        !query ||
        [movie.title, movie.genre, movie.description, movie.status].some(
          (value) => String(value || "").toLowerCase().includes(query)
        );

      const status = String(movie.status || "").toLowerCase();

      const matchesTab =
        activeTab === "all" ||
        (activeTab === "now" &&
          (status === "now showing" || status === "now_showing")) ||
        (activeTab === "coming" &&
          (status === "coming soon" || status === "coming_soon"));

      const matchesGenre =
        selectedGenre === "All Genres" ||
        String(movie.genre || "")
          .toLowerCase()
          .includes(selectedGenre.toLowerCase());

      return matchesSearch && matchesTab && matchesGenre;
    });
  }, [movies, search, activeTab, selectedGenre]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, activeTab, selectedGenre]);

  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE) || 1;

  const paginatedMovies = useMemo(() => {
    const startIdx = (currentPage - 1) * MOVIES_PER_PAGE;
    return filteredMovies.slice(startIdx, startIdx + MOVIES_PER_PAGE);
  }, [filteredMovies, currentPage]);

  // Filter showtimes
  const filteredShowtimes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return showtimes.filter((showtime) => {
      const movieTitle = String(showtime.movie?.title || "").toLowerCase();
      const cinemaName = String(showtime.hall?.cinema?.name || "").toLowerCase();
      const hallName = String(showtime.hall?.name || "").toLowerCase();

      const matchesSearch =
        !query ||
        movieTitle.includes(query) ||
        cinemaName.includes(query) ||
        hallName.includes(query);

      const matchesLocation =
        selectedLocation === "all" ||
        cinemaName.includes(selectedLocation.toLowerCase());

      return matchesSearch && matchesLocation;
    });
  }, [showtimes, search, selectedLocation]);

  // Seat Selection Open
  async function openSeatSelection(showtime) {
    setSelectedShowtime(showtime);
    setSeatData([]);
    setSelectedSeats([]);
    setSelectedSnacks([]);
    setCheckoutStep(1);
    setSeatError("");
    setSeatLoading(true);
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");

    try {
      const seats = await getShowtimeSeats(showtime.id);
      setSeatData(Array.isArray(seats?.data) ? seats.data : []);
    } catch (err) {
      setSeatError(
        getErrorMessage(err, "Unable to load seats. Please try again.")
      );
    } finally {
      setSeatLoading(false);
    }
  }

  function toggleSeat(seat) {
    if (seat.isBooked) {
      setShakingSeatId(seat.id);
      setTimeout(() => setShakingSeatId(null), 450);
      return;
    }

    if (!selectedSeats.includes(seat.id) && selectedSeats.length >= 10) {
      setSeatError("Maximum 10 seats allowed per transaction.");
      setShakingSeatId(seat.id);
      setTimeout(() => setShakingSeatId(null), 450);
      return;
    }
    setSeatError("");

    setSelectedSeats((current) =>
      current.includes(seat.id)
        ? current.filter((id) => id !== seat.id)
        : [...current, seat.id]
    );
  }

  function toggleSnack(snackId) {
    setSelectedSnacks((current) =>
      current.includes(snackId)
        ? current.filter((id) => id !== snackId)
        : [...current, snackId]
    );
  }

  function toggleWatchlist(movieId) {
    setWatchlist((current) =>
      current.includes(movieId)
        ? current.filter((id) => id !== movieId)
        : [...current, movieId]
    );
  }

  function closeSeatSelection() {
    setSelectedShowtime(null);
    setSeatData([]);
    setSelectedSeats([]);
    setSelectedSnacks([]);
    setCheckoutStep(1);
    setSeatError("");
  }

  // Price Calculations
  const ticketBasePrice = Number(selectedShowtime?.price || 0);

  const seatPrices = useMemo(() => {
    return selectedSeats.reduce((sum, seatId) => {
      const seatObj = seatData.find((s) => s.id === seatId);
      const isVip = seatObj?.seatNumber?.startsWith("E") || seatObj?.seatNumber?.startsWith("D");
      return sum + (isVip ? ticketBasePrice + 250 : ticketBasePrice);
    }, 0);
  }, [selectedSeats, seatData, ticketBasePrice]);

  const snackPrices = useMemo(() => {
    return selectedSnacks.reduce((sum, sId) => {
      const item = SNACK_ADDONS.find((addon) => addon.id === sId);
      return sum + (item ? item.price : 0);
    }, 0);
  }, [selectedSnacks]);

  const serviceCharge = selectedSeats.length > 0 ? 50 : 0;
  const subtotalBeforeDiscount = seatPrices + snackPrices;

  // Promo Code Application
  function handleApplyPromo() {
    setPromoError("");
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    if (PROMO_CODES[code]) {
      setAppliedPromo(PROMO_CODES[code]);
    } else {
      setPromoError("Invalid promo code. Try 'CINEMAX10', 'CINEMAX20', or 'STUDENT'.");
    }
  }

  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (appliedPromo.type === "percent") {
      return (subtotalBeforeDiscount * appliedPromo.value) / 100;
    }
    return Math.min(appliedPromo.value, subtotalBeforeDiscount);
  }, [appliedPromo, subtotalBeforeDiscount]);

  const finalTotalPrice = Math.max(0, subtotalBeforeDiscount + serviceCharge - discountAmount);

  // Digital Wallet Deposit Handler via M-Pesa STK Push
  function handleTopUpWallet() {
    if (!/^07\d{8}$|^01\d{8}$|^\+254\d{9}$/.test(depositPhone.trim())) {
      setDepositNotice("❌ Enter a valid Kenyan M-Pesa phone number (e.g. 0712345678).");
      return;
    }

    const numAmount = Number(depositAmount);
    if (!numAmount || numAmount < 50) {
      setDepositNotice("❌ Minimum deposit amount is KSh 50.");
      return;
    }

    setDepositLoading(true);
    setDepositNotice("📲 Sending M-Pesa STK Push prompt to " + depositPhone + "...");

    setTimeout(() => {
      setWalletBalance((prev) => prev + numAmount);
      setWalletTransactions((prev) => [
        {
          id: Date.now(),
          type: "M-PESA STK TOP-UP",
          amount: numAmount,
          date: new Date().toLocaleString("en-KE"),
          status: "SUCCESS",
        },
        ...prev,
      ]);
      setDepositLoading(false);
      setDepositNotice(`✅ Success! KSh ${formatPrice(numAmount)} added to your Cinemax Wallet.`);
    }, 1500);
  }

  // Send E-Ticket via Email simulation
  function handleSendTicketEmail(booking) {
    const target = emailInput.trim() || customer?.email || "customer@cinemax.com";
    setEmailSending(true);
    setEmailSentNotice("");

    setTimeout(() => {
      setEmailSending(false);
      setEmailSentNotice(`✅ E-Ticket #${booking.id} sent to ${target} with entrance QR Code!`);
    }, 1000);
  }

  // App Install / Package Download Handler
  async function handleInstallPWA() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDownloadNotice("✅ Thank you! Cinemax App installed on your device.");
      }
      setDeferredPrompt(null);
    } else {
      triggerAppPackageDownload("Android / Web App");
    }
  }

  function triggerAppPackageDownload(platformName) {
    const blobContent = JSON.stringify(
      {
        appName: "Cinemax Kenya Ticketing Platform",
        platform: platformName,
        version: "2.4.0",
        downloadedAt: new Date().toISOString(),
        instructions:
          "Open this package to install Cinemax on your phone or laptop.",
      },
      null,
      2
    );

    const blob = new Blob([blobContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = platformName.includes("Windows")
      ? "Cinemax_Desktop_v2.4.exe.json"
      : "Cinemax_Mobile_v2.4.apk.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadNotice(`✅ Downloading ${platformName} installer package... Check your downloads folder.`);
  }

  // Complete Booking & Payment Flow
  async function handleFinalCheckoutSubmit() {
    if (!customer) {
      closeSeatSelection();
      openAuth("login");
      setAuthMessage("Please sign in before completing your ticket reservation.");
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      openAuth("login");
      return;
    }

    if (paymentMethod === "mpesa") {
      if (!/^07\d{8}$|^01\d{8}$|^\+254\d{9}$/.test(mpesaPhone.trim())) {
        setSeatError("Enter a valid Kenyan M-Pesa phone number (e.g. 0712345678).");
        return;
      }
      setStkPushProcessing(true);
    } else if (paymentMethod === "wallet") {
      if (walletBalance < finalTotalPrice) {
        setSeatError(`Insufficient Cinemax Wallet balance (KSh ${formatPrice(walletBalance)}). Please top up via M-Pesa or choose M-Pesa STK Push.`);
        return;
      }
    }

    setBookingSubmitting(true);
    setSeatError("");

    setTimeout(async () => {
      try {
        const response = await createBooking(
          selectedShowtime.id,
          selectedSeats,
          token
        );

        if (response && response.booking) {
          if (paymentMethod === "wallet") {
            setWalletBalance((prev) => prev - finalTotalPrice);
            setWalletTransactions((prev) => [
              {
                id: Date.now(),
                type: `TICKET PURCHASE (${selectedShowtime.movie?.title})`,
                amount: -finalTotalPrice,
                date: new Date().toLocaleString("en-KE"),
                status: "DEBITED",
              },
              ...prev,
            ]);
          }

          const completeBookingObj = {
            ...response.booking,
            user: customer,
            paymentMethod: paymentMethod === "wallet" ? "Cinemax Digital Wallet" : paymentMethod === "mpesa" ? `M-Pesa STK (${mpesaPhone})` : paymentMethod === "card" ? "Credit/Debit Card" : "Cash at Counter",
            discount: discountAmount,
            totalPrice: finalTotalPrice,
          };

          setConfirmedBooking(completeBookingObj);
          setEmailSentNotice(`✅ E-Ticket #${completeBookingObj.id} sent automatically to ${customer.email || "your registered email"}!`);
          closeSeatSelection();
        } else {
          throw new Error(response?.message || "Booking submission failed.");
        }
      } catch (err) {
        setSeatError(
          getErrorMessage(
            err,
            "Failed to complete reservation. Selected seats may already be booked."
          )
        );
      } finally {
        setBookingSubmitting(false);
        setStkPushProcessing(false);
      }
    }, paymentMethod === "mpesa" ? 1600 : 300);
  }

  // Open customer ticket drawer
  async function openMyTickets() {
    setShowMyBookings(true);
    setMyBookingsLoading(true);

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setMyBookingsLoading(false);
      return;
    }

    try {
      const bookingsList = await getMyBookings(token);
      setMyBookings(Array.isArray(bookingsList) ? bookingsList : []);
    } catch (err) {
      console.error("Failed to load customer tickets:", err);
    } finally {
      setMyBookingsLoading(false);
    }
  }

  // Auth Modal helpers
  function openAuth(mode) {
    setAuthMode(mode);
    setAuthName("");
    setAuthPhone("0712345678");
    setAuthPassword("");
    setAuthConfirmPassword("");
    setShowPassword(false);
    setAuthError("");
    setAuthMessage("");

    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setAuthEmail(savedEmail);
    }
  }

  function closeAuth() {
    if (authLoading) return;
    setAuthMode(null);
    setAuthError("");
    setAuthPassword("");
    setAuthConfirmPassword("");
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (authLoading) return;

    if (authMode === "register") {
      if (authPassword !== authConfirmPassword) {
        setAuthError("Passwords do not match. Please enter identical passwords.");
        return;
      }
    }

    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");

    try {
      const result =
        authMode === "register"
          ? await registerCustomer(
              authName.trim(),
              authEmail.trim(),
              authPassword,
              authPhone.trim()
            )
          : await loginCustomer(authEmail.trim(), authPassword);

      if (!result.token || !result.user) {
        throw new Error("Server response incomplete.");
      }

      localStorage.setItem(TOKEN_KEY, result.token);

      if (rememberMe && authEmail.trim()) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, authEmail.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      setCustomer(result.user);
      setEmailInput(result.user.email || "");
      setAuthMode(null);
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      setAuthConfirmPassword("");

      if (["ADMIN", "SUPER_ADMIN"].includes(result.user.role)) {
        setShowAdminDashboard(true);
        setAuthMessage(`⚡ Welcome to Cinemax Administrative Dashboard, ${result.user.name}!`);
      } else {
        setAuthMessage(
          authMode === "register"
            ? "Account created successfully! Welcome to Cinemax."
            : `Welcome back, ${result.user.name}!`
        );
      }
    } catch (err) {
      setAuthError(getErrorMessage(err, "Authentication failed. Check your email & password."));
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setCustomer(null);
    setShowAdminDashboard(false);
    setAuthMode(null);
    setAuthError("");
    setAuthPassword("");
    setAuthConfirmPassword("");
    setAuthMessage("You have signed out successfully.");
  }

  // Play Movie Specific Trailer
  function playMovieTrailer(movie) {
    const defaultTrailer = "https://www.youtube.com/embed/Way9Dexny3w?autoplay=1";
    setTrailerData({
      title: movie.title,
      url: movie.trailerUrl || defaultTrailer,
    });
  }

  // Render Seat Button helper
  function renderSeatButton(seat, isVipRow, row) {
    const isSelected = selectedSeats.includes(seat.id);
    const isShaking = shakingSeatId === seat.id;

    let stateClass = "seat-rect";
    if (seat.isBooked) {
      stateClass += " booked";
    } else if (isSelected) {
      stateClass += " selected bounce";
    } else if (isVipRow) {
      stateClass += " vip";
    } else {
      stateClass += " standard";
    }

    if (isShaking) {
      stateClass += " shake";
    }

    return (
      <button
        key={seat.id}
        type="button"
        className={stateClass}
        onClick={() => toggleSeat(seat)}
        onMouseEnter={() => setHoveredRow(row)}
        onMouseLeave={() => setHoveredRow(null)}
        title={
          seat.isBooked
            ? "Seat Booked"
            : `Seat ${seat.seatNumber} (${isVipRow ? "VIP Recliner KSh " + (ticketBasePrice + 250) : "Standard KSh " + ticketBasePrice})`
        }
      >
        {!seat.isBooked && <span className="seat-label-num">{seat.seatNumber.slice(1)}</span>}
      </button>
    );
  }

  // Render Admin Dashboard
  if (
    showAdminDashboard &&
    customer &&
    ["ADMIN", "SUPER_ADMIN"].includes(customer.role)
  ) {
    return (
      <AdminDashboard
        customer={customer}
        onBack={() => setShowAdminDashboard(false)}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="app" id="home">
      {/* 1. HEADER NAVIGATION */}
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Cinemax Home">
          <span className="brand-mark">CX</span>
          <span>
            <strong>CINEMAX</strong>
            <small>500+ MOVIES &amp; TICKETING</small>
          </span>
        </a>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="#home">Home</a>
          <a href="#movies">Movies ({movies.length})</a>
          <a href="#showtimes">Showtimes</a>
          <a href="#cinemas">Cinemas &amp; Branches ({cinemas.length})</a>
          <button
            type="button"
            className="nav-link-btn"
            onClick={() => setShowMapModal(true)}
          >
            📍 Location Map
          </button>
          {customer && (
            <>
              <button
                type="button"
                className="nav-link-btn"
                onClick={openMyTickets}
              >
                📜 Booking History
              </button>
              <button
                type="button"
                className="nav-link-btn wallet-nav-pill"
                onClick={() => setShowWalletModal(true)}
              >
                💳 Wallet: <strong>KSh {formatPrice(walletBalance)}</strong>
              </button>
            </>
          )}
        </nav>

        <div className="account-controls">
          {customer ? (
            <>
              <div className="account-user-pill">
                <span className="user-avatar">{customer.name.charAt(0)}</span>
                <span className="account-greeting">{customer.name}</span>
                <span className="loyalty-pts">🏆 150 pts</span>
              </div>

              {/* Special Admin Control Panel Button - Visible ONLY for Official Admin Accounts */}
              {["ADMIN", "SUPER_ADMIN"].includes(customer.role) && (
                <button
                  type="button"
                  className="admin-badge-btn"
                  onClick={() => setShowAdminDashboard(true)}
                >
                  ⚡ Admin Panel
                </button>
              )}

              <button
                type="button"
                className="text-button"
                onClick={handleLogout}
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="text-button"
                onClick={() => openAuth("login")}
              >
                Sign In
              </button>

              <button
                type="button"
                className="primary-button compact glow-btn"
                onClick={() => openAuth("register")}
              >
                Create Account
              </button>
            </>
          )}
        </div>
      </header>

      {authMessage && (
        <div className="site-notice" role="status">
          <span>{authMessage}</span>
          <button
            type="button"
            onClick={() => setAuthMessage("")}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}

      <main>
        {/* HOMEPAGE HERO BANNER */}
        <section className="hero">
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <div className="hero-badge-pill">
              <span className="pulse-dot"></span> EXPLORE 500+ MOVIES &amp; 12 CINEMA BRANCHES
            </div>

            <h1>
              Discover Blockbusters. <br />
              <span className="gold-gradient">Reserve Your Seats Now.</span>
            </h1>

            <p>
              Kenya&apos;s premier movie ticketing platform. Choose from over 500 feature films, select VIP or Standard recliner seats across 12 cinema locations, download your designed ticket &amp; receive it instantly by email!
            </p>

            <div className="hero-search-bar">
              <span className="hero-search-icon">🔍</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search across 500+ movies, genres, or cinema branches..."
              />
              <a href="#movies" className="primary-button compact glow-btn">
                Browse Catalog ({movies.length})
              </a>
            </div>

            <div className="hero-features-bar">
              <div className="feature-item">
                <span className="feat-icon">🍿</span>
                <div>
                  <strong>4K Laser Projection</strong>
                  <small>IMAX 3D Experience</small>
                </div>
              </div>

              <div className="feature-item">
                <span className="feat-icon">💺</span>
                <div>
                  <strong>VIP Recliners</strong>
                  <small>Leather Comfort</small>
                </div>
              </div>

              <div className="feature-item">
                <span className="feat-icon">💳</span>
                <div>
                  <strong>Digital Wallet</strong>
                  <small>Instant M-Pesa STK Top Up</small>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SPECIAL OFFERS BANNER */}
        <section className="offers-banner-section" id="offers">
          <div className="offer-card">
            <span className="offer-tag">PROMO CODE: CINEMAX10</span>
            <h3>🔥 Tuesday Movie Madness</h3>
            <p>Get 10% OFF on all movie tickets every Tuesday using promo code <strong>CINEMAX10</strong> at checkout!</p>
          </div>

          <div className="offer-card student">
            <span className="offer-tag student">PROMO CODE: STUDENT</span>
            <h3>🎓 Student Special Offer</h3>
            <p>KSh 150 OFF per ticket for students with valid ID! Use code <strong>STUDENT</strong>.</p>
          </div>
        </section>

        {/* MOVIES PAGE & GENRE FILTERS (500+ MOVIES) */}
        <section className="section movies-section" id="movies">
          <div className="section-heading">
            <div>
              <span className="eyebrow">500+ BLOCKBUSTER MOVIES</span>
              <h2>Now Showing &amp; Upcoming Feature Films ({filteredMovies.length})</h2>
            </div>
          </div>

          {/* STATUS TABS */}
          <div className="movie-tabs" role="group" aria-label="Filter movies status">
            <button
              type="button"
              className={activeTab === "all" ? "active" : ""}
              onClick={() => setActiveTab("all")}
            >
              All Movies ({movies.length})
            </button>

            <button
              type="button"
              className={activeTab === "now" ? "active" : ""}
              onClick={() => setActiveTab("now")}
            >
              🔥 Now Showing
            </button>

            <button
              type="button"
              className={activeTab === "coming" ? "active" : ""}
              onClick={() => setActiveTab("coming")}
            >
              ✨ Coming Soon
            </button>
          </div>

          {/* GENRE FILTERS BAR */}
          <div className="genre-filter-bar">
            <span className="genre-filter-label">Filter Genre:</span>
            <div className="genre-pills-scroll">
              {GENRES.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={selectedGenre === g ? "genre-chip active" : "genre-chip"}
                  onClick={() => setSelectedGenre(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-spinner-box">
              <div className="spinner"></div>
              <p>Loading feature movies catalog...</p>
            </div>
          ) : error ? (
            <div className="error-panel">
              <p className="error-message">{error}</p>
              <button
                type="button"
                className="secondary-button"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          ) : filteredMovies.length === 0 ? (
            <p className="message">No movies found matching your search criteria.</p>
          ) : (
            <>
              {/* MOVIES GRID */}
              <div className="movie-grid">
                {paginatedMovies.map((movie) => {
                  const isWatchlisted = watchlist.includes(movie.id);

                  return (
                    <article className="movie-card" key={movie.id}>
                      <div
                        className="movie-poster"
                        onClick={() => setMovieDetail(movie)}
                      >
                        {movie.posterUrl || movie.poster ? (
                          <img
                            src={movie.posterUrl || movie.poster}
                            alt={`${movie.title} poster`}
                            loading="lazy"
                          />
                        ) : (
                          <div className="poster-placeholder">
                            <span className="brand-mark">CX</span>
                            <strong>{movie.title}</strong>
                            <span className="placeholder-sub">CINEMAX EXCLUSIVE</span>
                          </div>
                        )}

                        <div className="poster-overlay">
                          <button
                            type="button"
                            className="quick-view-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setMovieDetail(movie);
                            }}
                          >
                            Overview &amp; Cast
                          </button>
                        </div>

                        <span className="movie-rating-badge">
                          {getAgeRating(movie.id)}
                        </span>

                        <button
                          type="button"
                          className={isWatchlisted ? "watchlist-btn active" : "watchlist-btn"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWatchlist(movie.id);
                          }}
                          title={isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
                        >
                          {isWatchlisted ? "★ Saved" : "☆ Save"}
                        </button>

                        <span className={`movie-status-pill ${movie.status === "Coming Soon" ? "coming" : "now"}`}>
                          {movie.status || "Now Showing"}
                        </span>
                      </div>

                      <div className="movie-card-content">
                        <div className="movie-genre-tags">
                          <span className="genre-pill">{movie.genre || "Action/Drama"}</span>
                          {movie.duration && (
                            <span className="duration-pill">⏱️ {movie.duration}m</span>
                          )}
                        </div>

                        <h3 onClick={() => setMovieDetail(movie)}>{movie.title}</h3>

                        {movie.description && (
                          <p className="movie-description">
                            {movie.description.length > 85
                              ? `${movie.description.slice(0, 85)}...`
                              : movie.description}
                          </p>
                        )}

                        <div className="movie-card-actions-row">
                          <button
                            type="button"
                            className="secondary-button compact"
                            onClick={() => playMovieTrailer(movie)}
                          >
                            ▶ Trailer
                          </button>

                          <button
                            type="button"
                            className="primary-button compact glow-btn"
                            onClick={() => {
                              setSearch(movie.title);
                              document
                                .getElementById("showtimes")
                                ?.scrollIntoView({ behavior: "smooth" });
                            }}
                          >
                            Book Now
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* PAGINATION CONTROLS FOR 500+ MOVIES */}
              {totalPages > 1 && (
                <div className="pagination-bar">
                  <button
                    type="button"
                    className="secondary-button compact"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    ← Previous
                  </button>

                  <span className="page-indicator">
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredMovies.length} total movies)
                  </span>

                  <button
                    type="button"
                    className="secondary-button compact"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next Page →
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* SHOWTIMES & CINEMAS SECTION */}
        <section className="section showtimes-section" id="showtimes">
          <div className="section-heading">
            <div>
              <span className="eyebrow">SCREENING TIMES</span>
              <h2>Upcoming Session Times &amp; Branches</h2>
            </div>
          </div>

          {/* LOCATION FILTER TABS */}
          <div className="location-filter-tabs">
            <span className="filter-label">📍 Filter Location:</span>
            <button
              type="button"
              className={selectedLocation === "all" ? "loc-tab active" : "loc-tab"}
              onClick={() => setSelectedLocation("all")}
            >
              All Cinemas ({cinemas.length})
            </button>

            {cinemas.map((c) => (
              <button
                key={c.id}
                type="button"
                className={selectedLocation === c.name ? "loc-tab active" : "loc-tab"}
                onClick={() => setSelectedLocation(c.name)}
              >
                {c.name.split(" ")[0]} Cinema
              </button>
            ))}
          </div>

          {loading ? (
            <div className="loading-spinner-box">
              <div className="spinner"></div>
              <p>Loading session times...</p>
            </div>
          ) : error ? (
            <p className="error-message">{error}</p>
          ) : filteredShowtimes.length === 0 ? (
            <p className="message">
              No showtimes currently available for your search.
            </p>
          ) : (
            <div className="showtime-list">
              {filteredShowtimes.map((showtime) => (
                <article className="showtime-card" key={showtime.id}>
                  <div className="showtime-movie">
                    <div className="showtime-play-icon">▶</div>
                    <div>
                      <h3>{showtime.movie?.title || "Movie Session"}</h3>
                      <p className="showtime-cinema-location">
                        📍 {showtime.hall?.cinema?.name || "Cinemax Branch"}
                      </p>
                      <div className="hall-badge-row">
                        <span className="hall-pill">
                          {showtime.hall?.name || "Main Hall"}
                        </span>
                        <span className="format-tag">
                          {getFormatTag(showtime.id)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="showtime-time-block">
                    <span className="showtime-date">
                      📅 {formatDate(showtime.startsAt)}
                    </span>
                    <strong className="showtime-clock">
                      ⏰ {formatTime(showtime.startsAt)}
                    </strong>
                  </div>

                  <div className="showtime-price-block">
                    <span className="price-label">Ticket From</span>
                    <strong className="price-value">
                      KSh {formatPrice(showtime.price)}
                    </strong>
                  </div>

                  <div className="showtime-action-block">
                    <button
                      type="button"
                      className="primary-button compact glow-btn"
                      onClick={() => openSeatSelection(showtime)}
                    >
                      💺 Select Seats
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* CINEMA LOCATIONS & TRACKING MAP SECTION */}
        <section className="section cinemas-section" id="cinemas">
          <div className="section-heading">
            <div>
              <span className="eyebrow">OUR CINEMA BRANCHES</span>
              <h2>Cinema Locations &amp; Tracking Map ({cinemas.length} Locations)</h2>
            </div>
            <button
              type="button"
              className="primary-button compact glow-btn"
              onClick={() => setShowMapModal(true)}
            >
              📍 Open Interactive Directions Map
            </button>
          </div>

          {loading ? (
            <p className="message">Loading cinema locations...</p>
          ) : cinemas.length === 0 ? (
            <p className="message">No cinema locations available.</p>
          ) : (
            <div className="cinema-grid">
              {cinemas.map((cinema, idx) => (
                <article className="cinema-card" key={cinema.id}>
                  <div className="cinema-header-row">
                    <span className="cinema-icon-badge">🏛️</span>
                    <div>
                      <h3>{cinema.name}</h3>
                      <p className="cinema-location-text">📍 {cinema.location}</p>
                    </div>
                  </div>

                  <div className="cinema-specs">
                    <span>🎬 {cinema.halls?.length || 0} Cinema Halls (IMAX &amp; Dolby 7.1)</span>
                    <span>🍿 Gourmet Concession Bar</span>
                    <span>📍 GPS Distance: ~{(idx * 1.8 + 1.2).toFixed(1)} km away</span>
                  </div>

                  <div className="cinema-card-actions">
                    <button
                      type="button"
                      className="secondary-button compact"
                      onClick={() => {
                        setSelectedMapBranch(idx);
                        setShowMapModal(true);
                      }}
                    >
                      📍 Track Location
                    </button>
                    <button
                      type="button"
                      className="primary-button compact"
                      onClick={() => {
                        setSelectedLocation(cinema.name);
                        document
                          .getElementById("showtimes")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      Show Schedule →
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FLOATING APP DOWNLOAD BUTTON */}
      <button
        type="button"
        className="floating-download-btn"
        onClick={() => {
          setShowDownloadModal(true);
          setDownloadNotice("");
        }}
        title="Download Cinemax App for Phone or Laptop"
      >
        <span className="dl-icon-pulse">📱</span>
        <span className="dl-btn-text">
          <strong>Download App</strong>
          <small>Phone &amp; Laptop</small>
        </span>
      </button>

      {/* DIGITAL WALLET MODAL */}
      {showWalletModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowWalletModal(false);
          }}
        >
          <div className="seat-modal wallet-modal">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">CUSTOMER DIGITAL WALLET</span>
                <h2>Cinemax Balance &amp; M-Pesa Top Up</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowWalletModal(false)}
              >
                ×
              </button>
            </div>

            {/* WALLET BALANCE CARD */}
            <div className="wallet-balance-card">
              <div className="wallet-balance-left">
                <span>Available Balance</span>
                <strong>KSh {formatPrice(walletBalance)}</strong>
                <small>Linked to {customer?.email || "customer@cinemax.com"}</small>
              </div>
              <div className="wallet-balance-right">
                <span className="wallet-badge">⚡ Instant STK Top Up</span>
              </div>
            </div>

            {/* DEPOSIT FORM */}
            <div className="wallet-deposit-form">
              <h3>📱 Load Wallet via M-Pesa STK Push</h3>

              <label>
                M-Pesa Phone Number:
                <input
                  type="tel"
                  value={depositPhone}
                  onChange={(e) => setDepositPhone(e.target.value)}
                  placeholder="0712345678"
                  required
                />
              </label>

              <label>Select Top-Up Amount (KSh):</label>
              <div className="deposit-preset-chips">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={depositAmount === amt ? "preset-chip active" : "preset-chip"}
                    onClick={() => setDepositAmount(amt)}
                  >
                    +KSh {formatPrice(amt)}
                  </button>
                ))}
              </div>

              <label className="mt-2">
                Or Custom Amount:
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  min={50}
                  max={70000}
                />
              </label>

              {depositNotice && <p className="success-message mini mt-2">{depositNotice}</p>}

              <button
                type="button"
                className="primary-button glow-btn full-width mt-3"
                disabled={depositLoading}
                onClick={handleTopUpWallet}
              >
                {depositLoading ? "Sending STK Push..." : `Top Up KSh ${formatPrice(depositAmount)} Now`}
              </button>
            </div>

            {/* RECENT WALLET TRANSACTIONS */}
            <div className="wallet-history-box">
              <h4>📜 Recent Wallet Statement</h4>
              <div className="transactions-list">
                {walletTransactions.map((tx) => (
                  <div key={tx.id} className="tx-item">
                    <div>
                      <strong>{tx.type}</strong>
                      <small>{tx.date}</small>
                    </div>
                    <span className={tx.amount > 0 ? "green-text font-bold" : "gold-text font-bold"}>
                      {tx.amount > 0 ? `+KSh ${formatPrice(tx.amount)}` : `-KSh ${formatPrice(Math.abs(tx.amount))}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRACKING LOCATION MAP MODAL */}
      {showMapModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowMapModal(false);
          }}
        >
          <div className="seat-modal map-tracker-modal">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">GPS CINEMA TRACKER</span>
                <h2>Interactive Branch Location Map</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowMapModal(false)}
              >
                ×
              </button>
            </div>

            {/* BRANCH SELECTOR TABS */}
            <div className="map-branch-selector">
              {cinemas.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  className={selectedMapBranch === i ? "map-tab active" : "map-tab"}
                  onClick={() => setSelectedMapBranch(i)}
                >
                  {c.name.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* INTERACTIVE VECTOR MAP CONTAINER */}
            {cinemas[selectedMapBranch] && (
              <div className="map-display-card">
                <div className="vector-map-graphic">
                  <div className="map-grid-overlay"></div>
                  <div className="map-pulse-marker">
                    <span className="marker-pin">📍</span>
                    <span className="marker-pulse-ring"></span>
                    <div className="marker-tooltip">
                      <strong>{cinemas[selectedMapBranch].name}</strong>
                      <small>OPEN NOW · IMAX Laser</small>
                    </div>
                  </div>
                </div>

                <div className="map-details-panel">
                  <h3>🏛️ {cinemas[selectedMapBranch].name}</h3>
                  <p>📍 {cinemas[selectedMapBranch].location}</p>

                  <div className="map-meta-grid">
                    <div>
                      <span>Distance:</span>
                      <strong>~{(selectedMapBranch * 1.8 + 1.2).toFixed(1)} km away</strong>
                    </div>
                    <div>
                      <span>Operating Hours:</span>
                      <strong>09:00 AM – 11:30 PM Daily</strong>
                    </div>
                    <div>
                      <span>Parking:</span>
                      <strong>Secure Covered Multilevel</strong>
                    </div>
                    <div>
                      <span>Hotline:</span>
                      <strong>+254 700 123 456</strong>
                    </div>
                  </div>

                  <div className="map-actions-row">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        cinemas[selectedMapBranch].name + " " + cinemas[selectedMapBranch].location
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="primary-button glow-btn flex-1"
                    >
                      🗺️ Open Google Maps Directions
                    </a>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        setSelectedLocation(cinemas[selectedMapBranch].name);
                        setShowMapModal(false);
                        document.getElementById("showtimes")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      View Showtimes →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DOWNLOAD APP MODAL */}
      {showDownloadModal && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowDownloadModal(false);
          }}
        >
          <div className="seat-modal app-download-modal">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">MOBILE &amp; DESKTOP APP</span>
                <h2>Download Cinemax App</h2>
                <p className="session-sub-info">
                  Book tickets 2x faster, receive offline QR tickets &amp; instant notifications!
                </p>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowDownloadModal(false)}
              >
                ×
              </button>
            </div>

            <div className="download-platforms-grid">
              {/* ANDROID OPTION */}
              <div className="platform-card">
                <div className="platform-icon">🤖</div>
                <h3>Android App (.APK)</h3>
                <p>Direct APK download for all Android phones &amp; tablets.</p>
                <button
                  type="button"
                  className="primary-button compact glow-btn full-width"
                  onClick={() => triggerAppPackageDownload("Android Mobile (.APK)")}
                >
                  📥 Download .APK (18 MB)
                </button>
              </div>

              {/* WINDOWS / LAPTOP OPTION */}
              <div className="platform-card">
                <div className="platform-icon">💻</div>
                <h3>Windows Desktop App</h3>
                <p>Native app for laptops and desktop PCs with instant launch.</p>
                <button
                  type="button"
                  className="primary-button compact glow-btn full-width"
                  onClick={() => triggerAppPackageDownload("Windows Desktop (.EXE)")}
                >
                  📥 Download .EXE (32 MB)
                </button>
              </div>

              {/* PWA INSTANT INSTALL OPTION */}
              <div className="platform-card pwa-card">
                <div className="platform-icon">📲</div>
                <h3>Instant PWA Web App</h3>
                <p>Install directly to your home screen or taskbar without app store downloads.</p>
                <button
                  type="button"
                  className="primary-button compact glow-btn full-width"
                  onClick={handleInstallPWA}
                >
                  ⚡ {deferredPrompt ? "Install Web App Now" : "Add to Home Screen"}
                </button>
              </div>
            </div>

            {/* MOBILE QR CODE SCAN INSTALL */}
            <div className="qr-app-install-box">
              <div className="qr-app-left">
                <h4>📱 Scan with Phone Camera to Open Mobile App</h4>
                <p>Point your phone&apos;s camera at this QR code to launch Cinemax immediately on your smartphone!</p>
              </div>
              <div className="qr-app-right">
                <QRCodeSVG value="https://cinemax.co.ke/app-download" />
              </div>
            </div>

            {downloadNotice && <p className="success-message mini mt-2 text-center">{downloadNotice}</p>}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-top">
          <a className="brand footer-brand" href="#home">
            <span className="brand-mark">CX</span>
            <span>
              <strong>CINEMAX</strong>
              <small>TICKETING</small>
            </span>
          </a>
          <p>Kenya&apos;s Complete Professional Cinema Management &amp; Ticket Booking Platform.</p>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Cinemax Kenya. All rights reserved.</span>
          <span>Powered by M-Pesa &amp; PostgreSQL Engine</span>
        </div>
      </footer>

      {/* MOVIE DETAILS MODAL */}
      {movieDetail && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMovieDetail(null);
          }}
        >
          <div className="seat-modal movie-detail-modal">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">MOVIE SYNOPSIS &amp; DETAILS</span>
                <h2>{movieDetail.title}</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setMovieDetail(null)}
              >
                ×
              </button>
            </div>

            <div className="detail-content-grid">
              <div className="detail-poster-wrapper">
                {movieDetail.posterUrl ? (
                  <img src={movieDetail.posterUrl} alt={movieDetail.title} />
                ) : (
                  <div className="poster-placeholder">
                    <span>{movieDetail.title}</span>
                  </div>
                )}
                <button
                  type="button"
                  className="primary-button compact full-width mt-3 glow-btn"
                  onClick={() => playMovieTrailer(movieDetail)}
                >
                  ▶ Watch Movie Trailer
                </button>
              </div>

              <div className="detail-info">
                <div className="detail-tags">
                  <span className="genre-pill">{movieDetail.genre}</span>
                  <span className="movie-rating-badge">{getAgeRating(movieDetail.id)}</span>
                  {movieDetail.duration && <span>⏱️ {movieDetail.duration} min</span>}
                  <span>🗣️ English / Swahili</span>
                </div>

                <p className="detail-synopsis">
                  {movieDetail.description || "Experience this breathtaking movie on the big screen with Dolby 7.1 Surround Sound."}
                </p>

                <div className="detail-meta-box">
                  <div>
                    <strong>Cast:</strong> <span>{getCastDirector(movieDetail.id).cast}</span>
                  </div>
                  <div>
                    <strong>Director:</strong> <span>{getCastDirector(movieDetail.id).director}</span>
                  </div>
                  <div>
                    <strong>Status:</strong> <span>{movieDetail.status || "Now Showing"}</span>
                  </div>
                  {movieDetail.releaseDate && (
                    <div>
                      <strong>Release Date:</strong>{" "}
                      <span>{formatDate(movieDetail.releaseDate)}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="primary-button glow-btn full-width"
                  onClick={() => {
                    setSearch(movieDetail.title);
                    setMovieDetail(null);
                    document.getElementById("showtimes")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Book Tickets for {movieDetail.title}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC MOVIE SPECIFIC TRAILER PLAYBACK MODAL */}
      {trailerData && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setTrailerData(null);
          }}
        >
          <div className="seat-modal trailer-modal">
            <div className="modal-heading">
              <h2>🎬 Official Trailer: {trailerData.title}</h2>
              <button
                type="button"
                className="close-button"
                onClick={() => setTrailerData(null)}
              >
                ×
              </button>
            </div>
            <div className="trailer-video-wrapper">
              <iframe
                src={trailerData.url}
                title={`Official Trailer for ${trailerData.title}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* MODERN PREMIUM AUTHENTICATION MODAL (CINEMAX PORTAL) */}
      {authMode && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAuth();
          }}
        >
          <section className="seat-modal auth-modal-redesigned" role="dialog" aria-modal="true">
            {/* HEADER */}
            <div className="auth-modal-header">
              <div className="auth-brand-group">
                <span className="brand-mark sm">CX</span>
                <h2>CINEMAX PORTAL</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={closeAuth}
                aria-label="Close authentication modal"
                disabled={authLoading}
              >
                ×
              </button>
            </div>

            {/* TAB SYSTEM */}
            <div className="auth-tab-switcher">
              <button
                type="button"
                className={authMode === "login" ? "auth-tab active" : "auth-tab"}
                onClick={() => openAuth("login")}
              >
                Sign In
              </button>
              <button
                type="button"
                className={authMode === "register" ? "auth-tab active" : "auth-tab"}
                onClick={() => openAuth("register")}
              >
                Create Account
              </button>
            </div>

            {/* UNIFIED FORM */}
            <form className="auth-form" onSubmit={handleAuthSubmit}>
              {authMode === "register" ? (
                <>
                  <label>
                    Full Name
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Enter your full name"
                      minLength={2}
                      maxLength={80}
                      required
                    />
                  </label>

                  <label>
                    Email Address
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                  </label>

                  <label>
                    M-Pesa Phone Number
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="0712345678"
                      required
                    />
                    <small className="field-hint">📱 Linked to instant M-Pesa STK Push ticket payments</small>
                  </label>

                  <label>
                    Password
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        minLength={8}
                        maxLength={72}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-pwd-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "🙈 Hide" : "👁️ Show"}
                      </button>
                    </div>
                  </label>

                  <label>
                    Confirm Password
                    <input
                      type={showPassword ? "text" : "password"}
                      value={authConfirmPassword}
                      onChange={(e) => setAuthConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      minLength={8}
                      maxLength={72}
                      required
                    />
                  </label>

                  {authError && <p className="error-message">{authError}</p>}

                  <button
                    type="submit"
                    className="primary-button booking-button glow-btn full-width mt-2"
                    disabled={authLoading}
                  >
                    {authLoading ? "Creating Account..." : "Create Account"}
                  </button>
                </>
              ) : (
                <>
                  <label>
                    Email Address
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                  </label>

                  <label>
                    Password
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="Enter your password"
                        minLength={8}
                        maxLength={72}
                        required
                      />
                      <button
                        type="button"
                        className="toggle-pwd-btn"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "🙈 Hide" : "👁️ Show"}
                      </button>
                    </div>
                  </label>

                  <div className="auth-options-row">
                    <label className="remember-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Remember Me</span>
                    </label>

                    <button
                      type="button"
                      className="text-button forgot-pwd-link"
                      onClick={() =>
                        setAuthError(
                          "Password reset link sent! Please check your inbox or contact support@cinemax.com."
                        )
                      }
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {authError && <p className="error-message">{authError}</p>}

                  <button
                    type="submit"
                    className="primary-button booking-button glow-btn full-width mt-2"
                    disabled={authLoading}
                  >
                    {authLoading ? "Signing In..." : "Sign In"}
                  </button>
                </>
              )}
            </form>
          </section>
        </div>
      )}

      {/* CINEMA SEAT SELECTION & CHECKOUT MODAL */}
      {selectedShowtime && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeSeatSelection();
          }}
        >
          <section className="seat-modal theater-seat-modal" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">
                  {checkoutStep === 1 ? "STEP 1: INTERACTIVE SEAT SELECTION" : "STEP 2: PAYMENT & SNACK ADD-ONS"}
                </span>
                <h2>{selectedShowtime.movie?.title}</h2>
                <p className="session-sub-info">
                  📍 {selectedShowtime.hall?.cinema?.name} · {selectedShowtime.hall?.name}
                  <span className="format-tag mini">{getFormatTag(selectedShowtime.id)}</span>
                </p>
                <p className="session-time-info">
                  📅 {formatDate(selectedShowtime.startsAt)} at {formatTime(selectedShowtime.startsAt)}
                </p>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={closeSeatSelection}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {/* STEP 1: INTERACTIVE SEAT SELECTION */}
            {checkoutStep === 1 && (
              <div className="modern-cinema-layout">
                {seatLoading ? (
                  <div className="loading-spinner-box">
                    <div className="spinner"></div>
                    <p>Loading real-time hall seat grid...</p>
                  </div>
                ) : seatError ? (
                  <p className="error-message">{seatError}</p>
                ) : (
                  <>
                    {/* SLEEK RAZOR-THIN CURVED SCREEN */}
                    <div className="sleek-screen-container">
                      <div className="sleek-screen-arc"></div>
                      <span className="screen-muted-text">S C R E E N</span>
                    </div>

                    {/* SEATING GRID WITH AISLE AND CURVATURE */}
                    <div className="cinema-arch-seating">
                      {["A", "B", "C", "D", "E"].map((row) => {
                        const rowSeats = seatData.filter((seat) =>
                          seat.seatNumber.startsWith(row)
                        );

                        if (rowSeats.length === 0) return null;
                        const isVipRow = row === "E" || row === "D";
                        const leftBlock = rowSeats.slice(0, 4);
                        const rightBlock = rowSeats.slice(4, 8);
                        const isRowActive = hoveredRow === row;

                        return (
                          <div
                            className={`arced-seat-row row-${row}`}
                            key={row}
                          >
                            <span className={`outer-row-label left ${isRowActive ? "active" : ""}`}>
                              {row}
                            </span>

                            {/* LEFT AISLE BLOCK */}
                            <div className="aisle-block left">
                              {leftBlock.map((seat) => renderSeatButton(seat, isVipRow, row))}
                            </div>

                            {/* VISIBLE CENTER AISLE */}
                            <div className="center-aisle-gap" title="Center Aisle"></div>

                            {/* RIGHT AISLE BLOCK */}
                            <div className="aisle-block right">
                              {rightBlock.map((seat) => renderSeatButton(seat, isVipRow, row))}
                            </div>

                            <span className={`outer-row-label right ${isRowActive ? "active" : ""}`}>
                              {row}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* STICKY FOOTER CHECKOUT ZONE */}
                    <div className="sticky-checkout-footer">
                      <div className="footer-left-legend">
                        <div className="footer-legend-item">
                          <span className="legend-chip standard"></span> Standard
                        </div>
                        <div className="footer-legend-item">
                          <span className="legend-chip vip"></span> VIP
                        </div>
                        <div className="footer-legend-item">
                          <span className="legend-chip selected"></span> Selected
                        </div>
                        <div className="footer-legend-item">
                          <span className="legend-chip booked"></span> Booked
                        </div>
                      </div>

                      <div className="footer-center-badges">
                        {selectedSeats.length > 0 ? (
                          seatData
                            .filter((seat) => selectedSeats.includes(seat.id))
                            .map((seat) => (
                              <span key={seat.id} className="dismissible-seat-badge">
                                {seat.seatNumber}
                                <button
                                  type="button"
                                  onClick={() => toggleSeat(seat)}
                                  title={`Deselect ${seat.seatNumber}`}
                                >
                                  ✕
                                </button>
                              </span>
                            ))
                        ) : (
                          <span className="empty-selection-hint">Select seats from seating plan</span>
                        )}
                      </div>

                      <div className="footer-right-checkout">
                        <div className="rolling-price-box">
                          <span className="price-sub-label">Subtotal:</span>
                          <strong className="rolling-price-val">KSh {formatPrice(seatPrices)}</strong>
                        </div>

                        <button
                          type="button"
                          className={`primary-button proceed-btn ${selectedSeats.length > 0 ? "active-bright" : "disabled-muted"}`}
                          disabled={selectedSeats.length === 0}
                          onClick={() => setCheckoutStep(2)}
                        >
                          Proceed to Payment →
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* STEP 2: CHECKOUT & CONCESSIONS */}
            {checkoutStep === 2 && (
              <div className="checkout-step-container">
                <div className="checkout-grid">
                  {/* LEFT: ORDER SUMMARY & FOOD ADDONS */}
                  <div className="checkout-summary-box">
                    <h3>📋 Order Summary</h3>
                    <div className="summary-line">
                      <span>Movie:</span>
                      <strong>{selectedShowtime.movie?.title}</strong>
                    </div>
                    <div className="summary-line">
                      <span>Cinema &amp; Hall:</span>
                      <strong>{selectedShowtime.hall?.cinema?.name} ({selectedShowtime.hall?.name})</strong>
                    </div>
                    <div className="summary-line">
                      <span>Date &amp; Time:</span>
                      <strong>{formatDate(selectedShowtime.startsAt)} at {formatTime(selectedShowtime.startsAt)}</strong>
                    </div>
                    <div className="summary-line">
                      <span>Selected Seats:</span>
                      <strong className="gold-text">
                        {seatData
                          .filter((seat) => selectedSeats.includes(seat.id))
                          .map((seat) => seat.seatNumber)
                          .join(", ")} ({selectedSeats.length} seats)
                      </strong>
                    </div>

                    {/* CONCESSION ADDONS SECTION */}
                    <div className="snacks-section">
                      <label className="snacks-label">🍿 Add Food &amp; Drink Combos (Optional):</label>
                      <div className="snack-chips-list">
                        {SNACK_ADDONS.map((snack) => {
                          const isSelected = selectedSnacks.includes(snack.id);
                          return (
                            <button
                              key={snack.id}
                              type="button"
                              className={isSelected ? "snack-chip active" : "snack-chip"}
                              onClick={() => toggleSnack(snack.id)}
                            >
                              <span>{snack.name}</span>
                              <strong>+KSh {snack.price}</strong>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="summary-divider"></div>

                    <div className="summary-line">
                      <span>Tickets Subtotal:</span>
                      <span>KSh {formatPrice(seatPrices)}</span>
                    </div>

                    {snackPrices > 0 && (
                      <div className="summary-line">
                        <span>Snack Add-ons:</span>
                        <span>KSh {formatPrice(snackPrices)}</span>
                      </div>
                    )}

                    <div className="summary-line">
                      <span>Booking Fee:</span>
                      <span>KSh {formatPrice(serviceCharge)}</span>
                    </div>

                    {appliedPromo && (
                      <div className="summary-line promo-discount-line">
                        <span>Discount ({appliedPromo.label}):</span>
                        <strong className="green-text">- KSh {formatPrice(discountAmount)}</strong>
                      </div>
                    )}

                    <div className="summary-divider"></div>

                    <div className="summary-line total-line">
                      <span>Total Due:</span>
                      <strong className="total-gold-price">KSh {formatPrice(finalTotalPrice)}</strong>
                    </div>

                    {/* PROMO INPUT */}
                    <div className="promo-box">
                      <label>Promo Code:</label>
                      <div className="promo-input-row">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          placeholder="e.g. CINEMAX10"
                        />
                        <button
                          type="button"
                          className="secondary-button compact"
                          onClick={handleApplyPromo}
                        >
                          Apply
                        </button>
                      </div>
                      {promoError && <p className="error-message mini">{promoError}</p>}
                      {appliedPromo && <p className="success-message mini">✓ Applied: {appliedPromo.label}</p>}
                    </div>
                  </div>

                  {/* RIGHT: PAYMENT METHODS */}
                  <div className="checkout-payment-box">
                    <h3>💳 Select Payment Method</h3>

                    <div className="payment-method-selector">
                      <button
                        type="button"
                        className={paymentMethod === "wallet" ? "pm-tab active" : "pm-tab"}
                        onClick={() => setPaymentMethod("wallet")}
                      >
                        💳 Cinemax Digital Wallet (Balance: KSh {formatPrice(walletBalance)})
                      </button>

                      <button
                        type="button"
                        className={paymentMethod === "mpesa" ? "pm-tab active" : "pm-tab"}
                        onClick={() => setPaymentMethod("mpesa")}
                      >
                        📱 M-Pesa STK Push
                      </button>

                      <button
                        type="button"
                        className={paymentMethod === "card" ? "pm-tab active" : "pm-tab"}
                        onClick={() => setPaymentMethod("card")}
                      >
                        💳 Credit / Debit Card
                      </button>

                      <button
                        type="button"
                        className={paymentMethod === "cash" ? "pm-tab active" : "pm-tab"}
                        onClick={() => setPaymentMethod("cash")}
                      >
                        💵 Cash at Counter
                      </button>
                    </div>

                    {/* WALLET FORM */}
                    {paymentMethod === "wallet" && (
                      <div className="payment-form-panel">
                        <p className="payment-hint">
                          ⚡ Deduct KSh {formatPrice(finalTotalPrice)} instantly from your Cinemax Wallet.
                          <br />
                          Current Wallet Balance: <strong>KSh {formatPrice(walletBalance)}</strong>
                        </p>
                      </div>
                    )}

                    {/* M-PESA FORM */}
                    {paymentMethod === "mpesa" && (
                      <div className="payment-form-panel">
                        <label>
                          M-Pesa Phone Number (for STK Push prompt):
                          <input
                            type="tel"
                            value={mpesaPhone}
                            onChange={(e) => setMpesaPhone(e.target.value)}
                            placeholder="0712345678"
                            required
                          />
                        </label>
                        <p className="payment-hint">
                          📲 An M-Pesa prompt will be sent directly to your phone. Enter your PIN to complete ticket payment.
                        </p>
                      </div>
                    )}

                    {/* CARD FORM */}
                    {paymentMethod === "card" && (
                      <div className="payment-form-panel">
                        <label>
                          Card Number:
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            placeholder="4542 •••• •••• 8892"
                          />
                        </label>
                        <div className="card-inline-row">
                          <label>
                            Expiry:
                            <input type="text" placeholder="MM/YY" />
                          </label>
                          <label>
                            CVV:
                            <input type="password" placeholder="123" maxLength={4} />
                          </label>
                        </div>
                      </div>
                    )}

                    {/* CASH HINT */}
                    {paymentMethod === "cash" && (
                      <div className="payment-form-panel">
                        <p className="payment-hint">
                          💵 Your seats will be reserved under state <strong>PENDING</strong>. Pay at the ticket counter 15 minutes before showtime.
                        </p>
                      </div>
                    )}

                    {seatError && <p className="error-message mt-2">{seatError}</p>}

                    <div className="checkout-action-buttons">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setCheckoutStep(1)}
                        disabled={bookingSubmitting}
                      >
                        ← Back to Seats
                      </button>

                      <button
                        type="button"
                        className="primary-button glow-btn flex-1"
                        disabled={bookingSubmitting}
                        onClick={handleFinalCheckoutSubmit}
                      >
                        {stkPushProcessing
                          ? "Sending STK Push..."
                          : bookingSubmitting
                          ? "Processing Ticket..."
                          : `Pay KSh ${formatPrice(finalTotalPrice)} Now`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* DIGITAL CINEMA TICKET STUB WITH DESIGNED TICKET PNG DOWNLOAD & EMAIL FEATURES */}
      {confirmedBooking && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirmedBooking(null);
          }}
        >
          <div className="seat-modal ticket-stub-modal">
            <div className="ticket-header">
              <div className="ticket-header-content">
                <span className="ticket-badge-success">✓ PAYMENT &amp; BOOKING CONFIRMED</span>
                <h2>Digital Cinema Ticket</h2>
                <p>Scan this QR code at the cinema turnstile for automatic entry.</p>
              </div>
              <button
                type="button"
                className="close-button ticket-close-btn"
                onClick={() => setConfirmedBooking(null)}
                aria-label="Close ticket"
              >
                ×
              </button>
            </div>

            <div className="ticket-stub-body">
              <div className="ticket-top-row">
                <div className="ticket-brand">
                  <span className="brand-mark">CX</span>
                  <strong>CINEMAX TICKET</strong>
                </div>
                <div className="ticket-ref">
                  <span>Booking Ref</span>
                  <strong>#CNX-{confirmedBooking.id}-2026</strong>
                </div>
              </div>

              {/* CUSTOMER DETAILS ON TICKET */}
              <div className="ticket-customer-row">
                <div>
                  <span>Customer Name</span>
                  <strong>{confirmedBooking.user?.name || customer?.name || "Valued Customer"}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{confirmedBooking.user?.email || customer?.email || "customer@cinemax.com"}</strong>
                </div>
              </div>

              <div className="ticket-movie-details">
                <h3>{confirmedBooking.showtime?.movie?.title || "Movie Session"}</h3>
                <p className="ticket-hall-info">
                  📍 {confirmedBooking.showtime?.hall?.cinema?.name} — {confirmedBooking.showtime?.hall?.name}
                </p>

                <div className="ticket-time-grid">
                  <div>
                    <span>Date</span>
                    <strong>{formatDate(confirmedBooking.showtime?.startsAt)}</strong>
                  </div>
                  <div>
                    <span>Showtime</span>
                    <strong>{formatTime(confirmedBooking.showtime?.startsAt)}</strong>
                  </div>
                </div>
              </div>

              <div className="ticket-divider">
                <div className="stub-notch left"></div>
                <div className="stub-line"></div>
                <div className="stub-notch right"></div>
              </div>

              <div className="ticket-bottom-row">
                <div className="ticket-seats-list">
                  <span>Reserved Seats</span>
                  <strong>
                    {confirmedBooking.seats
                      ? confirmedBooking.seats.map((s) => s.seat?.seatNumber).join(", ")
                      : "Seats Reserved"}
                  </strong>
                </div>

                <div className="ticket-total-paid">
                  <span>Payment Status</span>
                  <strong className="green-text">PAID ({confirmedBooking.paymentMethod || "M-Pesa"})</strong>
                </div>
              </div>

              {/* REAL RESPONSIVE VECTOR QR CODE WITH CENTER EMBLEM */}
              <div className="ticket-qrcode-section">
                <QRCodeSVG value={`CNX-BOOKING-${confirmedBooking.id}`} />
                <span className="barcode-num">SCAN FOR CINEMA ENTRANCE</span>
              </div>

              {/* EMAIL TICKET DISPATCH SECTION */}
              <div className="email-dispatch-box">
                <label>📧 Send E-Ticket &amp; QR Code to Email:</label>
                <div className="email-dispatch-row">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Enter email address..."
                  />
                  <button
                    type="button"
                    className="primary-button compact"
                    disabled={emailSending}
                    onClick={() => handleSendTicketEmail(confirmedBooking)}
                  >
                    {emailSending ? "Sending..." : "Send Email"}
                  </button>
                </div>
                {emailSentNotice && <p className="success-message mini mt-1">{emailSentNotice}</p>}
              </div>
            </div>

            <div className="ticket-actions">
              <button
                type="button"
                className="secondary-button glow-btn-border"
                onClick={() => downloadDesignedTicketImage(confirmedBooking)}
              >
                📥 Download Designed Ticket (PNG)
              </button>

              <button
                type="button"
                className="primary-button glow-btn"
                onClick={() => {
                  setConfirmedBooking(null);
                  openMyTickets();
                }}
              >
                View In Customer Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER MY ACCOUNT & BOOKING HISTORY DRAWER */}
      {showMyBookings && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowMyBookings(false);
          }}
        >
          <div className="seat-modal my-tickets-modal">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">CUSTOMER DASHBOARD</span>
                <h2>My Booking History &amp; Tickets</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => setShowMyBookings(false)}
              >
                ×
              </button>
            </div>

            <div className="customer-profile-bar">
              <div className="profile-info-item">
                <span className="user-avatar lg">{customer?.name?.charAt(0)}</span>
                <div>
                  <strong>{customer?.name}</strong>
                  <small>{customer?.email}</small>
                </div>
              </div>

              <div className="loyalty-box">
                <span>Wallet Balance:</span>
                <strong className="gold-text">KSh {formatPrice(walletBalance)}</strong>
              </div>
            </div>

            {myBookingsLoading ? (
              <div className="loading-spinner-box">
                <div className="spinner"></div>
                <p>Retrieving your movie tickets...</p>
              </div>
            ) : myBookings.length === 0 ? (
              <p className="message">You have not booked any movie tickets yet.</p>
            ) : (
              <div className="my-tickets-list">
                {myBookings.map((b) => (
                  <article key={b.id} className="my-ticket-card">
                    <div className="my-ticket-main">
                      <div className="my-ticket-header">
                        <h4>{b.showtime?.movie?.title}</h4>
                        <span className={`status-pill ${String(b.status).toLowerCase()}`}>
                          {b.status}
                        </span>
                      </div>

                      <p className="my-ticket-cinema">
                        📍 {b.showtime?.hall?.cinema?.name} · {b.showtime?.hall?.name}
                      </p>

                      <div className="my-ticket-meta">
                        <span>📅 {formatDate(b.showtime?.startsAt)}</span>
                        <span>⏰ {formatTime(b.showtime?.startsAt)}</span>
                      </div>

                      <div className="my-ticket-seats">
                        <span>Seats: </span>
                        <strong>
                          {b.seats ? b.seats.map((s) => s.seat?.seatNumber).join(", ") : "Reserved"}
                        </strong>
                      </div>
                    </div>

                    <div className="my-ticket-side">
                      <span className="my-ticket-price">KSh {formatPrice(b.totalPrice)}</span>
                      <div className="ticket-card-btns">
                        <button
                          type="button"
                          className="secondary-button compact"
                          onClick={() => downloadDesignedTicketImage(b)}
                        >
                          📥 Download PNG
                        </button>
                        <button
                          type="button"
                          className="secondary-button compact"
                          onClick={() => {
                            setConfirmedBooking(b);
                            setShowMyBookings(false);
                          }}
                        >
                          View QR
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
