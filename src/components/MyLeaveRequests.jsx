import { useEffect, useState, useCallback } from 'react';
import StatusBadge from './StatusBadge.jsx';
import LeaveBalanceRing from './LeaveBalanceRing.jsx';
import { getMyLeaveRequests, cancelMyLeaveRequest, getLeaveBalances, LEAVE_POLICY } from '../services/api.js';
import { IconInbox, IconX, IconClock } from './Icons.jsx';

const TABS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Shows the signed-in person's OWN leave request history — same shape as
// EmployeeDashboard's "My Leave History" section — but reusable for an HOD
// or MD, whose own requests no longer show up in their approval list (an
// HOD's leave is approved by the MD, and the MD's own leave doesn't belong
// in "requests I need to approve" either — see hodRoutes.js/mdRoutes.js on
// the backend). Without this, an HOD/MD would have no way to see whether
// their own request is still pending, approved, rejected or cancelled.
//
// showBalances (optional): also renders the PL/SL/CL remaining-leave rings
// above the tabs, exactly like EmployeeDashboard's "Leave Balance" section —
// so switching PENDING/APPROVED/REJECTED here updates alongside the same
// remaining-count rings an employee sees, not just a bare list.
export default function MyLeaveRequests({ empId, title = 'My Leave Requests', subtitle, showBalances = false }) {
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    try {
      const [reqs, bal] = await Promise.all([
        getMyLeaveRequests(empId),
        showBalances ? getLeaveBalances(empId) : Promise.resolve(null),
      ]);
      setRequests(reqs);
      if (showBalances) setBalances(bal);
    } catch (error) {
      console.error('Failed to load my leave requests:', error);
    } finally {
      setLoading(false);
    }
  }, [empId, showBalances]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const handleCancel = async (requestId) => {
    const res = await cancelMyLeaveRequest(requestId, empId);
    if (res.ok) {
      setToast({ type: 'ok', msg: 'Leave request withdrawn.' });
      load();
    } else {
      setToast({ type: 'err', msg: res.error });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = tab === 'ALL' ? requests : requests.filter((r) => r.status === tab);

  return (
    <div style={{ marginTop: 8 }}>
      {showBalances && (
        <>
          <div className="section-title">
            <h2>Leave Balance</h2>
          </div>
          <div className="rings-grid">
            {loading || !balances
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 190, borderRadius: 14 }} />
                ))
              : Object.keys(LEAVE_POLICY).map((key) => (
                  <LeaveBalanceRing
                    key={key}
                    label={LEAVE_POLICY[key].label}
                    color={LEAVE_POLICY[key].color}
                    total={balances?.[key]?.total || 0}
                    used={balances?.[key]?.used || 0}
                    remaining={balances?.[key]?.remaining || 0}
                  />
                ))}
          </div>
        </>
      )}

      <div className="section-title">
        <h2>{title}</h2>
        <span className="count-chip">{requests.length} total</span>
      </div>
      {subtitle && <p style={{ color: 'var(--ink-500)', fontSize: 13.5, marginTop: -10, marginBottom: 14 }}>{subtitle}</p>}

      <div className="filter-tabs">
        {TABS.map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="stack" style={{ gap: 12 }}>
          {Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 90 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <IconInbox />
          <h4>No leave requests here</h4>
          <p>Applications you submit will show up in this list.</p>
        </div>
      ) : (
        <div className="history-list stagger">
          {filtered.map((r) => (
            <div className="card history-item" key={r.requestId}>
              <div className="hi-top">
                <div>
                  <div className="hi-type">
                    {LEAVE_POLICY?.[r.leaveType]?.label || r.leaveType} · {r.dayType === 'HALF' ? 'Half Day' : 'Full Day'}
                  </div>
                  <div className="hi-dates">
                    {r.startDate === r.endDate
                      ? formatDate(r.startDate)
                      : `${formatDate(r.startDate)} – ${formatDate(r.endDate)}`}
                    &nbsp;·&nbsp;{r.days} day{r.days !== 1 ? 's' : ''}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="hi-reason">{r.reason}</div>
              <div className="hi-meta-row">
                <span>
                  <IconClock width={12} height={12} style={{ verticalAlign: '-2px', marginRight: 4 }} />
                  Applied {formatDate(r.appliedOn)}
                </span>
                {r.status === 'PENDING' && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r.requestId)}>
                    <IconX width={13} height={13} /> Withdraw
                  </button>
                )}
                {r.remarks && r.status !== 'PENDING' && <span>Note: {r.remarks}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
