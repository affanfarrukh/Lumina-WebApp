import { onAuthStateChange, requireAuth } from "./auth.js";
import { getServices } from "./db.js";
import { MOCK_SERVICES } from "./mockData.js";

requireAuth();

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
  serviceId = params.get("id");
  isReschedule = params.get("reschedule") === "true";

  if (!serviceId) {
    showError();
    return;
  }

  try {
    let allServices = [];
    const dbServices = await getServices();
    allServices = dbServices.length > 0 ? dbServices : MOCK_SERVICES;

    currentService = allServices.find((s) => s.id === serviceId);

    if (currentService) {
      renderForm();
    } else {
      showError();
    }
  } catch (error) {
    showError();
  }
});

function renderForm() {
  loadingState.style.display = "none";
  bookForm.style.display = "flex";
  
  totalPriceDisplay.textContent = `$${currentService.price}`;
  
  renderDates();
  renderTimes();
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
  if (!selectedTime) return;
  
  const notes = encodeURIComponent(notesArea.value);
  const time = encodeURIComponent(selectedTime);
  const formattedDate = `${selectedDateObj.month} ${selectedDateObj.date}, ${selectedDateObj.year}`;
  const date = encodeURIComponent(formattedDate);
  const rescheduleParam = isReschedule ? "&reschedule=true" : "";
  window.location.href = `book-summary.html?id=${serviceId}&date=${date}&time=${time}&notes=${notes}${rescheduleParam}`;
});
