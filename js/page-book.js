import { onAuthStateChange, requireAuth } from "./auth.js";
import { getServices, getStylists } from "./db.js";
import { MOCK_SERVICES, MOCK_STYLISTS } from "./mockData.js";

requireAuth();

const stylistScroll = document.getElementById("stylistScroll");
const dateScroll = document.getElementById("dateScroll");
const timeGrid = document.getElementById("timeGrid");
const continueBtn = document.getElementById("continueBtn");
const notesArea = document.getElementById("notesArea");
const totalPriceDisplay = document.getElementById("totalPriceDisplay");
const backBtn = document.getElementById("backBtn");
const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const bookForm = document.getElementById("bookForm");

const generateDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push({
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: d.getDate().toString(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
      year: d.getFullYear(),
      fullDate: d.toISOString().split('T')[0], // yyyy-mm-dd
      monthYearTitle: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    });
  }
  return dates;
};

const mockDates = generateDates();
let selectedDate = mockDates[0].fullDate;
let selectedDateObj = mockDates[0];
let selectedTime = "";
let selectedStylistId = "any";

const mockTimes = [
  "09:00 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "01:00 PM", "02:30 PM",
  "03:00 PM", "04:30 PM", "05:00 PM"
];

let serviceId = null;
let currentService = null;
let isReschedule = false;

window.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) window.lucide.createIcons();

  const params = new URLSearchParams(window.location.search);
  serviceId = params.get("id") || localStorage.getItem("lastServiceId");
  selectedStylistId = params.get("stylistId") || params.get("stylist") || localStorage.getItem("lastStylistId") || "any";
  
  isReschedule = params.get("reschedule") === "true";

  try {
    // 1. Fetch Services
    let allServices = [];
    const dbServices = await getServices();
    allServices = dbServices.length > 0 ? dbServices : MOCK_SERVICES;

    if (!serviceId && allServices.length > 0) {
      serviceId = allServices[0].id;
    }

    currentService = allServices.find((s) => s.id === serviceId);

    // 2. Fetch Stylists
    let allStylists = [];
    try {
      const dbStylists = await getStylists();
      allStylists = dbStylists.length > 0 ? dbStylists : MOCK_STYLISTS;
    } catch (e) {
      console.error("Stylist fetch fail:", e);
      allStylists = MOCK_STYLISTS;
    }

    if (currentService) {
      renderForm(allStylists);
    } else {
      showError();
    }
  } catch (error) {
    console.error("Booking load error:", error);
    showError();
  }
});

function renderForm(stylists) {
  loadingState.style.display = "none";
  bookForm.style.display = "flex";
  
  totalPriceDisplay.textContent = `$${currentService.price}`;
  
  renderStylists(stylists);
  renderDates();
  renderTimes();
}

function renderStylists(stylists) {
  if (!stylistScroll) return;
  stylistScroll.innerHTML = "";

  // Add "Any Available" option
  const anyCard = document.createElement("div");
  anyCard.className = `stylistCard ${selectedStylistId === "any" ? "active" : ""}`;
  anyCard.innerHTML = `
    <div class="stylistAvatarWrapper">
      <div class="anyStylistIcon">
        <i data-lucide="help-circle" style="width: 24px; height: 24px;"></i>
      </div>
    </div>
    <span class="stylistName">Any Available</span>
  `;
  anyCard.onclick = () => {
    selectedStylistId = "any";
    const oldActive = stylistScroll.querySelector(".stylistCard.active");
    if (oldActive) oldActive.classList.remove("active");
    anyCard.classList.add("active");
    updateContinueBtn();
  };
  stylistScroll.appendChild(anyCard);

  stylists.forEach(s => {
    const id = s.id || s.uid;
    const card = document.createElement("div");
    card.className = `stylistCard ${selectedStylistId === id ? "active" : ""}`;
    card.innerHTML = `
      <div class="stylistAvatarWrapper">
        <img src="${s.image}" alt="${s.name}" class="stylistAvatar" />
      </div>
      <span class="stylistName">${s.name}</span>
    `;
    
    card.onclick = () => {
      selectedStylistId = id;
      const oldActive = stylistScroll.querySelector(".stylistCard.active");
      if (oldActive) oldActive.classList.remove("active");
      card.classList.add("active");
      updateContinueBtn();
    };
    
    stylistScroll.appendChild(card);
  });
  
  if (window.lucide) window.lucide.createIcons();
  updateContinueBtn();
}

function renderDates() {
  dateScroll.innerHTML = "";
  document.getElementById("monthYearTitle").textContent = mockDates[0].monthYearTitle;
  
  mockDates.forEach(d => {
    const btn = document.createElement("button");
    btn.className = `dateCard ${selectedDate === d.fullDate ? "active" : ""}`;
    btn.setAttribute('data-monthyear', d.monthYearTitle);
    btn.innerHTML = `
      <span class="dayName">${d.day}</span>
      <span class="dayNumber">${d.date}</span>
    `;
    btn.onclick = () => {
      selectedDate = d.fullDate;
      selectedDateObj = d;
      
      const oldActive = dateScroll.querySelector(".dateCard.active");
      if (oldActive) oldActive.classList.remove("active");
      btn.classList.add("active");
    };
    dateScroll.appendChild(btn);
  });
}

let scrollTimeout;
dateScroll.addEventListener("scroll", () => {
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    const containerRect = dateScroll.getBoundingClientRect();
    const cards = dateScroll.querySelectorAll(".dateCard");
    let leftmostCard = cards[0];
    
    for (let card of cards) {
      const rect = card.getBoundingClientRect();
      // If the right edge of the card is past the container's left edge + 20px buffer
      if (rect.right > containerRect.left + 20) { 
        leftmostCard = card;
        break;
      }
    }
    
    if (leftmostCard) {
      const newMonthYear = leftmostCard.getAttribute("data-monthyear");
      const titleEl = document.getElementById("monthYearTitle");
      if (titleEl.textContent !== newMonthYear) {
        titleEl.textContent = newMonthYear;
      }
    }
    scrollTimeout = null;
  }, 50); // 50ms throttle for smooth updates
});

function renderTimes() {
  timeGrid.innerHTML = "";
  mockTimes.forEach(t => {
    const btn = document.createElement("button");
    btn.className = `timeSlot ${selectedTime === t ? "active" : ""}`;
    btn.textContent = t;
    btn.onclick = () => {
      selectedTime = t;
      renderTimes();
      updateContinueBtn();
    };
    timeGrid.appendChild(btn);
  });
}

function updateContinueBtn() {
  // Now only time is strictly required, stylist defaults to "any"
  if (selectedTime) {
    continueBtn.disabled = false;
  } else {
    continueBtn.disabled = true;
  }
}

function showError() {
  loadingState.style.display = "none";
  errorState.style.display = "block";
}

backBtn.addEventListener("click", () => {
  window.history.back();
});

continueBtn.addEventListener("click", () => {
  
  if (!selectedTime) {
    alert("Please select an available time slot before continuing.");
    return;
  }
  
  if (!selectedDateObj) {
    alert("Please select a date before continuing.");
    return;
  }

  try {
    const notesValue = notesArea ? notesArea.value : "";
    const notes = encodeURIComponent(notesValue || "");
    const time = encodeURIComponent(selectedTime);
    const formattedDate = `${selectedDateObj.month} ${selectedDateObj.date}, ${selectedDateObj.year}`;
    const date = encodeURIComponent(formattedDate);
    
    const rescheduleParam = isReschedule ? "&reschedule=true" : "";
    const stylistToPass = (selectedStylistId && selectedStylistId !== "any") ? selectedStylistId : "";
    const stylistParam = stylistToPass ? `&stylistId=${stylistToPass}` : "";
    
    // Fallback for serviceId if it somehow became null
    const finalServiceId = serviceId || (currentService ? currentService.id : "");
    
    const targetUrl = `book-summary.html?id=${finalServiceId}&date=${date}&time=${time}&notes=${notes}${rescheduleParam}${stylistParam}`;
    
    // REDUNDANCY: Save to localStorage in case URL params are stripped on next page
    localStorage.setItem("lastServiceId", finalServiceId);
    if (stylistToPass) localStorage.setItem("lastStylistId", stylistToPass);
    else localStorage.removeItem("lastStylistId");
    
    localStorage.setItem("lastBookingDate", formattedDate);
    localStorage.setItem("lastBookingTime", selectedTime);
    localStorage.setItem("lastBookingNotes", notesValue || "");
    
    window.location.href = targetUrl;
  } catch (err) {
    console.error("Navigation error:", err);
    alert("An error occurred while preparing your booking. Please try again.");
  }
});

// Also ensure the button is enabled if a time was already selected (unlikely but safe)
updateContinueBtn();
