require('dotenv').config();
const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const open = require('open').default;
const fs = require('fs');

const app = express();
const port = 8888;
let tokenExpiration = null;

const scopes = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing'
];

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

function authenticate() {
  if (fs.existsSync('./tokens.json')) {
  try {
    const raw = fs.readFileSync('./tokens.json', 'utf8');
    if (!raw) throw new Error("Empty token file");

    const { access_token, refresh_token, expire_time } = JSON.parse(raw);
    if (!access_token || !refresh_token || !expire_time) throw new Error("Incomplete token data");

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);
    tokenExpiration = new Date(expire_time);

    if (new Date() >= tokenExpiration) {
      return refreshAccessToken();
    }

    return;
  } catch (e) {
    console.warn("⚠️ Token file invalid or empty. Re-authenticating.");
    fs.unlinkSync('./tokens.json'); // delete broken file
  }
}


  const authorizeURL = spotifyApi.createAuthorizeURL(scopes);
  open(authorizeURL);

  app.get('/callback', async (req, res) => {
    try {
      const code = req.query.code;
      const data = await spotifyApi.authorizationCodeGrant(code);

      const access_token = data.body.access_token;
      const refresh_token = data.body.refresh_token;
      tokenExpiration = new Date(Date.now() + data.body.expires_in * 1000);

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);

      fs.writeFileSync('./tokens.json', JSON.stringify({
        access_token,
        refresh_token,
        expire_time: tokenExpiration
      }, null, 2));

      res.send("✅ Auth complete. You can close this window.");
    } catch (err) {
      console.error(err);
      res.send("❌ Auth failed");
    }
  });

  app.listen(port, () => {
    console.log(`🌐 Listening on http://127.0.0.1:${port}`);
  });
}

function refreshAccessToken() {
  return spotifyApi.refreshAccessToken().then(data => {
    spotifyApi.setAccessToken(data.body.access_token);
    tokenExpiration = new Date(Date.now() + data.body.expires_in * 1000);
    const current = JSON.parse(fs.readFileSync('./tokens.json', 'utf8'));
    current.access_token = data.body.access_token;
    current.expire_time = tokenExpiration;
    fs.writeFileSync('./tokens.json', JSON.stringify(current, null, 2));
    console.log("🔄 Token refreshed");
  });
}

async function playSpotifyTrack(uri) {
  const devices = await spotifyApi.getMyDevices();
  const device = devices.body.devices.find(d => !d.is_restricted);

  if (!device) {
    return console.log("⚠️ No usable Spotify device found");
  }

  const deviceId = device.id;

  try {
    if (uri.startsWith('spotify:playlist:')) {
      // Extract playlist ID
      const playlistId = uri.split(':')[2];

      // Fetch tracks from playlist
      const tracksData = await spotifyApi.getPlaylistTracks(playlistId, { limit: 20 });
      const uris = tracksData.body.items.map(item => item.track.uri).filter(Boolean);

      if (uris.length === 0) {
        return console.log("❌ Playlist has no playable tracks");
      }

      await spotifyApi.play({
        device_id: deviceId,
        uris: uris.slice(0, 20), // Spotify has a max limit per call
      });
    } else if (uri.startsWith('spotify:track:')) {
      await spotifyApi.play({
        device_id: deviceId,
        uris: [uri]
      });
    } else {
      console.warn("❌ Unsupported URI format");
    }

    console.log(`🎵 Playing from: ${uri}`);
  } catch (err) {
    console.error("❌ Failed to play", err);
  }
}


module.exports = { authenticate, playSpotifyTrack };
