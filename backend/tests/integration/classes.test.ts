
import request from 'supertest';
import { expect } from 'chai';
import mongoose from 'mongoose';
import { app } from '../../src/server.ts';
import { User } from '../../src/models/User.ts';
import { SuperAdmin } from '../../src/models/SuperAdmin.ts';
import { Teacher } from '../../src/models/Teacher.ts';
import { ClassModel } from '../../src/models/Class.ts';
import { SubjectModel } from '../../src/models/Subject.ts';

describe('Class and Subject Management API', () => {
    let superAdminToken: string;
    let teacherId: string;
    let classId: string;
    let subjectId: string;

    before(async () => {
        // Setup SuperAdmin for authentication
        const superAdminUser = await User.create({
            email: 'superadmin_test_class@example.com',
            password: 'password123',
            role: 'superadmin',
            phone: '1234567890',
            instituteEmail: 'admin_test_class@institute.com'
        });

        await SuperAdmin.create({
            userId: superAdminUser._id,
            firstName: 'Super',
            lastName: 'Admin',
            adminId: 'SA002',
            email: superAdminUser.email,
            phone: superAdminUser.phone,
            instituteEmail: superAdminUser.instituteEmail
        });

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'superadmin_test_class@example.com', password: 'password123' });

        superAdminToken = res.body.token;

        // Setup a Teacher for assignment
        const teacherUser = await User.create({
            email: 'teacher_test_class@example.com',
            password: 'password123',
            role: 'teacher',
            phone: '0987654321',
            instituteEmail: 'teacher_test_class@institute.com'
        });

        const teacher = await Teacher.create({
            userId: teacherUser._id,
            firstName: 'Test',
            lastName: 'Teacher',
            teacherId: 'T002',
            email: teacherUser.email,
            phone: teacherUser.phone,
            instituteEmail: teacherUser.instituteEmail,
            department: 'Science'
        });
        teacherId = teacher._id.toString();
    });

    after(async () => {
        await User.deleteMany({ email: { $in: ['superadmin_test_class@example.com', 'teacher_test_class@example.com'] } });
        await SuperAdmin.deleteMany({ email: 'superadmin_test_class@example.com' });
        await Teacher.deleteMany({ email: 'teacher_test_class@example.com' });
        await ClassModel.deleteMany({});
        await SubjectModel.deleteMany({});
    });

    describe('Class API', () => {
        it('should create a new class', async () => {
            const res = await request(app)
                .post('/api/classes')
                .set('Cookie', `token=${superAdminToken}`)
                .send({
                    className: 'Grade 10',
                    classCode: 'G10-A',
                    section: 'A',
                    academicYear: '2024-2025',
                    classTeacherId: teacherId
                });

            expect(res.status).to.equal(201);
            expect(res.body.data.className).to.equal('Grade 10');
            classId = res.body.data._id;
        });

        it('should get all classes', async () => {
            const res = await request(app)
                .get('/api/classes')
                .set('Cookie', `token=${superAdminToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.classes).to.be.an('array');
            expect(res.body.classes.some((c: any) => c.classCode === 'G10-A')).to.be.true;
        });

        it('should update a class', async () => {
            const res = await request(app)
                .patch(`/api/classes/${classId}`)
                .set('Cookie', `token=${superAdminToken}`)
                .send({ className: 'Grade 10 Updated' });

            expect(res.status).to.equal(200);
            expect(res.body.data.className).to.equal('Grade 10 Updated');
        });
    });

    describe('Subject API', () => {
        it('should create a new subject', async () => {
            const res = await request(app)
                .post('/api/subjects')
                .set('Cookie', `token=${superAdminToken}`)
                .send({
                    subjectName: 'Physics',
                    subjectCode: 'PHY101',
                    credits: 4,
                    classId: classId,
                    teacherId: teacherId
                });

            expect(res.status).to.equal(201);
            expect(res.body.data.subjectName).to.equal('Physics');
            subjectId = res.body.data._id;
        });

        it('should get all subjects', async () => {
            const res = await request(app)
                .get('/api/subjects')
                .set('Cookie', `token=${superAdminToken}`);

            expect(res.status).to.equal(200);
            expect(res.body.subjects).to.be.an('array');
            expect(res.body.subjects.some((s: any) => s.subjectCode === 'PHY101')).to.be.true;
        });

        it('should update a subject', async () => {
            const res = await request(app)
                .patch(`/api/subjects/${subjectId}`)
                .set('Cookie', `token=${superAdminToken}`)
                .send({ subjectName: 'Physics Advanced' });

            expect(res.status).to.equal(200);
            expect(res.body.data.subjectName).to.equal('Physics Advanced');
        });

        it('should delete a subject', async () => {
            const res = await request(app)
                .delete(`/api/subjects/${subjectId}`)
                .set('Cookie', `token=${superAdminToken}`);

            expect(res.status).to.equal(200);
            const check = await SubjectModel.findById(subjectId);
            expect(check).to.be.null;
        });
    });

    describe('Class API - Delete', () => {
        it('should delete a class', async () => {
            const res = await request(app)
                .delete(`/api/classes/${classId}`)
                .set('Cookie', `token=${superAdminToken}`);

            expect(res.status).to.equal(200);
            const check = await ClassModel.findById(classId);
            expect(check).to.be.null;
        });
    });
});
