import { onAuthStateChange, requireAuth } from "./auth.js";
import { getServices } from "./db.js";
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

window.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) window.lucide.createIcons();

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    showError();
    return;
  }

  try {
    let allServices = [];
    const dbServices = await getServices();
    allServices = dbServices.length > 0 ? dbServices : MOCK_SERVICES;

    const service = allServices.find((s) => s.id === id);

    if (service) {
      renderService(service);
    } else {
      showError();
    }
  } catch (error) {
    showError();
  }
});

function renderService(service) {
  loadingState.style.display = "none";
  loadedState.style.display = "block";

  serviceHeroImg.src = service.image;
  serviceHeroImg.alt = service.name;
  serviceCategory.textContent = service.category;
  serviceTitle.textContent = service.name;
  servicePrice.textContent = `$${service.price}`;
  serviceRating.textContent = `${service.ratings} (${service.reviews || 0} reviews)`;
  serviceDuration.textContent = `${service.duration} Min`;
  serviceDescription.textContent = service.description;

  bookNowBtn.href = `book.html?id=${service.id}`;
}

function showError() {
  loadingState.style.display = "none";
  errorState.style.display = "block";
}

backBtn.addEventListener("click", () => {
  window.history.back();
});
