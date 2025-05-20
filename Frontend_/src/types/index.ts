export type UserRole = 'admin' | 'attendant' | 'user';

export interface User {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface Parking {
  id: string;
  code: string;
  name: string;
  location: string;
  totalSpaces: number;
  availableSpaces: number;
  feePerHour: number;
  total_spaces?: number;
  available_spaces?: number;
  hourly_rate?: number;
}

export interface Car {
  id: string;
  plateNumber: string;
  userId: string;
  plate_number?: string;
  owner_id?: string;
  make?: string;
  model?: string;
  color?: string;
  year?: number;
  is_parked?: boolean;
  owner_name?: string;
  createdAt?: string;
}

export interface Entry {
  id: string;
  carId: string;
  parkingId: string;
  entryTime: string;
  exitTime: string | null;
  chargedAmount: number;
  car?: Car;
  parking?: Parking;
  plate_number?: string;
  parking_name?: string;
  entry_time?: string;
  exit_time?: string;
}

export interface Ticket {
  id: string;
  entryId: string;
  issuedTime: string;
  totalAmount: number;
  entry?: Entry;
  plate_number?: string;
  parking_name?: string;
  entry_time?: string;
  exit_time?: string;
  amount?: number;
  status?: string;
  duration_hours?: number;
}

export interface Log {
  id: string;
  userId: string;
  action: string;
  description: string;
  timestamp: string;
  user?: User;
}

export interface DashboardStats {
  totalParkings: number;
  totalAttendants: number;
  totalRevenue: number;
  occupancyRate: number;
}

export interface Booking {
  id: string;
  userId: string;
  carId: string;
  parkingId: string;
  date: string;
  startTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
  user?: User;
  car?: Car;
  parking?: Parking;
}

export interface TableColumn<T> {
  header: string;
  accessorKey: keyof T;
  cell?: (info: { getValue: () => any; row: { original: T } }) => React.ReactNode;
}
