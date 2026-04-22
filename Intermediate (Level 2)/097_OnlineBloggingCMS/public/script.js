let token = localStorage.getItem("cms_token") || null;
const app = document.getElementById("app");
const navAdminLink = document.getElementById("nav-admin-link");
const navLogout = document.getElementById("nav-logout");

function setAuthUI() {
  if (token) {
    navAdminLink.textContent = "Dashboard";
    navAdminLink.onclick = () => route("dashboard");
    navLogout.style.display = "inline";
  } else {
    navAdminLink.textContent = "Admin";
    navAdminLink.onclick = () => route("login");
    navLogout.style.display = "none";
  }
}

async function api(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (token) opts.headers["Authorization"] = token;
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(path, opts);
  return r.json();
}

async function logout() {
  await api("POST", "/api/logout");
  token = null;
  localStorage.removeItem("cms_token");
  setAuthUI();
  route("home");
}

function fmt(d) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

async function route(page, id) {
  setAuthUI();
  if (page === "home") await renderHome();
  else if (page === "post") await renderPost(id);
  else if (page === "login") renderLogin();
  else if (page === "dashboard") await renderDashboard();
  else if (page === "create") renderForm(null);
  else if (page === "edit") await renderEditForm(id);
}

async function renderHome() {
  const posts = await api("GET", "/api/posts");
  app.innerHTML = `
    <div class="home-header"><h1>The Blog</h1><p>Thoughts, ideas &amp; stories.</p></div>
    <div class="controls">
      <input id="search" placeholder="Search posts…" oninput="filterPosts()" />
      <select id="sort" onchange="filterPosts()">
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
      </select>
    </div>
    <div id="blog-grid" class="blog-grid"></div>`;
  window._posts = posts;
  filterPosts();
}

function filterPosts() {
  const q = document.getElementById("search").value.toLowerCase();
  const sort = document.getElementById("sort").value;
  let list = (window._posts || []).filter(p => p.title.toLowerCase().includes(q));
  list = list.sort((a, b) => sort === "newest" ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt));
  const grid = document.getElementById("blog-grid");
  if (!list.length) { grid.innerHTML = `<div class="empty">No posts found.</div>`; return; }
  grid.innerHTML = list.map(p => `
    <div class="blog-card" onclick="route('post',${p.id})">
      <h2>${p.title}</h2>
      <div class="meta">By ${p.author} &nbsp;·&nbsp; ${fmt(p.createdAt)}</div>
      <p>${p.content}</p>
    </div>`).join("");
}

async function renderPost(id) {
  const p = await api("GET", `/api/posts/${id}`);
  app.innerHTML = `
    <div class="post-back" onclick="route('home')">← Back</div>
    <h1 class="post-title">${p.title}</h1>
    <div class="post-meta">By ${p.author} &nbsp;·&nbsp; ${fmt(p.createdAt)}</div>
    <div class="post-body">${p.content}</div>`;
}

function renderLogin() {
  app.innerHTML = `
    <div class="login-wrap">
      <h1>Admin Login</h1>
      <p>Sign in to manage your blog.</p>
      <div class="form-group"><label>Username</label><input id="u" type="text" /></div>
      <div class="form-group"><label>Password</label><input id="p" type="password" /></div>
      <button class="btn btn-primary" onclick="doLogin()">Sign In</button>
      <div id="lerr" class="error"></div>
    </div>`;
  document.getElementById("p").addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
}

async function doLogin() {
  const u = document.getElementById("u").value;
  const p = document.getElementById("p").value;
  const res = await api("POST", "/api/login", { username: u, password: p });
  if (res.token) {
    token = res.token;
    localStorage.setItem("cms_token", token);
    setAuthUI();
    route("dashboard");
  } else {
    document.getElementById("lerr").textContent = res.error || "Login failed";
  }
}

async function renderDashboard() {
  if (!token) { route("login"); return; }
  const posts = await api("GET", "/api/admin/posts");
  app.innerHTML = `
    <div class="dash-header">
      <h1>Dashboard</h1>
      <button class="btn btn-primary" onclick="route('create')">+ New Post</button>
    </div>
    <table class="admin-table">
      <thead><tr><th>Title</th><th>Author</th><th>Created</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${posts.length ? posts.map(p => `
        <tr>
          <td>${p.title}</td>
          <td>${p.author}</td>
          <td>${fmt(p.createdAt)}</td>
          <td><span class="badge ${p.isPublished ? "badge-pub" : "badge-draft"}">${p.isPublished ? "Published" : "Draft"}</span></td>
          <td><div class="actions">
            <button class="btn btn-ghost btn-sm" onclick="route('edit',${p.id})">Edit</button>
            <button class="btn btn-ghost btn-sm" onclick="togglePublish(${p.id})">${p.isPublished ? "Unpublish" : "Publish"}</button>
            <button class="btn btn-danger btn-sm" onclick="deletePost(${p.id})">Delete</button>
          </div></td>
        </tr>`).join("") : `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--muted)">No posts yet.</td></tr>`}
      </tbody>
    </table>`;
}

async function togglePublish(id) {
  await api("PATCH", `/api/posts/${id}/publish`);
  renderDashboard();
}

async function deletePost(id) {
  if (!confirm("Delete this post?")) return;
  await api("DELETE", `/api/posts/${id}`);
  renderDashboard();
}

function renderForm(post) {
  app.innerHTML = `
    <div class="form-header">
      <h1>${post ? "Edit Post" : "New Post"}</h1>
      <button class="btn btn-ghost" onclick="route('dashboard')">Cancel</button>
    </div>
    <div class="form-group"><label>Title</label><input id="f-title" value="${post ? post.title : ""}" /></div>
    <div class="form-group"><label>Author</label><input id="f-author" value="${post ? post.author : ""}" /></div>
    <div class="form-group"><label>Content</label><textarea id="f-content">${post ? post.content : ""}</textarea></div>
    <div style="display:flex;gap:.75rem;margin-top:.5rem;">
      <button class="btn btn-primary" onclick="savePost(${post ? post.id : "null"})">${post ? "Save Changes" : "Create Post"}</button>
    </div>
    <div id="ferr" class="error"></div>`;
}

async function renderEditForm(id) {
  if (!token) { route("login"); return; }
  const post = await api("GET", `/api/posts/${id}`);
  renderForm(post);
}

async function savePost(id) {
  const title = document.getElementById("f-title").value.trim();
  const author = document.getElementById("f-author").value.trim();
  const content = document.getElementById("f-content").value.trim();
  if (!title || !author || !content) { document.getElementById("ferr").textContent = "All fields required."; return; }
  const method = id ? "PUT" : "POST";
  const path = id ? `/api/posts/${id}` : "/api/posts";
  const res = await api(method, path, { title, author, content });
  if (res.id) route("dashboard");
  else document.getElementById("ferr").textContent = res.error || "Error saving post";
}

route("home");