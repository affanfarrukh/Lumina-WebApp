import { onAuthStateChange, requireAuth } from "./auth.js";
import { getServices, getReviewsByService, addReview, getUserProfile } from "./db.js";
import { MOCK_SERVICES } from "./mockData.js";

requireAuth();

const loadingState = document.getElementById("loadingState");
const loadedState = document.getElementById("loadedState");
const errorState = document.getElementById("errorState");
const backBtn = document.getElementById("backBtn");

const serviceHeroImg = document.getElementById("serviceHeroImg");
const serviceCategory = document.getElementById("serviceCategory");
const serviceTitle = document.getElementById("serviceTitle");
const servicePrice = document.getElementById("servicePrice");
const serviceRating = document.getElementById("serviceRating");
const serviceDuration = document.getElementById("serviceDuration");
const serviceDescription = document.getElementById("serviceDescription");
const bookNowBtn = document.getElementById("bookNowBtn");

// Reviews Elements
const reviewsList = document.getElementById("reviewsList");
const showReviewFormBtn = document.getElementById("showReviewFormBtn");
const reviewFormContainer = document.getElementById("reviewFormContainer");
const cancelReviewBtn = document.getElementById("cancelReviewBtn");
const submitReviewBtn = document.getElementById("submitReviewBtn");
const starSelector = document.getElementById("starSelector");
const reviewComment = document.getElementById("reviewComment");

let currentRating = 0;
let currentUser = null;
let currentServiceId = null;

onAuthStateChange(({ user }) => {
  currentUser = user;
});

window.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) window.lucide.createIcons();

  const params = new URLSearchParams(window.location.search);
  let id = params.get("id");

  // Fallback to localStorage if ID is missing from URL
  if (!id) {
    id = localStorage.getItem("lastServiceId");
  }

  if (!id) {
    showError("Please select a service from the home page.");
    return;
  }

  try {
    let allServices = [];
    const dbServices = await getServices();
    
    // We try to find the service in the database first.
    let service = dbServices.find((s) => s.id === id);
    
    // If not found in DB, we check mocks as a last resort.
    // This fixes the "service not found" if DB is active but item is a mock.
    if (!service) {
      service = MOCK_SERVICES.find((s) => s.id === id);
    }

    if (service) {
      currentServiceId = id;
      renderService(service);
      initReviewSystem();
      await loadReviews(id);
    } else {
      console.warn(`Service with ID ${id} not found in DB or Mocks.`);
      showError();
    }
  } catch (error) {
    console.error("Failed to load service detail:", error);
    showError();
  }
});

function initReviewSystem() {
  if (!starSelector) return;
  
  // Star Selection Logic - Using event delegation because Lucide replaces <i> with <svg>
  starSelector.addEventListener("click", (e) => {
    const star = e.target.closest("[data-value]");
    if (star) {
      currentRating = parseInt(star.getAttribute("data-value"));
      updateStarSelection();
    }
  });

  if (showReviewFormBtn) {
    showReviewFormBtn.addEventListener("click", () => {
      if (reviewFormContainer) reviewFormContainer.style.display = "flex";
      showReviewFormBtn.style.display = "none";
    });
  }

  if (cancelReviewBtn) {
    cancelReviewBtn.addEventListener("click", () => {
      resetForm();
    });
  }

  if (submitReviewBtn) {
    submitReviewBtn.addEventListener("click", handleReviewSubmit);
  }
}

function updateStarSelection() {
  if (!starSelector) return;
  starSelector.querySelectorAll("[data-value]").forEach(star => {
    const val = parseInt(star.getAttribute("data-value"));
    if (val <= currentRating) {
      star.style.fill = "var(--accent-gold)";
      star.style.color = "var(--accent-gold)";
    } else {
      star.style.fill = "none";
      star.style.color = "currentColor";
    }
  });
}

function resetForm() {
  if (reviewFormContainer) reviewFormContainer.style.display = "none";
  if (showReviewFormBtn) showReviewFormBtn.style.display = "block";
  currentRating = 0;
  if (reviewComment) reviewComment.value = "";
  updateStarSelection();
}

async function handleReviewSubmit() {
  if (currentRating === 0) {
    alert("Please select a star rating.");
    return;
  }
  
  if (!currentUser) {
    alert("You must be logged in to post a review.");
    return;
  }
  
  submitReviewBtn.disabled = true;
  submitReviewBtn.textContent = "Posting...";
  
  try {
    const profile = await getUserProfile(currentUser.uid);
    const userName = profile ? profile.name : (currentUser.displayName || "Valued Customer");
    
    await addReview({
      serviceId: currentServiceId,
      userId: currentUser.uid,
      userName: userName,
      rating: currentRating,
      comment: reviewComment?.value || ""
    });
    
    resetForm();
    await loadReviews(currentServiceId);

  } catch (error) {
    console.error("Error submitting review:", error);
    alert("Failed to post review. Please try again.");
  } finally {
    submitReviewBtn.disabled = false;
    submitReviewBtn.textContent = "Post Review";
  }
}

async function loadReviews(serviceId) {
  if (!reviewsList) return;
  reviewsList.innerHTML = `<p class="emptyReviews">Loading reviews...</p>`;
  try {
    const reviews = await getReviewsByService(serviceId);
    
    // Calculate real source-of-truth metrics
    const totalReviews = reviews.length;
    const sumRatings = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const averageRating = totalReviews > 0 ? (sumRatings / totalReviews).toFixed(1) : "0.0";
    
    // Update header stats with real data
    if (serviceRating) {
      serviceRating.textContent = `${averageRating} (${totalReviews} reviews)`;
    }

    renderReviews(reviews);
  } catch (error) {
    console.error("Error loading reviews:", error);
    reviewsList.innerHTML = `<p class="emptyReviews">Could not load reviews.</p>`;
  }
}

function renderReviews(reviews) {
  if (!reviewsList) return;
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

function renderService(service) {
  loadingState.style.display = "none";
  loadedState.style.display = "block";

  serviceHeroImg.src = service.image;
  serviceHeroImg.alt = service.name;
  serviceCategory.textContent = service.category;
  serviceTitle.textContent = service.name;
  servicePrice.textContent = `$${service.price}`;
  // Ratings and reviews will be set by loadReviews() to ensure source-of-truth accuracy
  serviceRating.textContent = "Loading stats...";
  serviceDuration.textContent = `${service.duration} Min`;
  serviceDescription.textContent = service.description;

  bookNowBtn.href = `book.html?id=${service.id}`;
}

function showError(message = "Service not found") {
  if (loadingState) loadingState.style.display = "none";
  if (errorState) {
    errorState.style.display = "block";
    errorState.innerHTML = `
      <p>${message}</p>
      <a href="index.html" class="btn btn-primary" style="margin-top: 20px; display: inline-block;">Go back to Home</a>
    `;
  }
}

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.history.back();
  });
}
