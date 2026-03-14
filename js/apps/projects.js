/**
 * js/apps/projects.js — Projects window app logic.
 * Handles the Projects folder window, sidebar, and project detail display.
 */

// --- DATA ---
const projectsData = [
  {
    title: "Retro OS Portfolio",
    description: "The interactive portfolio website you are currently viewing, inspired by classic MacOS.",
    date: "Aug 23, 2025",
    technologies: ["HTML5", "CSS3", "JavaScript"],
    demoUrl: "#", codeUrl: "#",
  },
  {
    title: "HackYours",
    description: "A Fullstack AI Powered Hackathon Guide. Helps ideate and create roadmaps for hackathon competitions.",
    date: "March 15, 2025",
    technologies: ["Frontend", "UX/UI", "Photoshop"],
    demoUrl: "https://hackyours.raghavkatta.xyz/",
    codeUrl: "https://github.com/raghavxkatta/HackYours-BinaryBrains",
  },
  {
    title: "Causeway",
    description: "UX/UI concept for an app encouraging volunteering through community rewards.",
    date: "Feb 28, 2024",
    technologies: ["Figma"],
    demoUrl: "https://www.figma.com/design/qTIFz2HWxLFwJiPy1Xgz6J/Causeway-App?node-id=0-1",
    codeUrl: "#",
  },
  {
    title: "AI Medical Assistant",
    description: "AI tool offering potential diagnoses, causes, and recovery advice.",
    date: "Nov 15, 2024",
    technologies: ["Python", "Gemini API", "Rag"],
    demoUrl: "#",
    codeUrl: "https://github.com/JustPratiyush/AI-Powered-Medical-Assistant",
  },
  {
    title: "Old Personal Website",
    description: "My primary personal portfolio website showcasing my skills, projects, and professional journey.",
    date: "Jun 22, 2025",
    technologies: ["Vanilla Frontend"],
    demoUrl: "https://www.oldportfolio.abhinavkuchhal.com",
    codeUrl: "#",
  },
];

// --- WINDOW MANAGEMENT ---
function openReadMe() {
  const existing = document.getElementById("readme");
  if (existing) { bringToFront(existing); return; }
  createWindowFromTemplate("readme-template", "readme-container");
}

function openProjectsFolder() {
  const existing = document.getElementById("projects");
  if (existing) { bringToFront(existing); return; }

  const win = createWindowFromTemplate("projects-template", "projects-container");
  if (!win) return;

  const sidebar = win.querySelector(".projects-sidebar");
  if (sidebar) {
    sidebar.innerHTML = projectsData.map((p, i) =>
      `<div class="sidebar-project-item" onclick="selectProject(${i})"><h4>${p.title}</h4><p>${p.date}</p></div>`
    ).join("");
  }

  const toggleBtn = win.querySelector(".projects-toggle-btn");
  const contentArea = win.querySelector(".projects-window-content");
  if (toggleBtn && contentArea) {
    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      contentArea.classList.toggle("sidebar-visible");
    });
  }

  showProjectDetails(0);
}

function selectProject(index) {
  showProjectDetails(index);
  document.querySelector("#projects .projects-window-content")?.classList.remove("sidebar-visible");
}

function showProjectDetails(index) {
  const project = projectsData[index];
  const detailsContainer = document.querySelector("#projects .project-details-container");
  if (!project || !detailsContainer) return;

  document.querySelectorAll("#projects .sidebar-project-item").forEach((item, i) => {
    item.classList.toggle("active", i === index);
  });

  detailsContainer.innerHTML = `
    <h2 class="project-title">${project.title}</h2>
    <p class="project-date">${project.date}</p>
    <p class="project-description">${project.description}</p>
    <div class="project-tech">${project.technologies.map(t => `<span>${t}</span>`).join("")}</div>
    <div class="project-buttons">
      ${project.demoUrl !== "#" ? `<a href="${project.demoUrl}" target="_blank" class="btn-retro btn-demo">Live Demo</a>` : ""}
      ${project.codeUrl !== "#" ? `<a href="${project.codeUrl}" target="_blank" class="btn-retro btn-code">Source Code</a>` : ""}
    </div>`;
}
