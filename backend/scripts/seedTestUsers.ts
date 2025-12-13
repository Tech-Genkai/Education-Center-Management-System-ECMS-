import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.ts';
import { User } from '../src/models/User.ts';
import { Student } from '../src/models/Student.ts';
import { Teacher } from '../src/models/Teacher.ts';
import { Parent } from '../src/models/Parent.ts';

async function createOrUpdateUser({ email, instituteEmail, phone, password, role }: { email: string; instituteEmail: string; phone: string; password: string; role: 'student' | 'teacher' | 'superadmin'; }) {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedInstitute = instituteEmail.toLowerCase().trim();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = new User({ email: normalizedEmail, instituteEmail: normalizedInstitute, phone, password, role, isActive: true });
  } else {
    user.email = normalizedEmail;
    user.instituteEmail = normalizedInstitute;
    user.phone = phone;
    if (password) user.password = password; // will re-hash in pre-save
    user.role = role;
    user.isActive = true;
  }

  await user.save();
  return user;
}

async function seed() {
  await connectDatabase(process.env.MONGODB_URI, 'ecms-seed');

  const studentUser = await createOrUpdateUser({
    email: 'student@test.com',
    instituteEmail: 'student@scms.edu',
    phone: '+10000000001',
    password: 'Student@123',
    role: 'student'
  });

  const teacherUser = await createOrUpdateUser({
    email: 'teacher@test.com',
    instituteEmail: 'teacher@scms.edu',
    phone: '+10000000002',
    password: 'Teacher@123',
    role: 'teacher'
  });

  const adminUser = await createOrUpdateUser({
    email: 'admin@test.com',
    instituteEmail: 'admin@scms.edu',
    phone: '+10000000003',
    password: 'Admin@123',
    role: 'superadmin'
  });

  await Student.findOneAndUpdate(
    { userId: studentUser._id },
    {
      userId: studentUser._id,
      studentId: 'S-1001',
      firstName: 'Test',
      lastName: 'Student',
      email: studentUser.email,
      instituteEmail: studentUser.instituteEmail,
      phone: studentUser.phone,
      status: 'active'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Teacher.findOneAndUpdate(
    { userId: teacherUser._id },
    {
      userId: teacherUser._id,
      teacherId: 'T-1001',
      firstName: 'Test',
      lastName: 'Teacher',
      email: teacherUser.email,
      instituteEmail: teacherUser.instituteEmail,
      phone: teacherUser.phone,
      status: 'active'
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Parent login is not currently supported by the User role enum; we still create a Parent record linked to the student
  await Parent.findOneAndUpdate(
    { guardianId: 'P-1001' },
    {
      userId: studentUser._id,
      guardianId: 'P-1001',
      firstName: 'Test',
      lastName: 'Parent',
      relationship: 'guardian',
      email: 'parent@test.com',
      phone: '+10000000004',
      wards: [studentUser._id]
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log('Seed complete:', {
    student: studentUser.email,
    teacher: teacherUser.email,
    admin: adminUser.email,
    parent: 'parent@test.com (record only, no login role)'
  });
}

seed()
  .then(() => disconnectDatabase())
  .then(() => mongoose.disconnect())
  .catch((err) => {
    console.error('Seed failed', err);
    return disconnectDatabase().finally(() => mongoose.disconnect()).finally(() => process.exit(1));
  });
