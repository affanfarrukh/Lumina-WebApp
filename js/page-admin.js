import { onAuthStateChange, requireAuth, requireAdminAuth, logoutUser } from "./auth.js";
import { getServices, getStylists } from "./db.js";
import { db } from "./firebase-init.js";
import { doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { MOCK_SERVICES, MOCK_STYLISTS } from "./mockData.js";
import { renderBottomNav } from "./components.js";

// Require admin user
requireAdminAuth();

const servicesCount = document.getElementById("servicesCount");
const stylistsCount = document.getElementById("stylistsCount");
const bookingsCount = document.getElementById("bookingsCount");
const logoutBtn = document.getElementById("logoutBtn");
const seedDbBtn = document.getElementById("seedDbBtn");
const seedDbTitle = document.getElementById("seedDbTitle");

window.addEventListener("DOMContentLoaded", async () => {
  renderBottomNav("admin.html");
  if (window.lucide) window.lucide.createIcons();

  try {
    const services = await getServices();
    servicesCount.textContent = services.length;
  } catch(e) {
    console.error("Failed to fetch services", e);
  }

  try {
    const stylists = await getStylists();
    stylistsCount.textContent = stylists.length;
  } catch(e) {
    console.error("Failed to fetch stylists", e);
  }

  try {
    // Basic count of total bookings across all users for admin overview
    // In a real app we'd need a specific admin query
    const colSnap = await getDocs(collection(db, "bookings"));
    bookingsCount.textContent = colSnap.size;
  } catch(e) {
    console.error("Failed to fetch bookings count", e);
  }

});

logoutBtn.addEventListener("click", async () => {
  if (confirm("Are you sure you want to logout?")) {
    await logoutUser();
    window.location.href = "login.html";
  }
});

seedDbBtn.addEventListener("click", async () => {
  seedDbBtn.disabled = true;
  seedDbTitle.textContent = "Seeding...";
  
  try {
    for (const service of MOCK_SERVICES) {
      await setDoc(doc(db, "services", service.id), service);
    }
    for (const stylist of MOCK_STYLISTS) {
      await setDoc(doc(db, "stylists", stylist.id), stylist);
    }
    alert("Database seeded successfully!");
    window.location.reload();
  } catch (e) {
    alert("Error seeding database: " + e.message);
    seedDbBtn.disabled = false;
    seedDbTitle.textContent = "Seed Firebase DB";
  }
});
