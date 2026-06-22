require('dotenv').config();
const { sequelize, User, Patient, Appointment } = require('../models');
const { ROLES } = require('../config/roles');

// Creates one demo login per role so you (and your supervisor) can test
// RBAC behavior immediately without manually registering five accounts.
// Password for every seeded account is "password123" — change in real use.
const demoUsers = [
  { name: 'Admin User', email: 'admin@saanvi.test', password: 'password123', role: ROLES.ADMIN },
  { name: 'Dr. Asha Rai', email: 'doctor@saanvi.test', password: 'password123', role: ROLES.DOCTOR },
  { name: 'Nurse Kiran Thapa', email: 'nurse@saanvi.test', password: 'password123', role: ROLES.NURSE },
  { name: 'Front Desk Priya', email: 'receptionist@saanvi.test', password: 'password123', role: ROLES.RECEPTIONIST },
  { name: 'Ram Patient', email: 'patient@saanvi.test', password: 'password123', role: ROLES.PATIENT },
];

const demoPatients = [
  {
    firstName: 'Sita',
    lastName: 'Sharma',
    dateOfBirth: '1990-05-12',
    gender: 'female',
    phone: '9800000001',
    email: 'sita.sharma@example.com',
    bloodGroup: 'O+',
    medicalNotes: 'No known allergies.',
  },
  {
    firstName: 'Hari',
    lastName: 'Gurung',
    dateOfBirth: '1985-11-02',
    gender: 'male',
    phone: '9800000002',
    bloodGroup: 'B+',
    medicalNotes: 'Mild penicillin allergy.',
  },
];

async function seed() {
  try {
    await sequelize.sync({ alter: true });

    for (const userData of demoUsers) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData,
      });
      console.log(created ? `Created user: ${user.email} (${user.role})` : `Already exists: ${user.email}`);
    }

    const admin = await User.findOne({ where: { email: 'admin@saanvi.test' } });
    const doctor = await User.findOne({ where: { email: 'doctor@saanvi.test' } });
    const patientUser = await User.findOne({ where: { email: 'patient@saanvi.test' } });

    for (const patientData of demoPatients) {
      const [patient, created] = await Patient.findOrCreate({
        where: { phone: patientData.phone },
        defaults: { ...patientData, registeredBy: admin?.id },
      });
      console.log(created ? `Created patient: ${patient.firstName} ${patient.lastName}` : `Already exists: ${patientData.phone}`);
    }

    // Link the demo patient LOGIN to its own Patient record, so logging in
    // as patient@saanvi.test has real data to book appointments against and
    // a "My Records" view to see.
    const [ramPatient] = await Patient.findOrCreate({
      where: { phone: '9800000099' },
      defaults: {
        firstName: 'Ram',
        lastName: 'Patient',
        dateOfBirth: '1995-03-20',
        gender: 'male',
        phone: '9800000099',
        email: 'patient@saanvi.test',
        bloodGroup: 'A+',
        userId: patientUser?.id,
      },
    });
    if (patientUser && !ramPatient.userId) {
      await ramPatient.update({ userId: patientUser.id });
    }

    // Seed a couple of demo appointments so the Appointments screen and
    // dashboards aren't empty on first login.
    if (doctor && ramPatient) {
      const inTwoDays = new Date();
      inTwoDays.setDate(inTwoDays.getDate() + 2);
      inTwoDays.setHours(10, 30, 0, 0);

      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      lastWeek.setHours(15, 0, 0, 0);

      await Appointment.findOrCreate({
        where: { patientId: ramPatient.id, doctorId: doctor.id, scheduledAt: inTwoDays },
        defaults: {
          patientId: ramPatient.id,
          doctorId: doctor.id,
          scheduledAt: inTwoDays,
          reason: 'Routine check-up',
          status: 'scheduled',
          bookedBy: admin?.id,
        },
      });

      await Appointment.findOrCreate({
        where: { patientId: ramPatient.id, doctorId: doctor.id, scheduledAt: lastWeek },
        defaults: {
          patientId: ramPatient.id,
          doctorId: doctor.id,
          scheduledAt: lastWeek,
          reason: 'Fever and cough',
          status: 'completed',
          notes: 'Prescribed rest and fluids. Follow up if symptoms persist beyond 5 days.',
          bookedBy: admin?.id,
        },
      });

      console.log('Seeded demo appointments for patient@saanvi.test with doctor@saanvi.test');
    }

    console.log('\nSeeding complete. Demo logins (password: password123):');
    demoUsers.forEach((u) => console.log(`  ${u.role.padEnd(13)} -> ${u.email}`));

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
