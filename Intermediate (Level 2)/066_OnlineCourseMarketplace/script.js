const DEFAULT_COURSES = [
  {id:1,title:"HTML & CSS Fundamentals",instructor:"Ravi Kumar",category:"Web Dev",price:499,description:"Learn HTML5 and CSS3 from scratch. Build real-world layouts with flexbox and grid."},
  {id:2,title:"JavaScript Mastery",instructor:"Priya Sharma",category:"Web Dev",price:799,description:"Deep dive into modern JavaScript: ES6+, async/await, DOM manipulation, and projects."},
  {id:3,title:"Python for Data Science",instructor:"Arjun Mehta",category:"Data Science",price:999,description:"Master Python, Pandas, NumPy, and Matplotlib for data analysis and visualization."},
  {id:4,title:"Machine Learning Basics",instructor:"Sneha Patel",category:"Data Science",price:1299,description:"Understand ML algorithms, supervised/unsupervised learning, and model evaluation."},
  {id:5,title:"UI/UX Design Principles",instructor:"Ananya Roy",category:"Design",price:699,description:"Learn design thinking, wireframing, Figma, and how to create user-centered designs."},
  {id:6,title:"Digital Marketing",instructor:"Karan Joshi",category:"Marketing",price:599,description:"Master SEO, social media marketing, Google Ads, and email marketing strategies."},
  {id:7,title:"Business Strategy",instructor:"Meera Iyer",category:"Business",price:899,description:"Build strategic thinking, market analysis, and business model frameworks."},
  {id:8,title:"React.js Complete Guide",instructor:"Dev Nair",category:"Web Dev",price:1099,description:"Build modern SPAs with React, hooks, context API, and React Router."}
];

let adminMode = false;
let currentFilter = {search:"",category:""};

function loadCourses() {
  const stored = localStorage.getItem("courses");
  if (!stored) {
    localStorage.setItem("courses", JSON.stringify(DEFAULT_COURSES));
    return DEFAULT_COURSES;
  }
  return JSON.parse(stored);
}

function saveCourses(courses) {
  localStorage.setItem("courses", JSON.stringify(courses));
}

function getEnrolled() {
  return JSON.parse(localStorage.getItem("enrolledCourses") || "[]");
}

function saveEnrolled(arr) {
  localStorage.setItem("enrolledCourses", JSON.stringify(arr));
}

function displayCourses(list) {
  const grid = document.getElementById("courseGrid");
  if (!list.length) {
    grid.innerHTML = '<p class="no-results">No courses found.</p>';
    return;
  }
  const enrolled = getEnrolled();
  grid.innerHTML = list.map(c => `
    <div class="course-card">
      <h3>${c.title}</h3>
      <p>👨‍🏫 ${c.instructor}</p>
      <p>📂 ${c.category}</p>
      <p class="price">₹${c.price}</p>
      <button onclick="showCourseDetails(${c.id})">View Details</button>
      <button onclick="enrollCourse(${c.id})" ${enrolled.includes(c.id)?"disabled style='background:#888'":""}>
        ${enrolled.includes(c.id)?"Enrolled":"Enroll"}
      </button>
    </div>
  `).join("");
}

function getFilteredCourses() {
  let courses = loadCourses();
  if (currentFilter.search) {
    courses = courses.filter(c => c.title.toLowerCase().includes(currentFilter.search.toLowerCase()));
  }
  if (currentFilter.category) {
    courses = courses.filter(c => c.category === currentFilter.category);
  }
  return courses;
}

function searchCourses() {
  currentFilter.search = document.getElementById("searchInput").value;
  displayCourses(getFilteredCourses());
}

function filterByCategory() {
  currentFilter.category = document.getElementById("categoryFilter").value;
  displayCourses(getFilteredCourses());
}

function showCourseDetails(id) {
  const course = loadCourses().find(c => c.id === id);
  if (!course) return;
  const enrolled = getEnrolled();
  document.getElementById("courseDetails").innerHTML = `
    <h2>${course.title}</h2>
    <p>👨‍🏫 Instructor: <strong>${course.instructor}</strong></p>
    <p>📂 Category: ${course.category}</p>
    <p class="price">₹${course.price}</p>
    <p style="margin:12px 0;line-height:1.6">${course.description}</p>
    <button onclick="enrollCourse(${course.id})" ${enrolled.includes(course.id)?"disabled style='background:#888'":""}>
      ${enrolled.includes(course.id)?"Already Enrolled":"Enroll Now"}
    </button>
  `;
  showSection("detailsSection");
}

function closeDetails() {
  showSection("courseListSection");
}

function enrollCourse(id) {
  const enrolled = getEnrolled();
  if (!enrolled.includes(id)) {
    enrolled.push(id);
    saveEnrolled(enrolled);
    alert("Enrolled successfully!");
    displayCourses(getFilteredCourses());
    const detailsVisible = document.getElementById("detailsSection").style.display !== "none";
    if (detailsVisible) showCourseDetails(id);
  }
}

function showEnrollments() {
  const enrolled = getEnrolled();
  const courses = loadCourses();
  const list = document.getElementById("enrolledList");
  if (!enrolled.length) {
    list.innerHTML = '<p class="no-results">You have not enrolled in any course yet.</p>';
  } else {
    list.innerHTML = enrolled.map(id => {
      const c = courses.find(x => x.id === id);
      return c ? `<div class="enrolled-item"><strong>${c.title}</strong> — ${c.instructor} | ₹${c.price}</div>` : "";
    }).join("");
  }
  showSection("enrollmentsSection");
}

function closeEnrollments() {
  showSection("courseListSection");
}

function toggleAdminMode() {
  if (!adminMode) {
    const pass = prompt("Enter admin password:");
    if (pass !== "admin123") { alert("Wrong password!"); return; }
  }
  adminMode = !adminMode;
  const btn = document.getElementById("adminToggleBtn");
  btn.textContent = adminMode ? "Exit Admin" : "Admin Mode";
  btn.classList.toggle("active", adminMode);
  if (adminMode) {
    showSection("adminSection");
    renderAdminList();
  } else {
    showSection("courseListSection");
    displayCourses(getFilteredCourses());
  }
}

function renderAdminList() {
  const courses = loadCourses();
  const el = document.getElementById("adminCourseList");
  el.innerHTML = courses.map(c => `
    <div class="admin-course-item">
      <span>${c.title} (${c.category}) — ₹${c.price}</span>
      <div class="actions">
        <button class="btn-edit" onclick="editCourse(${c.id})">Edit</button>
        <button class="btn-delete" onclick="deleteCourse(${c.id})">Delete</button>
      </div>
    </div>
  `).join("");
}

function saveCourse() {
  const id = document.getElementById("editId").value;
  const title = document.getElementById("fTitle").value.trim();
  const instructor = document.getElementById("fInstructor").value.trim();
  const category = document.getElementById("fCategory").value;
  const price = parseFloat(document.getElementById("fPrice").value);
  const description = document.getElementById("fDesc").value.trim();
  if (!title || !instructor || !price) { alert("Fill all required fields."); return; }
  let courses = loadCourses();
  if (id) {
    courses = courses.map(c => c.id === parseInt(id) ? {id:parseInt(id),title,instructor,category,price,description} : c);
  } else {
    const newId = courses.length ? Math.max(...courses.map(c => c.id)) + 1 : 1;
    courses.push({id:newId,title,instructor,category,price,description});
  }
  saveCourses(courses);
  resetForm();
  renderAdminList();
  alert("Course saved!");
}

function editCourse(id) {
  const c = loadCourses().find(x => x.id === id);
  if (!c) return;
  document.getElementById("editId").value = c.id;
  document.getElementById("fTitle").value = c.title;
  document.getElementById("fInstructor").value = c.instructor;
  document.getElementById("fCategory").value = c.category;
  document.getElementById("fPrice").value = c.price;
  document.getElementById("fDesc").value = c.description;
  document.getElementById("formTitle").textContent = "Edit Course";
  window.scrollTo(0,0);
}

function deleteCourse(id) {
  if (!confirm("Delete this course?")) return;
  let courses = loadCourses().filter(c => c.id !== id);
  saveCourses(courses);
  let enrolled = getEnrolled().filter(eid => eid !== id);
  saveEnrolled(enrolled);
  renderAdminList();
}

function resetForm() {
  document.getElementById("editId").value = "";
  document.getElementById("fTitle").value = "";
  document.getElementById("fInstructor").value = "";
  document.getElementById("fPrice").value = "";
  document.getElementById("fDesc").value = "";
  document.getElementById("formTitle").textContent = "Add Course";
}

function showSection(id) {
  ["courseListSection","detailsSection","enrollmentsSection","adminSection"].forEach(s => {
    document.getElementById(s).style.display = s === id ? "block" : "none";
  });
}

displayCourses(loadCourses());