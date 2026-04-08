import { onAuthStateChange, requireAuth } from "./auth.js";
import { getServices, createBooking } from "./db.js";
import { MOCK_SERVICES } from "./mockData.js";

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

let currentUser = null;
let currentService = null;
let bookingDate = "";
let bookingTime = "";
let bookingNotes = "";
let isReschedule = false;
let selectedPaymentMethod = "card";

requireAuth();

window.addEventListener("DOMContentLoaded", async () => {
  if (window.lucide) window.lucide.createIcons();

  onAuthStateChange(({ user }) => {
    currentUser = user;
  });

  const params = new URLSearchParams(window.location.search);
  const serviceId = params.get("id");
  bookingDate = params.get("date");
  bookingTime = params.get("time");
  bookingNotes = params.get("notes") || "";
  isReschedule = params.get("reschedule") === "true";

  if (!serviceId || !bookingDate || !bookingTime) {
    showError();
    return;
  }

  try {
    let allServices = [];
    const dbServices = await getServices();
    allServices = dbServices.length > 0 ? dbServices : MOCK_SERVICES;

    currentService = allServices.find((s) => s.id === serviceId);

    if (currentService) {
      renderSummary();
    } else {
      showError();
    }
  } catch (error) {
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
  serviceCategoryInfo.textContent = `${currentService.duration} Min • Stylist: Default`;
  
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
    await createBooking({
      serviceId: currentService.id,
      userId: currentUser ? currentUser.uid : "guest",
      date: bookingDate,
      time: bookingTime,
      status: "upcoming",
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
