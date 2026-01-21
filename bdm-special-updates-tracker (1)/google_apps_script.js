
/**
 * BDM SPECIAL UPDATES TRACKER - BACKEND SCRIPT
 * 
 * INSTRUCTIONS:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste this entire code into Code.gs
 * 4. Click Deploy > New Deployment
 * 5. Select type: "Web App"
 * 6. Execute as: "Me"
 * 7. Who has access: "Anyone"
 * 8. Copy the Web App URL and paste it into the BDM Hub Setup page.
 */

const SHEET_DB_NAME = "Sheet1";
const SHEET_MASTER_NAME = "HHID STATUS";

// Standardize headers for when we create a new sheet
const HEADERS_DB = ["ID", "Province", "Municipality", "Barangay", "Member Name", "Update Type", "Grantee Name", "Date", "Period", "Status", "Extra Info"];

/**
 * Handle GET requests (Fetching Data)
 */
function doGet(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(5000);

  try {
    const sheetParam = e.parameter.sheet;
    const targetSheet = (sheetParam === SHEET_MASTER_NAME || (sheetParam && sheetParam.includes("HHID"))) 
      ? SHEET_MASTER_NAME 
      : SHEET_DB_NAME;

    // Return raw 2D array [ [row1_col1, row1_col2], [row2_col1, row2_col2] ]
    return responseJSON({ 
      status: 'success',
      data: getDataRaw(targetSheet) 
    });

  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Handle POST requests (Saving/Deleting Data)
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    if (!e.postData || !e.postData.contents) {
      return responseJSON({ status: 'error', message: 'No data found' });
    }

    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'save_record') {
      const result = saveRecord(data.record);
      return responseJSON({ status: 'success', message: 'Record saved', details: result });
    } 
    else if (action === 'delete_record') {
      const result = deleteRecord(data.id);
      return responseJSON({ status: 'success', message: 'Record deleted', details: result });
    }
    
    return responseJSON({ status: 'error', message: 'Unknown action: ' + action });

  } catch (error) {
    return responseJSON({ status: 'error', message: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Helper: Get Raw Data (Array of Arrays)
 */
function getDataRaw(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  // Return all data including headers (if any) as a raw 2D array
  return sheet.getDataRange().getValues();
}

/**
 * Helper: Save or Update a Record
 */
function saveRecord(record) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_DB_NAME);
  
  // Create sheet if missing
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_DB_NAME);
    sheet.appendRow(HEADERS_DB);
  }

  const data = sheet.getDataRange().getValues();
  
  // Prepare row data based on fixed column order
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
    record.extraInfo
  ];

  // 1. Check for duplicate ID to update (Column A / Index 0)
  // Check if Row 1 is a header. If the first cell is exactly "ID", we skip it.
  const startRow = (data.length > 0 && String(data[0][0]).toUpperCase() === 'ID') ? 1 : 0;

  for (let i = startRow; i < data.length; i++) {
    // Compare ID string
    if (String(data[i][0]) === String(record.id)) {
      // Update the row (i + 1 because sheets are 1-indexed)
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return "Updated existing record at row " + (i + 1);
    }
  }

  // 2. If not found, Append new row
  sheet.appendRow(rowData);
  return "Inserted new record";
}

/**
 * Helper: Delete a Record
 */
function deleteRecord(id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DB_NAME);
  if (!sheet) return "Sheet not found";

  const data = sheet.getDataRange().getValues();
  
  const startRow = (data.length > 0 && String(data[0][0]).toUpperCase() === 'ID') ? 1 : 0;

  for (let i = startRow; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return "Deleted row " + (i + 1);
    }
  }
  return "ID not found";
}

/**
 * Helper: Return JSON response
 */
function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
