/**
 * App: Trash
 * Handles all logic for the trash can, including the multi-stage easter egg.
 */

// --- STATE MANAGEMENT ---
// This object will track the user's progress through the easter egg.
let trashState = {
  folderDepth: 0,
  dogRevealed: false,
  conversationState: "initial", // Can be 'initial' or 'pills'
  isEmptied: false,
};

// The sequence of folder names the user will click through.
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
 * Main function to render the content of the Trash window based on the current state.
 */
/**
 * Main function to render the content of the Trash window based on the current state.
 */
function renderTrashContent() {
  const trashContent = document.getElementById("trashContent");
  if (!trashContent) return;

  if (trashState.isEmptied) {
    trashContent.innerHTML = `<div style="padding:12px;">The trash is empty. The secret is gone.</div>`;
    return;
  }

  if (trashState.dogRevealed) {
    // Once the dog is revealed, show different options based on the conversation state.
    if (trashState.conversationState === "initial") {
      trashContent.innerHTML = `
        <div class="secret-content revealed">
          <img src="assets/icons/blogs.webp" alt="Guardian Dog" style="width: 70px; margin-bottom: 10px;">
          <span class="highlight">Woof! You found the guardian. What will you do?</span>
          <div class="game-options-container">
            <span class="game-option" onclick="createMessageWindow('Pixel Dog', 'You pet the dog. It wags its tail happily.')">Pet the dog</span>
            <span class="game-option" onclick="talkToDog()">Talk to the dog</span>
            <span class="game-option" onclick="killDog()">Kill the dog</span>
          </div>
        </div>`;
    } else if (trashState.conversationState === "pills") {
      trashContent.innerHTML = `
        <div class="secret-content revealed">
          <img src="assets/icons/blogs.webp" alt="Guardian Dog" style="width: 70px; margin-bottom: 10px;">
          <span class="highlight">The dog looks at you knowingly. "The choice is yours... See how deep the rabbit-hole goes."</span>
          <div class="game-options-container">
              <span class="game-option" onclick="chooseBluePill()">Take the Blue Pill</span>
              <span class="game-option" onclick="chooseRedPill()">Take the Red Pill</span>
          </div>
        </div>`;
    }
  } else {
    // Display the next folder in the sequence.
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
    // Check if the dog is being revealed for the first time
    if (!trashState.dogRevealed) {
      // Close all other windows, keeping the 'trash' window open
      closeAllWindows(["trash"]);
    }
    trashState.dogRevealed = true;
  }
  renderTrashContent(); // Re-render the trash window with the new state
}

/**
 * Changes the state to show the "red pill / blue pill" options.
 */
function talkToDog() {
  trashState.conversationState = "pills";
  renderTrashContent();
}

/**
 * NEW FUNCTION: Ends the easter egg by emptying the trash.
 */
function endEasterEgg() {
  trashState.isEmptied = true;
  renderTrashContent();
}

/**
 * Resets the easter egg and shows a sad message. This is ONLY for the "Kill" option.
 */
function killDog() {
  createMessageWindow(
    "What have you done?",
    "You monster. The guardian is gone forever."
  );
  // Now call the separate function to end the sequence
  endEasterEgg();
}

/**
 * The user chose the red pill. Reveal the Konami code.
 */
function chooseRedPill() {
  const message = `The dog nods. "Your reality is a construct. To see behind the veil, you must enter the code. Listen closely..."
    <br><br>
    <strong>Up, Up, Down, Down, Left, Right, Left, Right, B, A</strong>
    <br><br>
    "Now go. Awaken."`;
  createMessageWindow("The Truth", message);
  // After revealing, the dog vanishes without the "monster" message.
  endEasterEgg();
}

/**
 * The user chose the blue pill. Show a mundane message.
 */
function chooseBluePill() {
  createMessageWindow(
    "Ignorance is Bliss",
    "You take the blue pill. The dog sighs. You suddenly have a strong urge to check your email and organize your files. The moment of strange insight is gone."
  );
  // The dog also vanishes without the "monster" message.
  endEasterEgg();
}
