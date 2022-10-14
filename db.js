const db = new sqlite3.Database("jovian-database.db");
const sqlite3 = require("sqlite3");

db.run(
  "CREATE TABLE IF NOT EXISTS faqs (question TEXT, answer TEXT, id INTEGER PRIMARY KEY AUTOINCREMENT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS reviews (text TEXT, name TEXT, id INTEGER PRIMARY KEY AUTOINCREMENT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS bookings (booking TEXT, artist TEXT, project TEXT, email TEXT, id INTEGER PRIMARY KEY AUTOINCREMENT)"
);

db.run(
  "CREATE TABLE IF NOT EXISTS messages (name TEXT, email TEXT, subject TEXT, message TEXT, id INTEGER PRIMARY KEY AUTOINCREMENT)"
);
