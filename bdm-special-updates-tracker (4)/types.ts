
export enum UpdateStatus {
  RECEIVED = 'RECEIVED',
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
  ENCODED = 'ENCODED',
  DISCARDED = 'DISCARDED',
  RETURNED = 'RETURNED',
  SENT_THROUGH_MAIL = 'SENT THROUGH MAIL'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

// Fixed User interface to include missing properties used in constants.ts and login logic
export interface User {
  id: string;
  firstName?: string;
  mi?: string;
  lastName?: string;
  name: string;
  email: string;
  username?: string;
  municipality?: string;
  contact?: string;
  position?: string;
  role: UserRole;
  status: 'Pending' | 'Approved';
  avatar?: string;
  Password?: string;
}

export interface MemberRecord {
  id: string;
  province: string;
  municipality: string;
  barangay: string;
  memberName: string;
  updateType: string;
  granteeName: string;
  date: string;
  period: number;
  status: UpdateStatus;
  extraInfo?: string; 
}

export interface SummaryRow {
  updateType: string;
  periods: number[]; 
  total: number;
}

export interface MasterRecord {
  hhid: string;
  province: string;
  municipality: string;
  barangay: string;
  granteeName: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}
