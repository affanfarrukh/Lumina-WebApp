import { onAuthStateChange, requireAuth, logoutUser } from "./auth.js";
import { getUserProfile } from "./db.js";
import { renderBottomNav } from "./components.js";

requireAuth();

const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profilePic = document.getElementById("profilePic");
const logoutBtn = document.getElementById("logoutBtn");
const adminLink = document.getElementById("adminLink");

window.addEventListener("DOMContentLoaded", () => {
  renderBottomNav("profile.html");
  if (window.lucide) window.lucide.createIcons();

  onAuthStateChange(async ({ user }) => {
    if (user) {
      let displayName = user.displayName || (user.email ? user.email.split("@")[0] : "Guest User");
      let displayEmail = user.email;
      let photoURL = user.photoURL || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop";

      try {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          if (profile.name) displayName = profile.name;
          if (profile.role === "admin") {
            adminLink.style.display = "block";
          }
        }
      } catch (e) {
        console.error("Error fetching user profile", e);
      }

      profileName.textContent = displayName;
      profileEmail.textContent = displayEmail;
      profilePic.src = photoURL;
    }
  });
});

logoutBtn.addEventListener("click", async () => {
  try {
    await logoutUser();
    window.location.href = "login.html";
  } catch (error) {
    alert("Failed to logout: " + error.message);
  }
});
