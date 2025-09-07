function calcInput(v) {
  const d = document.getElementById("calcDisplay");
  if (!d) return;
  if (d.value === "Error") d.value = "";
  d.value += v;
}

function calculate() {
  const d = document.getElementById("calcDisplay");
  if (!d) return;
  try {
    const sanitized = d.value
      .replace(/\^/g, "**")
      .replace(/√\(([^)]+)\)/g, "Math.sqrt($1)")
      .replace(/√([0-9.]+)/g, "Math.sqrt($1)")
      .replace(/([0-9.]+)%/g, "($1/100)");
    const result = new Function("return " + sanitized)();
    if (!Number.isFinite(result)) throw new Error("Invalid result");
    d.value = String(
      Number.isInteger(result) ? result : parseFloat(result.toFixed(8))
    );
  } catch (e) {
    d.value = "Error";
  }
}

function clearCalc() {
  const d = document.getElementById("calcDisplay");
  if (d) d.value = "";
}

function handleCalcKeyDown(e) {
  const calcWin = document.getElementById("calculator");
  if (!calcWin || calcWin.style.display !== "block") return;

  const keyMap = {
    Enter: "=",
    Backspace: "backspace",
    Escape: "clear",
    c: "clear",
  };

  if ("0123456789.+-*/^%".includes(e.key)) {
    e.preventDefault();
    calcInput(e.key);
  } else if (keyMap[e.key]) {
    e.preventDefault();
    if (keyMap[e.key] === "=") {
      calculate();
    } else if (keyMap[e.key] === "clear") {
      clearCalc();
    } else if (keyMap[e.key] === "backspace") {
      const d = document.getElementById("calcDisplay");
      if (d) d.value = d.value.slice(0, -1);
    }
  }
}

function initCalculator() {
  document.addEventListener("keydown", handleCalcKeyDown);
}
