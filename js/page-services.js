import { onAuthStateChange, requireAuth } from "./auth.js";
import { getServices } from "./db.js";
import { MOCK_CATEGORIES, MOCK_SERVICES } from "./mockData.js";
import { renderBottomNav } from "./components.js";

requireAuth();

const categoriesFilters = document.getElementById("categoriesFilters");
const servicesGrid = document.getElementById("servicesGrid");
const openFilterBtn = document.getElementById("openFilterBtn");
const filterCount = document.getElementById("filterCount");
const filterSheet = document.getElementById("filterSheet");
const sheetContent = document.getElementById("sheetContent");
const sortOptionsContainer = document.getElementById("sortOptions");
const resetFiltersBtn = document.getElementById("resetFiltersBtn");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");

let allServices = [];
let activeCategory = "All";
let sortBy = "default";
let tempSortBy = "default";

window.addEventListener("DOMContentLoaded", async () => {
  renderBottomNav("services.html");
  
  // Parse URL for ?category
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get("category");
  if (catParam) activeCategory = catParam;

  renderCategoryBadges();
  updateSortUI();

  try {
    const dbServices = await getServices();
    allServices = dbServices.length > 0 ? dbServices : MOCK_SERVICES;
  } catch (err) {
    allServices = MOCK_SERVICES;
  }

  renderServices();

  // Bottom Sheet events
  openFilterBtn.addEventListener("click", () => {
    tempSortBy = sortBy;
    updateSortUI();
    filterSheet.classList.add("active");
  });

  filterSheet.addEventListener("click", () => {
    filterSheet.classList.remove("active");
  });

  sheetContent.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Sort Option clicks
  sortOptionsContainer.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      tempSortBy = e.target.getAttribute("data-sort");
      updateSortUI();
    }
  });

  resetFiltersBtn.addEventListener("click", () => {
    tempSortBy = "default";
    activeCategory = "All";
    updateSortUI();
    renderCategoryBadges();
  });

  applyFiltersBtn.addEventListener("click", () => {
    sortBy = tempSortBy;
    updateFilterBadge();
    filterSheet.classList.remove("active");
    renderServices();
  });
});

function renderCategoryBadges() {
  categoriesFilters.innerHTML = "";
  
  const allBtn = document.createElement("button");
  allBtn.className = `filterBadge ${activeCategory === "All" ? "active" : ""}`;
  allBtn.textContent = "All";
  allBtn.onclick = () => {
    activeCategory = "All";
    renderCategoryBadges();
    updateFilterBadge();
    renderServices();
  };
  categoriesFilters.appendChild(allBtn);

  MOCK_CATEGORIES.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className = `filterBadge ${activeCategory === cat.name ? "active" : ""}`;
    btn.textContent = cat.name;
    btn.onclick = () => {
      activeCategory = cat.name;
      renderCategoryBadges();
      updateFilterBadge();
      renderServices();
    };
    categoriesFilters.appendChild(btn);
  });
}

function updateSortUI() {
  const btns = sortOptionsContainer.querySelectorAll(".sortBtn");
  btns.forEach(b => {
    if (b.getAttribute("data-sort") === tempSortBy) {
      b.classList.add("sortBtnActive");
    } else {
      b.classList.remove("sortBtnActive");
    }
  });
}

function updateFilterBadge() {
  let count = 0;
  if(sortBy !== "default") count++;
  if(activeCategory !== "All") count++;
  
  if (count > 0) {
    filterCount.style.display = "inline-block";
    filterCount.textContent = count;
  } else {
    filterCount.style.display = "none";
  }
}

function renderServices() {
  servicesGrid.innerHTML = "";
  
  const filtered = activeCategory === "All" 
    ? allServices 
    : allServices.filter(s => s.category === activeCategory);

  const sortedServices = [...filtered].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "rating") return b.ratings - a.ratings;
    return 0;
  });

  if (sortedServices.length === 0) {
    servicesGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 0; color: var(--text-secondary);">
        No services found for this category.
      </div>`;
    return;
  }

  sortedServices.forEach(s => {
    const a = document.createElement("a");
    a.href = `service-detail.html?id=${s.id}`;
    a.className = "serviceCardWrapper";
    
    a.innerHTML = `
      <div class="card card-p-none interactive serviceCard">
        <img src="${s.image}" alt="${s.name}" class="serviceImage" />
        <div class="serviceContent">
          <span class="serviceCategory">${s.category}</span>
          <h3 class="serviceName">${s.name}</h3>
          <div class="serviceMeta">
            <span class="priceStr">$${s.price}</span>
            <div class="ratingStr">
              <i data-lucide="star"></i>
              <span>${s.ratings || 4.5}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    servicesGrid.appendChild(a);
  });

  if (window.lucide) window.lucide.createIcons();
}
