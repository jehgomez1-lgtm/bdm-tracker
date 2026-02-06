
/**
 * BDM SPECIAL UPDATES TRACKER - BACKEND SCRIPT
 */

const SHEET_DB_NAME = "Sheet1";
const SHEET_MASTER_NAME = "HHID STATUS";
const SHEET_PROFILE_NAME = "PROFILES";
const SHEET_USER_NAME = "User";

// Updated Column Order: Status(J), Status Date 1(K), Status 2(L), Status Date 2(M), Extra Info(N)
const HEADERS_DB = ["ID", "Province", "Municipality", "Barangay", "Member Name", "Update Type", "Grantee Name", "Date", "Period", "Status", "Status Date 1", "Status 2", "Status Date 2", "Extra Info"];

// Full headers based on provided Excel dataset
const HEADERS_PROFILE = [
  "HH_ID", "ENTRY_ID", "REGION", "PROVINCE", "MUNICIPALITY", "BARANGAY", 
  "FIRST_NAME", "LAST_NAME", "MIDDLE_NAME", "EXT_NAME", 
  "BIRTHDAY", "AGE", "SEX", 
  "CLIENT_STATUS", "CS_CATEGORY", "MEMBER_STATUS", 
  "RELATION_TO_HH_HEAD", "CIVIL_STATUS", 
  "GRANTEE", "HH_SET", 
  "SOLO_PARENT", "IP_AFFILIATION", 
  "PCN", "PCN_REMARKS", 
  "PREGNANCY_STATUS", "LMP", 
  "HEALTH_MONITORED", "HEALTH_FACILITY", "HEALTH_FACILITY_STATUS", "REASON_FOR_NOT_ATTENDING_HEALTH", "REASON_HEALTH_REMARKS",
  "DISABILITY_TYPES", "CHILD_BENE", 
  "AGE_ON_EDUC", "GRADE_LEVEL", "SHS_STRAND", "SHS_TRACK", "EDUC_MONIT", "ATTEND_SCHOOL", "SCHOOL_NAME", "REASON_FOR_NOT_ATTENDING_SCHOOL", "REASON_EDUC_REMARKS", 
  "LRN", "LRN_REMARKS"
];

const HEADERS_USER = ["ID", "Username", "Password", "First Name", "MI", "Last Name", "Position", "Municipality", "Email", "Role", "Status", "Avatar"];

function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(5000);
  try {
    const sheetParam = e.parameter.sheet;
    let targetSheetName = SHEET_DB_NAME;
    if (sheetParam === SHEET_MASTER_NAME || (sheetParam && sheetParam.includes("HHID"))) {
      targetSheetName = SHEET_MASTER_NAME;
    } else if (sheetParam === SHEET_PROFILE_NAME || sheetParam === "PROFILES") {
      targetSheetName = SHEET_PROFILE_NAME;
    } else if (sheetParam === SHEET_USER_NAME || sheetParam === "User") {
      targetSheetName = SHEET_USER_NAME;
    }
    return responseJSON({ status: 'success', data: getDataRaw(targetSheetName) });
  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(60000); // Extended timeout for bulk profile writes
  try {
    if (!e.postData || !e.postData.contents) {
      return responseJSON({ status: 'error', message: 'No data' });
    }
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'save_record') {
      return responseJSON({ status: 'success', details: saveRecord(data.record) });
    } else if (data.action === 'save_profiles') {
      return responseJSON({ status: 'success', details: saveProfiles(data.records, data.mode || 'replace') });
    } else if (data.action === 'register_user' || data.action === 'update_user') {
      return responseJSON({ status: 'success', details: saveUser(data.user) });
    } else if (data.action === 'delete_user') {
      return responseJSON({ status: 'success', details: deleteUser(data.id) });
    }
    return responseJSON({ status: 'error', message: 'Unknown action' });
  } catch (error) {
    return responseJSON({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getDataRaw(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  return sheet.getDataRange().getValues();
}

function saveRecord(record) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_DB_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_DB_NAME);
    sheet.appendRow(HEADERS_DB);
  }
  const data = sheet.getDataRange().getValues();
  
  const rowData = [
    record.id, 
    record.province, 
    record.municipality, 
    record.barangay, 
    record.memberName, 
    record.updateType, 
    record.granteeName, 
    record.date, 
    record.period, 
    record.status, 
    record.statusDate1 || '',
    record.status2 || '',
    record.statusDate2 || '',
    record.extraInfo
  ];

  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(record.id)) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return "Updated";
    }
  }
  sheet.appendRow(rowData);
  return "Inserted";
}

function saveProfiles(records, mode) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_PROFILE_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_PROFILE_NAME);
    sheet.appendRow(HEADERS_PROFILE);
  }
  
  if (mode === 'replace') {
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
       sheet.getRange(2, 1, lastRow - 1, HEADERS_PROFILE.length).clearContent();
    }
  }

  if (!records || records.length === 0) return "Empty records list";

  const rows = records.map(r => [
    r.hhid || '',
    r.entryId || '',
    r.region || '',
    r.province || '',
    r.municipality || '',
    r.barangay || '',
    
    r.firstName || '',
    r.lastName || '',
    r.middleName || '',
    r.extName || '',
    
    r.birthday || '',
    r.age || 0,
    r.sex || '',
    
    r.clientStatus || '',
    r.csCategory || '',
    r.memberStatus || '',
    r.relationship || '',
    r.civilStatus || '',
    
    r.isGrantee || '',
    r.hhSet || '',
    r.soloparent || '',
    r.ipAffiliation || '',
    
    r.pcn || '',
    r.pcnRemarks || '',
    
    r.pregnancyStatus || '',
    r.lmp || '',
    
    r.healthMonitored || '',
    r.healthFacility || '',
    r.healthFacilityStatus || '',
    r.reasonNotAttendingHealth || '',
    r.healthRemarks || '',
    
    r.disability || '',
    r.childBene || '',
    
    r.ageOnEduc || '',
    r.gradeLevel || '',
    r.shsStrand || '',
    r.shsTrack || '',
    r.educMonit || '',
    r.attendingSchool || '',
    r.schoolName || '',
    r.reasonNotAttendingSchool || '',
    r.educRemarks || '',
    
    r.lrn || '',
    r.lrnRemarks || ''
  ]);

  const lastRow = sheet.getLastRow();
  sheet.getRange(lastRow + 1, 1, rows.length, HEADERS_PROFILE.length).setValues(rows);
  
  return "Saved " + rows.length + " profiles";
}

function saveUser(user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_USER_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_USER_NAME);
    sheet.appendRow(HEADERS_USER);
  }
  const data = sheet.getDataRange().getValues();
  const rowData = [
      user.id, user.username, user.Password, user.firstName, user.mi, user.lastName, 
      user.position, user.municipality, user.email, user.role, user.status, user.avatar
  ];
  
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(user.id)) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return "User Updated";
    }
  }
  sheet.appendRow(rowData);
  return "User Registered";
}

function deleteUser(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_USER_NAME);
  if (!sheet) return "Sheet not found";
  const data = sheet.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(userId)) {
      sheet.deleteRow(i + 1);
      return "User Deleted";
    }
  }
  return "User not found";
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
