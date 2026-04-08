// js/components.js
import { onAuthStateChange } from "./auth.js";

/**
 * Creates and injects the bottom navigation into the designated container
 * @param {string} activePath - The current path, e.g., "/", "/services.html", etc.
 */
export function renderBottomNav(activePath) {
  const baseNavItems = [
    { name: "Home", href: "index.html", icon: "home" },
    { name: "Services", href: "services.html", icon: "search" },
    { name: "Bookings", href: "bookings.html", icon: "calendar-heart" },
    { name: "Profile", href: "profile.html", icon: "user" },
  ];

  // If we are at root, equivalent to index.html
  if (activePath === "/" || activePath === "") {
    activePath = "index.html";
  }

  const nav = document.createElement("nav");
  nav.className = "bottomNav";

  const appContainer = document.querySelector("#app") || document.body;
  if (appContainer) {
    appContainer.classList.add("has-bottom-nav");
    appContainer.appendChild(nav);
  }

  function renderNavItems(navItems) {
    nav.innerHTML = "";
    navItems.forEach((item) => {
      const isActive = activePath.includes(item.href) || 
                       (activePath === "index.html" && item.href === "index.html");

      const a = document.createElement("a");
      a.href = item.href;
      a.className = `navItem ${isActive ? "active" : ""}`;

      a.innerHTML = `
        <div class="iconWrapper">
          <i data-lucide="${item.icon}"></i>
          ${isActive ? '<span class="dot"></span>' : ''}
        </div>
        <span class="label">${item.name}</span>
      `;

      nav.appendChild(a);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Render initial without admin
  renderNavItems(baseNavItems);

  // Re-render when auth changes
  onAuthStateChange(({ user }) => {
    if (user && user.email === "aaazann@gmail.com") {
      const adminNavItems = [
        baseNavItems[0], // Home
        baseNavItems[1], // Services
        { name: "Admin", href: "admin.html", icon: "shield" },
        baseNavItems[2], // Bookings
        baseNavItems[3], // Profile
      ];
      renderNavItems(adminNavItems);
    }
  });
}
