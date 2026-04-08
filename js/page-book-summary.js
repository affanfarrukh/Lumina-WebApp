import { onAuthStateChange, requireAuth } from "./auth.js";
import { getServices, getStylists, createBooking } from "./db.js";
import { MOCK_SERVICES, MOCK_STYLISTS } from "./mockData.js";

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const summaryForm = document.getElementById("summaryForm");
const backBtn = document.getElementById("backBtn");

const pageTitle = document.getElementById("pageTitle");
const serviceImg = document.getElementById("serviceImg");
const serviceName = document.getElementById("serviceName");
const serviceCategoryInfo = document.getElementById("serviceCategoryInfo");
const dateTimeVal = document.getElementById("dateTimeVal");
const priceDetails = document.getElementById("priceDetails");
const subtotalVal = document.getElementById("subtotalVal");
const totalLabel = document.getElementById("totalLabel");
const totalVal = document.getElementById("totalVal");
const paymentSection = document.getElementById("paymentSection");
const paymentOptions = document.getElementById("paymentOptions");
const confirmBtn = document.getElementById("confirmBtn");

const successModal = document.getElementById("successModal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const homeBtn = document.getElementById("homeBtn");
const stylistNameVal = document.getElementById("stylistNameVal");
const stylistSummary = document.getElementById("stylistSummary");

let currentUser = null;
let currentService = null;
let bookingDate = "";
let bookingTime = "";
let bookingNotes = "";
let isReschedule = false;
let selectedPaymentMethod = "card";
let currentStylist = null;

requireAuth();

window.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) window.lucide.createIcons();

  onAuthStateChange(({ user }) => {
    currentUser = user;
  });

  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get("id") || localStorage.getItem("lastServiceId");
  const stylistId = params.get("stylistId") || params.get("stylist") || localStorage.getItem("lastStylistId"); 
  
  bookingDate = params.get("date") || localStorage.getItem("lastBookingDate");
  bookingTime = params.get("time") || localStorage.getItem("lastBookingTime");
  bookingNotes = params.get("notes") || localStorage.getItem("lastBookingNotes") || "";
  isReschedule = params.get("reschedule") === "true";

  // Provide defaults ONLY if values are truly missing
  if (!bookingDate) bookingDate = "Tomorrow";
  if (!bookingTime) bookingTime = "10:00 AM";

  try {
    let allServices = [];
    const dbServices = await getServices();
    allServices = dbServices.length > 0 ? dbServices : MOCK_SERVICES;

    // Use provided serviceId or fallback to first available
    const targetId = serviceId || (allServices.length > 0 ? allServices[0].id : null);
    currentService = allServices.find((s) => s.id === targetId);

    if (currentService) {
      // 2. Fetch Stylist details
      if (stylistId) {
        confirmBtn.setAttribute('data-stylist-id', stylistId);
        try {
          const dbStylists = await getStylists();
          const allStylists = dbStylists.length > 0 ? dbStylists : MOCK_STYLISTS;
          
          // Robust find: check both fetched data and mock data as fallback
          currentStylist = allStylists.find(s => (s.id || s.uid) === stylistId);
          
          if (!currentStylist && dbStylists.length > 0) {
            currentStylist = MOCK_STYLISTS.find(s => (s.id || s.uid) === stylistId);
          }
        } catch (e) {
          console.error("Stylist summary fetch fail:", e);
        }
      }
      renderSummary();
    } else {
      console.warn("Summary: No valid service found");
      showError();
    }
  } catch (error) {
    console.error("Summary load error:", error);
    showError();
  }
});

function renderSummary() {
  loadingState.style.display = "none";
  summaryForm.style.display = "flex";

  pageTitle.textContent = isReschedule ? 'Confirm Reschedule' : 'Review Booking';
  
  serviceImg.src = currentService.image;
  serviceImg.alt = currentService.name;
  serviceName.textContent = currentService.name;
  
  if (currentStylist) {
    stylistNameVal.textContent = currentStylist.name;
    // Add avatar if it exists
    const existingAvatar = document.getElementById("stylistAvatar");
    if (existingAvatar) existingAvatar.remove();
    
    if (currentStylist.image) {
      const img = document.createElement("img");
      img.id = "stylistAvatar";
      img.src = currentStylist.image;
      img.className = "stylistSummaryAvatar";
      stylistSummary.prepend(img);
    }
  } else {
    stylistNameVal.textContent = "Any Available Stylist";
    const existingAvatar = document.getElementById("stylistAvatar");
    if (existingAvatar) existingAvatar.remove();
    
    // Add a default fallback icon/avatar if we want
    const div = document.createElement("div");
    div.id = "stylistAvatar";
    div.className = "stylistSummaryAvatar anyStylistSummaryIcon";
    div.innerHTML = `<i data-lucide="help-circle" style="width: 20px; height: 20px;"></i>`;
    stylistSummary.prepend(div);
    if (window.lucide) window.lucide.createIcons();
  }

  serviceCategoryInfo.textContent = `${currentService.duration} Min • Professional Service`;
  
  // display the date param directly since it's now a full formatted date (e.g. Oct 12, 2026)
  dateTimeVal.textContent = `${bookingDate} • ${bookingTime}`;

  if (isReschedule) {
    priceDetails.style.display = "none";
    paymentSection.style.display = "none";
    totalLabel.textContent = "Amount Due";
    totalVal.textContent = "$0.00";
    confirmBtn.textContent = "Confirm Reschedule";
  } else {
    subtotalVal.textContent = `$${currentService.price}`;
    totalLabel.textContent = "Total";
    totalVal.textContent = `$${currentService.price + 5}`; // $5 mock tax
    confirmBtn.textContent = "Confirm Appointment";
  }
}

function showError() {
  loadingState.style.display = "none";
  errorState.style.display = "block";
}

backBtn.addEventListener("click", () => {
  window.history.back();
});

// Handle Payment Method Selection
paymentOptions.addEventListener("click", (e) => {
  const opt = e.target.closest(".paymentOption");
  if (opt) {
    document.querySelectorAll(".paymentOption").forEach(el => el.classList.remove("active"));
    opt.classList.add("active");
    selectedPaymentMethod = opt.getAttribute("data-method");
  }
});

confirmBtn.addEventListener("click", async () => {
  confirmBtn.disabled = true;
  const originalText = confirmBtn.textContent;
  confirmBtn.textContent = "Processing...";

  try {
    const finalPrice = currentService.price + (isReschedule ? 0 : 5);
    const stylistId = confirmBtn.getAttribute('data-stylist-id');
    await createBooking({
      serviceId: currentService.id,
      stylistId: stylistId || null,
      userId: currentUser ? currentUser.uid : "guest",
      userName: currentUser?.displayName || currentUser?.email || "Guest",
      date: bookingDate,
      time: bookingTime,
      status: "upcoming",
      notes: bookingNotes,
      price: finalPrice
    });

    showSuccess();
  } catch (e) {
    console.error("Booking error:", e);
    alert("Failed to confirm booking.");
    confirmBtn.disabled = false;
    confirmBtn.textContent = originalText;
  }
});

function showSuccess() {
  modalTitle.textContent = isReschedule ? 'Reschedule Confirmed!' : 'Booking Confirmed!';
  modalText.innerHTML = `Your appointment for <strong>${currentService.name}</strong> on ${bookingDate} at ${bookingTime} has been successfully ${isReschedule ? 'rescheduled' : 'confirmed'}. We will send you a WhatsApp reminder shortly.`;
  successModal.classList.add("active");
}

homeBtn.addEventListener("click", () => {
  window.location.href = "index.html";
});
