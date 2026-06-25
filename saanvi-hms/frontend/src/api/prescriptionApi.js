import api from './axios';

export const prescriptionApi = {
  getByAppointment: (appointmentId) => api.get(`/prescriptions/appointment/${appointmentId}`),
  getByPatient: (patientId) => api.get(`/prescriptions/patient/${patientId}`),
  create: (data) => api.post('/prescriptions', data),
  update: (id, data) => api.put(`/prescriptions/${id}`, data),
};
