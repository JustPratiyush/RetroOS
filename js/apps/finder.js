/**
 * js/apps/finder.js — Finder window app logic.
 * Handles navigation of the Finder sidebar and rendering of file/folder contents.
 */

// --- FILE DATA (add/remove images here, renderFinderContent reads automatically) ---
const finderData = {
  album: [
    { src: "assets/album/Steve with Macintosh.webp", label: "Steve with Macintosh.webp", title: "Steve with Macintosh" },
    { src: "assets/album/goggins.jpg", label: "goggins.jpg", title: "goggins" },
    { src: "assets/album/steve with apple.webp", label: "steve with apple.webp", title: "steve with apple" },
    { src: "assets/album/steve with mustache.jpg", label: "steve with mustache.jpg", title: "steve with mustache" },
  ],
  "system architecture blueprint": [
    { src: "assets/Files/architecture.png", label: "architecture.png", title: "Architecture Blueprint" },
  ],
};

function createFinderIcon({
  src,
  label,
  alt = label,
  action = "",
  target = "",
  title = "",
  classes = [],
  id = "",
  fallbackSrc = "",
  imageStyle = "",
  imageClasses = [],
}) {
  const icon = document.createElement("div");
  icon.className = ["finder-icon", ...classes].join(" ").trim();
  if (id) icon.id = id;
  if (action) icon.dataset.openAction = action;
  if (target) icon.dataset.openTarget = target;
  if (title) icon.dataset.openTitle = title;

  const image = document.createElement("img");
  image.src = src;
  image.alt = alt;
  image.className = imageClasses.join(" ").trim();
  if (imageStyle) {
    image.style.cssText = imageStyle;
  }
  if (fallbackSrc) {
    image.addEventListener("error", () => {
      image.src = fallbackSrc;
    });
  }

  const caption = document.createElement("span");
  caption.textContent = label;

  icon.append(image, caption);
  return icon;
}

function createFinderSocialsIcon(label = "My Socials", action = "socials") {
  const icon = document.createElement("div");
  icon.className = "finder-icon folder-icon finder-socials-folder";
  if (action) icon.dataset.openAction = action;

  const box = document.createElement("div");
  box.className = "android-folder-box";

  const grid = document.createElement("div");
  grid.className = "android-folder-grid";

  [
    { src: "assets/icons/twitter.webp", alt: "Twitter" },
    { src: "assets/icons/instagram.webp", alt: "Instagram" },
    { src: "assets/icons/youtube.webp", alt: "YouTube" },
    { src: "assets/icons/linkedin.webp", alt: "LinkedIn" },
  ].forEach(({ src, alt }) => {
    const image = document.createElement("img");
    image.src = src;
    image.alt = alt;
    grid.appendChild(image);
  });

  const caption = document.createElement("span");
  caption.textContent = label;

  box.appendChild(grid);
  icon.append(box, caption);
  return icon;
}

function clearFinderSelection(activeIcon = null) {
  document.querySelectorAll("#finder .finder-icon.selected").forEach((icon) => {
    icon.classList.toggle("selected", icon === activeIcon);
  });
}

function selectFinderIcon(icon) {
  if (!icon) return;
  clearFinderSelection(icon);
}

function activateFinderIcon(icon, event) {
  if (!icon) return;

  const now = Date.now();
  const lastActivatedAt = Number(icon.dataset.lastActivatedAt || "0");
  if (now - lastActivatedAt < 350) return;

  icon.dataset.lastActivatedAt = String(now);

  activateIconAction(icon.dataset.openAction || "", icon.dataset.openTarget || "", {
    event,
    title: icon.dataset.openTitle || "",
  });
}

function initFinderInteractions() {
  const mainContainer = document.querySelector("#finder .finder-main-container");
  if (!mainContainer || mainContainer.dataset.bound === "true") return;

  mainContainer.dataset.bound = "true";

  mainContainer.addEventListener("click", (e) => {
    const finderWindow = document.getElementById("finder");
    if (finderWindow) bringToFront(finderWindow);

    const icon = e.target.closest(".finder-icon");
    if (!icon || !mainContainer.contains(icon)) {
      clearFinderSelection();
      return;
    }

    selectFinderIcon(icon);
    activateFinderIcon(icon, e);
  });
}

// --- NAVIGATION ---
function selectFinderLocation(location) {
  renderFinderContent(location);
  document.querySelector("#finder .finder-content")?.classList.remove("sidebar-visible");
}

function renderFinderContent(location) {
  const mainContainer = document.querySelector("#finder .finder-main-container");
  if (!mainContainer) return;

  mainContainer.innerHTML = "";
  clearFinderSelection();

  document.querySelectorAll("#finder .sidebar-item").forEach((item) => {
    item.classList.toggle("active", item.textContent.trim().toLowerCase() === location);
  });

  if (location === "desktop") {
    document.querySelectorAll(".desktop-icon").forEach((icon) => {
      if (icon.classList.contains("android-folder")) {
        const socialsLabel = icon.querySelector("span")?.textContent || "My Socials";
        mainContainer.appendChild(
          createFinderSocialsIcon(
            socialsLabel,
            icon.dataset.openAction || "socials"
          )
        );
        return;
      }

      const name = icon.querySelector("span")?.textContent || "Untitled";
      const desktopImage = icon.querySelector("img");
      const imgSrc = desktopImage?.getAttribute("src") || "";

      mainContainer.appendChild(
        createFinderIcon({
          src: imgSrc,
          label: name,
          alt: name,
          action: icon.dataset.openAction || "",
          target: icon.dataset.openTarget || "",
          imageStyle: desktopImage?.getAttribute("style") || "",
          imageClasses: desktopImage?.className
            ? desktopImage.className.split(/\s+/).filter(Boolean)
            : [],
        })
      );
    });
  } else if (location === "documents") {
    mainContainer.append(
      createFinderIcon({
        src: "assets/icons/folderIcon.webp",
        label: "Album",
        alt: "Album",
        action: "finder-location",
        target: "album",
        classes: ["folder-icon"],
      }),
      createFinderIcon({
        src: "assets/icons/folderIcon.webp",
        label: "System Architecture Blueprint",
        alt: "System Architecture Blueprint",
        action: "finder-location",
        target: "system architecture blueprint",
        classes: ["folder-icon"],
      })
    );
  } else if (finderData[location]) {
    finderData[location].forEach(({ src, label, title }) => {
      mainContainer.appendChild(
        createFinderIcon({
          src,
          label,
          alt: title,
          action: "photo",
          target: src,
          title,
          fallbackSrc: "assets/icons/TxtIcon.webp",
        })
      );
    });
  } else if (location === "downloads") {
    const purgeState = window.purgeState || 0;
    const isPurgeReady = purgeState >= 2;

    mainContainer.appendChild(
      createFinderIcon({
        src: isPurgeReady ? "assets/icons/sacrifice.png" : "assets/icons/installer.png",
        label: isPurgeReady ? "PURGE" : "installer.dmg",
        alt: isPurgeReady ? "PURGE" : "installer.dmg",
        action: "purge",
        classes: isPurgeReady ? ["sacrifice-icon"] : [],
        id: isPurgeReady ? "sacrifice-app-icon" : "",
      })
    );
  } else {
    const emptyState = document.createElement("p");
    emptyState.style.cssText = "color:#555;padding:10px;";
    emptyState.textContent = "This folder is empty.";
    mainContainer.appendChild(emptyState);
  }
}
