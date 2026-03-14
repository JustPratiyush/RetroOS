/**
 * js/apps/finder.js — Finder window app logic.
 * Handles navigation of the Finder sidebar and rendering of file/folder contents.
 */

// --- FILE DATA (add/remove images here, renderFinderContent reads automatically) ---
const finderData = {
  album: [
    { src: "assets/album/Steve with Macintosh.webp", label: "Steve with Macintosh.webp", title: "Steve with Macintosh" },
    { src: "assets/album/goggins.jpg",                label: "goggins.jpg",               title: "goggins" },
    { src: "assets/album/steve with apple.webp",      label: "steve with apple.webp",     title: "steve with apple" },
    { src: "assets/album/steve with mustache.jpg",    label: "steve with mustache.jpg",   title: "steve with mustache" },
  ],
  "system architecture blueprint": [
    { src: "assets/Files/architecture.png", label: "architecture.png", title: "Architecture Blueprint" },
  ],
};

// --- NAVIGATION ---
function selectFinderLocation(location) {
  renderFinderContent(location);
  document.querySelector("#finder .finder-content")?.classList.remove("sidebar-visible");
}

function renderFinderContent(location) {
  const mainContainer = document.querySelector("#finder .finder-main-container");
  if (!mainContainer) return;

  mainContainer.innerHTML = "";
  document.querySelectorAll("#finder .sidebar-item").forEach((item) => {
    item.classList.toggle("active", item.textContent.trim().toLowerCase() === location);
  });

  if (location === "desktop") {
    document.querySelectorAll(".desktop-icon").forEach((icon) => {
      const name = icon.querySelector("span")?.textContent || "Untitled";
      if (icon.classList.contains("android-folder")) {
        return; // Exclude My Socials from Finder
      } else {
        const imgSrc = icon.querySelector("img")?.src || "";
        mainContainer.innerHTML += `<div class="finder-icon" ondblclick="handleFinderClick('${name.replace(/'/g, "\\'")}')"><img src="${imgSrc}" alt="${name}"><span>${name}</span></div>`;
      }
    });
  } else if (location === "documents") {
    mainContainer.innerHTML = `
      <div class="finder-icon folder-icon" ondblclick="handleFinderClick('Album Folder')">
        <img src="assets/icons/folderIcon.webp" alt="Album"><span>Album</span>
      </div>
      <div class="finder-icon folder-icon" ondblclick="handleFinderClick('Architecture Folder')">
        <img src="assets/icons/folderIcon.webp" alt="System Architecture Blueprint"><span>System Architecture Blueprint</span>
      </div>`;
  } else if (finderData[location]) {
    mainContainer.innerHTML = finderData[location].map(({ src, label, title }) =>
      `<div class="finder-icon" ondblclick="openPhotoViewer('${src}', '${title}')">
        <img src="${src}" onerror="this.src='assets/icons/TxtIcon.webp'" alt="${title}">
        <span>${label}</span>
      </div>`
    ).join("");
  } else if (location === "downloads") {
    if ((window.purgeState || 0) < 2) {
      mainContainer.innerHTML = `<div class="finder-icon" ondblclick="handlePurgeAction()">
        <img src="assets/icons/installer.png" alt="installer.dmg"><span>installer.dmg</span></div>`;
    } else {
      mainContainer.innerHTML = `<div class="finder-icon sacrifice-icon" id="sacrifice-app-icon" ondblclick="handlePurgeAction()">
        <img src="assets/icons/sacrifice.png" alt="PURGE"><span>PURGE</span></div>`;
    }
  } else {
    mainContainer.innerHTML = `<p style="color:#555;padding:10px;">This folder is empty.</p>`;
  }
}

// --- CLICK ROUTING ---
function handleFinderClick(name) {
  const map = {
    "ReadMe.txt":         openReadMe,
    "Projects":           openProjectsFolder,
    "Album Folder":       () => renderFinderContent("album"),
    "Architecture Folder": () => renderFinderContent("system architecture blueprint"),
  };
  map[name]?.();
}
