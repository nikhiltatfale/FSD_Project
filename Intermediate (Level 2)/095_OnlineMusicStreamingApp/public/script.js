let allSongs = [], currentSong = null, currentIndex = 0, currentQueue = [], isPlaying = false;
let favorites = JSON.parse(localStorage.getItem("favs") || "[]");
let playlist = JSON.parse(localStorage.getItem("playlist") || "[]");
let recent = JSON.parse(localStorage.getItem("recent") || "[]");
let currentUser = null, isAdmin = false;
const audio = document.getElementById("audio");

async function fetchSongs() {
  const res = await fetch("/songs");
  allSongs = await res.json();
  renderSongs(allSongs);
}

function loginUser() {
  const val = document.getElementById("login-input").value.trim();
  if (!val) return;
  fetch("/login-user", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: val }) })
    .then(r => r.json()).then(d => {
      currentUser = d.username;
      document.getElementById("login-page").style.display = "none";
      document.getElementById("app").style.display = "flex";
      document.getElementById("player-bar").style.display = "flex";
      document.getElementById("username-display").textContent = currentUser;
      fetchSongs();
    });
}

function showAdminLogin() {
  document.getElementById("login-page").style.display = "none";
  document.getElementById("admin-login-page").style.display = "flex";
}

function showUserLogin() {
  document.getElementById("admin-login-page").style.display = "none";
  document.getElementById("login-page").style.display = "flex";
}

function loginAdmin() {
  const u = document.getElementById("admin-user-input").value.trim();
  const p = document.getElementById("admin-pass-input").value;
  fetch("/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p }) })
    .then(r => r.json()).then(d => {
      if (d.success) {
        isAdmin = true;
        document.getElementById("admin-login-page").style.display = "none";
        document.getElementById("admin-panel").style.display = "flex";
        adminTab("songs");
      }
    }).catch(() => { document.getElementById("admin-err").textContent = "Invalid credentials"; });
}

function logout() {
  currentUser = null;
  document.getElementById("app").style.display = "none";
  document.getElementById("player-bar").style.display = "none";
  document.getElementById("login-input").value = "";
  document.getElementById("login-page").style.display = "flex";
  audio.pause();
}

function adminLogout() {
  isAdmin = false;
  document.getElementById("admin-panel").style.display = "none";
  document.getElementById("admin-login-page").style.display = "flex";
}

function showSection(name) {
  ["browse","favorites","playlist","recent"].forEach(s => {
    document.getElementById(s + "-section").style.display = s === name ? "" : "none";
  });
  document.querySelectorAll(".nav-item").forEach((el, i) => {
    el.classList.toggle("active", ["browse","favorites","playlist","recent"][i] === name);
  });
  if (name === "favorites") renderFavorites();
  if (name === "playlist") renderPlaylist();
  if (name === "recent") renderRecent();
}

function filterSongs() {
  const q = document.getElementById("search").value.toLowerCase();
  const filtered = allSongs.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
  renderSongs(filtered);
}

function renderSongs(songs) {
  document.getElementById("songs-grid").innerHTML = songs.map(s => songCard(s, songs)).join("");
}

function renderFavorites() {
  const favSongs = allSongs.filter(s => favorites.includes(s.id));
  document.getElementById("favorites-grid").innerHTML = favSongs.length ? favSongs.map(s => songCard(s, favSongs)).join("") : "<p style='color:var(--muted)'>No favorites yet.</p>";
}

function renderPlaylist() {
  const plSongs = allSongs.filter(s => playlist.includes(s.id));
  document.getElementById("playlist-grid").innerHTML = plSongs.length ? plSongs.map(s => songCard(s, plSongs)).join("") : "<p style='color:var(--muted)'>Playlist is empty.</p>";
}

function renderRecent() {
  const rSongs = recent.map(id => allSongs.find(s => s.id === id)).filter(Boolean);
  document.getElementById("recent-grid").innerHTML = rSongs.length ? rSongs.map(s => songCard(s, rSongs)).join("") : "<p style='color:var(--muted)'>Nothing played yet.</p>";
}

function songCard(s, queue) {
  const liked = favorites.includes(s.id);
  const inPl = playlist.includes(s.id);
  const playing = currentSong && currentSong.id === s.id;
  return `<div class="song-card${playing ? " playing" : ""}">
    <img src="${s.image}" alt="${s.title}" onerror="this.src='https://via.placeholder.com/300/1a1a25/e8ff47?text=♪'" onclick="playSong(${s.id},${JSON.stringify(queue).replace(/"/g,'&quot;')})">
    <div class="song-card-info">
      <div class="song-card-title">${s.title}</div>
      <div class="song-card-artist">${s.artist}</div>
      <div class="song-card-actions">
        <button onclick="playSong(${s.id},${JSON.stringify(queue).replace(/"/g,'&quot;')})">▶</button>
        <button class="${liked ? "liked" : ""}" onclick="toggleFav(${s.id})">♥</button>
        <button class="${inPl ? "in-playlist" : ""}" onclick="togglePlaylist(${s.id})">+</button>
      </div>
    </div>
  </div>`;
}

function playSong(id, queue) {
  currentQueue = queue;
  currentIndex = queue.findIndex(s => s.id === id);
  currentSong = queue[currentIndex];
  audio.src = currentSong.audio;
  audio.play();
  isPlaying = true;
  updatePlayerUI();
  addRecent(id);
}

function updatePlayerUI() {
  document.getElementById("player-img").src = currentSong ? currentSong.image : "";
  document.getElementById("player-title").textContent = currentSong ? currentSong.title : "—";
  document.getElementById("player-artist").textContent = currentSong ? currentSong.artist : "—";
  document.getElementById("play-btn").textContent = isPlaying ? "⏸" : "▶";
  renderSongs(allSongs.filter(s => {
    const q = document.getElementById("search").value.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q);
  }));
}

function togglePlay() {
  if (!currentSong) return;
  if (isPlaying) { audio.pause(); isPlaying = false; }
  else { audio.play(); isPlaying = true; }
  document.getElementById("play-btn").textContent = isPlaying ? "⏸" : "▶";
}

function nextSong() {
  if (!currentQueue.length) return;
  currentIndex = (currentIndex + 1) % currentQueue.length;
  currentSong = currentQueue[currentIndex];
  audio.src = currentSong.audio; audio.play(); isPlaying = true;
  updatePlayerUI(); addRecent(currentSong.id);
}

function prevSong() {
  if (!currentQueue.length) return;
  currentIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length;
  currentSong = currentQueue[currentIndex];
  audio.src = currentSong.audio; audio.play(); isPlaying = true;
  updatePlayerUI(); addRecent(currentSong.id);
}

function seek() {
  audio.currentTime = (document.getElementById("progress").value / 100) * audio.duration;
}

function setVolume() {
  audio.volume = document.getElementById("volume").value / 100;
}

function fmt(t) {
  if (isNaN(t)) return "0:00";
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return m + ":" + (s < 10 ? "0" : "") + s;
}

audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    document.getElementById("progress").value = (audio.currentTime / audio.duration) * 100;
    document.getElementById("cur-time").textContent = fmt(audio.currentTime);
    document.getElementById("dur-time").textContent = fmt(audio.duration);
  }
});

audio.addEventListener("ended", nextSong);
audio.volume = 0.8;

function toggleFav(id) {
  if (favorites.includes(id)) favorites = favorites.filter(f => f !== id);
  else favorites.push(id);
  localStorage.setItem("favs", JSON.stringify(favorites));
  const q = document.getElementById("search").value.toLowerCase();
  renderSongs(allSongs.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)));
}

function togglePlaylist(id) {
  if (playlist.includes(id)) playlist = playlist.filter(p => p !== id);
  else playlist.push(id);
  localStorage.setItem("playlist", JSON.stringify(playlist));
  const q = document.getElementById("search").value.toLowerCase();
  renderSongs(allSongs.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)));
}

function playPlaylist() {
  const plSongs = allSongs.filter(s => playlist.includes(s.id));
  if (plSongs.length) playSong(plSongs[0].id, plSongs);
}

function clearPlaylist() {
  playlist = []; localStorage.setItem("playlist", JSON.stringify(playlist)); renderPlaylist();
  const q = document.getElementById("search").value.toLowerCase();
  renderSongs(allSongs.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q)));
}

function addRecent(id) {
  recent = [id, ...recent.filter(r => r !== id)].slice(0, 10);
  localStorage.setItem("recent", JSON.stringify(recent));
}

function adminTab(tab) {
  ["songs","users","add"].forEach(t => {
    document.getElementById("admin-" + t + "-tab").style.display = t === tab ? "" : "none";
  });
  document.querySelectorAll("#admin-sidebar .nav-item").forEach((el, i) => {
    el.classList.toggle("active", ["songs","users","add"][i] === tab);
  });
  if (tab === "songs") loadAdminSongs();
  if (tab === "users") loadAdminUsers();
}

function loadAdminSongs() {
  fetch("/songs").then(r => r.json()).then(songs => {
    document.getElementById("admin-songs-list").innerHTML = songs.map(s =>
      `<div class="admin-song-row">
        <img src="${s.image}" onerror="this.src='https://via.placeholder.com/44/1a1a25/e8ff47?text=♪'" alt="">
        <div class="info"><strong>${s.title}</strong><span>${s.artist}</span></div>
        <button class="del-btn" onclick="deleteSong(${s.id})">Delete</button>
      </div>`
    ).join("");
  });
}

function loadAdminUsers() {
  fetch("/users").then(r => r.json()).then(users => {
    document.getElementById("admin-users-list").innerHTML = users.length
      ? users.map(u => `<span class="user-chip">👤 ${u}</span>`).join("")
      : "<p style='color:var(--muted)'>No users logged in.</p>";
  });
}

function deleteSong(id) {
  fetch("/delete-song/" + id, { method: "DELETE" }).then(() => { loadAdminSongs(); fetchSongs(); });
}

function addSong() {
  const title = document.getElementById("a-title").value.trim();
  const artist = document.getElementById("a-artist").value.trim();
  const image = document.getElementById("a-image").value.trim();
  const audio = document.getElementById("a-audio").value.trim();
  if (!title || !artist || !audio) { document.getElementById("add-msg").textContent = "Title, artist and audio URL required."; return; }
  fetch("/add-song", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, artist, image, audio }) })
    .then(r => r.json()).then(() => {
      document.getElementById("add-msg").textContent = "Song added!";
      ["a-title","a-artist","a-image","a-audio"].forEach(id => document.getElementById(id).value = "");
      loadAdminSongs(); fetchSongs();
    });
}

document.getElementById("login-input").addEventListener("keydown", e => { if (e.key === "Enter") loginUser(); });