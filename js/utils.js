/**
 * js/utils.js — Shared utility functions used across multiple app modules.
 */

/**
 * Creates a typewriter effect for a given element.
 * @param {HTMLElement} element - The element to type into.
 * @param {string} text - The text to type out.
 * @param {number} speed - Typing speed in milliseconds per character.
 * @param {function} [callback] - Optional callback after typing completes.
 */
function typewriterEffect(element, text, speed = 50, callback) {
  if (!element) return;
  let i = 0;
  element.innerHTML = "";
  element.classList.add("typing");

  function type() {
    element.innerHTML += text.charAt(i) === "\n" ? "<br>" : text.charAt(i);
    i++;
    if (i < text.length) {
      setTimeout(type, speed);
    } else {
      element.classList.remove("typing");
      callback?.();
    }
  }
  type();
}
