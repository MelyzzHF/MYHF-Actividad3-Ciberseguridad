const express = require('express');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) { console.error('Define JWT_SECRET'); process.exit(1); }

const DB = 'users.json';
const load = () => fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB)) : [];
const save = (u) => fs.writeFileSync(DB, JSON.stringify(u, null, 2));

const app = express();
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'upgrade-insecure-requests': null
    }
  }
}));

app.use(express.json());
app.use(express.static('public'));
app.use('/api/verify-2fa', rateLimit({ windowMs: 60000, max: 10 }));

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });
  if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
  const users = load();
  if (users.find(u => u.username === username))
    return res.status(409).json({ error: 'El usuario ya existe' });

  const secret = authenticator.generateSecret();
  users.push({
    username,
    hash: await bcrypt.hash(password, 10),
    secret,
    role: 'user'   
  });
  save(users);

  const otpauth = authenticator.keyuri(username, 'Actividad3', secret);
  res.status(201).json({
    success: true,
    message: 'Usuario registrado. Configura tu Authenticator.',
    secret_key: secret,
    qr: await QRCode.toDataURL(otpauth),
    username
  });
});

app.post('/api/verify-2fa', async (req, res) => {
  const { username, password, token } = req.body || {};
  if (!username || !password || !token)
    return res.status(400).json({ error: 'Faltan datos o el código' });
  const user = load().find(u => u.username === username);
  const okPass = user && await bcrypt.compare(String(password), user.hash);
  const okCode = user && authenticator.check(String(token).trim(), user.secret);
  if (!okPass || !okCode)
    return res.status(401).json({ error: 'Credenciales o código incorrecto ❌' });

  const jwtToken = jwt.sign({ sub: user.username, role: user.role }, JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '15m' });
  res.json({ success: true, message: '¡Verificación exitosa! Acceso concedido 🚀', token: jwtToken, username: user.username });
});

// Middlewares JWT
function auth(req, res, next) {
  const [type, tk] = (req.headers.authorization || '').split(' ');
  if (type !== 'Bearer' || !tk) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(tk, JWT_SECRET, { algorithms: ['HS256'] });
    next();
  } catch { res.status(401).json({ error: 'Token inválido o expirado' }); }
}
const admin = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Permisos insuficientes' });

app.get('/api/welcome', auth, (req, res) => res.json({ message: `¡Bienvenido, ${req.user.sub}!` }));
app.get('/api/admin', auth, admin, (req, res) =>
  res.json({ message: 'Panel de administración', users: load().map(u => ({ username: u.username, role: u.role })) }));

app.listen(3000, () => console.log('http://localhost:3000'));