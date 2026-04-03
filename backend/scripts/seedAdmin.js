/**
 * Non-interactive admin seeder — reads ADMIN_EMAIL and ADMIN_PASSWORD from .env
 * Run: node scripts/seedAdmin.js
 */
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import AdminUser from '../model/adminModel.js';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('✅ DB connected');

    const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = (process.env.ADMIN_PASSWORD || '').trim();
    const name = (process.env.ADMIN_NAME || 'Admin').trim();

    if (!email || !password) {
      console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
      process.exit(1);
    }

    const existing = await AdminUser.findOne({ email });
    if (existing) {
      console.log(`ℹ️  Admin already exists: ${existing.email} (role: ${existing.role})`);
      console.log('   Updating password from .env...');
      existing.password = await bcrypt.hash(password, 10);
      existing.status = 'active';
      await existing.save();
      console.log('✅ Admin password updated successfully!');
    } else {
      const hashed = await bcrypt.hash(password, 10);
      const admin = await AdminUser.create({
        email,
        name,
        password: hashed,
        role: 'super-admin',
        status: 'active',
        permissions: [
          'manage_products',
          'manage_orders',
          'manage_users',
          'view_stats',
          'manage_admins',
        ],
      });
      console.log(`✅ Admin created: ${admin.email} (role: ${admin.role})`);
    }

    console.log('\n📋 Login credentials:');
    console.log(`   Email   : ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🚀 You can now log in at the admin panel.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

run();
