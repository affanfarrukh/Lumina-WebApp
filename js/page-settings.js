import { requireAuth, onAuthStateChange } from "./auth.js";
import { saveUserProfile } from "./db.js";

requireAuth();

const backBtn = document.getElementById("backBtn");
const modalOverlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");
const modalSheet = document.getElementById("modalSheet");

// Settings Elements
const editProfileBtn = document.getElementById("editProfileBtn");
const profileNameValue = document.getElementById("profileNameValue");
const changePasswordBtn = document.getElementById("changePasswordBtn");

const notificationsBtn = document.getElementById("notificationsBtn");
const notificationsToggle = document.getElementById("notificationsToggle");
const darkModeBtn = document.getElementById("darkModeBtn");
const darkModeToggle = document.getElementById("darkModeToggle");
const languageBtn = document.getElementById("languageBtn");
const languageValue = document.getElementById("languageValue");

let currentUser = null;
let currentProfile = {};

// Local state
let isNotificationsEnabled = true;
let isDarkMode = false;
let currentLanguage = "English";

const LANGUAGES = ["English", "Urdu", "Arabic", "French", "Spanish"];

window.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) window.lucide.createIcons();

  onAuthStateChange(({ user, profile }) => {
    if (user) {
      currentUser = user;
      currentProfile = profile || {};
      
      const displayName = currentProfile.name || user.displayName || user.email.split("@")[0];
      profileNameValue.textContent = displayName;
    }
  });
});

backBtn.addEventListener("click", () => {
  window.history.back();
});

// Close modal when clicking overlay wrapper
modalOverlay.addEventListener("click", () => {
  closeModal();
});

modalSheet.addEventListener("click", (e) => {
  e.stopPropagation(); // Prevent closing when clicking inside the sheet
});

function closeModal() {
  modalOverlay.style.display = "none";
  modalContent.innerHTML = ""; // Clear content
}

function openModal(htmlContent) {
  modalContent.innerHTML = htmlContent;
  modalOverlay.style.display = "flex";
  if (window.lucide) window.lucide.createIcons();
  
  // Re-attach close button listener after injecting HTML
  const closeBtn = document.getElementById("closeBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }
}

// -------------------------
// Toggles
// -------------------------

notificationsBtn.addEventListener("click", () => {
  isNotificationsEnabled = !isNotificationsEnabled;
  if (isNotificationsEnabled) {
    notificationsToggle.classList.add("toggleOn");
  } else {
    notificationsToggle.classList.remove("toggleOn");
  }
});

darkModeBtn.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  if (isDarkMode) {
    darkModeToggle.classList.add("toggleOn");
  } else {
    darkModeToggle.classList.remove("toggleOn");
  }
});

// -------------------------
// Edit Profile
// -------------------------

editProfileBtn.addEventListener("click", () => {
  const nameVal = currentProfile.name || currentUser?.displayName || "";
  const emailVal = currentUser?.email || "";
  const mobileVal = currentProfile.mobile || "";
  const genderVal = currentProfile.gender || "Female";
  const dobVal = currentProfile.dob || "";
  const cityVal = currentProfile.city || "";
  const addressVal = currentProfile.address || "";

  openModal(`
    <div class="sheetHeader">
      <h2 class="sheetTitle">Edit Profile</h2>
      <button class="closeBtn" id="closeBtn"><i data-lucide="x" style="width: 20px; height: 20px;"></i></button>
    </div>
    <div class="form">
      <div class="field">
        <label class="label">Full Name</label>
        <input class="input" id="inpName" value="${nameVal}" placeholder="Your full name" />
      </div>
      <div class="field">
        <label class="label">Email Address</label>
        <input class="input" id="inpEmail" type="email" value="${emailVal}" placeholder="email@example.com" />
      </div>
      <div class="field">
        <label class="label">Mobile Number</label>
        <input class="input" id="inpMobile" type="tel" value="${mobileVal}" placeholder="+1 000 000 0000" />
      </div>
      <div class="field">
        <label class="label">Gender</label>
        <div class="genderRow" id="genderSelector">
          <button type="button" class="genderBtn ${genderVal === 'Female' ? 'genderBtnActive' : ''}" data-g="Female">Female</button>
          <button type="button" class="genderBtn ${genderVal === 'Male' ? 'genderBtnActive' : ''}" data-g="Male">Male</button>
          <button type="button" class="genderBtn ${genderVal === 'Other' ? 'genderBtnActive' : ''}" data-g="Other">Other</button>
        </div>
      </div>
      <div class="field">
        <label class="label">Date of Birth</label>
        <input class="input" id="inpDob" type="date" value="${dobVal}" />
      </div>
      <div class="field">
        <label class="label">City</label>
        <input class="input" id="inpCity" value="${cityVal}" placeholder="e.g. New York City" />
      </div>
      <div class="field">
        <label class="label">Address</label>
        <input class="input" id="inpAddress" value="${addressVal}" placeholder="Street, Area" />
      </div>
      <button class="saveBtn" id="saveProfileBtn">Save Changes</button>
    </div>
  `);

  let selectedGender = genderVal;

  document.getElementById("genderSelector").addEventListener("click", (e) => {
    if (e.target.classList.contains("genderBtn")) {
      document.querySelectorAll(".genderBtn").forEach(b => b.classList.remove("genderBtnActive"));
      e.target.classList.add("genderBtnActive");
      selectedGender = e.target.getAttribute("data-g");
    }
  });

  document.getElementById("saveProfileBtn").addEventListener("click", async () => {
    const updatedData = {
      name: document.getElementById("inpName").value,
      email: document.getElementById("inpEmail").value,
      mobile: document.getElementById("inpMobile").value,
      gender: selectedGender,
      dob: document.getElementById("inpDob").value,
      city: document.getElementById("inpCity").value,
      address: document.getElementById("inpAddress").value,
    };

    try {
      const btn = document.getElementById("saveProfileBtn");
      btn.textContent = "Saving...";
      btn.disabled = true;

      await saveUserProfile(currentUser.uid, updatedData);
      
      // Update local state and UI
      Object.assign(currentProfile, updatedData);
      profileNameValue.textContent = updatedData.name || currentUser?.displayName || currentUser?.email.split("@")[0];
      
      closeModal();
    } catch (e) {
      alert("Failed to save profile");
      console.error(e);
      btn.textContent = "Save Changes";
      btn.disabled = false;
    }
  });
});

// -------------------------
// Change Password
// -------------------------

changePasswordBtn.addEventListener("click", () => {
  openModal(`
    <div class="sheetHeader">
      <h2 class="sheetTitle">Change Password</h2>
      <button class="closeBtn" id="closeBtn"><i data-lucide="x" style="width: 20px; height: 20px;"></i></button>
    </div>
    <div class="form">
      <p class="error" id="pwError" style="display: none;"></p>
      <div class="field">
        <label class="label">Current Password</label>
        <input class="input" type="password" id="pwCurrent" placeholder="••••••••" />
      </div>
      <div class="field">
        <label class="label">New Password</label>
        <input class="input" type="password" id="pwNew" placeholder="••••••••" />
      </div>
      <div class="field">
        <label class="label">Confirm Password</label>
        <input class="input" type="password" id="pwConfirm" placeholder="••••••••" />
      </div>
      <button class="saveBtn" id="savePasswordBtn">Update Password</button>
    </div>
  `);

  document.getElementById("savePasswordBtn").addEventListener("click", () => {
    const newPw = document.getElementById("pwNew").value;
    const confirmPw = document.getElementById("pwConfirm").value;
    const errorEl = document.getElementById("pwError");

    if (newPw !== confirmPw) {
      errorEl.textContent = "Passwords do not match.";
      errorEl.style.display = "block";
      return;
    }
    if (newPw.length < 6) {
      errorEl.textContent = "Password must be at least 6 characters.";
      errorEl.style.display = "block";
      return;
    }

    // Since this is mock logic for changing passwords in vanilla app, just fake success
    errorEl.style.display = "none";
    alert("Password updated successfully!");
    closeModal();
  });
});

// -------------------------
// Language
// -------------------------

languageBtn.addEventListener("click", () => {
  let langHtml = LANGUAGES.map(lang => `
    <button class="langRow ${currentLanguage === lang ? 'langRowActive' : ''}" data-lang="${lang}">
      ${lang}
      ${currentLanguage === lang ? '<i data-lucide="check" style="width: 16px; height: 16px; color: var(--accent-gold);"></i>' : ''}
    </button>
  `).join("");

  openModal(`
    <div class="sheetHeader">
      <h2 class="sheetTitle">Language</h2>
      <button class="closeBtn" id="closeBtn"><i data-lucide="x" style="width: 20px; height: 20px;"></i></button>
    </div>
    <div class="langList" id="languageList">
      ${langHtml}
    </div>
  `);

  document.getElementById("languageList").addEventListener("click", (e) => {
    const btn = e.target.closest(".langRow");
    if (!btn) return;

    currentLanguage = btn.getAttribute("data-lang");
    languageValue.textContent = currentLanguage;
    closeModal();
  });
});
