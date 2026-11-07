const USERS_STORAGE_KEY = "cinemax_user_accounts_db";

// Official default pre-registered accounts
const DEFAULT_ACCOUNTS = [
  {
    id: 1001,
    name: "Kisii University Admin",
    email: "in170008323@kisiiuniversity.ac.ke",
    password: "1234",
    phone: "0712345678",
    role: "SUPER_ADMIN",
    createdAt: new Date().toISOString(),
  },
  {
    id: 1002,
    name: "System Admin",
    email: "admin@cinemax.com",
    password: "1234",
    phone: "0712345678",
    role: "ADMIN",
    createdAt: new Date().toISOString(),
  },
];

// Retrieve permanently saved user accounts directory from localStorage
function getSavedAccounts() {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
      return DEFAULT_ACCOUNTS;
    }

    // Ensure Kisii University Admin exists in saved accounts
    const hasKisiiAdmin = parsed.some(
      (acc) => acc.email.toLowerCase() === "in170008323@kisiiuniversity.ac.ke"
    );
    if (!hasKisiiAdmin) {
      parsed.unshift(DEFAULT_ACCOUNTS[0]);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_ACCOUNTS));
    return DEFAULT_ACCOUNTS;
  }
}

function saveAccounts(accounts) {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error("Failed to persist user account in localStorage:", err);
  }
}

// PERMANENT REGISTER USER ACCOUNT
export async function registerCustomer(name, email, password, phone = "0712345678") {
  const emailClean = (email || "").trim().toLowerCase();
  if (!emailClean) {
    throw new Error("Please enter a valid email address.");
  }

  const accounts = getSavedAccounts();
  const existing = accounts.find((acc) => acc.email.toLowerCase() === emailClean);

  if (existing) {
    throw new Error("An account with this email address already exists. Please sign in instead.");
  }

  const isSuperAdmin =
    emailClean === "in170008323@kisiiuniversity.ac.ke" ||
    emailClean.includes("admin") ||
    emailClean.includes("kisiiuniversity");

  const newAccount = {
    id: Date.now(),
    name: (name || "").trim() || "Valued Customer",
    email: emailClean,
    password: password,
    phone: phone,
    role: isSuperAdmin ? "SUPER_ADMIN" : "CUSTOMER",
    createdAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  saveAccounts(accounts);

  const token = `cnx_user_token_${newAccount.id}_${Date.now()}`;
  localStorage.setItem("cinemax_current_user_token", token);
  localStorage.setItem("cinemax_current_user_id", String(newAccount.id));

  return {
    status: "success",
    message: "Account created successfully! Welcome to Cinemax.",
    token: token,
    user: {
      id: newAccount.id,
      name: newAccount.name,
      email: newAccount.email,
      role: newAccount.role,
      phone: newAccount.phone,
    },
  };
}

// STRICT PERMANENT LOGIN ACCOUNT VALIDATION
export async function loginCustomer(email, password) {
  const emailClean = (email || "").trim().toLowerCase();
  if (!emailClean) {
    throw new Error("Please enter your email address.");
  }

  const accounts = getSavedAccounts();
  const account = accounts.find((acc) => acc.email.toLowerCase() === emailClean);

  // STRICT RULE: No user allowed to login without creating an account!
  if (!account) {
    throw new Error(
      "Account not found for this email address. Please click 'Create Account' to register first."
    );
  }

  // Validate password
  if (account.password !== password) {
    throw new Error("Incorrect password. Please enter the correct password for your account.");
  }

  // Login Success
  const token = `cnx_user_token_${account.id}_${Date.now()}`;
  localStorage.setItem("cinemax_current_user_token", token);
  localStorage.setItem("cinemax_current_user_id", String(account.id));

  return {
    status: "success",
    message: `Welcome back, ${account.name}!`,
    token: token,
    user: {
      id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      phone: account.phone,
    },
  };
}

// GET PERMANENT SAVED PROFILE
export async function getCustomerProfile(token) {
  if (!token) return null;

  const currentUserId = localStorage.getItem("cinemax_current_user_id");
  const accounts = getSavedAccounts();

  if (currentUserId) {
    const matched = accounts.find((acc) => String(acc.id) === String(currentUserId));
    if (matched) {
      return {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        role: matched.role,
        phone: matched.phone,
      };
    }
  }

  const defaultAdmin = accounts.find(
    (acc) => acc.email.toLowerCase() === "in170008323@kisiiuniversity.ac.ke"
  ) || accounts[0];

  return {
    id: defaultAdmin.id,
    name: defaultAdmin.name,
    email: defaultAdmin.email,
    role: defaultAdmin.role,
    phone: defaultAdmin.phone,
  };
}
