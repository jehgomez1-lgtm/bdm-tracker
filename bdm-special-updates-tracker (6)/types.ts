
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

export interface User {
  id: string;
  firstName?: string;
  mi?: string;
  lastName?: string;
  name: string; // Display name (Full name)
  email: string;
  username: string;
  municipality?: string; // Area of Assignment
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

export interface SortConfig {
  key: keyof MemberRecord;
  direction: 'asc' | 'desc';
}

export interface HouseholdMember {
  hhid: string;
  entryId: string;
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  lastName: string;
  firstName: string;
  middleName: string;
  extName: string;
  birthday: string;
  age: number;
  ageOnEduc?: string;
  sex: string;
  clientStatus: string;
  csCategory?: string;
  memberStatus: string;
  relationship: string;
  civilStatus: string;
  isGrantee: string;
  hhSet: string;
  soloparent: string;
  ipAffiliation: string;
  pcn: string;
  pcnRemarks?: string;
  pregnancyStatus: string;
  lmp?: string;
  healthMonitored?: string;
  healthFacility: string;
  healthFacilityStatus?: string;
  reasonNotAttendingHealth?: string;
  healthRemarks?: string;
  disability: string;
  childBene?: string;
  gradeLevel: string;
  shsStrand?: string;
  shsTrack?: string;
  educMonit?: string;
  attendingSchool: string;
  schoolName: string;
  reasonNotAttendingSchool?: string;
  educRemarks?: string;
  lrn: string;
  lrnRemarks?: string;
}
