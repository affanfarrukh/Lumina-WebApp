import { getStylists, addStylist, updateStylist, deleteStylist } from "./db.js";
import { requireAdminAuth, logoutUser } from "./auth.js";
import { renderBottomNav } from "./components.js";

requireAdminAuth();

const tableBody = document.getElementById("stylistsTableBody");
const openAddBtn = document.getElementById("openAddBtn");
const panelOverlay = document.getElementById("panelOverlay");
const closePanelBtn = document.getElementById("closePanelBtn");
const sidePanel = document.getElementById("sidePanel");
const backBtn = document.getElementById("backBtn");

const saveBtn = document.getElementById("saveBtn");
const panelTitle = document.getElementById("panelTitle");

// Form Inputs
const inpName = document.getElementById("inpName");
const inpRole = document.getElementById("inpRole");
const inpImage = document.getElementById("inpImage");
const inpRating = document.getElementById("inpRating");
const inpReviews = document.getElementById("inpReviews");

let stylists = [];
let editingId = null;

// Initialization
window.addEventListener("DOMContentLoaded", async () => {
  renderBottomNav("admin-stylists.html");
  if (window.lucide) window.lucide.createIcons();
  await loadStylists();
});

backBtn.addEventListener("click", () => {
  window.history.back();
});

async function loadStylists() {
  tableBody.innerHTML = `<tr><td colspan="4" class="emptyState">Loading stylists...</td></tr>`;
  try {
    stylists = await getStylists();
    renderTable();
  } catch (error) {
    console.error("Failed to load stylists", error);
    tableBody.innerHTML = `<tr><td colspan="4" class="emptyState">Failed to load data.</td></tr>`;
  }
}

function renderTable() {
  tableBody.innerHTML = "";
  if (stylists.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" class="emptyState">No stylists found. Add one above.</td></tr>`;
    return;
  }

  stylists.forEach(s => {
    const tr = document.createElement("tr");

    const imgHtml = s.image
      ? `<img src="${s.image}" alt="${s.name}" class="thumbRound" />`
      : `<div class="thumbPlaceholderRound"></div>`;

    tr.innerHTML = `
      <td>${imgHtml}</td>
      <td style="font-weight: 600;">${s.name}</td>
      <td>⭐ ${s.rating}</td>
      <td>
        <div class="actions">
          <button class="iconBtn edit-btn" title="Edit" data-id="${s.id}">
            <i data-lucide="pencil" style="width: 16px; height: 16px;"></i>
          </button>
          <button class="iconBtn iconBtnDanger delete-btn" title="Remove" data-id="${s.id}">
            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  if (window.lucide) window.lucide.createIcons();

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      openPanel(id);
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      if (confirm("Remove this stylist?")) {
        await deleteStylist(id);
        loadStylists();
      }
    });
  });
}

// Panel Logic
function openPanel(stylistId = null) {
  editingId = stylistId;
  if (stylistId) {
    panelTitle.textContent = "Edit Stylist";
    saveBtn.textContent = "Save Changes";
    const s = stylists.find(x => x.id === stylistId);
    if (s) {
      inpName.value = s.name || "";
      inpRole.value = s.role || "";
      inpImage.value = s.image || "";
      inpRating.value = s.rating || 5.0;
      inpReviews.value = s.reviews || 0;
    }
  } else {
    panelTitle.textContent = "Add Stylist";
    saveBtn.textContent = "Add Stylist";
    inpName.value = "";
    inpRole.value = "";
    inpImage.value = "";
    inpRating.value = "5.0";
    inpReviews.value = "0";
  }
  panelOverlay.style.display = "flex";
}

function closePanel() {
  panelOverlay.style.display = "none";
}

openAddBtn.addEventListener("click", () => openPanel(null));
closePanelBtn.addEventListener("click", closePanel);
panelOverlay.addEventListener("click", closePanel);

saveBtn.addEventListener("click", async () => {
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  const payload = {
    name: inpName.value,
    role: inpRole.value,
    image: inpImage.value,
    rating: parseFloat(inpRating.value) || 5.0,
    reviews: parseInt(inpReviews.value, 10) || 0
  };

  try {
    if (editingId) {
      await updateStylist(editingId, payload);
    } else {
      await addStylist(payload);
    }
    closePanel();
    loadStylists();
  } catch (error) {
    console.error(error);
    alert("Error saving stylist!");
  } finally {
    saveBtn.disabled = false;
  }
});

const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    if (confirm("Are you sure you want to logout?")) {
      await logoutUser();
      window.location.href = "login.html";
    }
  });
}
