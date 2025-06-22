const btn = document.getElementById("setAlarmBtn");
const status = document.getElementById("status");
const timeInput = document.getElementById("alarmTime");
const uriInput = document.getElementById("spotifyUri");

function setStatus(message, type = "info") {
  status.textContent = message;
  status.className = type;
}

function disableUI(disabled) {
  btn.disabled = disabled;
  timeInput.disabled = disabled;
  uriInput.disabled = disabled;
}

btn.addEventListener("click", async () => {
  const time = timeInput.value.trim();
  const uri = uriInput.value.trim();
  
  if (!time || !uri) {
    setStatus("❌ Please fill in both fields.", "error");
    return;
  }

  disableUI(true);
  setStatus("⏳ Setting alarm...");

  try {
    const result = await window.electronAPI.setAlarm(time, uri);
    setStatus(result, "success");
  } catch (err) {
    console.error(err);
    setStatus("❌ Failed to set alarm. See console.", "error");
  }

  disableUI(false);
});
