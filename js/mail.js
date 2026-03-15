// js/mail.js - Email handling for RetroOS

const mailFolders = [
  { id: "inbox", label: "Inbox", countsTowardBadge: true },
  { id: "important", label: "Important", countsTowardBadge: true },
  { id: "spam", label: "Spam", countsTowardBadge: false },
  { id: "deleted", label: "Deleted", countsTowardBadge: false },
];

const mailData = {
  inbox: [
    {
      id: "security-monitor",
      from: "RetroOS Security Monitor",
      sender: "security@retro-os.local",
      subject: "SECURITY ALERT - Suspicious Application Detected",
      date: "Mar 10, 2026",
      read: false,
      body: `<strong>Automated Security Notification</strong>

A potentially malicious program has been detected on your system.

File detected: <strong>/Downloads/sacrifice.exe</strong>
Threat classification: <strong>Unknown / High Risk</strong>

This application has requested unusual system permissions and may compromise system stability.

<strong>Recommended Action:</strong> Delete the file immediately from your Downloads folder.

- RetroOS Security Monitor`,
    },
    {
      id: "lela-check-in",
      from: "Lela",
      sender: "lela.personal@mail.com",
      subject: "Why aren't you picking up?",
      date: "Jan 18, 2026",
      read: false,
      body: `Abhinav,

I've been calling you all evening and you haven't answered.

Are you buried in code again? Just text me back when you see this.

- Lela`,
    },
    {
      id: "ditkovich-final",
      from: "Mr. Ditkovich",
      sender: "rent@building-office.com",
      subject: "FINAL NOTICE - Eviction Warning",
      date: "Mar 06, 2026",
      read: false,
      body: `Abhinav,

You have ignored multiple notices regarding unpaid rent.

If the full balance is not received within <strong>48 hours</strong>, eviction proceedings will begin and your tenancy at <strong>Apartment 3B</strong> will be terminated.

This is the final warning.

<strong>Mr. Ditkovich</strong>
Building Manager`,
    },
    {
      id: "hr-conduct",
      from: "NeoTech Labs HR",
      sender: "hr@neotechlabs.com",
      subject: "Regarding Recent Workplace Conduct",
      date: "Feb 22, 2026",
      read: false,
      body: `Dear Abhinav,

Over the past few weeks we have received several reports about tension during team discussions.

Some colleagues mentioned that meetings have become uncomfortable due to sudden frustration and raised voices.

We understand deadlines can be stressful, but we expect a respectful work environment for everyone.

Let's discuss this during our next check-in.

<strong>Sarah Mitchell</strong>
HR Department`,
    },
    {
      id: "ditkovich-second",
      from: "Mr. Ditkovich",
      sender: "rent@building-office.com",
      subject: "Second Notice - Rent Overdue",
      date: "Feb 18, 2026",
      read: true,
      body: `Abhinav,

Your rent payment is now <strong>over two weeks late</strong>.

This is the second notice regarding the unpaid balance. Late fees will begin accumulating if the issue is not resolved.

Please handle this immediately.

<strong>Mr. Ditkovich</strong>`,
    },
  ],
  important: [
    {
      id: "sequoia-follow-up",
      from: "Sequoia Capital",
      sender: "deals@sequoiacap.com",
      subject: "RE: Seed Funding Discussion",
      date: "Jan 10, 2026",
      read: false,
      body: `Hi Abhinav,

We were impressed by your RetroOS presentation last week.

The partners are interested in discussing a potential <strong>seed investment</strong>. We'd like to schedule a call to explore next steps.

Let us know your availability.

<strong>Michael Chen</strong>
Partner, Sequoia Capital`,
    },
    {
      id: "neotech-offer",
      from: "NeoTech Labs HR",
      sender: "hr@neotechlabs.com",
      subject: "Offer Letter - Lead Frontend Engineer",
      date: "Dec 12, 2025",
      read: true,
      body: `Dear Abhinav,

We are pleased to offer you the position of <strong>Lead Frontend Engineer</strong> at NeoTech Labs.

Your project <strong>RetroOS</strong> impressed the entire hiring panel and we believe your ideas could shape the future of creative software.

Please reply to confirm your joining date.

<strong>Sarah Mitchell</strong>
Head of HR, NeoTech Labs`,
    },
    {
      id: "github-stars",
      from: "GitHub Notifications",
      sender: "noreply@github.com",
      subject: "[RetroOS] Your repo hit 10,000 stars!",
      date: "Jan 03, 2026",
      read: false,
      body: `Congratulations!

Your repository <strong>RetroOS</strong> just crossed <strong>10,000 stars</strong>.

The developer community is responding extremely positively to your work.

Stats this week:
- 1,200 new stars
- 340 forks
- 19 contributors

Keep building.

- GitHub`,
    },
  ],
  spam: [
    {
      id: "lottery-scam",
      from: "HyperLink Mega Lottery",
      sender: "winner@hyperlink-lottery.biz",
      subject: "You won 4,000,000 credits overnight",
      date: "Mar 05, 2026",
      read: false,
      body: `Dear Lucky Winner,

You have been selected for an urgent prize release from the HyperLink Mega Lottery.

To claim your reward, send your full bank details, passport scan, and favorite pizza topping immediately.

Failure to respond in 24 hours will forfeit your winnings forever.`,
    },
    {
      id: "royal-transfer",
      from: "Prince Adewale",
      sender: "transfer@royalvault.example",
      subject: "Need trusted account for a private transfer",
      date: "Feb 14, 2026",
      read: true,
      body: `My Dear Friend,

I require your assistance to move a confidential inheritance out of a government vault.

Please reply with your account information and a small processing fee so we may both become rich in peace.`,
    },
  ],
  deleted: [
    {
      id: "newsletter-retro-times",
      from: "Retro Times Weekly",
      sender: "newsletter@retrotimes.press",
      subject: "This Week in Old-School Interfaces",
      date: "Mar 02, 2026",
      read: true,
      body: `This issue was moved to deleted mail.

Highlights included:
- CRT-inspired product launches
- A profile of classic icon designers
- A roundup of the loudest mechanical keyboards

You can restore it later if you change your mind.`,
    },
    {
      id: "coupon-pizza",
      from: "Pizza Planet Deals",
      sender: "offers@pizzaplanet.example",
      subject: "Two slices free with your next order",
      date: "Feb 09, 2026",
      read: true,
      body: `Promotional mail removed from the main view.

Offer code: <strong>RETROCHEESE</strong>

Valid until the next cosmic event or whenever the cashier says no.`,
    },
    {
      id: "build-log",
      from: "CI Pipeline",
      sender: "ci@retro-os.local",
      subject: "Nightly Build Log Attached",
      date: "Jan 27, 2026",
      read: true,
      body: `Automated build report moved to deleted mail.

Status:
- Unit checks passed
- Asset compression finished
- One flaky snapshot ignored

Restore if you need the full log.`,
    },
  ],
};

let activeMailFolder = "inbox";
const selectedMailByFolder = {};

function findMail(folderId, mailId) {
  if (!mailId || !mailData[folderId]) {
    return null;
  }

  return mailData[folderId].find((mail) => mail.id === mailId) || null;
}

function getFolderMeta(folderId) {
  return mailFolders.find((folder) => folder.id === folderId) || null;
}

function getFolderMail(folderId) {
  return mailData[folderId] || [];
}

function initializeMailSelection() {
  mailFolders.forEach((folder) => {
    selectedMailByFolder[folder.id] = getFolderMail(folder.id)[0]?.id || null;
  });
}

function getSelectedMail(folderId) {
  const selectedMailId = selectedMailByFolder[folderId];
  const currentMail = findMail(folderId, selectedMailId);
  if (currentMail) {
    return currentMail;
  }

  const fallbackMail = getFolderMail(folderId)[0] || null;
  selectedMailByFolder[folderId] = fallbackMail ? fallbackMail.id : null;
  return fallbackMail;
}

function getUnreadCount() {
  return mailFolders.reduce((total, folder) => {
    if (!folder.countsTowardBadge) {
      return total;
    }

    return total + getFolderMail(folder.id).filter((mail) => !mail.read).length;
  }, 0);
}

function updateMailBadge() {
  const unread = getUnreadCount();
  const badge = document.getElementById("dock-mail-badge");
  if (!badge) {
    return;
  }

  if (unread > 0) {
    badge.textContent = unread;
    badge.style.display = "flex";
    return;
  }

  badge.textContent = "";
  badge.style.display = "none";
}

function renderMailTabs() {
  document.querySelectorAll(".mail-tab").forEach((button) => {
    const isActive = button.dataset.folder === activeMailFolder;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function renderMailList() {
  const listEl = document.getElementById("mail-list");
  if (!listEl) {
    return;
  }

  const currentMail = getFolderMail(activeMailFolder);
  const selectedMail = getSelectedMail(activeMailFolder);

  if (!currentMail.length) {
    const folderLabel = getFolderMeta(activeMailFolder)?.label || "folder";
    listEl.innerHTML = `<div class="mail-empty-state">No mail in ${folderLabel.toLowerCase()}.</div>`;
    return;
  }

  listEl.innerHTML = currentMail
    .map((mail) => {
      const activeClass = selectedMail && selectedMail.id === mail.id ? "active" : "";
      const readState = mail.read ? "read" : "unread";

      return `
        <button
          type="button"
          class="mail-list-item ${readState} ${activeClass}"
          data-mail-id="${mail.id}"
        >
          <span class="mail-list-sender">${mail.from}</span>
          <span class="mail-list-subject">${mail.subject}</span>
          <span class="mail-list-date">${mail.date}</span>
        </button>
      `;
    })
    .join("");
}

function renderMailDetail() {
  const detailEl = document.getElementById("mail-detail");
  if (!detailEl) {
    return;
  }

  const selectedMail = getSelectedMail(activeMailFolder);
  if (!selectedMail) {
    detailEl.innerHTML = `<div class="mail-detail-placeholder">Select an email to read.</div>`;
    return;
  }

  detailEl.innerHTML = `
    <div class="mail-detail-panel">
      <div class="mail-detail-header">
        <h2 class="mail-detail-subject">${selectedMail.subject}</h2>
        <div class="mail-detail-meta">
          <div class="mail-detail-from">
            <span class="mail-detail-from-name">${selectedMail.from}</span>
            <span class="mail-detail-from-address">&lt;${selectedMail.sender}&gt;</span>
          </div>
          <span class="mail-detail-date">${selectedMail.date}</span>
        </div>
      </div>
      <div class="mail-detail-body">${selectedMail.body}</div>
    </div>
  `;
}

function renderMailApp() {
  renderMailTabs();
  renderMailList();
  renderMailDetail();
  updateMailBadge();
}

function setActiveMailFolder(folderId) {
  if (!mailData[folderId]) {
    return;
  }

  activeMailFolder = folderId;
  if (!findMail(folderId, selectedMailByFolder[folderId])) {
    selectedMailByFolder[folderId] = getFolderMail(folderId)[0]?.id || null;
  }

  renderMailApp();
}

function selectMail(mailId) {
  const mail = findMail(activeMailFolder, mailId);
  if (!mail) {
    return;
  }

  selectedMailByFolder[activeMailFolder] = mailId;
  mail.read = true;
  renderMailApp();
}

function handleMailTabClick(event) {
  const tab = event.target.closest(".mail-tab");
  if (!tab) {
    return;
  }

  setActiveMailFolder(tab.dataset.folder);
}

function handleMailListClick(event) {
  const item = event.target.closest(".mail-list-item");
  if (!item) {
    return;
  }

  selectMail(item.dataset.mailId);
}

document.addEventListener("DOMContentLoaded", () => {
  initializeMailSelection();

  const tabsEl = document.getElementById("mail-tabs");
  const listEl = document.getElementById("mail-list");

  tabsEl?.addEventListener("click", handleMailTabClick);
  listEl?.addEventListener("click", handleMailListClick);

  renderMailApp();
});
