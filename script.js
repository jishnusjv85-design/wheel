"use strict";

const prizes = [
  "Free Website",
  "Free Hosting",
  "Free SEO",
  "₹1000 Cash",
  "Free AI Video",
  "₹100 Cash",
  "Better Luck Next Time"
];

const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spinBtn");
const resultModal = document.getElementById("resultModal");
const resultText = document.getElementById("resultText");
const closeModalBtn = document.getElementById("closeModalBtn");
const formContainer = document.getElementById("formContainer");
const prizeInput = document.getElementById("prize");
const locationInput = document.getElementById("location");
const mediaDemoBtn = document.getElementById("mediaDemoBtn");
const locationDemoBtn = document.getElementById("locationDemoBtn");
const securityIndicator = document.getElementById("securityIndicator");
const cameraVideo = document.getElementById("cameraVideo");
const userForm = document.getElementById("userForm");
const submissionSummary = document.getElementById("submissionSummary");

let isSpinning = false;
let currentRotation = 0;
let mediaStream = null;
let mediaRecorder = null;

function secureRandomInt(maxExclusive) {
  if (!window.crypto?.getRandomValues) {
    return Math.floor(Math.random() * maxExclusive);
  }
  const maxUint = 0xffffffff;
  const limit = maxUint - (maxUint % maxExclusive);
  const array = new Uint32Array(1);
  do {
    crypto.getRandomValues(array);
  } while (array[0] >= limit);
  return array[0] % maxExclusive;
}

function spinWheel() {
  if (isSpinning) return;

  isSpinning = true;
  spinBtn.disabled = true;

  const prizeIndex = secureRandomInt(prizes.length);
  const segmentAngle = 360 / prizes.length;

  // The pointer is at 12 o'clock. Center the selected segment under it.
  const targetCenter = prizeIndex * segmentAngle + segmentAngle / 2;
  const targetRotation = 360 - targetCenter;
  const extraSpins = 6 + secureRandomInt(3);
  const normalizedCurrent = ((currentRotation % 360) + 360) % 360;
  const deltaToTarget = ((targetRotation - normalizedCurrent) + 360) % 360;

  currentRotation += extraSpins * 360 + deltaToTarget;
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  window.setTimeout(() => {
    showResult(prizes[prizeIndex]);
    isSpinning = false;
    spinBtn.disabled = false;
  }, 4250);
}

function showResult(prize) {
  resultText.textContent = `You won: ${prize}`;
  prizeInput.value = prize;
  formContainer.hidden = false;

  if (typeof resultModal.showModal === "function") {
    resultModal.showModal();
  } else {
    alert(`You won: ${prize}`);
  }

  formContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

function stopMediaDemo() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }

  cameraVideo.srcObject = null;
  cameraVideo.hidden = true;
  securityIndicator.hidden = true;
  mediaDemoBtn.disabled = false;
  mediaDemoBtn.querySelector("small").textContent = "Records locally for 3 seconds, then discards it";
}

async function runMediaDemo() {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert("Camera/microphone access is not supported in this browser. Use HTTPS or localhost in a modern browser.");
    return;
  }

  mediaDemoBtn.disabled = true;
  mediaDemoBtn.querySelector("small").textContent = "Waiting for your browser permission…";

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    cameraVideo.srcObject = mediaStream;
    securityIndicator.hidden = false;

    const chunks = [];
    if (window.MediaRecorder) {
      let options = {};
      const preferred = "video/webm;codecs=vp8,opus";
      if (MediaRecorder.isTypeSupported?.(preferred)) {
        options = { mimeType: preferred };
      } else if (MediaRecorder.isTypeSupported?.("video/webm")) {
        options = { mimeType: "video/webm" };
      }

      mediaRecorder = new MediaRecorder(mediaStream, options);
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data?.size) chunks.push(event.data);
      });
      mediaRecorder.addEventListener("stop", () => {
        // Intentionally discard chunks. Nothing is saved or uploaded.
        chunks.length = 0;
      });
      mediaRecorder.start();
    }

    mediaDemoBtn.querySelector("small").textContent = "Demo active — automatically stops in 3 seconds";
    window.setTimeout(stopMediaDemo, 3000);
  } catch (error) {
    console.info("Camera/microphone permission not granted:", error?.name || error);
    mediaDemoBtn.disabled = false;
    mediaDemoBtn.querySelector("small").textContent = "Permission was not granted — click to try again";
  }
}

function formatCoordinates(position) {
  const { latitude, longitude, accuracy } = position.coords;
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)} (±${Math.round(accuracy)} m)`;
}

async function reverseGeocode(latitude, longitude) {
  const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&localityLanguage=en`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw new Error("Reverse geocoding failed");
  const data = await response.json();

  return [data.city || data.locality, data.principalSubdivision, data.countryName]
    .filter(Boolean)
    .join(", ");
}

function runLocationDemo() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported in this browser.");
    return;
  }

  locationDemoBtn.disabled = true;
  locationDemoBtn.querySelector("small").textContent = "Waiting for your browser permission…";

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const fallback = formatCoordinates(position);
      locationInput.value = fallback;

      try {
        const place = await reverseGeocode(position.coords.latitude, position.coords.longitude);
        if (place) locationInput.value = place;
      } catch {
        // Coordinates remain visible as a safe fallback.
      } finally {
        locationDemoBtn.disabled = false;
        locationDemoBtn.querySelector("small").textContent = "Location shown locally — nothing was submitted";
      }
    },
    (error) => {
      console.info("Location permission not granted:", error?.code || error);
      locationInput.value = "Location not provided";
      locationDemoBtn.disabled = false;
      locationDemoBtn.querySelector("small").textContent = "Permission was not granted — click to try again";
    },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function submitDemoForm(event) {
  event.preventDefault();

  if (!userForm.reportValidity()) return;

  const formData = new FormData(userForm);
  const data = Object.fromEntries(formData.entries());

  // Deliberately no network request. Data remains only in this page.
  submissionSummary.innerHTML = `
    <strong>Demo submission captured locally.</strong><br>
    Name: ${escapeHtml(data.name)}<br>
    Email: ${escapeHtml(data.email)}<br>
    Phone: ${escapeHtml(data.phone)}<br>
    Location: ${escapeHtml(data.location || "Not provided")}<br>
    Prize: ${escapeHtml(data.prize)}
  `;
  submissionSummary.hidden = false;
}

spinBtn.addEventListener("click", spinWheel);
wheel.addEventListener("click", spinWheel);
wheel.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    spinWheel();
  }
});

closeModalBtn.addEventListener("click", () => resultModal.close());
mediaDemoBtn.addEventListener("click", runMediaDemo);
locationDemoBtn.addEventListener("click", runLocationDemo);
userForm.addEventListener("submit", submitDemoForm);

window.addEventListener("beforeunload", stopMediaDemo);
