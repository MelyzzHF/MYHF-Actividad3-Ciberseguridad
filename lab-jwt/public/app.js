const $ = (id) => document.getElementById(id);
const steps = ['step1', 'step2', 'step3', 'step4'];
let token = null;
let creds = null;  

const show = (id) => steps.forEach((s) => $(s).classList.toggle('hidden', s !== id));

function setMsg(el, text, ok = false) {
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'error');
}

async function api(url, options = {}) {
  try {
    const res = await fetch(url, options);
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: 'No se pudo conectar con el servidor' } };
  }
}

const postJson = (url, body) =>
  api(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

async function enterWelcome() {
  const r = await api('/api/welcome', { headers: { Authorization: 'Bearer ' + token } });
  $('welcomeMsg').textContent = r.ok ? r.data.message : r.data.error;
  $('adminMsg').textContent = '';
  show('step4');
}

// Paso 1: Registro
$('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('regMsg').textContent = '';
  const username = $('regUser').value.trim();
  const password = $('regPass').value;
  const r = await postJson('/api/register', { username, password });
  if (!r.ok) { setMsg($('regMsg'), r.data.error); return; }
  creds = { username, password };
  $('qrImage').src = r.data.qr;
  $('secretDisplay').textContent = r.data.secret_key;
  $('tokenCode').value = '';
  $('verifyMsg').textContent = '';
  show('step2');
});

// Paso 2: Verificación del código
$('verifyForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const r = await postJson('/api/verify-2fa', {
    username: creds.username,
    password: creds.password,
    token: $('tokenCode').value.trim()
  });
  if (!r.ok) {
    setMsg($('verifyMsg'), r.data.error);
    $('tokenCode').value = '';
    return;
  }
  token = r.data.token;
  creds = null;
  await enterWelcome();
});

// Login de cuentas existentes
$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const r = await postJson('/api/verify-2fa', {
    username: $('logUser').value.trim(),
    password: $('logPass').value,
    token: $('logCode').value.trim()
  });
  if (!r.ok) { setMsg($('logMsg'), r.data.error); $('logCode').value = ''; return; }
  token = r.data.token;
  $('loginForm').reset();
  await enterWelcome();
});

$('goLogin').addEventListener('click', (e) => { e.preventDefault(); show('step3'); });
$('goRegister').addEventListener('click', (e) => { e.preventDefault(); show('step1'); });

$('btnAdmin').addEventListener('click', async () => {
  const r = await api('/api/admin', { headers: { Authorization: 'Bearer ' + token } });
  setMsg($('adminMsg'), r.status + ' - ' + (r.data.message || r.data.error), r.ok);
});

$('btnLogout').addEventListener('click', () => {
  token = null;
  show('step3');
});