const { playSpotifyTrack } = require('./spotify');

function setAlarm(targetTime, spotifyUri) {
  const now = new Date();
  const [hour, minute] = targetTime.split(':').map(Number);
  const alarmTime = new Date();
  alarmTime.setHours(hour, minute, 0, 0);

  if (alarmTime <= now) {
    alarmTime.setDate(alarmTime.getDate() + 1);
  }

  const delay = alarmTime - now;

  console.log(`⏰ Alarm set for ${alarmTime.toLocaleTimeString()} in ${(delay / 1000 / 60).toFixed(2)} mins`);

  setTimeout(() => {
    console.log("🚨 Triggering alarm");
    playSpotifyTrack(spotifyUri);
  }, delay);
}

module.exports = { setAlarm };
