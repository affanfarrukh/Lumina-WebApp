import { onAuthStateChange, requireAuth } from "./auth.js";
import { getServices, getUserBookings, cancelBooking } from "./db.js";
import { MOCK_SERVICES } from "./mockData.js";
import { renderBottomNav } from "./components.js";

const bookingsList = document.getElementById("bookingsList");
const bookingTabs = document.getElementById("bookingTabs");

let currentUser = null;
let allServices = [];
let allBookings = [];
let activeTab = "upcoming";

// We don't require auth immediately if we want to show guest bookings for demo,
// but usually bookings page should require auth. Let's let requireAuth handle it or just use onAuthStateChange.
// In the original, it fetches for user or "guest". We'll replicate that.
// requireAuth(); // comment out to allow "guest" fallback from original Nextjs app

window.addEventListener("DOMContentLoaded", async () => {
  renderBottomNav("bookings.html");

  try {
    const dbServices = await getServices();
    allServices = dbServices.length > 0 ? dbServices : MOCK_SERVICES;
  } catch(e) {
    allServices = MOCK_SERVICES;
  }

  onAuthStateChange(async ({ user }) => {
    currentUser = user;
    await fetchBookings();
  });

  // Event Delegation for cancel buttons to ensure they work regardless of DOM updates
  bookingsList.addEventListener("click", async (e) => {
    const btn = e.target.closest(".cancel-btn");
    if (!btn) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const id = btn.getAttribute("data-id");
    
    // Removing confirm() as the browser might be blocking it silently if "Don't show again" was checked
    try {
      btn.textContent = "Canceling...";
      btn.disabled = true;
      
      await cancelBooking(id);
      
      // Refresh list locally to mirror the backend update
      allBookings = allBookings.map(b => b.id === id ? { ...b, status: "completed" } : b);
      renderBookings();
    } catch (err) {
      console.error("Cancellation error:", err);
      alert("Failed to cancel booking: " + err.message);
      btn.textContent = "Cancel";
      btn.disabled = false;
    }
  });
});

bookingTabs.addEventListener("click", (e) => {
  if (e.target.classList.contains("tab")) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    e.target.classList.add("active");
    activeTab = e.target.getAttribute("data-tab");
    renderBookings();
  }
});

async function fetchBookings() {
  bookingsList.innerHTML = `<div style="text-align: center; padding: 40px;">Loading bookings...</div>`;
  try {
    const uid = currentUser ? currentUser.uid : "guest";
    allBookings = await getUserBookings(uid);
    renderBookings();
  } catch (e) {
    console.error(e);
    bookingsList.innerHTML = `<div style="text-align: center; padding: 40px;">Error loading bookings.</div>`;
  }
}

function renderBookings() {
  bookingsList.innerHTML = "";

  const filtered = allBookings.filter(b => 
    activeTab === "upcoming" ? b.status === "upcoming" : b.status === "completed"
  );

  if (filtered.length === 0) {
    bookingsList.innerHTML = `
      <div class="emptyState">
        <div class="emptyIcon">
          <i data-lucide="calendar-heart" style="width: 40px; height: 40px;"></i>
        </div>
        <p class="emptyText">
          You don't have any ${activeTab} bookings.<br/>
          Book your next premium experience now.
        </p>
        <a href="services.html" style="margin-top: 8px; text-decoration: none;">
          <button class="btn-primary" style="padding: 12px 24px;">Explore Services</button>
        </a>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  filtered.forEach(booking => {
    const service = allServices.find(s => s.id === booking.serviceId) || MOCK_SERVICES.find(s => s.id === booking.serviceId);
    if (!service) return;

    const div = document.createElement("div");
    div.className = "bookingCard";
    
    let actionsHtml = "";
    if (booking.status === "upcoming") {
      actionsHtml = `
        <div class="actions">
          <a href="book.html?id=${service.id}&reschedule=true" style="flex: 1; display: flex;">
            <button class="actionBtn actionBtnPrimary" style="width: 100%;">Reschedule</button>
          </a>
          <button class="actionBtn cancel-btn" data-id="${booking.id}" style="flex: 1;">
            Cancel
          </button>
        </div>
      `;
    } else {
      actionsHtml = `
        <div class="actions">
          <a href="book.html?id=${service.id}" style="flex: 1; display: flex;">
            <button class="actionBtn actionBtnPrimary" style="width: 100%;">Book Again</button>
          </a>
        </div>
      `;
    }

    div.innerHTML = `
      <div class="cardHeader">
        <span class="status ${booking.status === 'upcoming' ? 'statusUpcoming' : 'statusCompleted'}">
          ${booking.status}
        </span>
        <span class="price">$${service.price}</span>
      </div>

      <div class="serviceInfo">
        <img src="${service.image}" alt="${service.name}" class="serviceImage" />
        <div class="serviceDetails">
          <h3 class="serviceName">${service.name}</h3>
          <div class="metaRow">
            <div class="metaItem">
              <i data-lucide="calendar"></i>
              <span>${booking.date}</span>
            </div>
            <div class="metaItem">
              <i data-lucide="clock"></i>
              <span>${booking.time}</span>
            </div>
          </div>
        </div>
      </div>

      ${actionsHtml}
    `;

    bookingsList.appendChild(div);
  });

  // Cancel button clicks are handled by event delegation on bookingsList

  if (window.lucide) window.lucide.createIcons();
}
