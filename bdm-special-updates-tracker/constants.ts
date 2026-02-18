
import { MemberRecord, UpdateStatus, MasterRecord, User, UserRole } from './types';

// The URL you get after deploying your Google Apps Script
export const DEFAULT_GOOGLE_SHEET_URL = ''; 

export const MOCK_USERS: User[] = [
  { 
    id: 'admin_root', 
    name: 'System Administrator', 
    email: 'admin@bdm.gov', 
    username: 'admin', 
    Password: 'Admin2026', 
    role: UserRole.ADMIN, 
    status: 'Approved',
    position: 'Root Access',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
  }
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

export const DUMMY_MASTER_LIST: MasterRecord[] = [];
export const GENERATED_RECORDS: MemberRecord[] = [];
