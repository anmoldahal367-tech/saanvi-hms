const sequelize = require('../config/db');
const User = require('./User');
const Patient = require('./Patient');
const Appointment = require('./Appointment');

// A patient record optionally belongs to the staff user who registered it.
// onDelete: SET NULL means deleting a staff account never deletes patient data.
User.hasMany(Patient, { foreignKey: 'registeredBy', as: 'registeredPatients' });
Patient.belongsTo(User, { foreignKey: 'registeredBy', as: 'registrar', onDelete: 'SET NULL' });

// A patient record can optionally be linked to the patient's own login
// account, so a logged-in patient can be matched to "their" record.
User.hasOne(Patient, { foreignKey: 'userId', as: 'patientProfile', onDelete: 'SET NULL' });
Patient.belongsTo(User, { foreignKey: 'userId', as: 'account' });

// An appointment belongs to exactly one patient and one doctor (a User with
// role 'doctor'). Deleting a patient or doctor cascades to their appointments
// being removed too, since an appointment with no patient/doctor is meaningless.
Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments', onDelete: 'CASCADE' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });

User.hasMany(Appointment, { foreignKey: 'doctorId', as: 'doctorAppointments', onDelete: 'CASCADE' });
Appointment.belongsTo(User, { foreignKey: 'doctorId', as: 'doctor' });

module.exports = {
  sequelize,
  User,
  Patient,
  Appointment,
};

