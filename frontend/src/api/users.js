import api from './axios';

export const fetchAllUsers  = ()     => api.get('/users');
export const fetchUserById  = (id)   => api.get(`/users/${id}`);
export const updateMyProfile = (data) => api.put('/users/profile', data);
export const fetchMyDashboard = () => api.get('/users/dashboard');
export const updateMyDashboard = (data) => api.put('/users/dashboard', data);
export const removeUser     = (id)   => api.delete(`/users/${id}`);
