
export enum UpdateStatus {
  RECEIVED = 'RECEIVED',
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  REJECTED = 'REJECTED',
  ENCODED = 'ENCODED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  municipality: string; // Added for regional tracking
  avatar?: string;
}

export interface SystemMessage {
  id: string;
  sender: string;
  senderId: string;
  senderMunicipality?: string; // Track origin of messages
  recipientId: string; // 'all' or specific user id
  recipientName: string;
  content: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
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
