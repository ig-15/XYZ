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
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3002/api';
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
  withCredentials: true
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

// Create service-specific axios instances
const createServiceInstance = (baseURL: string) => {
  const instance = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true
  });

  // Add request interceptor
  instance.interceptors.request.use(
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

  // Add response interceptor
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      const message = error.response?.data?.message || 'An error occurred';
      toast.error(message);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create service instances
const authInstance = createServiceInstance(AUTH_SERVICE_URL);
const userInstance = createServiceInstance(USER_SERVICE_URL);
const parkingInstance = createServiceInstance(PARKING_SERVICE_URL);
const carEntryInstance = createServiceInstance(CAR_ENTRY_SERVICE_URL);
const reportingInstance = createServiceInstance(REPORTING_SERVICE_URL);
const carInstance = createServiceInstance(CAR_SERVICE_URL);
const bookingInstance = createServiceInstance(BOOKING_SERVICE_URL);
const ticketInstance = createServiceInstance(TICKET_SERVICE_URL);
const logInstance = createServiceInstance(LOG_SERVICE_URL);

// Auth endpoints
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await authInstance.post('/login', { email, password });
    const { user, token } = response.data;
    return { user, token };
  },
  
  register: async (userData: Partial<User> & { password: string }) => {
    const response = await authInstance.post('/register', userData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await authInstance.get('/me');
    return response.data.user;
  },
  
  logout: async () => {
    const response = await authInstance.post('/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return response.data;
  }
};

// Parking endpoints
export const parkingApi = {
  getAll: async () => {
    try {
      const response = await parkingInstance.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching parkings:', error);
      throw error;
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await parkingInstance.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching parking:', error);
      throw error;
    }
  },
  
  create: async (parking: Partial<Parking>) => {
    try {
      const response = await parkingInstance.post('/', parking);
      return response.data;
    } catch (error) {
      console.error('Error creating parking:', error);
      throw error;
    }
  },
  
  update: async (id: string, parking: Partial<Parking>) => {
    try {
      const response = await parkingInstance.put(`/${id}`, parking);
      return response.data;
    } catch (error) {
      console.error('Error updating parking:', error);
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await parkingInstance.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting parking:', error);
      throw error;
    }
  },

  getAllParkings: async () => {
    try {
      const response = await parkingInstance.get('/');
      return response.data;
    } catch (error) {
      console.error('Error fetching all parkings:', error);
      throw error;
    }
  },

  updateAvailableSpaces: async (parkingId: string, spaces: number) => {
    try {
      const response = await parkingInstance.put(`/${parkingId}/spaces`, { availableSpaces: spaces });
      return response.data;
    } catch (error) {
      console.error('Error updating available spaces:', error);
      throw error;
    }
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
    try {
      const response = await api.get(`${CAR_SERVICE_URL}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cars:', error);
      throw error;
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await api.get(`${CAR_SERVICE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching car:', error);
      throw error;
    }
  },
  
  getByPlateNumber: async (plateNumber: string) => {
    try {
      const response = await api.get(`${CAR_SERVICE_URL}/plate/${plateNumber}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching car by plate number:', error);
      throw error;
    }
  },
  
  create: async (car: Partial<Car>) => {
    try {
      const response = await api.post(`${CAR_SERVICE_URL}`, car);
      return response.data;
    } catch (error) {
      console.error('Error creating car:', error);
      throw error;
    }
  },
  
  update: async (id: string, car: Partial<Car>) => {
    try {
      const response = await api.put(`${CAR_SERVICE_URL}/${id}`, car);
      return response.data;
    } catch (error) {
      console.error('Error updating car:', error);
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await api.delete(`${CAR_SERVICE_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting car:', error);
      throw error;
    }
  },
  
  getUserCars: async (userId: string) => {
    const response = await api.get(`${CAR_SERVICE_URL}/user/${userId}`);
    return response.data;
  },
  
  createCar: async (car: Partial<Car>) => {
    const response = await api.post(`${CAR_SERVICE_URL}/register`, {
      plate_number: car.plate_number,
      user_id: car.user_id,
      make: car.make || null,
      model: car.model || null,
      color: car.color || null,
      year: car.year || null
    });
    return response.data.data;
  },
  
  updateCar: async (id: string, car: Partial<Car>) => {
    const response = await api.put(`${CAR_SERVICE_URL}/${id}`, {
      plate_number: car.plate_number || car.plateNumber,
      make: car.make,
      model: car.model,
      color: car.color,
      year: car.year
    });
    return response.data.data;
  },
  
  deleteCar: async (id: string) => {
    const response = await api.delete(`${CAR_SERVICE_URL}/${id}`);
    return response.data;
  },
  
  getAllCars: async (page = 1, limit = 10, searchQuery = '', parkingId?: string) => {
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
    const response = await api.get(`${CAR_SERVICE_URL}${queryString ? `?${queryString}` : ''}`);
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
  getLogs: async (params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = `${REPORTING_SERVICE_URL}/user-activity${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  getEntriesReport: async (params: {
    startDate?: string;
    endDate?: string;
    parkingId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.parkingId) queryParams.append('parkingId', params.parkingId);
    
    const queryString = queryParams.toString();
    const url = `${REPORTING_SERVICE_URL}/parking-usage${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  getExitsReport: async (params: {
    startDate?: string;
    endDate?: string;
    parkingId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.parkingId) queryParams.append('parkingId', params.parkingId);
    
    const queryString = queryParams.toString();
    const url = `${REPORTING_SERVICE_URL}/parking-usage${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
  },

  getRevenueReport: async (params: {
    startDate?: string;
    endDate?: string;
    parkingId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.parkingId) queryParams.append('parkingId', params.parkingId);
    
    const queryString = queryParams.toString();
    const url = `${REPORTING_SERVICE_URL}/revenue/by-parking${queryString ? `?${queryString}` : ''}`;
    
    const response = await api.get(url);
    return response.data;
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
    try {
      const response = await userInstance.get('/users');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },
  
  getById: async (id: string) => {
    try {
      const response = await userInstance.get(`/users/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },
  
  update: async (id: string, userData: Partial<User>) => {
    try {
      const response = await userInstance.put(`/users/${id}`, userData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },
  
  updateRole: async (id: string, role: string) => {
    try {
      const response = await userInstance.put(`/users/${id}/role`, { role });
      return response.data.data;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },
  
  delete: async (id: string) => {
    try {
      const response = await userInstance.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
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
