
-- Database Schema for BDM Special Updates Tracker

CREATE TABLE IF NOT EXISTS member_records (
  id TEXT PRIMARY KEY,
  province TEXT,
  municipality TEXT,
  barangay TEXT,
  "memberName" TEXT,
  "updateType" TEXT,
  "granteeName" TEXT,
  date DATE,
  period INTEGER,
  status TEXT,
  "extraInfo" TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "user" TEXT,
  action TEXT,
  details TEXT
);

-- Optional: Indexes for faster searching
CREATE INDEX IF NOT EXISTS idx_member_name ON member_records("memberName");
CREATE INDEX IF NOT EXISTS idx_hhid ON member_records(id);
