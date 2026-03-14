// js/mail.js - Email handling for RetroOS

// --- INBOX DATA ---
const inboxEmails = [
  {
    from: "RetroOS Security Monitor", sender: "security@retro-os.local",
    subject: "⚠ SECURITY ALERT — Suspicious Application Detected",
    date: "Mar 10, 2026", read: false,
    body: `<strong>Automated Security Notification</strong>

A potentially malicious program has been detected on your system.

File detected: <strong>/Downloads/sacrifice.exe</strong>
Threat classification: <strong>Unknown / High Risk</strong>

This application has requested unusual system permissions and may compromise system stability.

<strong>Recommended Action:</strong> Delete the file immediately from your Downloads folder.

— RetroOS Security Monitor`
  },
  {
    from: "Lela", sender: "lela.personal@mail.com",
    subject: "Why aren't you picking up?",
    date: "Jan 18, 2026", read: false,
    body: `Abhinav,

I've been calling you all evening and you haven't answered.

Are you buried in code again? Just text me back when you see this.

— Lela`
  },
  {
    from: "Mr. Ditkovich", sender: "rent@building-office.com",
    subject: "FINAL NOTICE — Eviction Warning",
    date: "Mar 06, 2026", read: false,
    body: `Abhinav,

You have ignored multiple notices regarding unpaid rent.

If the full balance is not received within <strong>48 hours</strong>, eviction proceedings will begin and your tenancy at <strong>Apartment 3B</strong> will be terminated.

This is the final warning.

<strong>Mr. Ditkovich</strong>
Building Manager`
  },
  {
    from: "NeoTech Labs HR", sender: "hr@neotechlabs.com",
    subject: "Regarding Recent Workplace Conduct",
    date: "Feb 22, 2026", read: false,
    body: `Dear Abhinav,

Over the past few weeks we have received several reports about tension during team discussions.

Some colleagues mentioned that meetings have become uncomfortable due to sudden frustration and raised voices.

We understand deadlines can be stressful, but we expect a respectful work environment for everyone.

Let's discuss this during our next check-in.

<strong>Sarah Mitchell</strong>
HR Department`
  },
  {
    from: "Mr. Ditkovich", sender: "rent@building-office.com",
    subject: "Second Notice — Rent Overdue",
    date: "Feb 18, 2026", read: false,
    body: `Abhinav,

Your rent payment is now <strong>over two weeks late</strong>.

This is the second notice regarding the unpaid balance. Late fees will begin accumulating if the issue is not resolved.

Please handle this immediately.

<strong>Mr. Ditkovich</strong>`
  },
  {
    from: "Sequoia Capital", sender: "deals@sequoiacap.com",
    subject: "RE: Seed Funding Discussion",
    date: "Jan 10, 2026", read: true,
    body: `Hi Abhinav,

We were impressed by your RetroOS presentation last week.

The partners are interested in discussing a potential <strong>seed investment</strong>. We'd like to schedule a call to explore next steps.

Let us know your availability.

<strong>Michael Chen</strong>
Partner, Sequoia Capital`
  },
  {
    from: "Mr. Ditkovich", sender: "rent@building-office.com",
    subject: "Rent Reminder — Apartment 3B",
    date: "Feb 01, 2026", read: true,
    body: `Hello Abhinav,

This is a friendly reminder that the rent for <strong>Apartment 3B</strong> is now due.

Please stop by the office or send the payment within the next few days.

Thank you.

<strong>Mr. Ditkovich</strong>
Building Manager`
  },
  {
    from: "NeoTech Labs HR", sender: "hr@neotechlabs.com",
    subject: "Offer Letter — Lead Frontend Engineer",
    date: "Dec 12, 2025", read: true,
    body: `Dear Abhinav,

We are pleased to offer you the position of <strong>Lead Frontend Engineer</strong> at NeoTech Labs.

Your project <strong>RetroOS</strong> impressed the entire hiring panel and we believe your ideas could shape the future of creative software.

Please reply to confirm your joining date.

<strong>Sarah Mitchell</strong>
Head of HR, NeoTech Labs`
  },
  {
    from: "GitHub Notifications", sender: "noreply@github.com",
    subject: "[RetroOS] ⭐️ Your repo hit 1,000 stars!",
    date: "Jan 03, 2026", read: true,
    body: `Congratulations!

Your repository <strong>RetroOS</strong> just crossed <strong>10,000 stars</strong>.

The developer community is responding extremely positively to your work.

Stats this week:
• 1,200 new stars
• 340 forks
• 19 contributors

Keep building.

— GitHub`
  },
];

// --- INBOX RENDERING ---
function updateMailBadge() {
  const unread = inboxEmails.filter(e => !e.read).length;
  const badge = document.getElementById("dock-mail-badge");
  if (badge) {
    if (unread > 0) {
      badge.textContent = unread;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
      badge.textContent = '';
    }
  }
}

function renderInbox() {
  const listEl = document.getElementById("mail-list");
  if (!listEl) return;
  listEl.innerHTML = inboxEmails.map((email, i) => `
    <div class="mail-list-item ${email.read ? 'read' : 'unread'}" onclick="selectEmail(${i})" id="mail-item-${i}">
      <div class="mail-list-sender">${email.from}</div>
      <div class="mail-list-subject">${email.subject}</div>
      <div class="mail-list-preview">${email.body.replace(/<[^>]*>/g, '').substring(0, 60)}...</div>
      <div class="mail-list-date">${email.date}</div>
    </div>`).join("");
}

function selectEmail(index) {
  const email = inboxEmails[index];
  if (!email) return;

  email.read = true;
  updateMailBadge();

  // Internal app badge (if any)
  const unread = inboxEmails.filter(e => !e.read).length;
  const appBadge = document.getElementById("mail-badge");
  if (appBadge) appBadge.textContent = unread > 0 ? unread : "";

  document.querySelectorAll(".mail-list-item").forEach((item, i) => {
    item.classList.toggle("active", i === index);
    item.classList.toggle("read", inboxEmails[i].read);
    item.classList.toggle("unread", !inboxEmails[i].read);
  });

  const detailEl = document.getElementById("mail-detail");
  if (!detailEl) return;
  detailEl.innerHTML = `
    <div class="mail-detail-header">
      <div class="mail-detail-subject">${email.subject}</div>
      <div class="mail-detail-meta">
        <span class="mail-detail-from">${email.from} &lt;${email.sender}&gt;</span>
        <span class="mail-detail-date">${email.date}</span>
      </div>
    </div>
    <div class="mail-detail-body">${email.body}</div>`;
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  updateMailBadge(); // Set initial badge count

  const origOpen = window.openWindow;
  if (origOpen) {
    window.openWindow = function(id) {
      if (id === 'mail') {
        setTimeout(() => { 
          renderInbox(); 
        }, 500);
      }
      return origOpen.apply(this, arguments);
    };
  }
});
