import { onAuthStateChange, requireAuth } from "./auth.js";
import { getServices, getAllReviews, getStylists } from "./db.js";
import { MOCK_CATEGORIES, MOCK_SERVICES, MOCK_STYLISTS } from "./mockData.js";
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
const stylistsScroll = document.getElementById("stylistsScroll");

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
    if (dbServices.length > 0) {
      allServices = dbServices;
    } else {
      console.warn("Firestore 'services' collection is empty. Falling back to mock data for demo.");
      allServices = MOCK_SERVICES;
    }
    
    // Enrich with Real Review Data
    try {
      const allReviews = await getAllReviews();
      allServices = allServices.map(service => {
        const serviceReviews = allReviews.filter(r => r.serviceId === service.id);
        const count = serviceReviews.length;
        const avg = count > 0 
          ? (serviceReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(1)
          : "0.0";
        
        return {
          ...service,
          ratings: parseFloat(avg),
          reviewsCount: count // using a distinct field to avoid confusion
        };
      });
    } catch (revError) {
      console.error("Error aggregating reviews:", revError);
    }
  } catch (error) {
    console.error("Critical error in getServices():", error);
    allServices = MOCK_SERVICES;
  }
  
  renderServices();
  
  // Load Stylists
  try {
    const dbStylists = await getStylists();
    const allStylists = dbStylists.length > 0 ? dbStylists : MOCK_STYLISTS;
    renderStylists(allStylists);
  } catch (error) {
    console.error("Error loading stylists:", error);
    renderStylists(MOCK_STYLISTS);
  }
  
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
    : [...allServices]
        .sort((a, b) => {
          // 1. Prioritize Featured
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          
          // 2. Secondary: Higher Ratings
          return (b.ratings || 0) - (a.ratings || 0);
        })
        .slice(0, 3);
    
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
                <span>${service.ratings ? (typeof service.ratings === 'number' ? service.ratings.toFixed(1) : service.ratings) : "0.0"} (${service.reviewsCount || 0})</span>
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
    a.addEventListener("click", () => {
      localStorage.setItem("lastServiceId", service.id);
    });

    servicesList.appendChild(a);
  });
  if (window.lucide) window.lucide.createIcons();
}

/**
 * Renders the top stylists scroll on the home page.
 */
function renderStylists(stylists) {
  if (!stylistsScroll) return;
  stylistsScroll.innerHTML = "";
  
  // Display top 5 stylists
  // Display top 5 stylists
  stylists.slice(0, 5).forEach(st => {
    const id = st.id || st.uid;
    if (!id) return;

    const card = document.createElement("a");
    card.href = `./stylist-detail.html?id=${id}`;
    card.className = "stCard";
    card.setAttribute("data-stylist-id", id);
    
    card.innerHTML = `
      <img src="${st.image}" alt="${st.name}" class="stImage" />
      <h4 class="stName">${st.name}</h4>
      <p class="stRole">${st.role}</p>
      <div class="stRating">
        <i data-lucide="star"></i>
        <span>${st.rating ? st.rating.toFixed(1) : "0.0"}</span>
      </div>
    `;

    // Intercept with JS for localStorage fallback, but keep raw href for browser compatibility
    card.addEventListener("click", () => {
      console.log("Stylist clicked on Home:", id);
      localStorage.setItem("lastStylistId", id);
    });

    stylistsScroll.appendChild(card);
  });
  
  if (window.lucide) window.lucide.createIcons();
}
