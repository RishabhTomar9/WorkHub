import api from './api.js';

// Worker Services
export const workerService = {
  // Get all workers for a site
  getWorkersBySite: async (siteId) => {
    const response = await api.get(`/workers/site/${siteId}`);
    return response.data;
  },

  // Add a new worker
  addWorker: async (workerData) => {
    const response = await api.post('/workers', workerData);
    return response.data;
  },

  // Update worker
  updateWorker: async (workerId, workerData) => {
    const response = await api.put(`/workers/${workerId}`, workerData);
    return response.data;
  },

  // Delete worker
  deleteWorker: async (workerId) => {
    const response = await api.delete(`/workers/${workerId}`);
    return response.data;
  }
};

// Attendance Services
export const attendanceService = {
  // Get attendance for a site by date
  getAttendanceBySite: async (siteId, date) => {
    const response = await api.get(`/attendance/site/${siteId}?date=${date}`);
    return response.data;
  },

  // Create or update attendance
  markAttendance: async (attendanceData) => {
    const response = await api.post('/attendance', attendanceData);
    return response.data;
  },

  // Bulk update attendance
  bulkUpdateAttendance: async (siteId, date, records) => {
    const response = await api.post('/attendance/bulk', {
      siteId,
      date,
      records
    });
    return response.data;
  }
};

// Payment Services
export const paymentService = {
  // Add a payment
  addPayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  // Get payments for a worker
  getWorkerPayments: async (workerId, startDate = null, endDate = null) => {
    let url = `/payments/worker/${workerId}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await api.get(url);
    return response.data;
  },

  // Get payments for a site
  getSitePayments: async (siteId, startDate = null, endDate = null, workerId = null) => {
    let url = `/payments/site/${siteId}`;
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (workerId) params.append('workerId', workerId);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    const response = await api.get(url);
    return response.data;
  },

  // Update a payment
  updatePayment: async (paymentId, paymentData) => {
    const response = await api.put(`/payments/${paymentId}`, paymentData);
    return response.data;
  },

  // Delete a payment
  deletePayment: async (paymentId) => {
    const response = await api.delete(`/payments/${paymentId}`);
    return response.data;
  },

  // Get worker summary with attendance and payments
  getWorkerSummary: async (workerId, startDate = null, endDate = null) => {
    let url = `/payments/summary/${workerId}`;
    if (startDate && endDate) {
      url += `?startDate=${startDate}&endDate=${endDate}`;
    }
    const response = await api.get(url);
    return response.data;
  }
};

// Site Services
export const siteService = {
  // Get all sites for user
  getSites: async () => {
    const response = await api.get('/sites');
    return response.data;
  },

  // Get site by ID
  getSite: async (siteId) => {
    const response = await api.get(`/sites/${siteId}`);
    return response.data;
  }
};
