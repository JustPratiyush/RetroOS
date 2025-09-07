/**
 * App: Trash
 * Handles all logic for the trash can, including the multi-stage easter egg.
 */

// --- STATE MANAGEMENT ---
let trashState = {
  folderDepth: 0,
  dogRevealed: false,
  conversationState: "initial", // Can be 'initial', 'pills', 'final'
  isEmptied: false,
};

const FOLDER_MESSAGES = [
  "DO NOT OPEN",
  "Are you sure?",
  "I'm just joking... or am I?",
  "Seriously, it's for your own good.",
  "You're just wasting your time.",
  "Last chance. Turn back now.",
  "Fine, be that way.",
  "You really want to open this file?",
  "Just one more click...",
];

/**
 * Creates a typewriter effect for a given element.
 * @param {HTMLElement} element - The element to type into.
 * @param {string} text - The text to type out.
 * @param {number} speed - The speed of typing in milliseconds.
 * @param {function} [callback] - An optional function to run after typing is complete.
 */
function typewriterEffect(element, text, speed = 50, callback) {
  if (!element) return;
  let i = 0;
  element.innerHTML = "";
  element.classList.add("typing");

  function type() {
    const char = text.charAt(i);
    // Use innerHTML to correctly render the line break
    if (char === "\n") {
      element.innerHTML += "<br>";
    } else {
      element.innerHTML += char;
    }
    i++;

    if (i < text.length) {
      setTimeout(type, speed);
    } else {
      element.classList.remove("typing");
      if (callback) {
        callback();
      }
    }
  }
  type();
}

/**
 * Main function to render the content of the Trash window based on the current state.
 */
function renderTrashContent() {
  const trashContent = document.getElementById("trashContent");
  if (!trashContent) return;

  trashContent.classList.remove("no-padding");

  if (trashState.isEmptied) {
    // Final state: display the empty message with normal styling.
    trashContent.innerHTML = `<div style="padding: 15px; color: black; text-align: center; height: 100%; display: flex; align-items: center; justify-content: center;">The trash is empty. The secret is gone.</div>`;
    return;
  }

  if (trashState.dogRevealed) {
    trashContent.classList.add("no-padding");

    if (trashState.conversationState === "initial") {
      trashContent.innerHTML = `
         <div class="secret-content revealed">
           <div class="secret-main">
             <div id="guardian-text" class="guardian-text highlight"></div>
             <div class="game-options-container">
               <span class="game-option" onclick="createMessageWindow('Pixel Dog', 'You pet the dog. It wags its tail happily.')">Pet the dog</span>
               <span class="game-option" onclick="talkToDog()">Talk to the dog</span>
               <span class="game-option" onclick="killDog()">Kill the dog</span>
             </div>
           </div>
           <img src="assets/icons/sleeping_dog.webp" alt="Guardian Dog" class="guardian-dog-image">
         </div>`;
      const textElement = document.getElementById("guardian-text");
      typewriterEffect(
        textElement,
        "Woof! You found the guardian. What will you do?"
      );
    } else if (trashState.conversationState === "pills") {
      const message = `The dog looks at you knowingly.\n"The choice is yours... \nSee how deep the rabbit-hole goes."`;
      trashContent.innerHTML = `
        <div class="secret-content revealed">
            <div id="guardian-text" class="guardian-text highlight"></div>
            <div class="pill-stage-container">
                 <img src="assets/icons/wise_dog.webp" alt="Wise Guardian Dog" class="guardian-dog-image wise">
                 <div class="pill-buttons-container" style="opacity: 0;">
                     <div class="pill-option blue" onclick="chooseBluePill()">Take the Blue Pill</div>
                     <div class="pill-option red" onclick="chooseRedPill()">Take the Red Pill</div>
                 </div>
            </div>
        </div>`;
      const textElement = document.getElementById("guardian-text");
      typewriterEffect(textElement, message);

      // After 4 seconds, fade in the pill buttons.
      setTimeout(() => {
        const pillContainer = trashContent.querySelector(
          ".pill-buttons-container"
        );
        if (pillContainer) {
          pillContainer.style.transition = "opacity 0.5s ease-in";
          pillContainer.style.opacity = "1";
        }
      }, 4000);
    } else if (trashState.conversationState === "final") {
      // This state is handled by the choosePill functions directly
    }
  } else {
    // Before the dog is revealed, ensure the window has its default height
    const trashWindow = document.getElementById("trash");
    if (trashWindow) trashWindow.style.height = ""; // Reset height

    const message = FOLDER_MESSAGES[trashState.folderDepth];
    trashContent.innerHTML = `
      <div class="finder-icon" onclick="progressTrashSequence()" style="margin-top:6px;">
        <img src="assets/icons/folderIcon.webp" alt="Secret Folder">
        <span>${message}</span>
      </div>`;
  }
}
/**
 * Called when a user double-clicks a folder. Advances the sequence.
 */
function progressTrashSequence() {
  trashState.folderDepth++;
  if (trashState.folderDepth >= FOLDER_MESSAGES.length) {
    if (!trashState.dogRevealed) {
      closeAllWindows(["trash"]);
    }
    trashState.dogRevealed = true;
  }
  renderTrashContent();
}

/**
 * Changes the state to show the "red pill / blue pill" options and resizes the window.
 */
function talkToDog() {
  trashState.conversationState = "pills";
  const trashWindow = document.getElementById("trash");
  if (trashWindow) {
    trashWindow.style.height = "420px"; // Make window taller for this scene
  }
  renderTrashContent();
}

/**
 * Marks the easter egg as completed. The effect will be visible on next window open.
 */
function endEasterEgg() {
  trashState.isEmptied = true;
}

/**
 * Resets the easter egg and shows a sad message.
 */
function killDog() {
  createMessageWindow(
    "What have you done?",
    "You monster. The guardian is gone forever."
  );
  endEasterEgg();
}

/**
 * The user chose the red pill. Reveals the Konami code in the same window.
 */
function chooseRedPill() {
  trashState.conversationState = "final";
  const trashContent = document.getElementById("trashContent");
  const trashWindow = document.getElementById("trash");
  if (trashWindow) trashWindow.style.height = ""; // Reset height to default

  const message = `The dog nods. "Your reality is a construct. To see behind the veil, you must enter the code. Listen closely..."\n\nUp, Up, Down, Down, Left, Right, Left, Right, B, A\n\n"Now go. Awaken."`;

  trashContent.innerHTML = `<div class="final-message-container" style="background-color: #0d2a0d; padding: 15px; height: 100%; box-sizing: border-box; display: flex; justify-content: center; align-items: center;"><div id="final-message" class="final-message-text highlight"></div></div>`;
  const textElement = document.getElementById("final-message");
  typewriterEffect(textElement, message, 50); // Removed callback
  endEasterEgg(); // Mark as emptied in the background
}

/**
 * The user chose the blue pill. Shows a mundane message in the same window.
 */
function chooseBluePill() {
  trashState.conversationState = "final";
  const trashContent = document.getElementById("trashContent");
  const trashWindow = document.getElementById("trash");
  if (trashWindow) trashWindow.style.height = ""; // Reset height to default

  const message =
    "You take the blue pill. The dog sighs. You suddenly have a strong urge to check your email and organize your files. The moment of strange insight is gone.";

  trashContent.innerHTML = `<div class="final-message-container" style="background-color: #0d2a0d; padding: 15px; height: 100%; box-sizing: border-box; display: flex; justify-content: center; align-items: center;"><div id="final-message" class="final-message-text highlight"></div></div>`;
  const textElement = document.getElementById("final-message");
  typewriterEffect(textElement, message, 50); // Removed callback
  endEasterEgg(); // Mark as emptied in the background
}
