
/**
 * BDM SPECIAL UPDATES TRACKER - BACKEND SCRIPT
 */

const SHEET_DB_NAME = "Sheet1";
const SHEET_MASTER_NAME = "HHID STATUS";
const SHEET_PROFILE_NAME = "PROFILES";
const SHEET_USER_NAME = "User";

const HEADERS_DB = ["ID", "Province", "Municipality", "Barangay", "Member Name", "Update Type", "Grantee Name", "Date", "Period", "Status", "Extra Info"];
const HEADERS_PROFILE = [
  "HH_ID", "ENTRY_ID", "REGION", "PROVINCE", "MUNICIPALITY", "BARANGAY", 
  "LAST_NAME", "FIRST_NAME", "MIDDLE_NAME", "EXT_NAME", "BIRTHDAY", "AGE", 
  "SEX", "CLIENT_STATUS", "MEMBER_STATUS", "RELATIONSHIP", "CIVIL_STATUS", 
  "IS_GRANTEE", "SOLO_PARENT", "IP_AFFILIATION", "PCN", "PREGNANCY_STATUS", 
  "HEALTH_FACILITY", "ATTENDING_SCHOOL", "SCHOOL_NAME", "GRADE_LEVEL", "LRN", 
  "HH_SET", "DISABILITY"
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
  const rowData = [record.id, record.province, record.municipality, record.barangay, record.memberName, record.updateType, record.granteeName, record.date, record.period, record.status, record.extraInfo];
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
    r.lastName || '',
    r.firstName || '',
    r.middleName || '',
    r.extName || '',
    r.birthday || '',
    r.age || 0,
    r.sex || '',
    r.clientStatus || '',
    r.memberStatus || '',
    r.relationship || '',
    r.civilStatus || '',
    r.isGrantee || '',
    r.soloparent || '',
    r.ipAffiliation || '',
    r.pcn || '',
    r.pregnancyStatus || '',
    r.healthFacility || '',
    r.attendingSchool || '',
    r.schoolName || '',
    r.gradeLevel || '',
    r.lrn || '',
    r.hhSet || '',
    r.disability || ''
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
  // Map fields to HEADERS_USER order
  // ["ID", "Username", "Password", "First Name", "MI", "Last Name", "Position", "Municipality", "Email", "Role", "Status", "Avatar"]
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
