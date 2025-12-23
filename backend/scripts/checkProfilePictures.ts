import mongoose from 'mongoose';
import { SuperAdmin } from '../src/models/SuperAdmin.js';
import { User } from '../src/models/User.js';
import { UserProfile } from '../src/models/UserProfile.js';
import { ClassModel } from '../src/models/Class.js';

const checkProfilePictures = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ecms';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Check classes and their subjects
    console.log('📚 Checking Classes and Subjects:');
    console.log('='.repeat(80));

    const classes = await ClassModel.find().populate('subjects', 'subjectName subjectCode').lean();

    for (const cls of classes) {
      console.log(`\n📖 Class: ${cls.className} (${cls.classCode})`);
      console.log(`   Academic Year: ${cls.academicYear}`);
      console.log(`   Subjects: ${cls.subjects && cls.subjects.length > 0
        ? cls.subjects.map((s: any) => `${s.subjectName} (${s.subjectCode})`).join(', ')
        : 'No subjects assigned'}`);
      console.log(`   Subjects Array: ${JSON.stringify(cls.subjects?.map((s: any) => s._id) || [])}`);
    }

    console.log('\n' + '='.repeat(80));

    // Fetch all SuperAdmins
    const superAdmins = await SuperAdmin.find().lean();

    console.log(`\n👥 Found ${superAdmins.length} SuperAdmin accounts:\n`);
    console.log('='.repeat(80));

    for (const admin of superAdmins) {
      console.log(`\n👤 SuperAdmin: ${admin.firstName} ${admin.lastName}`);
      console.log(`   Admin ID: ${admin.adminId}`);
      console.log(`   User ID: ${admin.userId}`);
      console.log(`   SuperAdmin.profilePicture: ${admin.profilePicture}`);

      // Check User model
      const user = await User.findById(admin.userId).lean();
      if (user) {
        console.log(`   User.profilePicture: ${user.profilePicture || 'Not set'}`);
        console.log(`   User.email: ${user.email}`);
      } else {
        console.log(`   ⚠️  User document not found!`);
      }

      // Check UserProfile model
      const userProfile = await UserProfile.findOne({ userId: admin.userId }).lean();
      if (userProfile) {
        console.log(`   UserProfile.profilePicture.url: ${userProfile.profilePicture?.url || 'Not set'}`);
        console.log(`   UserProfile.profilePicture.gridfsFileId: ${userProfile.profilePicture?.gridfsFileId || 'Not set'}`);
      } else {
        console.log(`   ℹ️  UserProfile document not found`);
      }

      console.log('-'.repeat(80));
    }

    console.log('\n✅ Check complete');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

checkProfilePictures();
