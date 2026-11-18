import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD?.trim();
const name = process.env.ADMIN_NAME?.trim() || 'SONIQ Administrator';

if (!email || !password) {
  console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
  process.exit(1);
}

const dataDir = path.join(process.cwd(), 'data');
fs.mkdirSync(dataDir, { recursive: true });
const db = new DatabaseSync(path.join(dataDir, 'soniq.db'));

const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
const hash = bcrypt.hashSync(password, 12);
const now = new Date().toISOString();

if (existing) {
  db.prepare("UPDATE users SET name = ?, passwordHash = ?, role = 'ADMIN', isBlocked = 0, updatedAt = ? WHERE email = ?").run(
    name,
    hash,
    now,
    email
  );
  console.log(`Updated existing admin user: ${email}`);
} else {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
  db.prepare(`
    INSERT INTO users (id, name, email, passwordHash, role, phone, isBlocked, addressesJson, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, 'ADMIN', '', 0, '[]', ?, ?)
  `).run(id, name, email, hash, now, now);
  console.log(`Seeded new admin user: ${email}`);
}
