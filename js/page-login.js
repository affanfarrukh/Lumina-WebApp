import { auth } from "./firebase-init.js";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { onAuthStateChange } from "./auth.js";

// If user is already logged in, redirect them
onAuthStateChange(({ user, loading }) => {
  if (!loading && user) {
    window.location.href = "index.html";
  }
});

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const googleBtn = document.getElementById("googleBtn");
const errorBanner = document.getElementById("errorBanner");

function getErrorMessage(code) {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password. Please try again.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact support.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    default:
      return "Something went wrong. Please try again.";
  }
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.style.display = "block";
  // Reset animation
  errorBanner.style.animation = 'none';
  errorBanner.offsetHeight; /* trigger reflow */
  errorBanner.style.animation = null; 
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  googleBtn.disabled = isLoading;
  if(isLoading) {
    submitBtn.textContent = "Signing In...";
  } else {
    submitBtn.textContent = "Sign In";
  }
}

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBanner.style.display = "none";
  setLoading(true);
  
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // onAuthStateChange listener will handle redirect
  } catch (error) {
    showError(getErrorMessage(error.code));
    setLoading(false);
  }
});

googleBtn.addEventListener("click", async () => {
  errorBanner.style.display = "none";
  setLoading(true);
  
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    // listener will handle redirect
  } catch (error) {
    if (error.code !== "auth/popup-closed-by-user") {
      showError("Failed to sign in with Google. Please try again.");
    }
    setLoading(false);
  }
});
