/**
 * App: Terminal
 * Stateful RetroOS shell with command parsing and app integrations.
 */

const TERMINAL_USER = "abhinavkuchhal";
const TERMINAL_HOST = "retro-os";
const TERMINAL_HOME_PATH = "/Users/abhinavkuchhal";
const TERMINAL_OS_VERSION = "2.1";
const TERMINAL_SHELL_VERSION = "2.0";

const terminalState = {
  history: [],
  historyIndex: 0,
  matrixInterval: null,
  currentPath: "~",
  sessionStartedAt: Date.now(),
};

const terminalSocialLinks = [
  {
    key: "site",
    label: "Website",
    fileName: "Website.url",
    url: "https://abhinavkuchhal.com",
    aliases: ["my site", "website", "sandbox"],
  },
  {
    key: "github",
    label: "GitHub",
    fileName: "GitHub.url",
    url: "https://github.com/JustPratiyush",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    fileName: "LinkedIn.url",
    url: "https://www.linkedin.com/in/abhinav-kuchhal/",
  },
  {
    key: "x",
    label: "X",
    fileName: "X.url",
    url: "https://x.com/JustPratiyush",
    aliases: ["twitter"],
  },
  {
    key: "instagram",
    label: "Instagram",
    fileName: "Instagram.url",
    url: "https://www.instagram.com/abhinavkuchhal7/",
  },
  {
    key: "youtube",
    label: "YouTube",
    fileName: "YouTube.url",
    url: "https://www.youtube.com/@abhinavkuchhal",
  },
];

let terminalOutput;
let terminalInput;
let terminalPromptPath;
let matrixCanvas;

const terminalCommands = {
  help: {
    description: "Show all commands or detailed help for one command",
    usage: "help [command]",
    aliases: ["?"],
    examples: ["help", "help open", "help theme"],
    execute(args) {
      const target = args.join(" ").trim();
      return target ? formatCommandHelp(target) : formatHelpOverview();
    },
  },
  man: {
    description: "Alias for help <command>",
    usage: "man <command>",
    examples: ["man ls", "man projects"],
    execute(args) {
      const target = args.join(" ").trim();
      if (!target) {
        return createTextResult(
          'Usage: man <command>\nTry: man open',
          "terminal-error"
        );
      }
      return formatCommandHelp(target);
    },
  },
  clear: {
    description: "Clear the terminal screen",
    usage: "clear",
    aliases: ["cls"],
    execute() {
      displayWelcomeMessage();
      return null;
    },
  },
  ls: {
    description: "List files in the current folder or a target folder",
    usage: "ls [path]",
    aliases: ["dir"],
    examples: ["ls", 'ls "Documents/System Architecture Blueprint"', "ls ~/Projects"],
    execute(args) {
      return listDirectory(args.join(" ").trim() || ".");
    },
  },
  cd: {
    description: "Change the current directory inside the terminal",
    usage: "cd [path]",
    examples: ["cd Desktop", "cd ~/Projects", 'cd "Documents/Album"'],
    execute(args) {
      return changeDirectory(args.join(" ").trim() || "~");
    },
  },
  pwd: {
    description: "Print the current absolute path",
    usage: "pwd",
    execute() {
      return createTextResult(toAbsolutePath(terminalState.currentPath));
    },
  },
  cat: {
    description: "Read a text file or project note",
    usage: "cat <file>",
    examples: ["cat ReadMe.txt", 'cat "01-retro-os-sandbox.txt"', 'cat "GitHub.url"'],
    execute(args) {
      const target = args.join(" ").trim();
      if (!target) {
        return createTextResult(
          'Usage: cat <file>\nTry: cat ReadMe.txt',
          "terminal-error"
        );
      }
      return readTerminalItem(target);
    },
  },
  open: {
    description: "Open an app, file, project, folder, link, or web search",
    usage: "open <target>",
    aliases: ["launch"],
    examples: [
      "open finder",
      "open mail",
      "open github",
      'open "HackYours"',
      'open "system architecture blueprint"',
      'open "retro desktop sandbox inspiration"',
    ],
    execute(args) {
      const target = args.join(" ").trim();
      if (!target) {
        return createTextResult(
          'Usage: open <target>\nTry: open finder',
          "terminal-error"
        );
      }
      return openTerminalTarget(target);
    },
  },
  close: {
    description: "Close an open RetroOS window or popup",
    usage: "close <target>",
    examples: ["close mail", "close finder", "close socials"],
    execute(args) {
      const target = args.join(" ").trim();
      if (!target) {
        return createTextResult(
          'Usage: close <target>\nTry: close mail',
          "terminal-error"
        );
      }
      return closeTerminalTarget(target);
    },
  },
  finder: {
    description: "Open Finder and jump to a RetroOS location",
    usage: "finder [desktop|documents|downloads|album|architecture]",
    examples: ["finder", "finder documents", "finder album"],
    execute(args) {
      return openFinderFromTerminal(args.join(" ").trim());
    },
  },
  projects: {
    description: "List projects or open a specific project",
    usage: "projects [list|open|<number>|<name>]",
    examples: ["projects", "projects 2", 'projects "HackYours"', "projects open"],
    execute(args) {
      return handleProjectsCommand(args);
    },
  },
  mail: {
    description: "Show inbox stats, list messages, or open one",
    usage: "mail [count|list|open <number>|open <query>]",
    aliases: ["inbox"],
    examples: ["mail", "mail list", "mail open 1", 'mail open "rent"'],
    execute(args) {
      return handleMailCommand(args);
    },
  },
  theme: {
    description: "Change the wallpaper from the terminal",
    usage: "theme <classic|alt|next|1-5>",
    aliases: ["wallpaper"],
    examples: ["theme classic", "theme next", "theme 3"],
    execute(args) {
      return handleThemeCommand(args.join(" ").trim());
    },
  },
  socials: {
    description: "List social links or open a specific profile",
    usage: "socials [open|github|linkedin|x|instagram|youtube|site]",
    aliases: ["social"],
    examples: ["socials", "socials open", "socials github"],
    execute(args) {
      return handleSocialsCommand(args);
    },
  },
  history: {
    description: "Show or clear this terminal session's command history",
    usage: "history [clear]",
    aliases: ["hist"],
    examples: ["history", "history clear"],
    execute(args) {
      return handleHistoryCommand(args);
    },
  },
  whoami: {
    description: "Show the active RetroOS user",
    usage: "whoami",
    execute() {
      return createTextResult(
        "abhinavkuchhal\nFrontend engineer building handcrafted retro interfaces."
      );
    },
  },
  date: {
    description: "Show the current local date and time",
    usage: "date",
    execute() {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat(undefined, {
        dateStyle: "full",
        timeStyle: "long",
      });
      return createTextResult(formatter.format(now));
    },
  },
  echo: {
    description: "Print text back to the terminal",
    usage: "echo <text>",
    examples: ['echo "hello retro world"'],
    execute(args) {
      return createTextResult(args.join(" "));
    },
  },
  uname: {
    description: "Show OS information",
    usage: "uname [-a]",
    execute(args) {
      if (args[0] === "-a") {
        return createTextResult(
          `RetroOS ${TERMINAL_OS_VERSION} retrosh ${TERMINAL_SHELL_VERSION} ${toAbsolutePath(
            terminalState.currentPath
          )}`
        );
      }
      return createTextResult("RetroOS");
    },
  },
  uptime: {
    description: "Show how long the current session has been running",
    usage: "uptime",
    execute() {
      return createTextResult(`up ${formatDuration(Date.now() - terminalState.sessionStartedAt)}`);
    },
  },
  neofetch: {
    description: "Display RetroOS system information",
    usage: "neofetch",
    aliases: ["fetch"],
    execute() {
      return buildNeofetchResult();
    },
  },
  about: {
    description: "About the RetroOS operating system sandbox",
    usage: "about",
    execute() {
      return createTextResult(
        [
          `Retro OS v${TERMINAL_OS_VERSION}`,
          "",
          "A product-grade operating system sandbox engineered as a desktop-style browser environment with modular apps and Redis-backed shared features.",
          "The terminal now mirrors the rest of the OS with real window hooks, folder navigation,",
          "project shortcuts, mail summaries, and theme controls.",
        ].join("\n")
      );
    },
  },
  contact: {
    description: "Show profile and contact links",
    usage: "contact",
    aliases: ["links"],
    execute() {
      return createHtmlResult(formatContactLinks());
    },
  },
  details: {
    description: "Show runtime details about the current RetroOS session",
    usage: "details",
    execute() {
      return createTextResult(buildDetailsSummary());
    },
  },
  matrix: {
    description: "Start or stop the matrix mode inside the terminal",
    usage: "matrix [start|stop]",
    examples: ["matrix", "matrix stop"],
    execute(args) {
      const mode = (args[0] || "start").toLowerCase();
      if (mode === "stop") {
        stopMatrixAnimation({ clearOutput: true });
        return createTextResult("Matrix stream stopped.");
      }
      runMatrixAnimation();
      return null;
    },
  },
  sudo: {
    description: "Ask nicely; still no root access",
    usage: "sudo <command>",
    execute(args) {
      if (
        args.join(" ").toLowerCase() === "make me a sandwich"
      ) {
        return createTextResult("Okay.\nJust kidding. No sudo on this machine.");
      }
      return createTextResult(
        "User is not in the sudoers file. This incident will be reported."
      );
    },
  },
  exit: {
    description: "Close the terminal window",
    usage: "exit",
    aliases: ["logout"],
    execute() {
      stopMatrixAnimation({ clearOutput: false });
      closeWindow("terminal");
      return null;
    },
  },
};

const terminalCommandAliases = Object.entries(terminalCommands).reduce(
  (aliases, [name, config]) => {
    (config.aliases || []).forEach((alias) => {
      aliases[alias.toLowerCase()] = name;
    });
    return aliases;
  },
  {}
);

function initTerminal() {
  terminalOutput = document.getElementById("terminalOutput");
  terminalInput = document.getElementById("terminalInput");
  terminalPromptPath = document.querySelector(
    "#terminal .terminal-input-container .terminal-path"
  );

  if (!terminalInput || !terminalOutput) {
    console.error("Terminal elements not found.");
    return;
  }

  terminalInput.addEventListener("keydown", handleTerminalInput);
  updateTerminalPromptPath();
  displayWelcomeMessage();
}

function displayWelcomeMessage() {
  stopMatrixAnimation({ clearOutput: false });
  if (!terminalOutput) return;

  terminalOutput.innerHTML = `
    <div class="terminal-line terminal-boot">Welcome to Retro OS Terminal v${TERMINAL_OS_VERSION}</div>
    <div class="terminal-line terminal-boot">[INFO] Type "help" to explore the shell.</div>
    <div class="terminal-line terminal-boot">[INFO] New commands: cd, cat, open, finder, projects, mail, theme, history.</div>`;
  updateTerminalPromptPath();
  scrollTerminalToBottom();
}

function handleTerminalInput(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    executeCommand();
    return;
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    navigateHistory("up");
    return;
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    navigateHistory("down");
    return;
  }

  if (event.ctrlKey && event.key.toLowerCase() === "l") {
    event.preventDefault();
    displayWelcomeMessage();
    terminalInput.value = "";
    return;
  }

  if (event.key === "Escape") {
    terminalInput.value = "";
  }
}

function executeCommand() {
  const commandText = terminalInput.value.trim();
  if (!commandText) return;

  if (!/^matrix(?:\s|$)/i.test(commandText) && terminalState.matrixInterval) {
    stopMatrixAnimation({ clearOutput: true });
  }

  if (terminalState.history[terminalState.history.length - 1] !== commandText) {
    terminalState.history.push(commandText);
  }
  terminalState.historyIndex = terminalState.history.length;

  const promptPath = terminalState.currentPath;
  appendPromptLine(commandText, promptPath);

  const parsed = tokenizeCommand(commandText);
  if (parsed.error) {
    appendResult(createTextResult(parsed.error, "terminal-error"));
    terminalInput.value = "";
    scrollTerminalToBottom();
    return;
  }

  const [rawCommandName, ...args] = parsed.tokens;
  const resolvedCommand = resolveCommand(rawCommandName);

  if (!resolvedCommand) {
    appendResult(buildUnknownCommandResult(rawCommandName));
    terminalInput.value = "";
    scrollTerminalToBottom();
    return;
  }

  try {
    const result = resolvedCommand.execute(args, {
      rawInput: commandText,
      commandName: resolvedCommand.name,
    });
    appendResult(result);
  } catch (error) {
    console.error("Terminal command failed:", error);
    appendResult(
      createTextResult(
        `Command failed: ${resolvedCommand.name}\n${error.message || "Unknown error"}`,
        "terminal-error"
      )
    );
  }

  terminalInput.value = "";
  updateTerminalPromptPath();
  scrollTerminalToBottom();
}

function navigateHistory(direction) {
  if (terminalState.history.length === 0 || !terminalInput) return;

  if (direction === "up" && terminalState.historyIndex > 0) {
    terminalState.historyIndex -= 1;
    terminalInput.value = terminalState.history[terminalState.historyIndex];
  } else if (direction === "down") {
    if (terminalState.historyIndex < terminalState.history.length - 1) {
      terminalState.historyIndex += 1;
      terminalInput.value = terminalState.history[terminalState.historyIndex];
    } else {
      terminalState.historyIndex = terminalState.history.length;
      terminalInput.value = "";
    }
  }

  setTimeout(() => {
    const end = terminalInput.value.length;
    terminalInput.setSelectionRange(end, end);
  }, 0);
}

function focusTerminal() {
  setTimeout(() => terminalInput?.focus(), 50);
}

function appendPromptLine(commandText, promptPath) {
  if (!terminalOutput) return;

  const line = document.createElement("div");
  line.className = "terminal-line";

  [
    { className: "terminal-user", text: TERMINAL_USER },
    { className: "terminal-prompt", text: "@" },
    { className: "terminal-info", text: TERMINAL_HOST },
    { className: "terminal-prompt", text: ":" },
    { className: "terminal-path", text: promptPath },
    { className: "terminal-prompt", text: "$ " },
    { className: "terminal-command", text: commandText },
  ].forEach((part) => {
    const span = document.createElement("span");
    span.className = part.className;
    span.textContent = part.text;
    line.appendChild(span);
  });

  terminalOutput.appendChild(line);
}

function appendResult(result) {
  if (!result || !terminalOutput) return;

  const line = document.createElement("div");
  line.className = `terminal-line${result.className ? ` ${result.className}` : ""}`;

  if (result.type === "html") {
    line.innerHTML = result.content;
  } else {
    const pre = document.createElement("pre");
    pre.textContent = result.content;
    line.appendChild(pre);
  }

  terminalOutput.appendChild(line);
}

function scrollTerminalToBottom() {
  if (!terminalOutput) return;
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

function updateTerminalPromptPath() {
  if (terminalPromptPath) {
    terminalPromptPath.textContent = terminalState.currentPath;
  }
}

function tokenizeCommand(input) {
  const tokens = [];
  let current = "";
  let quote = null;
  let escaping = false;

  for (const char of input) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === "\\") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (escaping) {
    current += "\\";
  }

  if (quote) {
    return { tokens: [], error: "Unclosed quote in command input." };
  }

  if (current) {
    tokens.push(current);
  }

  return { tokens };
}

function resolveCommand(name) {
  if (!name) return null;

  const normalized = name.toLowerCase();
  const key = terminalCommands[normalized]
    ? normalized
    : terminalCommandAliases[normalized];

  if (!key) return null;
  return { name: key, ...terminalCommands[key] };
}

function buildUnknownCommandResult(commandName) {
  const suggestion = getClosestCommandName(commandName);
  const lines = [`Command not found: ${commandName}`];
  if (suggestion) {
    lines.push(`Did you mean: ${suggestion}?`);
  }
  lines.push('Type "help" to see available commands.');
  return createTextResult(lines.join("\n"), "terminal-error");
}

function getClosestCommandName(commandName) {
  const target = commandName.toLowerCase();
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  Object.keys(terminalCommands).forEach((name) => {
    const distance = levenshteinDistance(target, name);
    if (distance < bestScore) {
      bestScore = distance;
      best = name;
    }
  });

  return bestScore <= 3 ? best : null;
}

function levenshteinDistance(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

function createTextResult(content, className = "") {
  return { type: "text", content, className };
}

function createHtmlResult(content, className = "") {
  return { type: "html", content, className };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const replacements = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return replacements[char];
  });
}

function formatHelpOverview() {
  const commandNames = Object.keys(terminalCommands);
  const longestName = commandNames.reduce(
    (max, name) => Math.max(max, name.length),
    0
  );

  const rows = commandNames
    .map((name) => {
      const padding = " ".repeat(longestName - name.length + 2);
      return `<span class="terminal-command">${escapeHtml(
        name
      )}</span>${padding}${escapeHtml(terminalCommands[name].description)}`;
    })
    .join("\n");

  return createHtmlResult(
    `<pre>Available commands:\n${rows}\n\nUse <span class="terminal-command">help &lt;command&gt;</span> for details.</pre>`
  );
}

function formatCommandHelp(commandName) {
  const resolved = resolveCommand(commandName);
  if (!resolved) {
    return createTextResult(
      `No manual entry for "${commandName}".`,
      "terminal-error"
    );
  }

  const lines = [
    `<span class="terminal-command">${escapeHtml(resolved.name)}</span>`,
    escapeHtml(resolved.description),
    "",
    `<span class="terminal-info">Usage:</span> ${escapeHtml(resolved.usage || resolved.name)}`,
  ];

  if (resolved.aliases?.length) {
    lines.push(
      `<span class="terminal-info">Aliases:</span> ${escapeHtml(
        resolved.aliases.join(", ")
      )}`
    );
  }

  if (resolved.examples?.length) {
    lines.push("");
    lines.push(`<span class="terminal-info">Examples:</span>`);
    resolved.examples.forEach((example) => {
      lines.push(`  <span class="terminal-command">${escapeHtml(example)}</span>`);
    });
  }

  return createHtmlResult(`<pre>${lines.join("\n")}</pre>`);
}

function normalizeLookupValue(value) {
  return String(value)
    .toLowerCase()
    .replace(/\.(app|url|txt|exe|dmg|png|jpg|jpeg|webp)$/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCurrentPathParts() {
  return terminalState.currentPath === "~"
    ? []
    : terminalState.currentPath.slice(2).split("/").filter(Boolean);
}

function buildVirtualPath(parts) {
  return parts.length ? `~/${parts.join("/")}` : "~";
}

function toAbsolutePath(virtualPath) {
  return virtualPath === "~"
    ? TERMINAL_HOME_PATH
    : `${TERMINAL_HOME_PATH}/${virtualPath.slice(2)}`;
}

function createDirectoryEntry(name, options = {}) {
  return { name, type: "directory", ...options };
}

function createFileEntry(name, options = {}) {
  return { name, type: "file", ...options };
}

function createAppEntry(name, options = {}) {
  return { name, type: "app", ...options };
}

function createUrlEntry(name, url, options = {}) {
  return { name, type: "url", url, ...options };
}

function getProjectsDataSafe() {
  return typeof projectsData !== "undefined" ? projectsData : [];
}

function getFinderAssetsSafe(key) {
  if (typeof finderData === "undefined") return [];
  return Array.isArray(finderData[key]) ? finderData[key] : [];
}

function buildProjectFileName(project, index) {
  return `${String(index + 1).padStart(2, "0")}-${slugify(project.title)}.txt`;
}

function getReadMeText() {
  const elements = document.querySelectorAll(
    "#readme-template .content h2, #readme-template .content p"
  );
  const sections = Array.from(elements)
    .map((element) => element.textContent.trim())
    .filter(Boolean);

  if (sections.length) {
    return sections.join("\n\n");
  }

  return [
    "RetrOS - README.txt",
    "-------------------",
    "",
    "Welcome.",
    "",
    "You are currently inside a sandbox operating system",
    "running entirely in your web browser.",
    "",
    "This system contains apps, files, hidden functions,",
    "and several small secrets waiting to be discovered.",
    "",
    "Feel free to explore the desktop, open applications,",
    "inspect folders, and experiment with the environment.",
    "",
    "Some things are obvious.",
    "Some things are not.",
    "",
    "Tip:",
    "Curiosity will reveal more than instructions ever could.",
    "",
    "— System",
  ].join("\n");
}

function formatProjectDetails(project, index) {
  const lines = [
    `${index + 1}. ${project.title}`,
    `Date: ${project.date}`,
    `Technologies: ${project.technologies.join(", ")}`,
    "",
    project.description,
  ];

  if (project.demoUrl !== "#") {
    lines.push("", `Live Demo: ${project.demoUrl}`);
  }

  if (project.codeUrl !== "#") {
    lines.push(`Source Code: ${project.codeUrl}`);
  }

  return lines.join("\n");
}

function resolveProjectReference(query) {
  const projects = getProjectsDataSafe();
  if (!query || !projects.length) return null;

  if (/^\d+$/.test(query)) {
    const index = Number(query) - 1;
    if (projects[index]) {
      return { index, project: projects[index] };
    }
  }

  const normalizedQuery = normalizeLookupValue(query);
  const exactMatch = projects.findIndex((project, index) => {
    return (
      normalizeLookupValue(project.title) === normalizedQuery ||
      normalizeLookupValue(buildProjectFileName(project, index)) === normalizedQuery
    );
  });

  if (exactMatch >= 0) {
    return { index: exactMatch, project: projects[exactMatch] };
  }

  const fuzzyMatch = projects.findIndex((project, index) => {
    return (
      normalizeLookupValue(project.title).includes(normalizedQuery) ||
      normalizeLookupValue(buildProjectFileName(project, index)).includes(normalizedQuery)
    );
  });

  return fuzzyMatch >= 0
    ? { index: fuzzyMatch, project: projects[fuzzyMatch] }
    : null;
}

function getDirectoryEntries(path) {
  if (path === "~") {
    return [
      createDirectoryEntry("Applications"),
      createDirectoryEntry("Desktop"),
      createDirectoryEntry("Documents"),
      createDirectoryEntry("Downloads"),
      createDirectoryEntry("Projects"),
      createFileEntry("ReadMe.txt", {
        reader: getReadMeText,
        opener: () => openReadMe(),
      }),
    ];
  }

  if (path === "~/Applications") {
    return [
      createAppEntry("Finder.app", { opener: () => openWindow("finder") }),
      createAppEntry("Mail.app", { opener: () => openWindow("mail") }),
      createAppEntry("Internet.app", { opener: () => openWindow("internet") }),
      createAppEntry("Music.app", { opener: () => openWindow("music") }),
      createAppEntry("Calculator.app", { opener: () => openWindow("calculator") }),
      createAppEntry("Terminal.app", { opener: () => openWindow("terminal") }),
      createAppEntry("Settings.app", { opener: () => openWindow("settings") }),
      createAppEntry("Guestbook.app", { opener: () => openWindow("guestbook") }),
      createAppEntry("Noticeboard.app", { opener: () => openWindow("noticeboard") }),
      createAppEntry("Trash.app", { opener: () => openWindow("trash") }),
      createAppEntry("Pizza.app", { opener: () => openWindow("coffee") }),
    ];
  }

  if (path === "~/Desktop") {
    return [
      createFileEntry("ReadMe.txt", {
        reader: getReadMeText,
        opener: () => openReadMe(),
      }),
      createAppEntry("Calculator.app", { opener: () => openWindow("calculator") }),
      createAppEntry("Pizza.app", { opener: () => openWindow("coffee") }),
      createUrlEntry("My Site.url", "https://abhinavkuchhal.com"),
      createDirectoryEntry("My Socials", {
        opener: () => openSocialsPopup(),
      }),
    ];
  }

  if (path === "~/Desktop/My Socials") {
    return terminalSocialLinks.map((link) =>
      createUrlEntry(link.fileName, link.url, {
        label: link.label,
      })
    );
  }

  if (path === "~/Documents") {
    return [
      createDirectoryEntry("Album"),
      createDirectoryEntry("System Architecture Blueprint"),
    ];
  }

  if (path === "~/Documents/Album") {
    return getFinderAssetsSafe("album").map((asset) =>
      createFileEntry(asset.label, {
        reader: () =>
          `Image: ${asset.title}\nSource: ${asset.src}\n\nUse "open ${asset.label}" to view it in the Photo Viewer.`,
        opener: () => openPhotoViewer(asset.src, asset.title),
      })
    );
  }

  if (path === "~/Documents/System Architecture Blueprint") {
    return getFinderAssetsSafe("system architecture blueprint").map((asset) =>
      createFileEntry(asset.label, {
        reader: () =>
          `Blueprint: ${asset.title}\nSource: ${asset.src}\n\nUse "open ${asset.label}" to inspect it in the Photo Viewer.`,
        opener: () => openPhotoViewer(asset.src, asset.title),
      })
    );
  }

  if (path === "~/Downloads") {
    if ((window.purgeState || 0) < 2) {
      return [
        createFileEntry("installer.dmg", {
          reader: () =>
            "installer.dmg was flagged by RetroOS Security Monitor.\nUse \"open installer.dmg\" only if you enjoy suspicious software.",
          opener: () => {
            if (typeof handlePurgeAction === "function") {
              handlePurgeAction();
            }
          },
        }),
      ];
    }

    return [
      createFileEntry("PURGE", {
        reader: () =>
          "PURGE is active in Downloads.\nThe system recommends leaving it alone.",
        opener: () => {
          if (typeof handlePurgeAction === "function") {
            handlePurgeAction();
          }
        },
      }),
    ];
  }

  if (path === "~/Projects") {
    return getProjectsDataSafe().map((project, index) =>
      createFileEntry(buildProjectFileName(project, index), {
        reader: () => formatProjectDetails(project, index),
        opener: () => openProjectByIndex(index),
      })
    );
  }

  return null;
}

function findEntryByName(entries, name) {
  const normalizedName = normalizeLookupValue(name);
  return entries.find(
    (entry) => normalizeLookupValue(entry.name) === normalizedName
  );
}

function getPathEntry(path) {
  if (path === "~") {
    return createDirectoryEntry("~");
  }

  const parts = path.slice(2).split("/").filter(Boolean);
  const parentPath = buildVirtualPath(parts.slice(0, -1));
  const parentEntries = getDirectoryEntries(parentPath);
  if (!parentEntries) return null;
  return findEntryByName(parentEntries, parts[parts.length - 1]);
}

function resolvePathTarget(input, options = {}) {
  const rawInput = (input || ".").trim();
  if (!rawInput || rawInput === ".") {
    return {
      path: terminalState.currentPath,
      entry: getPathEntry(terminalState.currentPath),
    };
  }

  let normalizedInput = rawInput;
  if (normalizedInput.startsWith(TERMINAL_HOME_PATH)) {
    normalizedInput = `~${normalizedInput.slice(TERMINAL_HOME_PATH.length)}`;
  }

  if (normalizedInput.startsWith("/") && !normalizedInput.startsWith("~/")) {
    return {
      error: `Path outside ${TERMINAL_HOME_PATH} is not available in RetroOS.`,
    };
  }

  let parts = normalizedInput.startsWith("~") ? [] : getCurrentPathParts();
  const relativeInput = normalizedInput.startsWith("~")
    ? normalizedInput.slice(1)
    : normalizedInput;

  const segments = relativeInput.split("/").filter(Boolean);
  let resolvedEntry = getPathEntry(buildVirtualPath(parts));

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];

    if (segment === ".") {
      continue;
    }

    if (segment === "..") {
      parts = parts.slice(0, -1);
      resolvedEntry = getPathEntry(buildVirtualPath(parts));
      continue;
    }

    const currentPath = buildVirtualPath(parts);
    const currentEntries = getDirectoryEntries(currentPath);
    if (!currentEntries) {
      return { error: `No such file or directory: ${rawInput}` };
    }

    const entry = findEntryByName(currentEntries, segment);
    if (!entry) {
      return { error: `No such file or directory: ${rawInput}` };
    }

    const isLastSegment = i === segments.length - 1;
    if (!isLastSegment && entry.type !== "directory") {
      return { error: `${entry.name}: not a directory` };
    }

    parts.push(entry.name);
    resolvedEntry = entry;
  }

  if (options.mustBeDirectory && resolvedEntry?.type !== "directory") {
    return { error: `${resolvedEntry?.name || rawInput}: not a directory` };
  }

  return {
    path: buildVirtualPath(parts),
    entry: resolvedEntry || getPathEntry(buildVirtualPath(parts)),
  };
}

function listDirectory(pathInput) {
  const resolved = resolvePathTarget(pathInput, { mustBeDirectory: true });
  if (resolved.error) {
    return createTextResult(resolved.error, "terminal-error");
  }

  const entries = getDirectoryEntries(resolved.path) || [];
  if (!entries.length) {
    return createTextResult("This folder is empty.");
  }

  const rows = entries
    .map((entry) => {
      const displayName =
        entry.type === "directory" ? `${entry.name}/` : entry.name;
      const className =
        entry.type === "directory"
          ? "terminal-directory"
          : entry.type === "app"
            ? "terminal-info"
            : "terminal-file";
      return `<span class="${className}">${escapeHtml(displayName)}</span>`;
    })
    .join("\n");

  return createHtmlResult(`<pre>${rows}</pre>`);
}

function changeDirectory(pathInput) {
  const resolved = resolvePathTarget(pathInput, { mustBeDirectory: true });
  if (resolved.error) {
    return createTextResult(resolved.error, "terminal-error");
  }

  terminalState.currentPath = resolved.path;
  updateTerminalPromptPath();
  return createTextResult(toAbsolutePath(resolved.path));
}

function readTerminalItem(target) {
  const resolved = resolvePathTarget(target);
  if (!resolved.error && resolved.entry) {
    if (resolved.entry.type === "directory") {
      return createTextResult(
        `${resolved.entry.name} is a directory.\nUse "ls" or "cd" instead.`,
        "terminal-error"
      );
    }

    if (typeof resolved.entry.reader === "function") {
      return createTextResult(resolved.entry.reader());
    }

    if (resolved.entry.type === "url") {
      return createTextResult(resolved.entry.url);
    }

    return createTextResult(
      `${resolved.entry.name} is not readable as plain text.\nTry: open ${resolved.entry.name}`,
      "terminal-error"
    );
  }

  const projectMatch = resolveProjectReference(target);
  if (projectMatch) {
    return createTextResult(
      formatProjectDetails(projectMatch.project, projectMatch.index)
    );
  }

  const socialMatch = resolveSocialLink(target);
  if (socialMatch) {
    return createTextResult(socialMatch.url);
  }

  return createTextResult(
    resolved.error || `Unable to read: ${target}`,
    "terminal-error"
  );
}

const terminalAppTargets = [
  {
    keys: ["finder"],
    label: "Finder",
    open: () => openWindow("finder"),
    close: () => closeWindow("finder"),
    isOpen: () => isWindowVisible("finder"),
  },
  {
    keys: ["mail", "inbox"],
    label: "Mail",
    open: () => openWindow("mail"),
    close: () => closeWindow("mail"),
    isOpen: () => isWindowVisible("mail"),
  },
  {
    keys: ["internet", "browser", "snoogle"],
    label: "Internet",
    open: () => openWindow("internet"),
    close: () => closeWindow("internet"),
    isOpen: () => isWindowVisible("internet"),
  },
  {
    keys: ["music"],
    label: "Music",
    open: () => openWindow("music"),
    close: () => closeWindow("music"),
    isOpen: () => isWindowVisible("music"),
  },
  {
    keys: ["calculator", "calc"],
    label: "Calculator",
    open: () => openWindow("calculator"),
    close: () => closeWindow("calculator"),
    isOpen: () => isWindowVisible("calculator"),
  },
  {
    keys: ["terminal"],
    label: "Terminal",
    open: () => openWindow("terminal"),
    close: () => closeWindow("terminal"),
    isOpen: () => isWindowVisible("terminal"),
  },
  {
    keys: ["settings"],
    label: "Settings",
    open: () => openWindow("settings"),
    close: () => closeWindow("settings"),
    isOpen: () => isWindowVisible("settings"),
  },
  {
    keys: ["guestbook"],
    label: "Guestbook",
    open: () => openWindow("guestbook"),
    close: () => closeWindow("guestbook"),
    isOpen: () => isWindowVisible("guestbook"),
  },
  {
    keys: ["noticeboard", "notice board"],
    label: "Notice Board",
    open: () => openWindow("noticeboard"),
    close: () => closeWindow("noticeboard"),
    isOpen: () => isWindowVisible("noticeboard"),
  },
  {
    keys: ["trash"],
    label: "Trash",
    open: () => openWindow("trash"),
    close: () => closeWindow("trash"),
    isOpen: () => isWindowVisible("trash"),
  },
  {
    keys: ["pizza", "coffee"],
    label: "Pizza",
    open: () => openWindow("coffee"),
    close: () => closeWindow("coffee"),
    isOpen: () => isWindowVisible("coffee"),
  },
  {
    keys: ["projects", "project"],
    label: "Projects",
    open: () => openProjectsFolder(),
    close: () => closeWindow("projects"),
    isOpen: () => Boolean(document.getElementById("projects")),
  },
  {
    keys: ["readme", "readme.txt"],
    label: "ReadMe.txt",
    open: () => openReadMe(),
    close: () => closeWindow("readme"),
    isOpen: () => Boolean(document.getElementById("readme")),
  },
  {
    keys: ["socials", "my socials"],
    label: "My Socials",
    open: () => openSocialsPopup(),
    close: () => closeSocialsFolder(),
    isOpen: () => isSocialsPopupOpen(),
  },
];

function resolveAppTarget(target) {
  const normalizedTarget = normalizeLookupValue(target);
  return terminalAppTargets.find((appTarget) =>
    appTarget.keys.some((key) => normalizeLookupValue(key) === normalizedTarget)
  );
}

function openTerminalTarget(target) {
  const resolvedPath = resolvePathTarget(target);
  if (!resolvedPath.error && resolvedPath.entry) {
    if (resolvedPath.entry.type === "directory") {
      return openDirectoryPath(resolvedPath.path);
    }

    if (typeof resolvedPath.entry.opener === "function") {
      resolvedPath.entry.opener();
      return createTextResult(`Opened ${resolvedPath.entry.name}.`);
    }
  }

  const specialPath = resolveSpecialPathAlias(target);
  if (specialPath) {
    return openDirectoryPath(specialPath);
  }

  const appTarget = resolveAppTarget(target);
  if (appTarget) {
    appTarget.open();
    return createTextResult(`Opened ${appTarget.label}.`);
  }

  const socialMatch = resolveSocialLink(target);
  if (socialMatch) {
    window.open(socialMatch.url, "_blank", "noopener,noreferrer");
    return createTextResult(`Opened ${socialMatch.label}.`);
  }

  const projectMatch = resolveProjectReference(target);
  if (projectMatch) {
    openProjectByIndex(projectMatch.index);
    return createTextResult(`Opened project: ${projectMatch.project.title}`);
  }

  if (looksLikeUrl(target)) {
    window.open(normalizeExternalUrl(target), "_blank", "noopener,noreferrer");
    return createTextResult(`Opened ${normalizeExternalUrl(target)}.`);
  }

  openInternetSearch(target);
  return createTextResult(`Opening Internet search for "${target}".`);
}

function closeTerminalTarget(target) {
  const appTarget = resolveAppTarget(target);
  if (!appTarget) {
    return createTextResult(`Nothing closeable matched "${target}".`, "terminal-error");
  }

  if (!appTarget.isOpen()) {
    return createTextResult(`${appTarget.label} is not open.`, "terminal-error");
  }

  appTarget.close();
  return createTextResult(`Closed ${appTarget.label}.`);
}

function openFinderFromTerminal(rawLocation) {
  if (rawLocation) {
    const explicitLocation = normalizeFinderLocation(rawLocation);
    if (!explicitLocation) {
      return createTextResult(
        'Unknown Finder location.\nTry: finder documents',
        "terminal-error"
      );
    }

    openWindow("finder");
    renderFinderContent(explicitLocation);
    return createTextResult(
      `Opened Finder: ${formatFinderLocationLabel(explicitLocation)}`
    );
  }

  const location = getFinderLocationForPath(terminalState.currentPath) || "desktop";
  if (!location) {
    return createTextResult(
      'Unknown Finder location.\nTry: finder documents',
      "terminal-error"
    );
  }

  openWindow("finder");
  renderFinderContent(location);
  return createTextResult(`Opened Finder: ${formatFinderLocationLabel(location)}`);
}

function normalizeFinderLocation(value) {
  if (!value) return null;

  const map = {
    desktop: "desktop",
    documents: "documents",
    docs: "documents",
    downloads: "downloads",
    album: "album",
    architecture: "system architecture blueprint",
    blueprint: "system architecture blueprint",
    systemarchitectureblueprint: "system architecture blueprint",
  };

  return map[normalizeLookupValue(value)] || null;
}

function formatFinderLocationLabel(location) {
  if (location === "system architecture blueprint") {
    return "System Architecture Blueprint";
  }
  return location.charAt(0).toUpperCase() + location.slice(1);
}

function getFinderLocationForPath(path) {
  const pathMap = {
    "~": "desktop",
    "~/Desktop": "desktop",
    "~/Documents": "documents",
    "~/Documents/Album": "album",
    "~/Documents/System Architecture Blueprint": "system architecture blueprint",
    "~/Downloads": "downloads",
  };

  return pathMap[path] || null;
}

function resolveSpecialPathAlias(target) {
  const map = {
    desktop: "~/Desktop",
    documents: "~/Documents",
    docs: "~/Documents",
    downloads: "~/Downloads",
    album: "~/Documents/Album",
    architecture: "~/Documents/System Architecture Blueprint",
    blueprint: "~/Documents/System Architecture Blueprint",
    systemarchitectureblueprint: "~/Documents/System Architecture Blueprint",
  };

  return map[normalizeLookupValue(target)] || null;
}

function openDirectoryPath(path) {
  if (path === "~/Projects") {
    openProjectsFolder();
    return createTextResult("Opened Projects.");
  }

  if (path === "~/Desktop/My Socials") {
    openSocialsPopup();
    return createTextResult("Opened My Socials.");
  }

  const finderLocation = getFinderLocationForPath(path);
  if (finderLocation) {
    openWindow("finder");
    renderFinderContent(finderLocation);
    return createTextResult(
      `Opened Finder: ${formatFinderLocationLabel(finderLocation)}`
    );
  }

  return createTextResult(
    `Cannot open ${path} directly.\nUse "cd ${path}" instead.`,
    "terminal-error"
  );
}

function isWindowVisible(id) {
  const element = document.getElementById(id);
  return Boolean(element && getComputedStyle(element).display !== "none");
}

function isSocialsPopupOpen() {
  const popup = document.getElementById("socials-popup");
  return Boolean(popup && getComputedStyle(popup).display !== "none");
}

function openSocialsPopup() {
  const popup = document.getElementById("socials-popup");
  if (!popup || isSocialsPopupOpen()) return;
  if (typeof toggleSocialsFolder === "function") {
    toggleSocialsFolder({ stopPropagation() {} });
  }
}

function openProjectByIndex(index) {
  openProjectsFolder();
  setTimeout(() => {
    if (typeof showProjectDetails === "function") {
      showProjectDetails(index);
    }
  }, 60);
}

function handleProjectsCommand(args) {
  const subcommand = (args[0] || "list").toLowerCase();
  const projects = getProjectsDataSafe();

  if (!projects.length) {
    return createTextResult("No projects are available right now.", "terminal-error");
  }

  if (subcommand === "list") {
    const rows = projects
      .map(
        (project, index) =>
          `${String(index + 1).padStart(2, "0")}  ${project.title}  (${project.date})`
      )
      .join("\n");
    return createTextResult(
      `${rows}\n\nUse "projects <number>" to open one.`
    );
  }

  if (subcommand === "open" && args.length === 1) {
    openProjectsFolder();
    return createTextResult("Opened Projects.");
  }

  const query =
    subcommand === "open" ? args.slice(1).join(" ").trim() : args.join(" ").trim();

  if (!query) {
    openProjectsFolder();
    return createTextResult("Opened Projects.");
  }

  const match = resolveProjectReference(query);
  if (!match) {
    return createTextResult(`No project matched "${query}".`, "terminal-error");
  }

  openProjectByIndex(match.index);
  return createTextResult(`Opened project: ${match.project.title}`);
}

function getMailFoldersSafe() {
  return typeof mailFolders !== "undefined" ? mailFolders : [];
}

function getMailDataSafe() {
  return typeof mailData !== "undefined" ? mailData : {};
}

function getAllMailMessages() {
  const folders = getMailFoldersSafe();
  const data = getMailDataSafe();

  return folders.flatMap((folder) =>
    (data[folder.id] || []).map((mail) => ({
      folderId: folder.id,
      folderLabel: folder.label,
      countsTowardBadge: folder.countsTowardBadge !== false,
      mail,
    }))
  );
}

function getTerminalUnreadMailCount() {
  return getAllMailMessages().filter(
    ({ mail, countsTowardBadge }) => countsTowardBadge && !mail.read
  ).length;
}

function resolveEmailReference(query) {
  const emails = getAllMailMessages();
  if (!query || !emails.length) return null;

  if (/^\d+$/.test(query)) {
    const index = Number(query) - 1;
    if (emails[index]) {
      return { index, ...emails[index] };
    }
  }

  const normalizedQuery = normalizeLookupValue(query);
  const exactIndex = emails.findIndex(({ mail, folderLabel }) => {
    return (
      normalizeLookupValue(mail.subject) === normalizedQuery ||
      normalizeLookupValue(mail.from) === normalizedQuery ||
      normalizeLookupValue(folderLabel) === normalizedQuery
    );
  });

  if (exactIndex >= 0) {
    return { index: exactIndex, ...emails[exactIndex] };
  }

  const fuzzyIndex = emails.findIndex(({ mail, folderLabel }) => {
    return (
      normalizeLookupValue(mail.subject).includes(normalizedQuery) ||
      normalizeLookupValue(mail.from).includes(normalizedQuery) ||
      normalizeLookupValue(folderLabel).includes(normalizedQuery)
    );
  });

  return fuzzyIndex >= 0 ? { index: fuzzyIndex, ...emails[fuzzyIndex] } : null;
}

function openMailMessage(match) {
  openWindow("mail");
  setTimeout(() => {
    if (!match) {
      return;
    }

    if (typeof setActiveMailFolder === "function") {
      setActiveMailFolder(match.folderId);
    }
    if (typeof selectMail === "function") {
      selectMail(match.mail.id);
    }
  }, 80);
}

function handleMailCommand(args) {
  const emails = getAllMailMessages();
  if (!emails.length) {
    return createTextResult("Mail is unavailable right now.", "terminal-error");
  }

  const action = (args[0] || "count").toLowerCase();

  if (action === "count") {
    const unreadCount = getTerminalUnreadMailCount();
    const folderSummary = getMailFoldersSafe()
      .map((folder) => `${folder.label}: ${(getMailDataSafe()[folder.id] || []).length}`)
      .join("\n");
    return createTextResult(
      `Mail contains ${emails.length} messages.\nUnread: ${unreadCount}\n\n${folderSummary}`
    );
  }

  if (action === "list") {
    const rows = emails
      .map(({ mail, folderLabel }, index) => {
        const marker = mail.read ? " " : "*";
        return `${String(index + 1).padStart(2, "0")} [${marker}] [${folderLabel}] ${mail.date}  ${mail.from} - ${mail.subject}`;
      })
      .join("\n");
    return createTextResult(`${rows}\n\nUse "mail open <number>" to read one.`);
  }

  if (action === "open") {
    const query = args.slice(1).join(" ").trim();
    if (!query) {
      openWindow("mail");
      return createTextResult("Opened Mail.");
    }

    const match = resolveEmailReference(query);
    if (!match) {
      return createTextResult(`No email matched "${query}".`, "terminal-error");
    }

    openMailMessage(match);
    return createTextResult(`Opened email: ${match.mail.subject}`);
  }

  const implicitMatch = resolveEmailReference(args.join(" ").trim());
  if (implicitMatch) {
    openMailMessage(implicitMatch);
    return createTextResult(`Opened email: ${implicitMatch.mail.subject}`);
  }

  return createTextResult(
    'Usage: mail [count|list|open <number>|open <query>]',
    "terminal-error"
  );
}

function handleThemeCommand(rawValue) {
  if (!rawValue) {
    return createTextResult(
      `Current theme: ${getCurrentThemeLabel()}\nAvailable: classic, next, 1, 2, 3, 4, 5`
    );
  }

  const value = rawValue.toLowerCase();

  if (value === "classic") {
    setWallpaper("classic");
    return createTextResult("Theme updated: Classic grayscale.");
  }

  if (value === "alt" || value === "next") {
    setWallpaper("alt");
    return createTextResult(`Theme updated: ${getCurrentThemeLabel()}`);
  }

  if (/^[1-5]$/.test(value)) {
    setWallpaper(value);
    return createTextResult(`Theme updated: ${getCurrentThemeLabel()}`);
  }

  return createTextResult(
    'Unknown theme option.\nUse: theme classic | theme next | theme 1-5',
    "terminal-error"
  );
}

function getCurrentThemeLabel() {
  const currentTheme = localStorage.getItem("currentWallpaper") || "1";
  if (currentTheme === "classic") {
    return "Classic";
  }
  if (currentTheme === "custom") {
    return "Custom";
  }
  return `Wallpaper ${currentTheme}`;
}

function handleSocialsCommand(args) {
  if (!args.length) {
    const rows = terminalSocialLinks
      .map(
        (link) =>
          `<span class="terminal-info">${escapeHtml(link.label)}:</span> <a href="${escapeHtml(
            link.url
          )}" target="_blank" rel="noopener noreferrer">${escapeHtml(link.url)}</a>`
      )
      .join("\n");
    return createHtmlResult(`<pre>${rows}</pre>`);
  }

  const target = args.join(" ").trim();
  if (normalizeLookupValue(target) === "open") {
    openSocialsPopup();
    return createTextResult("Opened My Socials.");
  }

  const match = resolveSocialLink(target);
  if (!match) {
    return createTextResult(`No social profile matched "${target}".`, "terminal-error");
  }

  window.open(match.url, "_blank", "noopener,noreferrer");
  return createTextResult(`Opened ${match.label}.`);
}

function resolveSocialLink(target) {
  const normalizedTarget = normalizeLookupValue(target);
  return terminalSocialLinks.find((link) => {
    const aliases = [link.key, link.label, link.fileName, ...(link.aliases || [])];
    return aliases.some(
      (alias) => normalizeLookupValue(alias) === normalizedTarget
    );
  });
}

function handleHistoryCommand(args) {
  if ((args[0] || "").toLowerCase() === "clear") {
    terminalState.history = [];
    terminalState.historyIndex = 0;
    return createTextResult("Command history cleared.");
  }

  if (!terminalState.history.length) {
    return createTextResult("No commands in history yet.");
  }

  const rows = terminalState.history
    .map((item, index) => `${String(index + 1).padStart(2, "0")}  ${item}`)
    .join("\n");

  return createTextResult(rows);
}

function buildNeofetchResult() {
  const terminalWindow = document.getElementById("terminal");
  const resolution =
    terminalWindow && terminalWindow.clientWidth && terminalWindow.clientHeight
      ? `${terminalWindow.clientWidth}x${terminalWindow.clientHeight}`
      : "dynamic";
  const unreadCount = getTerminalUnreadMailCount();

  const lines = [
    "                    .:'",
    "                 _ :'_",
    `              .-:\`/   \\\`:-.        <span class="terminal-user">${escapeHtml(
      TERMINAL_USER
    )}</span><span class="terminal-prompt">@</span><span class="terminal-info">${escapeHtml(
      TERMINAL_HOST
    )}</span>`,
    "             /  :/-. .-\\\\;  \\\\       ---------------------",
    `            /   :| o   o |;   \\\\      <span class="terminal-info">OS:</span> Retro OS v${TERMINAL_OS_VERSION}`,
    `           /   :/ '\\___/' \\\\:   \\\\     <span class="terminal-info">Shell:</span> retrosh ${TERMINAL_SHELL_VERSION}`,
    `          /   :|   '---'   |:   \\\\    <span class="terminal-info">Uptime:</span> ${escapeHtml(
      formatDuration(Date.now() - terminalState.sessionStartedAt)
    )}`,
    `         /   .:| .-'---'-. |:.   \\\\   <span class="terminal-info">Theme:</span> ${escapeHtml(
      getCurrentThemeLabel()
    )}`,
    `        /   .:|/         \\\\|:.    \\\\   <span class="terminal-info">Terminal:</span> RetroTerm`,
    `       /   .: |\\\\  '---'  /| :.    \\\\  <span class="terminal-info">Resolution:</span> ${escapeHtml(
      resolution
    )}`,
    `      /   .:  | '\\\\     /' |  :.    \\\\ <span class="terminal-info">Mail:</span> ${unreadCount} unread`,
    "     /   .:   |  |'---'|  |   :.    \\\\",
    "    /   .:    |  | .-. |  |    :.    \\\\",
    "   /   .:     |  |/   \\\\|  |     :.    \\\\",
    "  /   .:      |  |}   {|  |      :.    \\\\",
    " /   .:       |  ||   ||  |       :.    \\\\",
    "/   .:        |  ||   ||  |        :.    \\\\",
  ];

  return createHtmlResult(`<pre>${lines.join("\n")}</pre>`);
}

function formatContactLinks() {
  return `<pre><span class="terminal-info">Website:</span>  <a href="https://abhinavkuchhal.com" target="_blank" rel="noopener noreferrer">abhinavkuchhal.com</a>
<span class="terminal-info">GitHub:</span>   <a href="https://github.com/JustPratiyush" target="_blank" rel="noopener noreferrer">github.com/JustPratiyush</a>
<span class="terminal-info">LinkedIn:</span> <a href="https://www.linkedin.com/in/abhinav-kuchhal/" target="_blank" rel="noopener noreferrer">linkedin.com/in/abhinav-kuchhal</a>
<span class="terminal-info">X:</span>        <a href="https://x.com/JustPratiyush" target="_blank" rel="noopener noreferrer">x.com/JustPratiyush</a>
<span class="terminal-info">YouTube:</span>  <a href="https://www.youtube.com/@abhinavkuchhal" target="_blank" rel="noopener noreferrer">youtube.com/@abhinavkuchhal</a></pre>`;
}

function buildDetailsSummary() {
  const now = new Date();
  const openWindows = Array.from(document.querySelectorAll(".window"))
    .filter((element) => getComputedStyle(element).display !== "none")
    .map((element) => {
      const title = element.querySelector(".title span")?.textContent?.trim();
      return title || element.id || "Untitled";
    });
  const unreadCount = getTerminalUnreadMailCount();

  return [
    `System Time:  ${now.toLocaleTimeString()}`,
    `System Date:  ${now.toLocaleDateString()}`,
    `Current Dir:  ${toAbsolutePath(terminalState.currentPath)}`,
    `Theme:        ${getCurrentThemeLabel()}`,
    `Uptime:       ${formatDuration(Date.now() - terminalState.sessionStartedAt)}`,
    `Unread Mail:  ${unreadCount}`,
    `Open Windows: ${openWindows.length ? openWindows.join(", ") : "None"}`,
    "Status:       All systems nominal.",
  ].join("\n");
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!parts.length || seconds) parts.push(`${seconds}s`);
  return parts.join(" ");
}

function looksLikeUrl(value) {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value) || /^[^\s]+\.[^\s]+$/.test(value);
}

function normalizeExternalUrl(value) {
  return /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value) ? value : `https://${value}`;
}

function openInternetSearch(target) {
  openWindow("internet");
  setTimeout(() => {
    if (typeof navigateInternet === "function") {
      navigateInternet(target);
      return;
    }

    window.open(
      `https://duckduckgo.com/html/?q=${encodeURIComponent(target)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }, 80);
}

function stopMatrixAnimation({ clearOutput = false } = {}) {
  if (terminalState.matrixInterval) {
    clearInterval(terminalState.matrixInterval);
    terminalState.matrixInterval = null;
  }

  if (matrixCanvas?.parentElement) {
    matrixCanvas.parentElement.removeChild(matrixCanvas);
  }
  matrixCanvas = null;

  if (clearOutput && terminalOutput) {
    terminalOutput.innerHTML = "";
  }
}

function runMatrixAnimation() {
  stopMatrixAnimation({ clearOutput: true });
  if (!terminalOutput) return;

  matrixCanvas = document.createElement("canvas");
  terminalOutput.appendChild(matrixCanvas);

  const context = matrixCanvas.getContext("2d");
  const alphabet =
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポャュョッ";
  const fontSize = 16;
  let rainDrops = [];

  const resizeCanvas = () => {
    if (!matrixCanvas || !terminalOutput) return;
    matrixCanvas.width = terminalOutput.clientWidth;
    matrixCanvas.height = terminalOutput.clientHeight;
    const columns = Math.max(1, Math.floor(matrixCanvas.width / fontSize));
    rainDrops = Array.from({ length: columns }).fill(1);
  };

  resizeCanvas();

  const draw = () => {
    if (!context || !matrixCanvas) return;

    context.fillStyle = "rgba(0, 0, 0, 0.08)";
    context.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    context.fillStyle = "#0F0";
    context.font = `${fontSize}px monospace`;

    rainDrops.forEach((drop, index) => {
      const text = alphabet.charAt(Math.floor(Math.random() * alphabet.length));
      context.fillText(text, index * fontSize, drop * fontSize);

      if (drop * fontSize > matrixCanvas.height && Math.random() > 0.975) {
        rainDrops[index] = 0;
      }

      rainDrops[index] += 1;
    });
  };

  terminalState.matrixInterval = setInterval(draw, 60);
  window.addEventListener("resize", resizeCanvas, { once: true });
}
