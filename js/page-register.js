import { auth, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from "./firebase-init.js";
import { onAuthStateChange } from "./auth.js";
import { saveUserProfile } from "./db.js";

// If user is already logged in, redirect them
onAuthStateChange(({ user, loading }) => {
  if (!loading && user) {
    window.location.href = "index.html";
  }
});

const registerForm = document.getElementById("registerForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const googleBtn = document.getElementById("googleBtn");
const errorBanner = document.getElementById("errorBanner");

function getErrorMessage(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try signing in.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters long.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "Failed to create account. Please try again.";
  }
}

function showError(message) {
  errorBanner.textContent = message;
  errorBanner.style.display = "block";
  errorBanner.style.animation = 'none';
  errorBanner.offsetHeight;
  errorBanner.style.animation = null; 
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  googleBtn.disabled = isLoading;
  if(isLoading) {
    submitBtn.textContent = "Signing Up...";
  } else {
    submitBtn.textContent = "Sign Up";
  }
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBanner.style.display = "none";
  setLoading(true);
  
  const name = nameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: name });
    await saveUserProfile(user.uid, {
      name,
      email,
      role: "user",
      createdAt: new Date().toISOString()
    });
    // auth listener will handle redirect
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
    // Popup flow handles the creation/login
    await signInWithPopup(auth, provider);
    // auth listener will handle redirect
  } catch (error) {
    if (error.code !== "auth/popup-closed-by-user") {
      showError("Failed to sign up with Google. Please try again.");
    }
    setLoading(false);
  }
});
