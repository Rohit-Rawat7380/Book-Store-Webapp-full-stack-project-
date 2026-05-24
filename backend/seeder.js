const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Book = require('./src/books/book.model');
const User = require('./src/users/user.model');

const DB = process.env.DB_URL;

if (!DB) {
  console.error('DB_URL is not set in environment. Seeder aborted.');
  process.exit(1);
}

const booksFile = path.resolve(__dirname, '../frontend/public/books.json');

async function run() {
  try {
    const raw = fs.readFileSync(booksFile, 'utf-8');
    const data = JSON.parse(raw);

    await mongoose.connect(DB);
    console.log('Connected to MongoDB for seeding.');

    // Remove existing books to avoid duplicates
    await Book.deleteMany({});

    // Normalize entries (remove _id to let MongoDB create ObjectId)
    const docs = data.map(({ _id, ...rest }) => rest);

    const inserted = await Book.insertMany(docs);
    console.log(`Inserted ${inserted.length} books.`);
    // Create default admin if not exists
    const adminUsername = 'admin';
    const adminPassword = 'Admin@123';
    const existingAdmin = await User.findOne({ username: adminUsername });
    if (!existingAdmin) {
      const admin = new User({ username: adminUsername, password: adminPassword, role: 'admin' });
      await admin.save();
      console.log(`Created admin user: ${adminUsername} / ${adminPassword}`);
    } else {
      console.log('Admin user already exists');
    }
    await mongoose.disconnect();
    console.log('Seeding complete. Disconnected.');
    process.exit(0);
  } catch (err) {
    console.error('Seeder error:', err);
    process.exit(1);
  }
}

run();
