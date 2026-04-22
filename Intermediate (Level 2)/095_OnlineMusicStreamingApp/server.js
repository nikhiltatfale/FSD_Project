const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let songs = [
  { id: 1, title: "Blinding Lights", artist: "The Weeknd", image: "https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: 2, title: "Shape of You", artist: "Ed Sheeran", image: "https://i.scdn.co/image/ab67616d0000b273ba5db46f4b838ef6027e6f96", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
  { id: 3, title: "Levitating", artist: "Dua Lipa", image: "https://i.scdn.co/image/ab67616d0000b27384f3a96f7e77b10df3793c47", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
  { id: 4, title: "Stay", artist: "The Kid LAROI", image: "https://i.scdn.co/image/ab67616d0000b2737fba2e5aeff48cfc26c39c41", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
  { id: 5, title: "Peaches", artist: "Justin Bieber", image: "https://i.scdn.co/image/ab67616d0000b2734ae1c4c5c45aabe565499163", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3" },
  { id: 6, title: "Good 4 U", artist: "Olivia Rodrigo", image: "https://i.scdn.co/image/ab67616d0000b273a91c10fe9472d9bd89802e5a", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3" },
  { id: 7, title: "Montero", artist: "Lil Nas X", image: "https://i.scdn.co/image/ab67616d0000b273be82673b5f79d9658ec0a9fd", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3" },
  { id: 8, title: "Bad Habits", artist: "Ed Sheeran", image: "https://i.scdn.co/image/ab67616d0000b273ef4c9c7e82fe1fc750c66b55", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" }
];

let users = [];
let nextId = 9;

app.get("/songs", (req, res) => res.json(songs));

app.post("/add-song", (req, res) => {
  const { title, artist, image, audio } = req.body;
  if (!title || !artist || !audio) return res.status(400).json({ error: "Missing fields" });
  const song = { id: nextId++, title, artist, image: image || "https://via.placeholder.com/300", audio };
  songs.push(song);
  res.json(song);
});

app.delete("/delete-song/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const idx = songs.findIndex(s => s.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  songs.splice(idx, 1);
  res.json({ success: true });
});

app.post("/admin-login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") return res.json({ success: true });
  res.status(401).json({ error: "Invalid credentials" });
});

app.post("/login-user", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });
  if (!users.includes(username)) users.push(username);
  res.json({ success: true, username });
});

app.get("/users", (req, res) => res.json(users));

app.listen(3000, () => console.log("Server running at http://localhost:3000"));