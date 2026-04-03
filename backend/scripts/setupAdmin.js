/**
 * Setup script to initialize first admin user
 * Run: node scripts/setupAdmin.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import AdminUser from '../model/adminModel.js';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('DB connected');
  } catch (error) {
    console.error('DB error:', error.message);
    process.exit(1);
  }
};

const readline = await import('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, (answer) => {
    resolve(answer);
  });
});

const setupAdmin = async () => {
  try {
    await connectDb();

    console.log('\n========================================');
    console.log('Admin Setup Script');
    console.log('========================================\n');

    // Check if admin already exists
    const existingAdmin = await AdminUser.findOne({});
    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Name: ${existingAdmin.name}`);
      console.log(`  Role: ${existingAdmin.role}`);
      console.log(`  Status: ${existingAdmin.status}\n`);
      
      const override = await question('Do you want to create another admin? (yes/no): ');
      if (override.toLowerCase() !== 'yes') {
        process.exit(0);
      }
    }

    // Get admin details
    const email = await question('Enter admin email: ');
    const name = await question('Enter admin name: ');
    const password = await question('Enter admin password (min 12 chars with uppercase, lowercase, number, special char): ');
    const role = await question('Enter admin role (admin/super-admin) [default: admin]: ') || 'admin';

    // Validation
    if (!email || !email.includes('@')) {
      console.log('\nError: Invalid email address');
      process.exit(1);
    }

    if (!name) {
      console.log('\nError: Name is required');
      process.exit(1);
    }

    if (password.length < 12) {
      console.log('\nError: Password must be at least 12 characters');
      process.exit(1);
    }

    // Check if email already used
    const existing = await AdminUser.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.log('\nError: Admin with this email already exists');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const admin = await AdminUser.create({
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      role,
      status: 'active',
      permissions: role === 'super-admin' 
        ? ['manage_products', 'manage_orders', 'manage_users', 'view_stats', 'manage_admins']
        : ['manage_products', 'manage_orders', 'manage_users', 'view_stats'],
    });

    console.log('\n========================================');
    console.log('Admin created successfully!');
    console.log('========================================');
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Role: ${admin.role}`);
    console.log(`Status: ${admin.status}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\nError:', error.message);
    process.exit(1);
  }
};

setupAdmin();
