export type Role = 'ADMIN' | 'EMPLOYEE';

export type ShiftStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'TRADED';

export type TradeStatus =
  | 'PENDING_PEER'
  | 'PEER_ACCEPTED'
  | 'PEER_DECLINED'
  | 'ADMIN_APPROVED'
  | 'ADMIN_DENIED'
  | 'CANCELLED';

export interface Department {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  title: string;
  phone: string;
  avatarUrl?: string;
  hourlyRate: number;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shift {
  id: string;
  title: string;
  userId: string;
  departmentId: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  breakMinutes: number;
  location: string;
  notes?: string;
  status: ShiftStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftWithDetails extends Shift {
  user?: {
    id: string;
    name: string;
    email: string;
    title: string;
    avatarUrl?: string;
  };
  department?: Department;
}

export interface TradeRequest {
  id: string;
  requesterId: string;
  requesterShiftId: string;
  targetUserId: string;
  targetShiftId: string;
  reason?: string;
  status: TradeStatus;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TradeWithDetails extends TradeRequest {
  requester: {
    id: string;
    name: string;
    email: string;
    title: string;
  };
  requesterShift: Shift & { department?: Department };
  targetUser: {
    id: string;
    name: string;
    email: string;
    title: string;
  };
  targetShift: Shift & { department?: Department };
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
  title: string;
  departmentId?: string;
  departmentName?: string;
  departmentCode?: string;
}

export interface HospitalSettings {
  hospitalName: string;
  unitName: string;
  dayShiftStart: string; // "07:00"
  dayShiftEnd: string;   // "19:00"
  nightShiftStart: string; // "19:00"
  nightShiftEnd: string;   // "07:00"
  autoApproval: boolean;
  emailAlerts: boolean;
}
