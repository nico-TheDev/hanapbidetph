# 20 — Admin report queue page

**What to build:** Admin Reports page under `/admin` showing open reports from `listOpenReports`. Admin can review (set status, change listing status) or dismiss each report. Calls `adminSetStatus` and report status update operations.

**Blocked by:** 18 — `/admin` layout, role gate, and left nav; 17 — `adminMerge` + `listOpenReports`

**Status:** done

- [x] Open reports displayed in a queue ordered by date
- [x] Admin can view report reason, details, and linked listing
- [x] Admin can dismiss a report or mark reviewed and set listing status
- [x] Empty queue shows "No open reports"
