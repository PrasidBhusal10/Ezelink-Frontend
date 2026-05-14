const API = 'http://localhost:8000';

const auth = {
  getToken:  () => localStorage.getItem('ez_token'),
  getEmail:  () => localStorage.getItem('ez_email'),
  isLoggedIn:() => !!localStorage.getItem('ez_token'),
  save(token, email) {
    localStorage.setItem('ez_token', token);
    localStorage.setItem('ez_email', email);
  },
  clear() {
    localStorage.removeItem('ez_token');
    localStorage.removeItem('ez_email');
  },
  headers() {
    const t = this.getToken();
    return { 'Content-Type':'application/json', ...(t ? {Authorization:`Bearer ${t}`} : {}) };
  }
};

const api = {
  async request(method, path, body=null) {
    const opts = { method, headers: auth.headers() };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(`${API}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.detail?.message || data.detail || `Error ${res.status}`;
      throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
    return data;
  },
  get:    path       => api.request('GET',    path),
  post:   (path, b)  => api.request('POST',   path, b),
  delete: path       => api.request('DELETE', path),
  async login(email, password) {
    const res  = await fetch(`${API}/auth/login`, { method:'POST', body: new URLSearchParams({username:email, password}) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    return data;
  }
};

function toast(msg, type='success', ms=3500) {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id='toast-container'; document.body.appendChild(c); }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transform='translateX(110%)'; el.style.transition='all 0.3s'; setTimeout(()=>el.remove(), 300); }, ms);
}

async function copyText(text, btn) {
  await navigator.clipboard.writeText(text);
  const orig = btn.innerHTML;
  btn.innerHTML = '✓ Copied!';
  btn.style.color = '#16a34a';
  setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; }, 2000);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), d = Math.floor(diff/86400000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

function truncate(str, n=50) { return str.length > n ? str.slice(0,n)+'…' : str; }

function requireAuth() {
  if (!auth.isLoggedIn()) { window.location.href='login.html'; return false; }
  return true;
}

function updateNav() {
  const in_ = auth.isLoggedIn();
  document.querySelectorAll('[data-auth="true"]').forEach(el  => el.style.display = in_ ? '' : 'none');
  document.querySelectorAll('[data-auth="false"]').forEach(el => el.style.display = in_ ? 'none' : '');
  const em = document.getElementById('nav-email');
  if (em) em.textContent = auth.getEmail() || '';
}

function logout() { auth.clear(); window.location.href='index.html'; }

function getSavedSlugs() { return JSON.parse(localStorage.getItem('ez_slugs') || '[]'); }
function saveSlug(slug) {
  const s = getSavedSlugs();
  if (!s.includes(slug)) { s.unshift(slug); localStorage.setItem('ez_slugs', JSON.stringify(s.slice(0,100))); }
}