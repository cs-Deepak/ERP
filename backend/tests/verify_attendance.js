/**
 * Verification Script for Attendance System
 */

const fs = require('fs');
const path = require('path');
const LOG_FILE = path.join(__dirname, 'attendance_test_results.log');

const log = (...args) => {
    const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
};

const BASE_URL = 'http://localhost:5000/api';

if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

const testAttendance = async () => {
    log('--- Starting Attendance Verification ---');

    try {
        // 1. Login Teacher (Sarah from previous tests or create new)
        log('\n[1] Logging in Teacher...');
        const teacherLogin = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'sarah@lfes.com',
                password: 'password123'
            })
        });
        const teacherLoginData = await teacherLogin.json();
        const teacherToken = teacherLoginData.data?.token;

        if (!teacherToken) {
            log('Teacher login failed. Make sure sarah@lfes.com exists.');
            return;
        }
        log('Teacher logged in.');

        // 2. Need a Class and Students
        // Get all classes
        log('\n[2] Fetching Classes to find a target...');
        const classRes = await fetch(`${BASE_URL}/admin/classes`, {
            headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        const classData = await classRes.json();
        
        // Note: Teacher SARAH might not be authorized to view ALL classes via ADMIN route 
        // unless sarah is an admin or we use a public class route.
        // sarah is role: teacher. Admin routes have isAdmin middleware.
        // Let's use Admin token to get a class if teacher fails.
        let adminToken;
        if (classRes.status === 403) {
            log('Teacher forbidden from admin route. Logging in Admin to get class data...');
            const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'admin@lfes.com', password: 'password123' })
            });
            const adminLoginData = await adminLogin.json();
            adminToken = adminLoginData.data?.token;
            
            const adminClassRes = await fetch(`${BASE_URL}/admin/classes`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const adminClassData = await adminClassRes.json();
            classData.data = adminClassData.data;
        }

        const targetClass = classData.data && classData.data.length > 0 ? classData.data[0] : null;
        if (!targetClass) {
            log('No class found to test attendance.');
            return;
        }
        const classId = targetClass._id;
        log(`Target Class: ${targetClass.name} (${classId})`);

        // Get students in this class
        const studentRes = await fetch(`${BASE_URL}/admin/classes/${classId}/students`, {
            headers: { 'Authorization': `Bearer ${adminToken || teacherToken}` }
        });
        const studentData = await studentRes.json();
        const students = studentData.data || [];
        log(`Found ${students.length} students in class.`);

        if (students.length === 0) {
            log('No students in class to mark attendance.');
            return;
        }

        // 3. Mark Attendance
        log('\n[3] Marking Attendance for Today...');
        const today = new Date().toISOString().split('T')[0];
        const markRes = await fetch(`${BASE_URL}/attendance`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${teacherToken}`
            },
            body: JSON.stringify({
                classId,
                date: today,
                attendanceData: students.map(s => ({
                    studentId: s._id,
                    status: 'Present',
                    remarks: 'Coming in from verification script'
                }))
            })
        });
        const markData = await markRes.json();
        log('Mark Attendance Status:', markRes.status, markData.message);

        // 4. Duplicate Check
        log('\n[4] Testing Duplicate Prevention...');
        const dupRes = await fetch(`${BASE_URL}/attendance`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${teacherToken}`
            },
            body: JSON.stringify({
                classId,
                date: today,
                attendanceData: students.map(s => ({
                    studentId: s._id,
                    status: 'Absent'
                }))
            })
        });
        const dupData = await dupRes.json();
        log('Duplicate Mark Status:', dupRes.status, dupData.message);

        // 5. Fetch Report
        log('\n[5] Fetching Attendance Report...');
        const reportRes = await fetch(`${BASE_URL}/attendance?classId=${classId}&date=${today}`, {
            headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        const reportData = await reportRes.json();
        log('Fetch Report Status:', reportRes.status, `Found ${reportData.data?.length || 0} records`);
        if (reportData.data && reportData.data.length > 0) {
            log('Sample Record:', {
                student: reportData.data[0].student?.firstName,
                status: reportData.data[0].status
            });
        }

    } catch (error) {
        log('Test failed:', error.message);
    }
};

testAttendance();
