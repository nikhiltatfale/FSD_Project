const api = async (url, method = 'GET', body) => {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  return res.json();
};

const showMsg = (el, text, type) => { el.textContent = text; el.className = 'msg ' + type; el.style.display = 'block'; };
const hideMsg = el => { el.style.display = 'none'; };

// ---- ROOMS PAGE ----
if (document.getElementById('rooms-container')) {
  const params = new URLSearchParams(location.search);
  const checkIn = params.get('checkIn'), checkOut = params.get('checkOut');

  const renderRooms = async () => {
    const rooms = await api('/api/rooms');
    let available = rooms;
    if (checkIn && checkOut) {
      const results = await Promise.all(rooms.map(r =>
        api('/api/check-availability', 'POST', { roomId: r.id, checkIn, checkOut })
          .then(res => ({ room: r, available: res.available }))
      ));
      available = results.filter(x => x.available).map(x => x.room);
    }
    const el = document.getElementById('rooms-container');
    if (!available.length) { el.innerHTML = '<p>No rooms available for selected dates.</p>'; return; }
    el.innerHTML = available.map(r => `
      <div class="room-card">
        <img src="${r.image || 'https://via.placeholder.com/400x180?text=Room'}" alt="${r.type}" onerror="this.src='https://via.placeholder.com/400x180?text=Room'">
        <div class="room-info">
          <h3>Room ${r.number}</h3>
          <div class="type">${r.type}</div>
          <div class="price">₹${r.price}<span style="font-size:13px;color:#888;font-weight:normal">/night</span></div>
          <a class="btn btn-gold" href="booking.html?roomId=${r.id}&checkIn=${checkIn || ''}&checkOut=${checkOut || ''}">Book Now</a>
        </div>
      </div>`).join('');
  };
  renderRooms();

  const form = document.getElementById('avail-form');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const ci = document.getElementById('ci').value, co = document.getElementById('co').value;
    location.href = `rooms.html?checkIn=${ci}&checkOut=${co}`;
  });

  if (checkIn) {
    document.getElementById('ci').value = checkIn;
    document.getElementById('co').value = checkOut;
  }
}

// ---- BOOKING PAGE ----
if (document.getElementById('booking-form')) {
  const params = new URLSearchParams(location.search);
  const roomId = params.get('roomId'), checkIn = params.get('checkIn'), checkOut = params.get('checkOut');

  const loadRoom = async () => {
    if (!roomId) return;
    const rooms = await api('/api/rooms');
    const room = rooms.find(r => r.id == roomId);
    if (room) {
      document.getElementById('room-select').value = roomId;
      document.getElementById('room-info').textContent = `Room ${room.number} - ${room.type} - ₹${room.price}/night`;
    }
    if (checkIn) document.getElementById('checkIn').value = checkIn;
    if (checkOut) document.getElementById('checkOut').value = checkOut;
  };

  const fillRoomSelect = async () => {
    const rooms = await api('/api/rooms');
    const sel = document.getElementById('room-select');
    sel.innerHTML = '<option value="">-- Select Room --</option>' +
      rooms.map(r => `<option value="${r.id}">Room ${r.number} - ${r.type} - ₹${r.price}</option>`).join('');
  };

  fillRoomSelect().then(loadRoom);

  document.getElementById('check-avail-btn').addEventListener('click', async () => {
    const rId = document.getElementById('room-select').value;
    const ci = document.getElementById('checkIn').value;
    const co = document.getElementById('checkOut').value;
    const result = document.getElementById('availability-result');
    if (!rId || !ci || !co) { result.textContent = 'Select room and dates first.'; result.className = 'avail-no'; return; }
    const res = await api('/api/check-availability', 'POST', { roomId: rId, checkIn: ci, checkOut: co });
    result.textContent = res.available ? '✓ Available for selected dates' : '✗ Room not available for these dates';
    result.className = res.available ? 'avail-ok' : 'avail-no';
  });

  document.getElementById('booking-form').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = document.getElementById('booking-msg');
    const data = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      roomId: document.getElementById('room-select').value,
      checkIn: document.getElementById('checkIn').value,
      checkOut: document.getElementById('checkOut').value
    };
    const res = await api('/api/book', 'POST', data);
    if (res.error) { showMsg(msg, res.error, 'error'); return; }
    showMsg(msg, `Booking confirmed! Your Booking ID: ${res.id}`, 'success');
    e.target.reset();
    document.getElementById('availability-result').textContent = '';
  });
}

// ---- ADMIN PAGE ----
if (document.getElementById('admin-panel')) {
  const ADMIN_USER = 'admin', ADMIN_PASS = 'admin123';
  const loginSection = document.getElementById('login-section');
  const adminPanel = document.getElementById('admin-panel');
  const msg = document.getElementById('login-msg');

  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const u = document.getElementById('uname').value, p = document.getElementById('pwd').value;
    if (u === ADMIN_USER && p === ADMIN_PASS) {
      loginSection.style.display = 'none';
      adminPanel.style.display = 'block';
      loadRooms();
      loadBookings();
    } else {
      showMsg(msg, 'Invalid credentials', 'error');
    }
  });

  let editId = null;

  const loadRooms = async () => {
    const rooms = await api('/api/rooms');
    document.getElementById('rooms-table').innerHTML = rooms.map(r => `
      <tr>
        <td>${r.number}</td><td>${r.type}</td><td>₹${r.price}</td>
        <td>
          <button class="btn btn-sm" onclick="editRoom(${r.id})">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteRoom(${r.id})" style="margin-left:6px">Delete</button>
        </td>
      </tr>`).join('');
  };

  const loadBookings = async () => {
    const bookings = await api('/api/bookings');
    document.getElementById('bookings-table').innerHTML = bookings.length
      ? bookings.map(b => `<tr><td>${b.id}</td><td>${b.name}</td><td>${b.email}</td><td>${b.roomId}</td><td>${b.checkIn}</td><td>${b.checkOut}</td></tr>`).join('')
      : '<tr><td colspan="6" style="text-align:center;color:#888">No bookings yet</td></tr>';
  };

  window.deleteRoom = async id => {
    if (!confirm('Delete this room?')) return;
    await api('/api/rooms/' + id, 'DELETE');
    loadRooms();
  };

  window.editRoom = async id => {
    const rooms = await api('/api/rooms');
    const r = rooms.find(x => x.id === id);
    if (!r) return;
    editId = id;
    document.getElementById('r-number').value = r.number;
    document.getElementById('r-type').value = r.type;
    document.getElementById('r-price').value = r.price;
    document.getElementById('r-image').value = r.image || '';
    document.getElementById('room-form-title').textContent = 'Edit Room';
    document.getElementById('submit-btn').textContent = 'Update Room';
  };

  document.getElementById('room-form').addEventListener('submit', async e => {
    e.preventDefault();
    const formMsg = document.getElementById('form-msg');
    const data = {
      number: document.getElementById('r-number').value,
      type: document.getElementById('r-type').value,
      price: document.getElementById('r-price').value,
      image: document.getElementById('r-image').value
    };
    let res;
    if (editId) {
      res = await api('/api/rooms/' + editId, 'PUT', data);
    } else {
      res = await api('/api/rooms', 'POST', data);
    }
    if (res.error) { showMsg(formMsg, res.error, 'error'); return; }
    showMsg(formMsg, editId ? 'Room updated!' : 'Room added!', 'success');
    editId = null;
    document.getElementById('room-form').reset();
    document.getElementById('room-form-title').textContent = 'Add New Room';
    document.getElementById('submit-btn').textContent = 'Add Room';
    loadRooms();
  });

  document.getElementById('cancel-edit').addEventListener('click', () => {
    editId = null;
    document.getElementById('room-form').reset();
    document.getElementById('room-form-title').textContent = 'Add New Room';
    document.getElementById('submit-btn').textContent = 'Add Room';
    hideMsg(document.getElementById('form-msg'));
  });
}