import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import MyLeaveRequests from '../components/MyLeaveRequests.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getHodLeaveRequests, hodActionLeaveRequest, LEAVE_POLICY } from '../services/api.js';
import { IconCheck, IconX, IconInbox, IconCalendar, IconPlus } from '../components/Icons.jsx';

const TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
const initials = (name = '') => name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
const LEAVE_TYPE_LABELS = {
  1: 'Privilege Leave',
  2: 'Sick Leave',
  3: 'Casual Leave',
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function HodDashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING');
  const [selectedDate, setSelectedDate] = useState(null);
  const [remarksDraft, setRemarksDraft] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState('APPROVALS'); // 'APPROVALS' | 'MINE'
  const dateInputRef = useRef(null);

  const load = useCallback(async () => {
  try {
    const all = await getHodLeaveRequests();
    setRequests(all);
  } catch (error) {
    console.error('Failed to load HOD leave requests:', error);
  } finally {
    setLoading(false);
  }
}, []);

  useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      load();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}, [load]);

  useEffect(() => { load(); }, [load]);
  // Automatically refresh dashboard every 5 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      load();
    }
  }, 5000);

  return () => clearInterval(interval);
}, [load]);

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
      `
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
        <h3 style="text-align:center;">${session?.user?.department || ''} Department — Leave History Report</h3>

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

  const stats = useMemo(() => ({
    pending: requests.filter((r) => r.status === 'PENDING').length,
    approved: requests.filter((r) => r.status === 'APPROVED').length,
    cancelled: requests.filter((r) => r.status === 'CANCELLED' || r.status === 'REJECTED').length,
    total: requests.length,
  }), [requests]);

  const filtered = tab === 'ALL' ? requests : requests.filter((r) => r.status === tab);

  // Leave history is a record of who WAS on leave, so it only ever shows
  // already-approved requests — pending/rejected/cancelled ones don't belong
  // in a history report.
  const dateRequests = useMemo(
    () => (selectedDate
      ? requests.filter((r) => r.status === 'APPROVED' && selectedDate >= r.startDate && selectedDate <= r.endDate)
      : []),
    [requests, selectedDate],
  );

  const handleAction = async (requestId, action) => {
    setBusyId(requestId + action);
    const res = await hodActionLeaveRequest(requestId, action, remarksDraft[requestId] || '');
    setBusyId(null);
    if (res.ok) {
  setToast({
    type: 'ok',
    msg: action === 'APPROVED'
      ? 'Request approved.'
      : action === 'REJECTED'
        ? 'Request rejected.'
        : 'Leave cancelled.'
  });

  // Immediately reload dashboard data
  await load();
}else {
      setToast({ type: 'err', msg: res.error });
    }
    setTimeout(() => setToast(null), 2600);
  };

  const openDatePicker = () => {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === 'function') el.showPicker();
    else el.focus();
  };

  const renderActions = (r) => {
    if (r.status === 'PENDING') {
      return (
        <>
          <input
            className="input" placeholder="Optional remark for the employee…"
            value={remarksDraft[r.requestId] || ''}
            onChange={(e) => setRemarksDraft((p) => ({ ...p, [r.requestId]: e.target.value }))}
          />
          <div className="admin-actions">
            <button className="btn btn-primary btn-sm" disabled={busyId === r.requestId + 'APPROVED'} onClick={() => handleAction(r.requestId, 'APPROVED')}>
              {busyId === r.requestId + 'APPROVED' ? <span className="spinner" /> : <IconCheck width={14} height={14} />} Approve
            </button>
            <button className="btn btn-danger btn-sm" disabled={busyId === r.requestId + 'REJECTED'} onClick={() => handleAction(r.requestId, 'REJECTED')}>
              {busyId === r.requestId + 'REJECTED' ? <span className="spinner" /> : <IconX width={14} height={14} />} Reject
            </button>
          </div>
        </>
      );
    }
    if (r.status === 'APPROVED') {
      return (
        <div className="hi-meta-row">
          <span>{r.actionBy ? `Approved by ${r.actionBy} on ${formatDateTime(r.actionOn)}` : ''}</span>
          <button className="btn btn-danger btn-sm" disabled={busyId === r.requestId + 'CANCELLED'} onClick={() => handleAction(r.requestId, 'CANCELLED')}>
            {busyId === r.requestId + 'CANCELLED' ? <span className="spinner" /> : <IconX width={14} height={14} />} Cancel Leave
          </button>
        </div>
      );
    }
    return (
      <div className="hi-meta-row">
        <span>{r.actionBy ? `Actioned by ${r.actionBy} on ${formatDateTime(r.actionOn)}` : ''}</span>
        {r.remarks && <span>Note: {r.remarks}</span>}
      </div>
    );
  };

  const listToShow = selectedDate ? dateRequests : filtered;

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-area">
        <div className="container">
          <div className="page-header anim-fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1>{session?.user?.department || 'Department'} — HOD Approval Dashboard</h1>
              <p>Review leave requests submitted by employees of your department.</p>
            </div>
            <div className="filter-tabs" style={{ marginBottom: 4 }}>
            <button className={view === 'APPROVALS' ? 'active' : ''} onClick={() => setView('APPROVALS')}>
              Requests to Approve
            </button>
            <button className={view === 'MINE' ? 'active' : ''} onClick={() => setView('MINE')}>
              My Leave Requests
            </button>
          </div>
          </div>

          {view === 'APPROVALS' && (
            <div className="rings-grid stagger" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
              <StatCard label="Pending Requests" value={stats.pending} tone="warn" />
              <StatCard label="Approved" value={stats.approved} tone="ok" />
              <StatCard label="Cancelled/Rejected" value={stats.cancelled} tone="danger" />
              <StatCard label="Total Requests" value={stats.total} tone="info" />
            </div>
          )}

          

          {view === 'MINE' ? (
            <MyLeaveRequests
              empId={session?.user?.empId}
              title="My Leave Requests"
              subtitle="Your own leave requests are sent to the Managing Director for approval — not to this department's approval list."
              showBalances
            />
          ) : (
          <>
          <div className="section-title">
            <h2>{selectedDate ? `Leave History · ${formatDate(selectedDate)}` : 'Leave Requests'}</h2>
            <div className="row" style={{ gap: 8 }}>
              <span className="count-chip">{listToShow.length} shown</span>
              <div className="date-picker-wrap">
                <button type="button" className="icon-btn" title="Pick a date" onClick={openDatePicker}>
                  <IconCalendar width={17} height={17} />
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  className="date-picker-hidden-input"
                  value={selectedDate || ''}
                  onChange={(e) => setSelectedDate(e.target.value || null)}
                  aria-label="Select a date to view leave history"
                />
              </div>
              {selectedDate && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSelectedDate(null)}>
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

          {!selectedDate && (
            <div className="filter-tabs">
              {TABS.map((t) => (
                <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="stack" style={{ gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
            </div>
          ) : listToShow.length === 0 ? (
            <div className="card empty-state">
              <IconInbox />
              <h4>{selectedDate ? 'No leave records on this date' : 'No requests in this filter'}</h4>
              <p>{selectedDate ? 'Try picking a different date.' : 'Try switching to another tab above.'}</p>
            </div>
          ) : (
            <div className="history-list stagger">
              {listToShow.map((r) => (
                <div className="card history-item" key={r.requestId}>
                  <div className="hi-top">
                    <div className="emp-cell">
                      <div className="avatar">{initials(r.empName)}</div>
                      <div>
                        <div className="ec-name">{r.empName} <span style={{ color: 'var(--ink-300)', fontWeight: 500 }}>· {r.empId}</span></div>
                        <div className="ec-sub">{r.department}</div>
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  
<div className="hi-dates">
  <strong style={{ color: 'var(--cane-900)' }}>
    {LEAVE_TYPE_LABELS[Number(r.leaveType)] || 'Unknown Leave'}
  </strong>
  {' · '}
  {r.dayType === 'HALF' ? 'Half Day' : 'Full Day'}
  {' · '}
  {r.days} day{r.days !== 1 ? 's' : ''}
  <br />
  {r.startDate === r.endDate
    ? formatDate(r.startDate)
    : `${formatDate(r.startDate)} – ${formatDate(r.endDate)}`}
  &nbsp;·&nbsp;Applied {formatDateTime(r.appliedOn)}
</div>


                  <div className="hi-reason">{r.reason}</div>

                  {renderActions(r)}
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </div>
      </main>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneColor = { warn: 'var(--warn-600)', ok: 'var(--ok-600)', danger: 'var(--danger-600)', info: 'var(--info-600)' }[tone];
  return (
    <div className="card" style={{ padding: '18px 16px' }}>
      <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', color: toneColor }}>{value}</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-500)', fontWeight: 600, marginTop: 4 }}>{label}</div>
    </div>
  );
}
