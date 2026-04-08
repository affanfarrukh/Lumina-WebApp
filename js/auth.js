import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { auth } from "./firebase-init.js";
import { getUserProfile } from "./db.js";

let currentUser = null;
let currentProfile = null;
let isLoading = true;
let isInitialized = false;

const authCallbacks = [];

/**
 * Initialize the auth listener. This should be called once on app startup.
 */
function initAuth() {
  if (isInitialized) return;
  isInitialized = true;

  onAuthStateChanged(auth, async (firebaseUser) => {
    isLoading = true;
    currentUser = firebaseUser;

    if (firebaseUser) {
      const userDoc = await getUserProfile(firebaseUser.uid);
      if (userDoc) {
        currentProfile = userDoc;
      } else {
        currentProfile = { uid: firebaseUser.uid, email: firebaseUser.email || undefined };
      }
    } else {
      currentProfile = null;
    }

    isLoading = false;
    authCallbacks.forEach((cb) => cb({ user: currentUser, profile: currentProfile, loading: isLoading }));
  });
}

/**
 * Subscribe to auth state changes
 * @param {Function} callback 
 */
export function onAuthStateChange(callback) {
  authCallbacks.push(callback);
  // Trigger immediately with current state if initialized
  if (isInitialized) {
    callback({ user: currentUser, profile: currentProfile, loading: isLoading });
  } else {
    initAuth();
  }
}

/**
 * Redirect to login if user is not authenticated.
 * Should be called on protected pages.
 */
export function requireAuth() {
  onAuthStateChange(({ user, loading }) => {
    if (!loading && !user) {
      window.location.href = "login.html";
    }
  });
}

export function requireAdminAuth() {
  onAuthStateChange(({ user, loading }) => {
    if (!loading) {
      if (!user) {
        window.location.href = "login.html";
      } else if (user.email !== "aaazann@gmail.com") {
        window.location.href = "index.html";
      }
    }
  });
}

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentProfile() {
  return currentProfile;
}

export function isAuthLoading() {
  return isLoading;
}

export async function logoutUser() {
  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error signing out: ", error);
    throw error;
  }
}
