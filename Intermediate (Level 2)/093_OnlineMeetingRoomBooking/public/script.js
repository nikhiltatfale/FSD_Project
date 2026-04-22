// Global Variables
let adminToken = null;
let rooms = [];
let bookings = [];

// API Base URL
const API_URL = 'http://localhost:3000';

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  loadRooms();
  setupEventListeners();
  setMinDateToToday();
});

// Event Listeners
function setupEventListeners() {
  // Admin Toggle
  document.getElementById('adminLoginBtn').addEventListener('click', toggleAdminPanel);

  // Booking Form
  document.getElementById('bookingForm').addEventListener('submit', handleBooking);
  document.getElementById('roomSelect').addEventListener('change', checkAvailability);
  document.getElementById('bookingDate').addEventListener('change', checkAvailability);
  document.getElementById('startTime').addEventListener('change', checkAvailability);
  document.getElementById('endTime').addEventListener('change', checkAvailability);

  // My Bookings
  document.getElementById('loadMyBookings').addEventListener('click', loadMyBookings);

  // Admin Login
  document.getElementById('loginForm').addEventListener('submit', handleAdminLogin);

  // Admin Logout
  document.getElementById('adminLogout').addEventListener('click', handleAdminLogout);

  // Add Room
  document.getElementById('addRoomForm').addEventListener('submit', handleAddRoom);

  // Block Slot
  document.getElementById('blockSlotForm').addEventListener('submit', handleBlockSlot);

  // Load All Bookings
  document.getElementById('loadAllBookings').addEventListener('click', loadAllBookings);
}

// ===== ROOM MANAGEMENT =====

async function loadRooms() {
  try {
    const response = await fetch(`${API_URL}/rooms`);
    rooms = await response.json();
    
    // Populate room select dropdown
    const roomSelect = document.getElementById('roomSelect');
    const blockRoomSelect = document.getElementById('blockRoomSelect');
    
    roomSelect.innerHTML = '<option value="">-- Choose a room --</option>';
    blockRoomSelect.innerHTML = '<option value="">-- Choose a room --</option>';
    
    rooms.forEach(room => {
      const option = document.createElement('option');
      option.value = room.id;
      option.textContent = room.name;
      roomSelect.appendChild(option);
      blockRoomSelect.appendChild(option.cloneNode(true));
    });

    displayRooms();
  } catch (error) {
    console.error('Error loading rooms:', error);
  }
}

function displayRooms() {
  const roomList = document.getElementById('roomList');
  roomList.innerHTML = '';

  if (rooms.length === 0) {
    roomList.innerHTML = '<div class="empty-state"><p>No rooms available</p></div>';
    return;
  }

  rooms.forEach(room => {
    const card = document.createElement('div');
    card.className = 'room-card';
    card.innerHTML = `
      <h3>${room.name}</h3>
      <p><strong>Capacity:</strong> <span class="capacity">${room.capacity} people</span></p>
      <p><strong>Facilities:</strong></p>
      <div class="facilities">
        ${room.facilities.length > 0 ? 
          room.facilities.map(f => `<span class="facility-tag">${f}</span>`).join('') : 
          '<span style="color: #999;">None</span>'
        }
      </div>
    `;
    roomList.appendChild(card);
  });
}

// ===== BOOKING MANAGEMENT =====

async function checkAvailability() {
  const roomId = document.getElementById('roomSelect').value;
  const date = document.getElementById('bookingDate').value;
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;
  const availabilityInfo = document.getElementById('availabilityInfo');

  if (!roomId || !date) {
    availabilityInfo.innerHTML = '';
    return;
  }

  if (startTime && endTime) {
    if (startTime >= endTime) {
      availabilityInfo.innerHTML = '<div class="info-box error">End time must be after start time</div>';
      return;
    }
  }

  try {
    const response = await fetch(`${API_URL}/availability?roomId=${roomId}&date=${date}`);
    const data = await response.json();

    const selectedRoom = rooms.find(r => r.id == roomId);
    if (selectedRoom) {
      availabilityInfo.innerHTML = `<div class="info-box success">✓ Room "${selectedRoom.name}" is available for booking</div>`;
    }
  } catch (error) {
    console.error('Error checking availability:', error);
  }
}

async function handleBooking(e) {
  e.preventDefault();

  const userName = document.getElementById('userName').value;
  const roomId = document.getElementById('roomSelect').value;
  const date = document.getElementById('bookingDate').value;
  const startTime = document.getElementById('startTime').value;
  const endTime = document.getElementById('endTime').value;

  if (!userName || !roomId || !date || !startTime || !endTime) {
    alert('All fields are required');
    return;
  }

  if (startTime >= endTime) {
    alert('End time must be after start time');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: parseInt(roomId), userName, date, startTime, endTime })
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✓ Booking confirmed!\nBooking ID: ${data.id}`);
      document.getElementById('bookingForm').reset();
      document.getElementById('availabilityInfo').innerHTML = '';
      setMinDateToToday();
    } else {
      alert(`✗ Booking failed: ${data.error}`);
    }
  } catch (error) {
    console.error('Booking error:', error);
    alert('Error booking room');
  }
}

async function loadMyBookings() {
  const userName = document.getElementById('filterUserName').value;

  if (!userName) {
    alert('Please enter your name');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/bookings?userName=${encodeURIComponent(userName)}`);
    const bookings = await response.json();

    displayBookings(bookings, 'myBookingsList', true);
  } catch (error) {
    console.error('Error loading bookings:', error);
  }
}

async function loadAllBookings() {
  if (!adminToken) {
    alert('Not authenticated');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/admin/bookings`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!response.ok) {
      alert('Unauthorized');
      return;
    }

    const bookings = await response.json();
    displayBookings(bookings, 'adminBookingsList', false);
  } catch (error) {
    console.error('Error loading bookings:', error);
  }
}

function displayBookings(bookingsList, elementId, showCancel) {
  const container = document.getElementById(elementId);
  container.innerHTML = '';

  if (bookingsList.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No bookings found</p></div>';
    return;
  }

  const table = document.createElement('table');
  table.innerHTML = `
    <thead>
      <tr>
        <th>Booking ID</th>
        <th>Room Name</th>
        <th>User Name</th>
        <th>Date</th>
        <th>Time</th>
        ${showCancel ? '<th>Action</th>' : ''}
      </tr>
    </thead>
    <tbody>
      ${bookingsList.map(booking => `
        <tr>
          <td>${booking.id}</td>
          <td>${booking.roomName}</td>
          <td>${booking.userName}</td>
          <td>${booking.date}</td>
          <td>${booking.startTime} - ${booking.endTime}</td>
          ${showCancel ? `<td><button class="btn-cancel" onclick="cancelBooking('${booking.id}')">Cancel</button></td>` : ''}
        </tr>
      `).join('')}
    </tbody>
  `;

  container.appendChild(table);
}

async function cancelBooking(bookingId) {
  if (!confirm('Are you sure you want to cancel this booking?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/bookings/${bookingId}`, { method: 'DELETE' });
    const data = await response.json();

    if (response.ok) {
      alert('✓ Booking cancelled');
      // Reload bookings
      if (document.getElementById('filterUserName').value) {
        loadMyBookings();
      }
      if (adminToken) {
        loadAllBookings();
      }
    } else {
      alert(`✗ Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
  }
}

// ===== ADMIN FUNCTIONS =====

function toggleAdminPanel() {
  const panel = document.getElementById('adminPanel');
  panel.classList.toggle('hidden');
}

async function handleAdminLogin(e) {
  e.preventDefault();

  const username = document.getElementById('adminUsername').value;
  const password = document.getElementById('adminPassword').value;

  try {
    const response = await fetch(`${API_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok) {
      adminToken = data.token;
      document.getElementById('adminLoginForm').classList.add('hidden');
      document.getElementById('adminDashboard').classList.remove('hidden');
      loadAdminData();
    } else {
      alert('Invalid credentials');
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}

async function handleAdminLogout() {
  try {
    await fetch(`${API_URL}/admin/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
  } catch (error) {
    console.error('Logout error:', error);
  }

  adminToken = null;
  document.getElementById('adminLoginForm').classList.remove('hidden');
  document.getElementById('adminDashboard').classList.add('hidden');
  document.getElementById('adminUsername').value = '';
  document.getElementById('adminPassword').value = '';
}

async function handleAddRoom(e) {
  e.preventDefault();

  const name = document.getElementById('newRoomName').value;
  const capacity = document.getElementById('newRoomCapacity').value;
  const facilitiesInput = document.getElementById('newRoomFacilities').value;
  const facilities = facilitiesInput.split(',').map(f => f.trim()).filter(f => f);

  try {
    const response = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name, capacity: parseInt(capacity), facilities })
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✓ Room "${data.name}" added successfully`);
      document.getElementById('addRoomForm').reset();
      loadRooms();
      loadAdminData();
    } else {
      alert(`✗ Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Add room error:', error);
  }
}

async function handleBlockSlot(e) {
  e.preventDefault();

  const roomId = document.getElementById('blockRoomSelect').value;
  const date = document.getElementById('blockDate').value;
  const startTime = document.getElementById('blockStartTime').value;
  const endTime = document.getElementById('blockEndTime').value;

  if (startTime >= endTime) {
    alert('End time must be after start time');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/block`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ roomId: parseInt(roomId), date, startTime, endTime })
    });

    const data = await response.json();

    if (response.ok) {
      alert('✓ Time slot blocked');
      document.getElementById('blockSlotForm').reset();
    } else {
      alert(`✗ Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Block slot error:', error);
  }
}

async function loadAdminData() {
  // Load rooms for admin
  loadRooms();
  
  // Load all bookings
  loadAllBookings();
  
  // Load statistics
  loadStats();
}

function displayAdminRooms() {
  const adminRoomList = document.getElementById('adminRoomList');
  adminRoomList.innerHTML = '';

  if (rooms.length === 0) {
    adminRoomList.innerHTML = '<div class="empty-state"><p>No rooms</p></div>';
    return;
  }

  rooms.forEach(room => {
    const item = document.createElement('div');
    item.className = 'admin-room-item';
    item.innerHTML = `
      <div class="admin-room-item-info">
        <h4>${room.name}</h4>
        <p><strong>Capacity:</strong> ${room.capacity}</p>
        <p><strong>Facilities:</strong> ${room.facilities.length > 0 ? room.facilities.join(', ') : 'None'}</p>
      </div>
      <div class="admin-room-item-actions">
        <button class="btn btn-edit btn-small" onclick="editRoom(${room.id})">Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteRoom(${room.id})">Delete</button>
      </div>
    `;
    adminRoomList.appendChild(item);
  });
}

async function deleteRoom(roomId) {
  if (!confirm('Delete this room? All related bookings will be removed.')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/rooms/${roomId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const data = await response.json();

    if (response.ok) {
      alert('✓ Room deleted');
      loadRooms();
      loadAdminData();
    } else {
      alert(`✗ Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Delete error:', error);
  }
}

function editRoom(roomId) {
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;

  const newName = prompt('Room Name:', room.name);
  if (newName === null) return;

  const newCapacity = prompt('Capacity:', room.capacity);
  if (newCapacity === null) return;

  const newFacilities = prompt('Facilities (comma separated):', room.facilities.join(', '));
  if (newFacilities === null) return;

  updateRoom(roomId, newName, parseInt(newCapacity), newFacilities.split(',').map(f => f.trim()));
}

async function updateRoom(roomId, name, capacity, facilities) {
  try {
    const response = await fetch(`${API_URL}/rooms/${roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ name, capacity, facilities })
    });

    const data = await response.json();

    if (response.ok) {
      alert(`✓ Room updated`);
      loadRooms();
      displayAdminRooms();
    } else {
      alert(`✗ Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Update error:', error);
  }
}

async function loadStats() {
  if (!adminToken) return;

  try {
    const response = await fetch(`${API_URL}/admin/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    const stats = await response.json();
    displayStats(stats);
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function displayStats(stats) {
  const statsContainer = document.getElementById('statsContainer');
  statsContainer.innerHTML = '';

  const cards = [
    { label: 'Total Rooms', value: stats.totalRooms },
    { label: 'Total Bookings', value: stats.totalBookings },
    { label: 'Blocked Slots', value: stats.totalBlockedSlots }
  ];

  cards.forEach(card => {
    const cardEl = document.createElement('div');
    cardEl.className = 'stat-card';
    cardEl.innerHTML = `
      <h4>${card.label}</h4>
      <div class="stat-value">${card.value}</div>
    `;
    statsContainer.appendChild(cardEl);
  });

  if (stats.bookingsByRoom.length > 0) {
    const heading = document.createElement('h4');
    heading.style.marginTop = '20px';
    heading.textContent = 'Bookings by Room:';
    statsContainer.appendChild(heading);

    stats.bookingsByRoom.forEach(room => {
      const card = document.createElement('div');
      card.className = 'stat-card';
      card.innerHTML = `
        <h4>${room.roomName}</h4>
        <div class="stat-value">${room.bookingCount}</div>
      `;
      statsContainer.appendChild(card);
    });
  }
}

// Update admin rooms display when admin logs in
function updateAdminUI() {
  displayAdminRooms();
}

// Hook into loadAdminData to update room display
const originalLoadAdminData = loadAdminData;
loadAdminData = function() {
  originalLoadAdminData();
  setTimeout(() => displayAdminRooms(), 100);
};

// ===== UTILITY FUNCTIONS =====

function setMinDateToToday() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('bookingDate').setAttribute('min', today);
  document.getElementById('blockDate').setAttribute('min', today);
}
