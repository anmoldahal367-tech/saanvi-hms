import api from './axios';

export const appointmentApi = {
  getAll: (params) => api.get('/appointments', { params }),
  getDoctors: () => api.get('/appointments/doctors'),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  remove: (id) => api.delete(`/appointments/${id}`),
};
