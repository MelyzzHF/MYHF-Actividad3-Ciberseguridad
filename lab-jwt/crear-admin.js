const fs = require('fs');
const bcrypt = require('bcryptjs');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');

const [username, password] = process.argv.slice(2);
if (!username || !password || password.length < 8) {
  console.error('Uso: node crear-admin.js <usuario> <contraseña (mín. 8)>');
  process.exit(1);
}

const DB = 'users.json';
const users = fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB)) : [];
if (users.find((u) => u.username === username)) {
  console.error('Ese usuario ya existe');
  process.exit(1);
}

const secret = authenticator.generateSecret();
users.push({ username, hash: bcrypt.hashSync(password, 10), secret, role: 'admin' });
fs.writeFileSync(DB, JSON.stringify(users, null, 2));

const uri = authenticator.keyuri(username, 'Actividad3', secret);
QRCode.toFile('admin-qr.png', uri).then(() => {
  console.log('Admin creado. Escanea admin-qr.png con Google Authenticator.');
  console.log('Llave manual:', secret);
});