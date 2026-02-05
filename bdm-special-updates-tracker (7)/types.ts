
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
  STAFF = 'STAFF',
  GUEST = 'GUEST'
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
  statusDate1?: string; // Date for Status 1
  status2?: UpdateStatus; // Secondary Status
  statusDate2?: string; // Date for Status 2
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
  // Identification
  hhid: string;
  entryId: string;
  
  // Location
  region: string;
  province: string;
  municipality: string;
  barangay: string;
  
  // Personal Info
  lastName: string;
  firstName: string;
  middleName: string;
  extName: string;
  birthday: string;
  age: number;
  sex: string;
  
  // Status
  clientStatus: string;
  csCategory?: string;
  memberStatus: string;
  
  // Household Relation
  relationship: string;
  hhSet: string;
  isGrantee: string; // "1 - Active" or similar in Excel
  
  // Attributes
  civilStatus: string;
  soloparent: string;
  ipAffiliation: string;
  disability: string; // DISABILITY_TYPES
  
  // IDs
  pcn: string;
  pcnRemarks?: string;
  lrn: string;
  lrnRemarks?: string;
  
  // Health
  pregnancyStatus: string;
  lmp?: string;
  healthMonitored?: string;
  healthFacility: string;
  healthFacilityStatus?: string;
  reasonNotAttendingHealth?: string;
  healthRemarks?: string;
  
  // Education
  ageOnEduc?: string;
  gradeLevel: string;
  attendingSchool: string;
  schoolName: string;
  shsStrand?: string;
  shsTrack?: string;
  educMonit?: string;
  reasonNotAttendingSchool?: string;
  educRemarks?: string;
  
  // Other
  childBene?: string;
}
