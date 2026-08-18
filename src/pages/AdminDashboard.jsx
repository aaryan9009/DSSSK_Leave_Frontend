import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Navbar from "../components/Navbar.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { LEAVE_POLICY, getAllLeaveRequests } from "../services/api.js";
import { IconInbox, IconCalendar } from "../components/Icons.jsx";
import { useNavigate } from "react-router-dom";

// HR Admin is now READ-ONLY: it only ever sees leave requests that have
// already been APPROVED by the respective department HOD (the backend
// already filters the /admin/leave-requests endpoints to APPROVED-only).
// Approve/reject authority now lives on each HOD's own dashboard, scoped
// to their department — see HodDashboard.jsx.
const initials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatDateTime(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const dateInputRef = useRef(null);

  const load = useCallback(async (showLoading = false) => {
  if (showLoading) {
    setLoading(true);
  }

  try {
    const reqs = await getAllLeaveRequests();

    setRequests(reqs);
  } catch (error) {
    console.error("Failed to load admin leave history:", error);
  } finally {
    setLoading(false);
  }
}, []);

// Initial load ONLY
useEffect(() => {
  load(true);
}, [load]);

// Background refresh — does NOT show skeleton/loading
useEffect(() => {
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      load(false);
    }
  }, 5000);

  return () => clearInterval(interval);
}, [load]);

// Refresh when returning to the app/window
useEffect(() => {
  const handleFocus = () => {
    load(false);
  };

  window.addEventListener('focus', handleFocus);

  return () => {
    window.removeEventListener('focus', handleFocus);
  };
}, [load]);

  const dateRequests = useMemo(
    () =>
      selectedDate
        ? requests.filter(
            (r) => selectedDate >= r.startDate && selectedDate <= r.endDate,
          )
        : [],
    [requests, selectedDate],
  );

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");

    const rows = dateRequests
      .map(
        (r) => `
          <tr>
            <td>${r.empId}</td>
            <td>${r.empName}</td>
            <td>${r.department}</td>
          </tr>
        `,
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Leave History Report</title>
          <style>
            body{
              font-family: Arial, sans-serif;
              padding:20px;
            }
            h2{
              text-align:center;
              margin-bottom:5px;
            }
            .date{
              text-align:center;
              margin-bottom:20px;
            }
            table{
              width:100%;
              border-collapse:collapse;
            }
            th,td{
              border:1px solid #000;
              padding:8px;
              text-align:left;
            }
            th{
              background:#f2f2f2;
            }
            .footer{
              margin-top:15px;
              font-weight:bold;
            }
          </style>
        </head>
        <body>
          <h2>Shree Datta SSSK</h2>
          <h3 style="text-align:center;">Leave History Report (Approved by HODs)</h3>

          <div class="date">
            Leave Date: ${selectedDate}
          </div>

          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>

          <div class="footer">
            Total Employees On Leave: ${dateRequests.length}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };

  const listToShow = selectedDate ? dateRequests : requests;

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-area">
        <div className="container">
          <div className="page-header anim-fade-up">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              <div>
                <h1>HR Leave History</h1>
                <p>
                  Read-only view of leave requests already approved by each
                  department's HOD, across the karkhana.
                </p>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => navigate("/admin/manage-md")}
                >
                  Manage MD Access
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate("/admin/reset-password")}
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>

          <div
            className="rings-grid stagger"
            style={{
              gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
            }}
          >
            <StatCard
              label="Total Approved Leaves"
              value={requests.length}
              tone="ok"
            />
          </div>

          <div className="section-title">
            <h2>
              {selectedDate
                ? `Leave History · ${formatDate(selectedDate)}`
                : "Approved Leave History"}
            </h2>
            <div className="row" style={{ gap: 8 }}>
              <span className="count-chip">{listToShow.length} shown</span>
              <div className="date-picker-wrap">
                <button
                  type="button"
                  className="icon-btn"
                  title="Pick a date"
                  onClick={openDatePicker}
                >
                  <IconCalendar width={17} height={17} />
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  className="date-picker-hidden-input"
                  value={selectedDate || ""}
                  onChange={(e) => setSelectedDate(e.target.value || null)}
                  aria-label="Select a date to view leave history"
                />
              </div>
              {selectedDate && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSelectedDate(null)}
                >
                  Clear
                </button>
              )}
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handlePrint}
              disabled={!selectedDate}
            >
              Print
            </button>
          </div>

          {loading ? (
            <div className="stack" style={{ gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 120 }} />
              ))}
            </div>
          ) : listToShow.length === 0 ? (
            <div className="card empty-state">
              <IconInbox />
              <h4>
                {selectedDate
                  ? "No leave records on this date"
                  : "No approved leave requests yet"}
              </h4>
              <p>
                {selectedDate
                  ? "Try picking a different date."
                  : "Approved leaves from department HODs will show up here."}
              </p>
            </div>
          ) : (
            <div className="history-list stagger">
              {listToShow.map((r) => (
                <div className="card history-item" key={r.requestId}>
                  <div className="hi-top">
                    <div className="emp-cell">
                      <div className="avatar">{initials(r.empName)}</div>
                      <div>
                        <div className="ec-name">
                          {r.empName}{" "}
                          <span
                            style={{ color: "var(--ink-300)", fontWeight: 500 }}
                          >
                            · {r.empId}
                          </span>
                        </div>
                        <div className="ec-sub">{r.department}</div>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <div className="hi-dates">
                    <strong style={{ color: "var(--cane-900)" }}>
                      {LEAVE_POLICY[r.leaveType]?.label ||
                        r.leaveType ||
                        "Unknown Leave"}
                    </strong>{" "}
                    · {r.dayType === "HALF" ? "Half Day" : "Full Day"} ·{" "}
                    {r.days} day{r.days !== 1 ? "s" : ""}
                    <br />
                    {r.startDate === r.endDate
                      ? formatDate(r.startDate)
                      : `${formatDate(r.startDate)} – ${formatDate(r.endDate)}`}
                    &nbsp;·&nbsp;Applied {formatDateTime(r.appliedOn)}
                  </div>
                  <div className="hi-reason">{r.reason}</div>

                  <div className="hi-meta-row">
                    <span>
                      {r.actionBy
                        ? `Approved by HOD ${r.actionBy} on ${formatDateTime(r.actionOn)}`
                        : ""}
                    </span>
                    {r.remarks && <span>Note: {r.remarks}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneColor = {
    warn: "var(--warn-600)",
    ok: "var(--ok-600)",
    danger: "var(--danger-600)",
    info: "var(--info-600)",
  }[tone];
  return (
    <div className="card" style={{ padding: "18px 16px" }}>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          fontFamily: "var(--font-display)",
          color: toneColor,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12.5,
          color: "var(--ink-500)",
          fontWeight: 600,
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}
