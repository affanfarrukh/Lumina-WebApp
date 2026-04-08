import { getAllBookings, getServices, getAllUsers } from "./db.js";
import { requireAdminAuth, logoutUser } from "./auth.js";
import { MOCK_SERVICES } from "./mockData.js";
import { renderBottomNav } from "./components.js";

requireAdminAuth();

const tableBody = document.getElementById("bookingsTableBody");
const backBtn = document.getElementById("backBtn");

let bookings = [];
let services = [];
let users = [];

window.addEventListener("DOMContentLoaded", async () => {
  renderBottomNav("admin-bookings.html");
  if (window.lucide) window.lucide.createIcons();
  await loadData();
});

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.history.back();
  });
}

async function loadData() {
  tableBody.innerHTML = `<tr><td colspan="6" class="emptyState">Loading bookings...</td></tr>`;
  try {
    const [_bookings, _services, _users] = await Promise.all([
      getAllBookings(),
      getServices(),
      getAllUsers()
    ]);
    bookings = _bookings;
    services = _services.length > 0 ? _services : MOCK_SERVICES;
    users = _users;
    renderTable();
  } catch (error) {
    console.error("Failed to load bookings", error);
    tableBody.innerHTML = `<tr><td colspan="6" class="emptyState">Failed to load data.</td></tr>`;
  }
}

function renderTable() {
  tableBody.innerHTML = "";
  if (bookings.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="emptyState">No bookings found in the system.</td></tr>`;
    return;
  }

  bookings.forEach((b, i) => {
    const tr = document.createElement("tr");

    const service = services.find(srv => srv.id === b.serviceId);
    const serviceName = service ? service.name : b.serviceId;
    
    const user = users.find(u => u.uid === b.userId);
    let userName = b.userId === "guest" ? "Guest User" : "App User";
    if (user) {
      userName = user.name || user.email || userName;
    }
    
    let statusClass = "statusUpcoming";
    if (b.status === "completed") statusClass = "statusCompleted";
    if (b.status === "cancelled") statusClass = "statusCancelled";

    tr.innerHTML = `
      <td style="color: #bbb; font-size: 0.8rem;">${i + 1}</td>
      <td style="font-weight: 600;">${userName}</td>
      <td>${serviceName}</td>
      <td>${b.date}</td>
      <td>${b.time}</td>
      <td>
        <span class="statusBadge ${statusClass}">${b.status || 'upcoming'}</span>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  if (window.lucide) window.lucide.createIcons();
}

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logoutUser();
      window.location.href = "login.html";
    }
  });
}
