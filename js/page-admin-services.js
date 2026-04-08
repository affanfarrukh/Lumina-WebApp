import { getServices, addService, updateService, deleteService } from "./db.js";
import { requireAdminAuth, logoutUser } from "./auth.js";
import { renderBottomNav } from "./components.js";

// Require admin user
requireAdminAuth();

const tableBody = document.getElementById("servicesTableBody");
const openAddBtn = document.getElementById("openAddBtn");
const panelOverlay = document.getElementById("panelOverlay");
const closePanelBtn = document.getElementById("closePanelBtn");
const sidePanel = document.getElementById("sidePanel");
const backBtn = document.getElementById("backBtn");

const saveBtn = document.getElementById("saveBtn");
const panelTitle = document.getElementById("panelTitle");

// Form Inputs
const inpName = document.getElementById("inpName");
const inpCategory = document.getElementById("inpCategory");
const inpPrice = document.getElementById("inpPrice");
const inpDuration = document.getElementById("inpDuration");
const inpDescription = document.getElementById("inpDescription");
const inpImage = document.getElementById("inpImage");
const inpFeatured = document.getElementById("inpFeatured");

let services = [];
let editingId = null;

// Initialization
window.addEventListener("DOMContentLoaded", async () => {
  renderBottomNav("admin-services.html");
  if (window.lucide) window.lucide.createIcons();
  await loadServices();
});

if (backBtn) {
  backBtn.addEventListener("click", () => {
    window.history.back();
  });
}

async function loadServices() {
  tableBody.innerHTML = `<tr><td colspan="4" class="emptyState">Loading services...</td></tr>`;
  try {
    services = await getServices();
    renderTable();
  } catch (error) {
    console.error("Failed to load services", error);
    tableBody.innerHTML = `<tr><td colspan="4" class="emptyState">Failed to load data.</td></tr>`;
  }
}

function renderTable() {
  tableBody.innerHTML = "";
  if (services.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="4" class="emptyState">No services found. Add one above.</td></tr>`;
    return;
  }

  services.forEach(s => {
    const tr = document.createElement("tr");

    // Replace undefined string with fallback if image is missing
    const imgHtml = s.image
      ? `<img src="${s.image}" alt="${s.name}" class="thumb" />`
      : `<div class="thumbPlaceholder"></div>`;

    tr.innerHTML = `
      <td>${imgHtml}</td>
      <td style="font-weight: 500;">${s.name}</td>
      <td>$${s.price}</td>
      <td>
        <div class="actions">
          <button class="iconBtn edit-btn" title="Edit" data-id="${s.id}">
            <i data-lucide="pencil" style="width: 16px; height: 16px;"></i>
          </button>
          <button class="iconBtn iconBtnDanger delete-btn" title="Delete" data-id="${s.id}">
            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
          </button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  if (window.lucide) window.lucide.createIcons();

  // Attach dynamic event listeners
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      openPanel(id);
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.currentTarget.getAttribute("data-id");
      if (confirm("Delete this service?")) {
        await deleteService(id);
        loadServices();
      }
    });
  });
}

// Panel Logic
function openPanel(serviceId = null) {
  editingId = serviceId;
  if (serviceId) {
    panelTitle.textContent = "Edit Service";
    saveBtn.textContent = "Save Changes";
    const s = services.find(x => x.id === serviceId);
    if (s) {
      inpName.value = s.name || "";
      inpCategory.value = s.category || "Hair";
      inpPrice.value = s.price || 0;
      inpDuration.value = s.duration || 30;
      inpDescription.value = s.description || "";
      inpImage.value = s.image || "";
      inpFeatured.checked = !!s.featured;
    }
  } else {
    panelTitle.textContent = "Add Service";
    saveBtn.textContent = "Add Service";
    inpName.value = "";
    inpCategory.value = "Hair";
    inpPrice.value = "";
    inpDuration.value = "30";
    inpDescription.value = "";
    inpImage.value = "";
    inpFeatured.checked = false;
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
    category: inpCategory.value,
    price: Number(inpPrice.value) || 0,
    duration: Number(inpDuration.value) || 30,
    description: inpDescription.value,
    image: inpImage.value,
    featured: inpFeatured.checked,
    ratings: editingId ? (services.find(s => s.id === editingId)?.ratings || 5.0) : 5.0,
    reviews: editingId ? (services.find(s => s.id === editingId)?.reviews || 0) : 0
  };

  try {
    if (editingId) {
      await updateService(editingId, payload);
    } else {
      await addService(payload);
    }
    closePanel();
    loadServices();
  } catch (error) {
    console.error(error);
    alert("Error saving service!");
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
