import { onAuthStateChange, requireAuth } from "./auth.js";
import { getServices } from "./db.js";
import { MOCK_CATEGORIES, MOCK_SERVICES } from "./mockData.js";
import { renderBottomNav } from "./components.js";

// Require user to be authenticated to see homepage (mimics ProtectedRoute)
requireAuth();

const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const homeHeader = document.getElementById("homeHeader");
const categoriesSection = document.getElementById("categoriesSection");
const servicesTitle = document.getElementById("servicesTitle");
const seeAllBtn = document.getElementById("seeAllBtn");
const servicesList = document.getElementById("servicesList");
const userNameLabel = document.getElementById("userNameLabel");

let allServices = [];
let query = "";

// Initialize UI
window.addEventListener("DOMContentLoaded", async () => {
  // Render Bottom Nav
  renderBottomNav("index.html");

  // Load auth state
  onAuthStateChange(({ user, profile, loading }) => {
    if (!loading && user) {
      const firstName = profile?.name?.split(" ")[0] || user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "there";
      userNameLabel.textContent = firstName;
    }
  });

  // Render categories
  renderCategories();

  // Load services
  try {
    const dbServices = await getServices();
    allServices = dbServices.length > 0 ? dbServices : MOCK_SERVICES;
  } catch (error) {
    console.error("Failed to load services, falling back to mock", error);
    allServices = MOCK_SERVICES;
  }
  
  renderServices();
  
  // Attach Event Listeners
  searchInput.addEventListener("input", (e) => {
    query = e.target.value;
    updateSearchView();
    renderServices();
  });

  clearSearchBtn.addEventListener("click", () => {
    query = "";
    searchInput.value = "";
    updateSearchView();
    renderServices();
  });
});

function renderCategories() {
  const container = document.getElementById("categoriesGrid");
  container.innerHTML = "";
  
  MOCK_CATEGORIES.forEach(cat => {
    const a = document.createElement("a");
    a.href = `services.html?category=${encodeURIComponent(cat.name)}`;
    a.className = "categoryItem";
    a.innerHTML = `
      <div class="categoryIcon">
        <i data-lucide="${cat.icon}"></i>
      </div>
      <span class="categoryName">${cat.name}</span>
    `;
    container.appendChild(a);
  });

  if (window.lucide) window.lucide.createIcons();
}

function updateSearchView() {
  const isSearching = query.trim().length > 0;
  
  // Toggle UI elements
  homeHeader.style.display = isSearching ? "none" : "flex";
  categoriesSection.style.display = isSearching ? "none" : "block";
  seeAllBtn.style.display = isSearching ? "none" : "block";
  clearSearchBtn.style.display = isSearching ? "flex" : "none";
  
  servicesTitle.textContent = isSearching ? `Results for "${query}"` : "Featured Services";
}

function renderServices() {
  servicesList.innerHTML = "";
  
  const trimmed = query.trim().toLowerCase();
  const isSearching = trimmed.length > 0;

  const displayedServices = isSearching
    ? allServices.filter(
        (s) =>
          s.name?.toLowerCase().includes(trimmed) ||
          s.category?.toLowerCase().includes(trimmed) ||
          s.description?.toLowerCase().includes(trimmed)
      )
    : allServices.slice(0, 3);
    
  if (displayedServices.length === 0) {
    servicesList.innerHTML = `
      <div style="text-align: center; padding: 48px 0; color: var(--text-secondary);">
        <p style="font-size: 1rem;">No services matched your search.</p>
        <p style="font-size: 0.85rem; margin-top: 4px;">Try a different keyword like "hair" or "facial".</p>
      </div>
    `;
    return;
  }
  
  displayedServices.forEach(service => {
    const a = document.createElement("a");
    a.href = `service-detail.html?id=${service.id}`;
    a.className = "serviceLink";
    
    a.innerHTML = `
      <div class="card card-p-sm interactive">
        <div class="serviceCard">
          <img src="${service.image}" alt="${service.name}" class="serviceImage" />
          <div class="serviceInfo">
            <span class="serviceCategory">${service.category}</span>
            <h3 class="serviceName">${service.name}</h3>
            <div class="serviceMeta">
              <div class="metaItem">
                <i data-lucide="star" class="star"></i>
                <span>${service.ratings || 4.5}</span>
              </div>
              <div class="metaItem">
                <i data-lucide="clock"></i>
                <span>${service.duration} Min</span>
              </div>
            </div>
            <div class="priceStr">$${service.price}</div>
          </div>
        </div>
      </div>
    `;
    servicesList.appendChild(a);
  });
  
  if (window.lucide) window.lucide.createIcons();
}
