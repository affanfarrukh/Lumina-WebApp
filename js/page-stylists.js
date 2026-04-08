import { requireAuth } from "./auth.js";
import { getStylists, getAllStylistReviews } from "./db.js";
import { MOCK_STYLISTS } from "./mockData.js";
import { renderBottomNav } from "./components.js";

requireAuth();

const stylistsListContainer = document.getElementById("stylistsList");

let allStylists = [];
let favorites = new Set(["st1", "st2"]);

window.addEventListener("DOMContentLoaded", async () => {
  renderBottomNav("stylists.html");

  try {
    const dbStylists = await getStylists();
    let stylists = dbStylists.length > 0 ? dbStylists : MOCK_STYLISTS;

    // Aggregation: Calculate real ratings from stylist_reviews collection
    try {
      const allReviews = await getAllStylistReviews();
      stylists = stylists.map(s => {
        const id = s.id || s.uid;
        const sReviews = allReviews.filter(r => r.stylistId === id);
        const count = sReviews.length;
        const avg = count > 0 
          ? (sReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(1)
          : "0.0";
        
        return {
          ...s,
          rating: parseFloat(avg),
          reviewsCount: count
        };
      });
    } catch (revErr) {
      console.error("Error aggregating stylist reviews:", revErr);
    }

    allStylists = stylists;
  } catch (error) {
    console.error("Failed to fetch stylists, falling back to mock", error);
    allStylists = MOCK_STYLISTS;
  }

  renderStylists();
});

// Event Delegation for toggling favorites
stylistsListContainer.addEventListener("click", (e) => {
  const heartBtn = e.target.closest(".heartBtn");
  if (heartBtn) {
    e.preventDefault(); // Prevent navigating to services
    const id = heartBtn.getAttribute("data-id");
    if (favorites.has(id)) {
      favorites.delete(id);
    } else {
      favorites.add(id);
    }
    renderStylists();
  }
});

function renderStylists() {
  stylistsListContainer.innerHTML = "";

  allStylists.forEach(stylist => {
    const id = stylist.id || stylist.uid;
    if (!id) return;
    
    const card = document.createElement("a");
    card.href = `./stylist-detail.html?id=${id}`;
    card.className = "stylistCardWrapper";
    card.setAttribute("data-stylist-id", id);

    const isFav = favorites.has(stylist.id);

    card.innerHTML = `
      <div class="stylistCard">
        <div class="imageWrapper">
          <img src="${stylist.image}" alt="${stylist.name}" class="stylistImage" />
        </div>
        
        <div class="stylistInfo">
          <div class="nameRow">
            <h3 class="name">${stylist.name}</h3>
            <button class="heartBtn ${isFav ? 'saved' : ''}" data-id="${stylist.id}">
              <i data-lucide="heart" ${isFav ? 'fill="currentColor"' : ''}></i>
            </button>
          </div>
          
          <span class="role">${stylist.role}</span>
          
          <div class="metaRow">
            <div class="metaItem">
              <i data-lucide="star" class="star"></i>
              <span>${stylist.rating} (${stylist.reviewsCount || 0})</span>
            </div>
          </div>

          <button class="bookBtn">View Profile</button>
        </div>
      </div>
    `;

    card.addEventListener("click", (e) => {
      // Don't intercept if heart button was clicked
      if (e.target.closest(".heartBtn")) return;
      
      console.log("Stylist clicked on List:", id);
      localStorage.setItem("lastStylistId", id);
    });

    stylistsListContainer.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}
