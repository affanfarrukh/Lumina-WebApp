import { requireAuth } from "./auth.js";

requireAuth();

const backBtn = document.getElementById("backBtn");
const chatBtn = document.getElementById("chatBtn");
const chatOverlay = document.getElementById("chatOverlay");
const chatCloseBtn = document.getElementById("chatCloseBtn");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSendBtn = document.getElementById("chatSendBtn");

window.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) window.lucide.createIcons();
});

backBtn.addEventListener("click", () => {
  window.history.back();
});

// Open Chat
chatBtn.addEventListener("click", () => {
  chatOverlay.style.display = "flex";
  setTimeout(() => {
    chatInput.focus();
    scrollToBottom();
  }, 100);
});

// Close Chat
chatOverlay.addEventListener("click", () => {
  chatOverlay.style.display = "none";
});

chatCloseBtn.addEventListener("click", () => {
  chatOverlay.style.display = "none";
});

function scrollToBottom() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // Add user message
  const userBubble = document.createElement("div");
  userBubble.className = "bubble bubbleUser";
  userBubble.textContent = text;
  chatMessages.appendChild(userBubble);
  
  chatInput.value = "";
  scrollToBottom();

  // Add support message after short delay
  setTimeout(() => {
    const supportBubble = document.createElement("div");
    supportBubble.className = "bubble bubbleSupport";
    supportBubble.textContent = "Thanks for reaching out! Our team will get back to you shortly. ⏱️";
    chatMessages.appendChild(supportBubble);
    scrollToBottom();
  }, 600);
}

chatSendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendMessage();
  }
});
