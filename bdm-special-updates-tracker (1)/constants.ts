
import { MemberRecord, UpdateStatus, MasterRecord, User, UserRole } from './types';

// The URL you get after deploying your Google Apps Script
// You can also set this via the UI now!
export const DEFAULT_GOOGLE_SHEET_URL = ''; 

export const MOCK_USERS: User[] = [
  { id: '1', name: 'System Admin', username: 'admin', role: UserRole.ADMIN, municipality: 'Main HQ', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: '2', name: 'Maria Santos', username: 'staff1', role: UserRole.STAFF, municipality: 'BALENO', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Anita' },
];

export const MUNICIPALITIES = [
  "BALENO", "AROROY", "MOBO", "MASBATE CITY", "MILAGROS", "SAN PASCUAL", "USON"
];

export const UPDATE_TYPES = [
  "UPDATE 1 & 8 - Newborn and/or Adtl Member",
  "UPDATE 2 - other Muni and Province",
  "UPDATE 3 - other Region",
  "UPDATE 4 - Change of Health Faci",
  "UPDATE 5 - Change of School Faci",
  "UPDATE 6 - Change Grantee",
  "UPDATE 7 - Deceased",
  "UPDATE 9 - Basic Information",
  "UPDATE 11 - Child Selection/Deselection",
  "UPDATE 12 - Capturing of Pregnancy Status",
  "Code 12 - Moved-Out Member",
  "Code 12 - Moved-Out HH",
  "Code 14",
  "Code 15",
  "Duplicate HH",
  "Duplicate Member"
];

export const DUMMY_MASTER_LIST: MasterRecord[] = [
  { hhid: '054102010-0807-00020', province: 'MASBATE', municipality: 'BALENO', barangay: 'GABI', granteeName: 'ESQUILONA, ROSE MARIE BANCULO' },
  { hhid: '054102011-1037-00006', province: 'MASBATE', municipality: 'BALENO', barangay: 'GANGAO', granteeName: 'BANOY, MARILOU DELA ROSA' },
];

export const GENERATED_RECORDS: MemberRecord[] = [
  {
    id: '054102010-0807-00020',
    province: 'MASBATE',
    municipality: 'BALENO',
    barangay: 'GABI',
    memberName: 'ESQUILONA, ROSE MARIE BANCULO',
    updateType: 'UPDATE 9 - Basic Information',
    granteeName: 'ESQUILONA, ROSE MARIE BANCULO',
    date: '2026-01-10',
    period: 1,
    status: UpdateStatus.PROCESSED
  }
];
