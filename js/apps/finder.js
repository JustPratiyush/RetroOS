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
    { src: "assets/System_Architecture_Blueprint/Javascript hell, I should have used React. .png", label: "Javascript hell...", title: "Javascript hell" },
    { src: "assets/System_Architecture_Blueprint/Macintosh OS 2.webp", label: "Macintosh OS 2.webp", title: "Macintosh OS 2" },
    { src: "assets/System_Architecture_Blueprint/macintosh OS 1.png",  label: "macintosh OS 1.png",  title: "macintosh OS 1" },
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
        const thumbs = Array.from(icon.querySelectorAll(".android-folder-grid img"))
          .map(img => `<img src="${img.src}" style="width:14px;height:14px;object-fit:contain;border-radius:3px;" />`)
          .join("");
        mainContainer.innerHTML += `<div class="finder-icon" onclick="toggleSocialsFolder(event)">
          <div style="width:64px;height:64px;background:#e0e0e0;border:2px solid #999;border-radius:14px;display:grid;grid-template-columns:1fr 1fr;gap:3px;padding:6px;box-sizing:border-box;margin:0 auto;box-shadow:2px 2px 0 rgba(0,0,0,0.15);">${thumbs}</div>
          <span>${name}</span></div>`;
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
