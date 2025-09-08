/**
 * App: Trash
 * Handles all logic for the trash can, including the multi-stage easter egg.
 */

// --- STATE MANAGEMENT ---
let trashState = {
  folderDepth: 0,
  dogRevealed: false,
  conversationState: "initial", // Can be 'initial', 'petted', 'questioning', 'pills', 'failed_test', 'final'
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
 * Fades in the option buttons after a delay.
 * @param {HTMLElement} trashContent - The main content element of the trash window.
 */
function showOptions(trashContent) {
  if (!trashContent) return;
  const optionsContainer = trashContent.querySelector(
    ".game-options-container, .pill-buttons-container"
  );
  if (optionsContainer) {
    optionsContainer.style.transition = "opacity 0.5s ease-in";
    optionsContainer.style.opacity = "1";
  }
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
    let textElement;

    switch (trashState.conversationState) {
      case "initial":
        trashContent.innerHTML = `
           <div class="secret-content revealed">
             <div class="secret-main">
               <div id="guardian-text" class="guardian-text highlight"></div>
               <div class="game-options-container" style="opacity: 0;">
                 <span class="game-option" onclick="petTheDog()">Pet the dog</span>
                 <span class="game-option" onclick="killDog()">Kill the dog</span>
               </div>
             </div>
             <img src="assets/icons/sleeping_dog.webp" alt="Guardian Dog" class="guardian-dog-image">
           </div>`;
        textElement = document.getElementById("guardian-text");
        typewriterEffect(
          textElement,
          "'The dog slowly opens one eye...'\n'You finally arrived. \nWhat is your purpose here, traveler?'",
          50,
          () => showOptions(trashContent)
        );
        break;

      case "petted":
        trashContent.innerHTML = `
           <div class="secret-content revealed">
             <div class="secret-main">
               <div id="guardian-text" class="guardian-text highlight"></div>
               <div class="game-options-container" style="opacity: 0;">
                 <span class="game-option" onclick="talkToDog()">Yes</span>
                 <span class="game-option" onclick="killDog()">Kill the dog</span>
               </div>
             </div>
             <img src="assets/icons/happy_dog.webp" alt="Happy Guardian Dog" class="guardian-dog-image">
           </div>`;
        textElement = document.getElementById("guardian-text");
        typewriterEffect(
          textElement,
          "'Thank you... It's been long since my master, \nAbhinav, went away. I am his dog, Morphy.\nMay I ask you something?'",
          50,
          () => showOptions(trashContent)
        );
        break;

      case "questioning":
        trashContent.innerHTML = `
            <div class="secret-content revealed">
              <div class="secret-main">
                <div id="guardian-text" class="guardian-text highlight"></div>
                <div class="game-options-container" style="opacity: 0;">
                  <span class="game-option" onclick="answerQuestion(true)">"I've felt it my whole life."</span>
                  <span class="game-option" onclick="answerQuestion(false)">"The world seems fine."</span>
                </div>
              </div>
              <img src="assets/icons/happy_dog.webp" alt="Wise Dog" class="guardian-dog-image">
            </div>`;
        textElement = document.getElementById("guardian-text");
        typewriterEffect(
          textElement,
          "'Have you ever felt that something is wrong with the \nworld? That you are a slave, born into a prison \nyou cannot see or touch?'",
          50,
          () => showOptions(trashContent)
        );
        break;

      case "pills":
        const message = `'Then you are ready to see.'\n"The choice is yours...\nSee how deep the rabbit-hole goes."`;
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
        textElement = document.getElementById("guardian-text");
        typewriterEffect(textElement, message, 50, () =>
          showOptions(trashContent)
        );
        break;
    }
  } else {
    // Before the dog is revealed
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
 * Transitions to the 'petted' state after petting the dog.
 */
function petTheDog() {
  trashState.conversationState = "petted";
  renderTrashContent();
}

/**
 * Transitions to the 'questioning' state.
 */
function talkToDog() {
  trashState.conversationState = "questioning";
  renderTrashContent();
}

/**
 * Handles the user's answer to the dog's question.
 * @param {boolean} isReady - True if the user gave the "correct" answer.
 */
function answerQuestion(isReady) {
  if (isReady) {
    trashState.conversationState = "pills";
    const trashWindow = document.getElementById("trash");
    if (trashWindow) {
      trashWindow.style.height = "420px"; // Make window taller for the pill scene
    }
  } else {
    trashState.conversationState = "failed_test";
    const message =
      "The dog looks away, disappointed.\n'The path is not for you,' it whispers. 'Ignorance is bliss.' The moment passes.";
    const trashContent = document.getElementById("trashContent");
    trashContent.innerHTML = `<div class="final-message-container" style="padding: 15px; height: 100%; box-sizing: border-box; display: flex; justify-content: center; align-items: center;"><div id="final-message" class="final-message-text highlight"></div></div>`;
    const textElement = document.getElementById("final-message");
    typewriterEffect(textElement, message, 50);
    endEasterEgg();
    return; // Stop further rendering
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
 * Resets the easter egg and shows a sad message inside the trash window.
 */
function killDog() {
  trashState.conversationState = "final";
  const trashContent = document.getElementById("trashContent");
  if (!trashContent) return;
  const message = "You monster. The guardian is gone forever.";
  trashContent.innerHTML = `<div class="final-message-container" style="padding: 15px; height: 100%; box-sizing: border-box; display: flex; justify-content: center; align-items: center;"><div id="final-message" class="final-message-text highlight monster"></div></div>`;
  const textElement = document.getElementById("final-message");
  typewriterEffect(textElement, message, 50);
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

  trashContent.innerHTML = `<div class="final-message-container" style="padding: 15px; height: 100%; box-sizing: border-box; display: flex; justify-content: center; align-items: center;"><div id="final-message" class="final-message-text highlight"></div></div>`;
  const textElement = document.getElementById("final-message");
  typewriterEffect(textElement, message, 50);
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
    "You take the blue pill. The dog sighs. You suddenly have a strong urge to check your email and organize your files. Your daily mediocre life continues, the moment of strange insight is gone.";

  trashContent.innerHTML = `<div class="final-message-container" style="padding: 15px; height: 100%; box-sizing: border-box; display: flex; justify-content: center; align-items: center;"><div id="final-message" class="final-message-text highlight bluepill"></div></div>`;
  const textElement = document.getElementById("final-message");
  typewriterEffect(textElement, message, 50);
  endEasterEgg(); // Mark as emptied in the background
}
