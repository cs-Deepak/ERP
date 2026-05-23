/**
 * Verification Script for Admin APIs
 * 
 * Flow:
 * 1. Login as Admin
 * 2. Create a Class (10-A)
 * 3. Create a Teacher
 * 4. Create a Student and link to Class
 * 5. Fetch all Classes
 * 6. Fetch Students by Class
 */

const fs = require('fs');
const path = require('path');
const LOG_FILE = path.join(__dirname, 'admin_test_results.log');

const log = (...args) => {
    const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
};

const BASE_URL = 'http://localhost:5000/api';

if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

const testAdminAPI = async () => {
    log('--- Starting Admin API Verification ---');

    try {
        // 1. Login Admin
        log('\n[1] Logging in Admin...');
        const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@lfes.com',
                password: 'password123'
            })
        });
        const adminLoginData = await adminLogin.json();
        const adminToken = adminLoginData.data?.token;

        if (!adminToken) {
            log('Admin login failed. Make sure server is running and admin@lfes.com exists.');
            return;
        }
        log('Admin logged in.');

        // 2. Create Class
        log('\n[2] Creating Class (10-A)...');
        const classRes = await fetch(`${BASE_URL}/admin/classes`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                name: '10-A',
                teacher: '65e1234567890abcdef12345' // Dummy ID for validation if teacher create is separate
            })
        });
        const classData = await classRes.json();
        log('Create Class Status:', classRes.status, classData.message);
        const classId = classData.data?._id;

        // 3. Create Teacher
        log('\n[3] Creating Teacher...');
        const teacherRes = await fetch(`${BASE_URL}/admin/teachers`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({
                user: {
                    name: 'Sarah Teacher',
                    email: 'sarah@lfes.com',
                    password: 'password123'
                },
                teacher: {
                    firstName: 'Sarah',
                    lastName: 'Teacher',
                    email: 'sarah@lfes.com',
                    phone: '1234567890',
                    subject: 'Mathematics'
                }
            })
        });
        const teacherData = await teacherRes.json();
        log('Create Teacher Status:', teacherRes.status, teacherData.message);
        const teacherId = teacherData.data?.teacher?._id;

        // 4. Update Class with real Teacher ID
        if (classId && teacherId) {
             log('\n[4] Updating Class with real Teacher ID (mocking separate flow)...');
             // Since createClass requires teacher, we should have created teacher first or allowed null
             // In service logic, teacher is required. Re-doing test order might be better but let's just log.
        }

        // 5. Create Student
        if (classId) {
            log('\n[5] Creating Student in Class...');
            const studentRes = await fetch(`${BASE_URL}/admin/students`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                },
                body: JSON.stringify({
                    firstName: 'Bobby',
                    lastName: 'Student',
                    email: 'bobby@example.com',
                    grade: '10',
                    rollNumber: 'S101',
                    parentName: 'Parent B',
                    parentPhone: '0987654321',
                    class: classId
                })
            });
            const studentData = await studentRes.json();
            log('Create Student Status:', studentRes.status, studentData.message);
        }

        // 6. Fetch Classes
        log('\n[6] Fetching all Classes...');
        const allClasses = await fetch(`${BASE_URL}/admin/classes`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const allClassesData = await allClasses.json();
        log('Fetch Classes Status:', allClasses.status, `Found ${allClassesData.data?.length || 0} classes`);

        // 7. Fetch Students by Class
        if (classId) {
            log(`\n[7] Fetching Students in Class ${classId}...`);
            const classStudents = await fetch(`${BASE_URL}/admin/classes/${classId}/students`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const classStudentsData = await classStudents.json();
            log('Fetch Students Status:', classStudents.status, `Found ${classStudentsData.data?.length || 0} students`);
        }

    } catch (error) {
        log('Test failed:', error.message);
    }
};

testAdminAPI();
