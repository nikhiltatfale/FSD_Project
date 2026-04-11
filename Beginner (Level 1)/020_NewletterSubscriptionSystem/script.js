const form = document.getElementById('sub-form');
const emailInput = document.getElementById('email');
const msg = document.getElementById('msg');

function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function showMsg(text, type) {
  msg.textContent = text;
  msg.className = 'msg show ' + type;
}

form.addEventListener('submit', function(e) {
  e.preventDefault();
  const email = emailInput.value.trim().toLowerCase();

  if (!email)              { showMsg('⚠️ Please enter your email.', 'error'); return; }
  if (!isValidEmail(email)){ showMsg('⚠️ Please enter a valid email.', 'error'); return; }

  const subscribers = JSON.parse(localStorage.getItem('subscribers') || '[]');
  if (subscribers.includes(email)) { showMsg('ℹ️ Already subscribed! Please login.', 'error'); return; }

  subscribers.push(email);
  localStorage.setItem('subscribers', JSON.stringify(subscribers));

  emailInput.value = '';
  showMsg('🎉 Subscribed! Redirecting to login…', 'success');
  setTimeout(() => { window.location.href = 'login.html'; }, 1200);
});

emailInput.addEventListener('input', () => { msg.className = 'msg'; msg.textContent = ''; });