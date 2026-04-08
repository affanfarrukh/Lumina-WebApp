import { onAuthStateChange } from "./auth.js";
import { getStylistById, getReviewsByStylist, addStylistReview } from "./db.js";

// DOM Elements
const loadingState = document.getElementById("loadingState");
const loadedState = document.getElementById("loadedState");
const errorState = document.getElementById("errorState");
const backBtn = document.getElementById("backBtn");

const stylistHeroImg = document.getElementById("stylistHeroImg");
const stylistName = document.getElementById("stylistName");
const stylistRole = document.getElementById("stylistRole");
const stylistRating = document.getElementById("stylistRating");
const stylistExp = document.getElementById("stylistExp");
const reviewCountText = document.getElementById("reviewCountText");
const stylistBio = document.getElementById("stylistBio");
const skillsList = document.getElementById("skillsList");
const achievementsList = document.getElementById("achievementsList");
const portfolioGrid = document.getElementById("portfolioGrid");
const bookWithBtn = document.getElementById("bookWithBtn");

const showReviewFormBtn = document.getElementById("showReviewFormBtn");
const reviewFormContainer = document.getElementById("reviewFormContainer");
const cancelReviewBtn = document.getElementById("cancelReviewBtn");
const submitReviewBtn = document.getElementById("submitReviewBtn");
const reviewComment = document.getElementById("reviewComment");
const starSelector = document.getElementById("starSelector");
const reviewsList = document.getElementById("reviewsList");

let currentStylistId = null;
let currentRating = 0;
let currentUser = null;
let currentProfile = null;

// Auth check
onAuthStateChange(({ user, profile }) => {
  currentUser = user;
  currentProfile = profile;
});

window.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const urlId = urlParams.get("id");
  const storageId = localStorage.getItem("lastStylistId");
  
  const id = (urlId && urlId !== "null" && urlId !== "undefined") ? urlId : storageId;
  
  if (!id || id === "null" || id === "undefined") {
    console.error("Critical: No valid stylist ID found in URL or LocalStorage.");
    showError("Stylist Profile cannot be loaded without an ID. Please return to the homepage.");
    return;
  }

  currentStylistId = id;

  try {
    const stylist = await getStylistById(id);
    if (stylist) {
      renderStylist(stylist);
      await loadReviews(id);
    } else {
      showError("Stylist not found");
    }
  } catch (error) {
    console.error("Error loading stylist profile:", error);
    showError("Could not load stylist details");
  }
});

function renderStylist(stylist) {
  loadingState.style.display = "none";
  loadedState.style.display = "block";

  stylistHeroImg.src = stylist.image || "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=600&auto=format&fit=crop";
  stylistName.textContent = stylist.name;
  stylistRole.textContent = stylist.role;
  stylistRating.textContent = stylist.rating ? stylist.rating.toFixed(1) : "0.0";
  stylistExp.textContent = stylist.experience || "5+ Years";
  reviewCountText.textContent = `${stylist.reviews || 0} Reviews`;
  stylistBio.textContent = stylist.bio || `${stylist.name} is a dedicated ${stylist.role} with a passion for excellence in beauty and customer care.`;

  // Skills
  skillsList.innerHTML = "";
  const skills = stylist.skills || ["Hair Styling", "Master Coloring", "Scalp Therapy"];
  skills.forEach(skill => {
    const badge = document.createElement("span");
    badge.className = "skillBadge";
    badge.textContent = skill;
    skillsList.appendChild(badge);
  });

  // Achievements
  achievementsList.innerHTML = "";
  const achievements = stylist.achievements || [
    "Certified Master Colorist",
    "Best Stylist Award 2023",
    "Specialist in Organic Hair Treatment"
  ];
  achievements.forEach(ach => {
    const li = document.createElement("li");
    li.textContent = ach;
    achievementsList.appendChild(li);
  });

  // Portfolio
  portfolioGrid.innerHTML = "";
  const portfolio = stylist.portfolio || [
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1620331311520-246422fd82f9?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1623998021451-306e52f05903?q=80&w=400&auto=format&fit=crop"
  ];
  portfolio.forEach(img => {
    const imgEl = document.createElement("img");
    imgEl.className = "portfolioItem";
    imgEl.src = img;
    imgEl.alt = "Work Portfolio";
    portfolioGrid.appendChild(imgEl);
  });

  bookWithBtn.href = `book.html?stylistId=${stylist.id}`;
  
  if (window.lucide) window.lucide.createIcons();
}

async function loadReviews(stylistId) {
  if (!reviewsList) return;
  reviewsList.innerHTML = `<p class="emptyReviews">Loading feedback...</p>`;
  try {
    const reviews = await getReviewsByStylist(stylistId);
    
    // Calculate real source-of-truth metrics
    const totalReviews = reviews.length;
    const sumRatings = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const averageRating = totalReviews > 0 ? (sumRatings / totalReviews).toFixed(1) : "0.0";
    
    // Update header stats with real data
    if (stylistRating) {
      stylistRating.textContent = averageRating;
    }
    if (reviewCountText) {
      reviewCountText.textContent = `${totalReviews} Reviews`;
    }

    renderReviews(reviews);
  } catch (error) {
    console.error("Error loading stylist reviews:", error);
    reviewsList.innerHTML = `<p class="emptyReviews">Could not load reviews.</p>`;
  }
}

function renderReviews(reviews) {
  if (reviews.length === 0) {
    reviewsList.innerHTML = `<p class="emptyReviews">No reviews yet. Be the first to review!</p>`;
    return;
  }
  
  reviewsList.innerHTML = "";
  reviews.forEach(r => {
    const date = r.createdAt?.toDate ? r.createdAt.toDate().toLocaleDateString() : "Just now";
    
    const starsHtml = Array(5).fill(0).map((_, i) => 
      `<i data-lucide="star" style="${i < r.rating ? 'fill: var(--accent-gold);' : 'fill: none;'} color: var(--accent-gold); width: 14px; height: 14px;"></i>`
    ).join("");

    const card = document.createElement("div");
    card.className = "reviewCard";
    card.innerHTML = `
      <div class="reviewCardHeader">
        <span class="reviewerName">${r.userName}</span>
        <span class="reviewDate">${date}</span>
      </div>
      <div class="reviewStars">
        ${starsHtml}
      </div>
      <p class="reviewComment">${r.comment}</p>
    `;
    reviewsList.appendChild(card);
  });
  
  if (window.lucide) window.lucide.createIcons();
}

// Review Interaction
if (showReviewFormBtn) {
  showReviewFormBtn.addEventListener("click", () => {
    if (!currentUser) {
      alert("Please login to rate this stylist.");
      window.location.href = "login.html";
      return;
    }
    reviewFormContainer.style.display = "block";
    showReviewFormBtn.style.display = "none";
  });
}

if (cancelReviewBtn) {
  cancelReviewBtn.addEventListener("click", () => {
    reviewFormContainer.style.display = "none";
    showReviewFormBtn.style.display = "block";
    resetForm();
  });
}

if (starSelector) {
  starSelector.addEventListener("click", (e) => {
    const target = e.target.closest("[data-value]");
    if (target) {
      currentRating = parseInt(target.dataset.value);
      updateStarsUI();
    }
  });
}

function updateStarsUI() {
  const stars = starSelector.querySelectorAll("i, svg");
  stars.forEach((star, i) => {
    if (i < currentRating) {
      star.classList.remove("star-outline");
      star.classList.add("star-filled");
    } else {
      star.classList.remove("star-filled");
      star.classList.add("star-outline");
    }
  });
  // Note: We don't call lucide.createIcons() here because it would reset the stars 
  // and lose our classes. We handle the appearance via CSS now.
}

function resetForm() {
  currentRating = 0;
  reviewComment.value = "";
  updateStarsUI();
}

if (submitReviewBtn) {
  submitReviewBtn.addEventListener("click", async () => {
    if (currentRating === 0) {
      alert("Please select a star rating.");
      return;
    }

    submitReviewBtn.disabled = true;
    submitReviewBtn.textContent = "Posting...";

    try {
      const userName = currentProfile?.name || currentUser?.displayName || (currentUser?.email ? currentUser.email.split("@")[0] : "Guest User");
      await addStylistReview({
        stylistId: currentStylistId,
        userId: currentUser.uid,
        userName: userName,
        rating: currentRating,
        comment: reviewComment.value
      });
      
      alert("Review posted! Thank you.");
      reviewFormContainer.style.display = "none";
      showReviewFormBtn.style.display = "block";
      resetForm();
      
      // Refresh
      await loadReviews(currentStylistId);
      const updated = await getStylistById(currentStylistId);
      if(updated) {
        stylistRating.textContent = updated.rating.toFixed(1);
        reviewCountText.textContent = `${updated.reviews || 0} Reviews`;
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to post review.");
    } finally {
      submitReviewBtn.disabled = false;
      submitReviewBtn.textContent = "Post Review";
    }
  });
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.history.back();
  });
}

function showError(message) {
  loadingState.style.display = "none";
  errorState.style.display = "block";
  errorState.textContent = message;
}
