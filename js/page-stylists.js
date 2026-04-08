import { onAuthStateChange, requireAuth } from "./auth.js";
import { getStylists } from "./db.js";
import { MOCK_STYLISTS } from "./mockData.js";
import { renderBottomNav } from "./components.js";

requireAuth();

const stylistsListContainer = document.getElementById("stylistsList");

let allStylists = [];
let favorites = new Set(["st1", "st2"]);

window.addEventListener("DOMContentLoaded", async () => {
  renderBottomNav("stylists.html"); // Stylists doesn't have an icon in current Nextjs layout but we can render it. Actually in Nextjs, it's not in the bottom nav.

  try {
    const dbStylists = await getStylists();
    allStylists = dbStylists.length > 0 ? dbStylists : MOCK_STYLISTS;
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
    const a = document.createElement("a");
    a.href = `services.html`;
    a.className = "stylistCardWrapper";

    const isFav = favorites.has(stylist.id);

    a.innerHTML = `
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
              <span>${stylist.rating} (${stylist.reviews})</span>
            </div>
          </div>

          <button class="bookBtn">View Services</button>
        </div>
      </div>
    `;

    stylistsListContainer.appendChild(a);
  });

  if (window.lucide) window.lucide.createIcons();
}
