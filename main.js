// ===== Global state & helpers =====
const ambientAudio = document.getElementById("ambientAudio");
const voiceToggle  = document.getElementById("voiceToggle");
const titleEl      = document.getElementById("title");
const storyEl      = document.getElementById("storyText");
const buttonsEl    = document.getElementById("buttonsContainer");
const gameWrap     = document.getElementById("gameContainer");

let soundEnabled = false;
let narrationUtterance = null;
let currentStage = "intro";

// ===== Stage data =====
const STAGES = {
  intro: {
    bg: "assets/spear.jpg",
    title: "Roman Preparation",
    text: `Are you ready to start the Roman Preparation?`,
    buttons: [
      { label: "Press To Start", action: () => {
          enableSound();
          playAmbient();
          speak(STAGES.intro.text);
          buttonsEl.innerHTML = "";
          const contBtn = document.createElement("button");
          contBtn.textContent = "Continue";
          contBtn.addEventListener("click", () => goTo("role"));
          buttonsEl.appendChild(contBtn);
      }}
    ]
  },

  role: {
    bg: "assets/shield.jpg",
    title: "Your Goal",
    text: `Explore All The Museum Findings And Prepare The Soldier.`,
    buttons: [
      { label: "Soldier", action: () => goTo("lore") },
      { label: "How To Play", action: () => goTo("instructions") }
    ]
  },

  lore: {
    bg: "assets/soldier.jpg",
    title: "Soldier",
    text: `Use AR to scan the findings. Each finding will reveal its story.`,
    buttons: [
      { label: "Explore!", action: () => {
          stopAmbient();
          window.open(`ar.html?from=${currentStage}`, "_blank");
      }},
      { label: "Finish", action: () => goTo("end") },
      { label: "Back", action: () => goTo("role") }
    ]
  },

  instructions: {
    bg: "assets/armor.jpg",
    title: "How to Play — Overview",
    text: `
      • You play as the <b>Soldier</b>.<br>
      • Use your device camera to scan AR markers hidden in the environment.<br>
      • Each marker reveals a message about the story of each finding.<br>
      • Find and scan all the findings to prepare the soldier.<br>
    `,
    buttons: [
      { label: "Back", action: () => goTo("role") }
    ]
  },

  // ——— Minimal edits so the end "has meaning" ———
  end: {
  bg: "assets/complete.jpg",
  title: "Completed",
  text: `You Made It!<br><br>Go Again?`,
  buttons: [
    { label: "Restart", action: () => goTo("intro", true) }
  ]
}
};

// ===== Sound / Narration =====
function enableSound() {
  soundEnabled = true;
  voiceToggle.classList.add("active");
  voiceToggle.textContent = "🔊";
}

function disableSound() {
  soundEnabled = false;
  voiceToggle.classList.remove("active");
  voiceToggle.textContent = "🔇";
  cancelNarration();
  stopAmbient();
}

function playAmbient() {
  if (!soundEnabled) return;
  ambientAudio.volume = 0.4;
  ambientAudio.play().catch(() => {});
}

function stopAmbient() { ambientAudio.pause(); }

function cancelNarration() {
  try {
    if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
  } catch {}
}

function speak(text) {
  cancelNarration();
  if (!soundEnabled) return;
  let plainText = text.replace(/<a[^>]*>.*?<\/a>/gi, "");
  plainText = plainText.replace(/(<([^>]+)>)/gi, "");
  plainText = plainText.replace(/&[a-z]+;/gi, " ");
  plainText = plainText.replace(/\s+/g, " ").trim();
  const u = new SpeechSynthesisUtterance(plainText);
  u.lang = "en-GB";
  u.rate = 1.05;
  u.pitch = 1.0;
  narrationUtterance = u;
  speechSynthesis.speak(u);
}

voiceToggle.addEventListener("click", () => {
  if (soundEnabled) {
    disableSound();
  } else {
    enableSound();
    playAmbient();
    if (STAGES[currentStage]) speak(STAGES[currentStage].text);
  }
});

// ===== Navigation =====
function goTo(stage, resetAll = false) {
  // If called as Restart with resetAll=true, do a soft reset so the action έχει νόημα
  if (resetAll === true) {
    cancelNarration();
    stopAmbient();
    disableSound();               // επιστρέφει το σύστημα σε «σίγαση»
    try { history.replaceState({}, "", location.pathname); } catch {}
  }

  currentStage = stage;
  const s = STAGES[stage];
  if (!s) return;

  if (s.bg) gameWrap.style.backgroundImage = `url('${s.bg}')`;
  titleEl.textContent = s.title || "";
  storyEl.innerHTML = s.text || "";

  buttonsEl.innerHTML = "";
  (s.buttons || []).forEach(b => {
    const btn = document.createElement("button");
    btn.textContent = b.label;
    btn.addEventListener("click", b.action);
    buttonsEl.appendChild(btn);
  });

  if (soundEnabled) speak(s.text || "");
}

// ===== Init =====
window.addEventListener("load", () => {
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section");
  if (section && STAGES[section]) {
    goTo(section);
  } else {
    goTo("intro");
  }
});
