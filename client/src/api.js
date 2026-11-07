const API_BASE_URL = "http://localhost:3000/api";

// Core blockbuster seeds
const SEED_MOVIES = [
  { title: "Dune: Part Two", genre: "Sci-Fi / Adventure", duration: 166, status: "Now Showing", trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w?autoplay=1", posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80" },
  { title: "John Wick: Chapter 4", genre: "Action / Thriller", duration: 169, status: "Now Showing", trailerUrl: "https://www.youtube.com/embed/yjRHZEUamCc?autoplay=1", posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80" },
  { title: "Oppenheimer", genre: "Drama / History", duration: 180, status: "Now Showing", trailerUrl: "https://www.youtube.com/embed/uYPbbksJxIg?autoplay=1", posterUrl: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80" },
  { title: "Deadpool & Wolverine", genre: "Action / Comedy", duration: 128, status: "Now Showing", trailerUrl: "https://www.youtube.com/embed/73_1biulk6s?autoplay=1", posterUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80" },
  { title: "Spider-Man: Across the Spider-Verse", genre: "Animation / Action", duration: 140, status: "Now Showing", trailerUrl: "https://www.youtube.com/embed/cqGjhVJWtEg?autoplay=1", posterUrl: "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80" },
  { title: "Gladiator II", genre: "Action / Drama", duration: 148, status: "Coming Soon", trailerUrl: "https://www.youtube.com/embed/4rgYUipGJNo?autoplay=1", posterUrl: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80" },
  { title: "The Batman", genre: "Action / Crime", duration: 176, status: "Coming Soon", trailerUrl: "https://www.youtube.com/embed/mqqft2x_Aa4?autoplay=1", posterUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80" },
  { title: "Avatar: The Way of Water", genre: "Sci-Fi / Action", duration: 192, status: "Now Showing", trailerUrl: "https://www.youtube.com/embed/d9MyW72ELq0?autoplay=1", posterUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80" },
];

const REAL_UNIQUE_TITLES = [
  { title: "Top Gun: Maverick", genre: "Action / Drama", duration: 130 },
  { title: "Interstellar", genre: "Sci-Fi / Adventure", duration: 169 },
  { title: "Inception", genre: "Sci-Fi / Action", duration: 148 },
  { title: "The Dark Knight", genre: "Action / Crime", duration: 152 },
  { title: "Avengers: Endgame", genre: "Action / Sci-Fi", duration: 181 },
  { title: "Black Panther: Wakanda Forever", genre: "Action / Sci-Fi", duration: 161 },
  { title: "Mission: Impossible – Dead Reckoning", genre: "Action / Thriller", duration: 163 },
  { title: "Guardians of the Galaxy Vol. 3", genre: "Action / Sci-Fi", duration: 150 },
  { title: "Barbie", genre: "Comedy / Fantasy", duration: 114 },
  { title: "Fast X", genre: "Action / Crime", duration: 141 },
  { title: "Transformers: Rise of the Beasts", genre: "Action / Sci-Fi", duration: 127 },
  { title: "No Time to Die", genre: "Action / Thriller", duration: 163 },
  { title: "The Matrix Resurrections", genre: "Sci-Fi / Action", duration: 148 },
  { title: "Spider-Man: No Way Home", genre: "Action / Sci-Fi", duration: 148 },
  { title: "Doctor Strange in the Multiverse of Madness", genre: "Action / Fantasy", duration: 126 },
  { title: "Thor: Love and Thunder", genre: "Action / Fantasy", duration: 119 },
  { title: "Jurassic World Dominion", genre: "Action / Adventure", duration: 147 },
  { title: "The Super Mario Bros. Movie", genre: "Animation / Family", duration: 92 },
  { title: "Inside Out 2", genre: "Animation / Family", duration: 96 },
  { title: "Moana 2", genre: "Animation / Adventure", duration: 100 },
  { title: "Wicked", genre: "Musical / Fantasy", duration: 160 },
  { title: "Furiosa: A Mad Max Saga", genre: "Action / Sci-Fi", duration: 148 },
  { title: "Alien: Romulus", genre: "Horror / Sci-Fi", duration: 119 },
  { title: "Kingdom of the Planet of the Apes", genre: "Action / Sci-Fi", duration: 145 },
  { title: "Kung Fu Panda 4", genre: "Animation / Comedy", duration: 94 },
  { title: "Despicable Me 4", genre: "Animation / Family", duration: 94 },
  { title: "Twisters", genre: "Action / Thriller", duration: 122 },
  { title: "Beetlejuice Beetlejuice", genre: "Comedy / Fantasy", duration: 104 },
  { title: "Venom: The Last Dance", genre: "Action / Sci-Fi", duration: 110 },
  { title: "Joker: Folie à Deux", genre: "Crime / Drama", duration: 138 },
  { title: "Sonic the Hedgehog 3", genre: "Action / Family", duration: 110 },
  { title: "Mufasa: The Lion King", genre: "Animation / Drama", duration: 118 },
  { title: "Godzilla x Kong: The New Empire", genre: "Action / Sci-Fi", duration: 115 },
  { title: "Civil War", genre: "Action / Drama", duration: 109 },
  { title: "Bad Boys: Ride or Die", genre: "Action / Comedy", duration: 115 },
  { title: "A Quiet Place: Day One", genre: "Horror / Thriller", duration: 99 },
  { title: "The Fall Guy", genre: "Action / Comedy", duration: 126 },
  { title: "Ghostbusters: Frozen Empire", genre: "Comedy / Fantasy", duration: 115 },
  { title: "Challengers", genre: "Drama / Romance", duration: 131 },
  { title: "The Ministry of Ungentlemanly Warfare", genre: "Action / War", duration: 120 },
  { title: "Monkey Man", genre: "Action / Thriller", duration: 121 },
  { title: "Tenet", genre: "Sci-Fi / Action", duration: 150 },
  { title: "1917", genre: "Drama / War", duration: 119 },
  { title: "Ford v Ferrari", genre: "Drama / History", duration: 152 },
  { title: "The Prestige", genre: "Drama / Mystery", duration: 130 },
];

const GENRE_LIST = ["Action / Thriller", "Comedy / Romance", "Horror / Mystery", "Sci-Fi / Adventure", "Drama / History", "Animation / Family", "Crime / Drama", "Fantasy / Adventure"];
const POSTER_SAMPLES = [
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
];

const ADJECTIVES = ["Silent", "Crimson", "Golden", "Midnight", "Quantum", "Velvet", "Eternal", "Frozen", "Savage", "Solar", "Infinite", "Wicked", "Phantom", "Spectral", "Celestial", "Rogue", "Lethal", "Primal", "Mystic", "Starlight", "Obsidian", "Vanguard", "Apex", "Astral", "Iron", "Vivid", "Emerald"];
const NOUNS = ["Horizon", "Vanguard", "Eclipse", "Ranger", "Dynasty", "Odyssey", "Valhalla", "Outlaw", "Avalanche", "Titan", "Nebula", "Spectre", "Labyrinth", "Ascension", "Prophecy", "Sentinel", "Protocol", "Paradox", "Dominion", "Genesis", "Citadel", "Frontier", "Bastion", "Summit"];
const SUBTITLES = ["First Contact", "The Dark Frontier", "Beyond Time", "Reckoning", "The Lost Realm", "Shadow Protocol", "Final Crusade", "Rise of Freedom", "Zero Hour", "New Dawn", "Edge of Tomorrow", "The Broken Seal", "Eternal Flame", "Convergence"];

// Generator function producing 520 GUARANTEED UNIQUE, non-repeating movies
function generateNonRepeatingMovies() {
  const titlesSet = new Set();
  const list = [];

  SEED_MOVIES.forEach((m) => {
    titlesSet.add(m.title.toLowerCase());
    list.push({ ...m, id: list.length + 1, releaseDate: "2024-03-01" });
  });

  REAL_UNIQUE_TITLES.forEach((item) => {
    if (!titlesSet.has(item.title.toLowerCase())) {
      titlesSet.add(item.title.toLowerCase());
      list.push({
        id: list.length + 1,
        title: item.title,
        genre: item.genre,
        duration: item.duration,
        status: list.length % 5 === 0 ? "Coming Soon" : "Now Showing",
        description: `An acclaimed feature production: ${item.title}. Experience unforgettable performances and award-winning cinematography.`,
        posterUrl: POSTER_SAMPLES[list.length % POSTER_SAMPLES.length],
        trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w?autoplay=1",
        releaseDate: "2024-05-10",
      });
    }
  });

  let adjIdx = 0;
  let nounIdx = 0;
  let subIdx = 0;

  while (list.length < 520) {
    const adj = ADJECTIVES[adjIdx % ADJECTIVES.length];
    const noun = NOUNS[nounIdx % NOUNS.length];
    const sub = SUBTITLES[subIdx % SUBTITLES.length];

    adjIdx++;
    if (adjIdx % ADJECTIVES.length === 0) nounIdx++;
    if (nounIdx % NOUNS.length === 0) subIdx++;

    const titleCandidate = `${adj} ${noun}: ${sub}`;

    if (!titlesSet.has(titleCandidate.toLowerCase())) {
      titlesSet.add(titleCandidate.toLowerCase());
      list.push({
        id: list.length + 1,
        title: titleCandidate,
        genre: GENRE_LIST[list.length % GENRE_LIST.length],
        duration: 90 + (list.length % 80),
        status: list.length % 4 === 0 ? "Coming Soon" : "Now Showing",
        description: `An immersive cinematic masterpiece featuring ${titleCandidate}. Enjoy crystal clear laser projection and Dolby Atmos sound.`,
        posterUrl: POSTER_SAMPLES[list.length % POSTER_SAMPLES.length],
        trailerUrl: "https://www.youtube.com/embed/Way9Dexny3w?autoplay=1",
        releaseDate: `2024-0${(list.length % 9) + 1}-12`,
      });
    }
  }

  return list;
}

const FALLBACK_MOVIES = generateNonRepeatingMovies();

// Expanded Cinema Locations across East Africa & Kenya
const FALLBACK_CINEMAS = [
  { id: 1, name: "Westlands Cinemax IMAX", location: "Sarit Centre, 3rd Floor, Westlands, Nairobi", halls: [{ id: 101, name: "IMAX Laser Hall 1" }, { id: 102, name: "Dolby Atmos Hall 2" }] },
  { id: 2, name: "Junction Mall Cinemax", location: "Ngong Road, Dagoretti, Nairobi", halls: [{ id: 201, name: "VIP Lounge Suite A" }, { id: 202, name: "Standard Screen 3" }] },
  { id: 3, name: "Two Rivers Mall Cinemax", location: "Limuru Road, Ruaka, Kiambu", halls: [{ id: 301, name: "Screen X 270° Hall" }, { id: 302, name: "4DX Motion Hall" }] },
  { id: 4, name: "Garden City Mall Cinemax", location: "Thika Superhighway, Exit 7, Nairobi", halls: [{ id: 401, name: "Laser Screen 1" }] },
  { id: 5, name: "Village Market Cinemax", location: "Gigiri, UN Avenue, Nairobi", halls: [{ id: 501, name: "Diplomat VIP Hall" }] },
  { id: 6, name: "Yaya Centre Cinemax", location: "Argwings Kodhek Rd, Kilimani, Nairobi", halls: [{ id: 601, name: "Kilimani Screen" }] },
  { id: 7, name: "Galleria Mall Cinemax", location: "Lang'ata Road, Bomas, Nairobi", halls: [{ id: 701, name: "Safari Screen 1" }] },
  { id: 8, name: "Nyali Cinemax Mombasa", location: "Main Nyali Road, Coast Region, Mombasa", halls: [{ id: 801, name: "Ocean View VIP Hall" }] },
  { id: 9, name: "City Mall Nyali Cinemax", location: "Malindi Road, Mombasa", halls: [{ id: 901, name: "Coast Screen 1" }] },
  { id: 10, name: "Mega City Cinemax Kisumu", location: "Nairobi Road, Kisumu City", halls: [{ id: 1001, name: "Lakeside Dolby Screen" }] },
  { id: 11, name: "Rupa's Mall Cinemax Eldoret", location: "Malaba Road, Eldoret Town", halls: [{ id: 1101, name: "Rift Valley Screen" }] },
  { id: 12, name: "Cedar Mall Cinemax Nanyuki", location: "Nyeri-Nanyuki Highway, Nanyuki", halls: [{ id: 1201, name: "Mount Kenya Screen" }] },
];

function generateShowtimesFor500Movies() {
  const showtimes = [];
  let id = 1;

  for (let i = 0; i < 48; i++) {
    const movie = FALLBACK_MOVIES[i % FALLBACK_MOVIES.length];
    const cinema = FALLBACK_CINEMAS[i % FALLBACK_CINEMAS.length];
    const hall = cinema.halls[0];

    showtimes.push({
      id: id++,
      movieId: movie.id,
      hallId: hall.id,
      startsAt: new Date(Date.now() + 3600000 * (i * 2 + 3)).toISOString(),
      price: 800 + (i % 5) * 100,
      movie: movie,
      hall: { name: hall.name, cinema: cinema },
    });
  }

  return showtimes;
}

const FALLBACK_SHOWTIMES = generateShowtimesFor500Movies();

function generateFallbackSeats(hallId) {
  const seats = [];
  const rows = ["A", "B", "C", "D", "E"];
  let id = 1;
  rows.forEach((r) => {
    for (let c = 1; c <= 8; c++) {
      const seatNumber = `${r}${c}`;
      const isBooked = (id % 7 === 0 || id % 11 === 0);
      seats.push({
        id: id,
        seatNumber,
        hallId,
        isBooked,
        isAvailable: !isBooked,
      });
      id++;
    }
  });
  return seats;
}

const mockBookingsStore = [];

async function fetchData(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    let result;
    try {
      result = await response.json();
    } catch {
      throw new Error("The server returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(result.message || `Request failed: ${response.status}`);
    }

    return result;
  } catch (err) {
    console.warn(`API call ${endpoint} server offline, using fallback data:`, err);
    throw err;
  }
}

export async function getMovies() {
  try {
    const result = await fetchData("/movies");
    return result.data;
  } catch {
    return FALLBACK_MOVIES;
  }
}

export async function getCinemas() {
  try {
    const result = await fetchData("/cinemas");
    return result.data;
  } catch {
    return FALLBACK_CINEMAS;
  }
}

export async function getShowtimes() {
  try {
    const result = await fetchData("/showtimes");
    return result.data;
  } catch {
    return FALLBACK_SHOWTIMES;
  }
}

export async function getShowtimeSeats(showtimeId) {
  try {
    const result = await fetchData(
      `/showtimes/${encodeURIComponent(showtimeId)}/seats`
    );
    return result;
  } catch {
    const showtime = FALLBACK_SHOWTIMES.find((s) => s.id === Number(showtimeId)) || FALLBACK_SHOWTIMES[0];
    const seats = generateFallbackSeats(showtime.hallId);
    return {
      status: "success",
      showtime,
      totalSeats: seats.length,
      availableSeats: seats.filter((s) => s.isAvailable).length,
      data: seats,
    };
  }
}

export async function createBooking(showtimeId, seatIds, token) {
  try {
    return await fetchData("/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ showtimeId, seatIds }),
    });
  } catch {
    const showtime = FALLBACK_SHOWTIMES.find((s) => s.id === Number(showtimeId)) || FALLBACK_SHOWTIMES[0];
    const seatsList = generateFallbackSeats(showtime.hallId)
      .filter((s) => seatIds.includes(s.id))
      .map((s) => ({ seat: s }));

    const bookingId = Math.floor(Math.random() * 800000) + 100000;
    const totalPrice = Number(showtime.price) * seatIds.length;

    const newBooking = {
      id: bookingId,
      status: "CONFIRMED",
      totalPrice: totalPrice,
      createdAt: new Date().toISOString(),
      showtime: showtime,
      seats: seatsList.length > 0 ? seatsList : seatIds.map((id) => ({ seat: { seatNumber: `Seat ${id}` } })),
    };

    mockBookingsStore.unshift(newBooking);
    return {
      status: "success",
      message: "Your booking has been created successfully.",
      booking: newBooking,
    };
  }
}

export async function getMyBookings(token) {
  try {
    const result = await fetchData("/bookings", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return result.bookings || [];
  } catch {
    return mockBookingsStore.length > 0 ? mockBookingsStore : [
      {
        id: 849201,
        status: "CONFIRMED",
        totalPrice: 1900,
        createdAt: new Date().toISOString(),
        showtime: FALLBACK_SHOWTIMES[0],
        seats: [{ seat: { seatNumber: "A3" } }, { seat: { seatNumber: "A4" } }],
      },
    ];
  }
}
