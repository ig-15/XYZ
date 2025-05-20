import axios from 'axios';
import { toast } from '@/components/ui/sonner';
import { 
  User, 
  Parking,
  Car,
  Entry,
  Ticket,
  Log,
  DashboardStats,
  Booking
} from '@/types';

// Get API URLs from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const AUTH_SERVICE_URL = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3001/api/auth';
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3002/api/users';
const PARKING_SERVICE_URL = import.meta.env.VITE_PARKING_SERVICE_URL || 'http://localhost:3003/api/parkings';
const CAR_ENTRY_SERVICE_URL = import.meta.env.VITE_CAR_ENTRY_SERVICE_URL || 'http://localhost:3004/api/entries';
const REPORTING_SERVICE_URL = import.meta.env.VITE_REPORTING_SERVICE_URL || 'http://localhost:3005/api/reports';
const CAR_SERVICE_URL = import.meta.env.VITE_CAR_SERVICE_URL || 'http://localhost:3004/api/cars';
const BOOKING_SERVICE_URL = import.meta.env.VITE_BOOKING_SERVICE_URL || 'http://localhost:3003/api/bookings';
const TICKET_SERVICE_URL = import.meta.env.VITE_TICKET_SERVICE_URL || 'http://localhost:3004/api/tickets';
const LOG_SERVICE_URL = import.meta.env.VITE_LOG_SERVICE_URL || 'http://localhost:3005/api/logs';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || 'An error occurred';
    toast.error(message);
    
    if (error.response?.status === 401) {
      // Handle unauthorized (logout user)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await axios.post(`${AUTH_SERVICE_URL}/login`, { email, password });
    const { user, token } = response.data;
    return { user, token };
  },
  
  register: async (userData: Partial<User> & { password: string }) => {
    const response = await axios.post(`${AUTH_SERVICE_URL}/register`, userData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await axios.get(`${AUTH_SERVICE_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.user;
  },
  
  logout: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await axios.post(`${AUTH_SERVICE_URL}/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return response.data;
  }
};

// Parking endpoints
export const parkingApi = {
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${PARKING_SERVICE_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data || [];
  },
  
  getById: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${PARKING_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  create: async (parking: Partial<Parking>) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${PARKING_SERVICE_URL}`, parking, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  update: async (id: string, parking: Partial<Parking>) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${PARKING_SERVICE_URL}/${id}`, parking, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  delete: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${PARKING_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  getAllParkings: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${PARKING_SERVICE_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  updateAvailableSpaces: async (parkingId: string, spaces: number) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${PARKING_SERVICE_URL}/${parkingId}/spaces`, { availableSpaces: spaces }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

// Entry endpoints
export const entryApi = {
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${CAR_ENTRY_SERVICE_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data || [];
  },
  
  getById: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${CAR_ENTRY_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  registerEntry: async (carId: string, parkingId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${CAR_ENTRY_SERVICE_URL}`, { carId, parkingId }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  registerExit: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${CAR_ENTRY_SERVICE_URL}/${id}/exit`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },

  getActiveEntriesByPlate: async (plateNumber: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${CAR_ENTRY_SERVICE_URL}/active?plateNumber=${plateNumber}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  getRecentEntries: async (searchQuery: string = '') => {
    const token = localStorage.getItem('token');
    const url = searchQuery 
      ? `${CAR_ENTRY_SERVICE_URL}/recent?search=${searchQuery}` 
      : `${CAR_ENTRY_SERVICE_URL}/recent`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

// Car endpoints
export const carApi = {
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${CAR_SERVICE_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data || [];
  },
  
  getById: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${CAR_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  getByPlateNumber: async (plateNumber: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${CAR_SERVICE_URL}/plate/${plateNumber}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  create: async (car: Partial<Car>) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${CAR_SERVICE_URL}`, car, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  update: async (id: string, car: Partial<Car>) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${CAR_SERVICE_URL}/${id}`, car, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  delete: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${CAR_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },
  
  getUserCars: async (userId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${CAR_SERVICE_URL}/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data || [];
  },
  
  createCar: async (car: Partial<Car>) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${CAR_SERVICE_URL}`, car, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  updateCar: async (id: string, car: Partial<Car>) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${CAR_SERVICE_URL}/${id}`, car, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  deleteCar: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${CAR_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },
  
  getAllCars: async (page = 1, limit = 10, searchQuery = '', parkingId?: string) => {
    const token = localStorage.getItem('token');
    
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    
    if (searchQuery) {
      queryParams.append('search', searchQuery);
    }
    
    if (parkingId) {
      queryParams.append('parkingId', parkingId);
    }
    
    const queryString = queryParams.toString();
    
    const response = await axios.get(`${CAR_SERVICE_URL}${queryString ? `?${queryString}` : ''}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data;
  }
};

// Ticket endpoints
export const ticketApi = {
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${CAR_ENTRY_SERVICE_URL}/tickets`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data || [];
  },
  
  getAllTickets: async (params: {
    page?: number;
    limit?: number;
    plate?: string;
    parkingId?: string;
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
  }) => {
    const token = localStorage.getItem('token');
    
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.plate) queryParams.append('plate', params.plate);
    if (params.parkingId) queryParams.append('parkingId', params.parkingId);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.minAmount) queryParams.append('minAmount', params.minAmount.toString());
    if (params.maxAmount) queryParams.append('maxAmount', params.maxAmount.toString());
    
    const queryString = queryParams.toString();
    const url = `${CAR_ENTRY_SERVICE_URL}/tickets${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return {
      data: response.data.data || [],
      totalItems: response.data.totalItems || 0,
      totalPages: response.data.totalPages || 1,
      currentPage: response.data.currentPage || 1
    };
  },
  
  getById: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${CAR_ENTRY_SERVICE_URL}/tickets/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  generateTicket: async (entryId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${CAR_ENTRY_SERVICE_URL}/tickets`, { entryId }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  payTicket: async (ticketId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${CAR_ENTRY_SERVICE_URL}/tickets/${ticketId}/pay`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  }
};

// Log endpoints
export const logApi = {
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${REPORTING_SERVICE_URL}/logs`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data || [];
  },
  
  getByDateRange: async (startDate: string, endDate: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${REPORTING_SERVICE_URL}/logs?startDate=${startDate}&endDate=${endDate}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data || [];
  }
};

// Report endpoints
export const reportApi = {
  getDailyReport: async (date: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${REPORTING_SERVICE_URL}/reports/daily?date=${date}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  getMonthlyReport: async (month: string, year: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${REPORTING_SERVICE_URL}/reports/monthly?month=${month}&year=${year}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  getYearlyReport: async (year: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${REPORTING_SERVICE_URL}/reports/yearly?year=${year}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  getRevenueReport: async (params: {
    startDate?: string;
    endDate?: string;
    parkingId?: string;
  }) => {
    const token = localStorage.getItem('token');
    
    // Build query string from params
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.parkingId) queryParams.append('parkingId', params.parkingId);
    
    const queryString = queryParams.toString();
    const url = `${REPORTING_SERVICE_URL}/reports/revenue${queryString ? `?${queryString}` : ''}`;
    
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data.data;
  }
};

// Dashboard endpoints
export const dashboardApi = {
  getAdminStats: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${REPORTING_SERVICE_URL}/dashboard/admin`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  getAttendantStats: async (parkingId?: string) => {
    const token = localStorage.getItem('token');
    const url = parkingId ? `${REPORTING_SERVICE_URL}/dashboard/attendant?parkingId=${parkingId}` : `${REPORTING_SERVICE_URL}/dashboard/attendant`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  getUserStats: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${REPORTING_SERVICE_URL}/dashboard/user`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  }
};

// User endpoints
export const userApi = {
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${USER_SERVICE_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data || [];
  },
  
  getById: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${USER_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  update: async (id: string, userData: Partial<User>) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${USER_SERVICE_URL}/${id}`, userData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  updateRole: async (id: string, role: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${USER_SERVICE_URL}/${id}/role`, { role }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  delete: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${USER_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

// Booking endpoints
export const bookingApi = {
  getAll: async () => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${BOOKING_SERVICE_URL}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data || [];
  },
  
  getById: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${BOOKING_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  getUserBookings: async (userId: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${BOOKING_SERVICE_URL}/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },
  
  createBooking: async (bookingData: {
    userId: string;
    parkingId: string;
    carId: string;
    date: string;
    startTime: string;
    duration: number;
  }) => {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${BOOKING_SERVICE_URL}`, bookingData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  updateBooking: async (id: string, bookingData: Partial<Booking>) => {
    const token = localStorage.getItem('token');
    const response = await axios.put(`${BOOKING_SERVICE_URL}/${id}`, bookingData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
  },
  
  cancelBooking: async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await axios.delete(`${BOOKING_SERVICE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

export default api;
