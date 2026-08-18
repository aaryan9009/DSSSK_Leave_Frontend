import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { applyForLeave, getLeaveBalances, LEAVE_POLICY } from '../services/api.js';
import { IconChevronLeft, IconCheck, IconSparkle } from '../components/Icons.jsx';
import MyLeaveRequests from '../components/MyLeaveRequests.jsx';

const todayISO = new Date().toISOString().slice(0, 10);

function daysBetween(start, end) {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (e < s) return 0;
  return Math.round((e - s) / 86400000) + 1;
}

export default function ApplyLeave() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const isHod = session.role === 'HOD';
  const isMd = session.role === 'MD';
  // Apply Leave is shared across EMPLOYEE/HOD/MD (see App.jsx) — the "back to
  // dashboard" and post-submit redirect need to land on the right one, or an
  // MD who just applied for leave gets sent to the plain Employee dashboard
  // instead of back to /md.
  const homePath = isMd ? '/md' : isHod ? '/hod' : '/dashboard';
  const [balances, setBalances] = useState(null);

  const [leaveType, setLeaveType] = useState('personal');
  const [dayType, setDayType] = useState('FULL');
  const [startDate, setStartDate] = useState(todayISO);
  const [endDate, setEndDate] = useState(todayISO);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { getLeaveBalances(session.user.empId).then(setBalances); }, [session.user.empId]);
  useEffect(() => { if (dayType === 'HALF') setEndDate(startDate); }, [dayType, startDate]);

  const days = useMemo(() => (dayType === 'HALF' ? 0.5 : daysBetween(startDate, endDate)), [dayType, startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!reason.trim()) { setError('Please provide a reason for your leave.'); return; }
    if (days <= 0) { setError('Please select a valid date range.'); return; }

    setSubmitting(true);
    const res = await applyForLeave({
      empId: session.user.empId,
      empName: session.user.name,
      department: session.user.department,
      leaveType, startDate, endDate, dayType, reason: reason.trim(),
    });
    setSubmitting(false);
    if (!res.ok) { setError(res.error); return; }
    setSuccess(true);
    setRefreshKey((k) => k + 1);
    setTimeout(() => navigate(homePath), 1400);
  };

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-area">
        <div className="container" style={{ maxWidth: 680 }}>
          <button className="link-back" onClick={() => navigate(homePath)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <IconChevronLeft width={15} height={15} /> Back to dashboard
          </button>

          <div className="page-header anim-fade-up">
            <h1>Apply for Leave</h1>
            <p>Fill in the details below — your remaining balance updates automatically once approved.</p>
          </div>

          <form className="card anim-fade-up" style={{ padding: 24 }} onSubmit={handleSubmit}>
            {error && <div className="alert alert-error"><IconSparkle width={16} height={16} />{error}</div>}
            {success && <div className="alert alert-success"><IconCheck width={16} height={16} />Leave request submitted — redirecting to your dashboard…</div>}

            <div className="field">
              <label>Leave Type</label>
              <div className="leave-type-grid">
                {Object.keys(LEAVE_POLICY).map((key) => (
                  <button
                    type="button" key={key}
                    className={`type-pill${leaveType === key ? ' active' : ''}`}
                    onClick={() => setLeaveType(key)}
                  >
                    <div className="tp-label">{LEAVE_POLICY[key].label}</div>
                    <div className="tp-remaining">{balances ? `${balances[key].remaining} of ${balances[key].total} left` : '—'}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Day Type</label>
              <div className="daytype-toggle">
                <button type="button" className={dayType === 'FULL' ? 'active' : ''} onClick={() => setDayType('FULL')}>Full Day</button>
                <button type="button" className={dayType === 'HALF' ? 'active' : ''} onClick={() => setDayType('HALF')}>Half Day</button>
              </div>
            </div>

            <div className="date-row">
              <div className="field">
                <label htmlFor="start">Start Date</label>
                <input
                  id="start" type="date" className="input" value={startDate} min={todayISO}
                  onChange={(e) => { setStartDate(e.target.value); if (dayType === 'FULL' && e.target.value > endDate) setEndDate(e.target.value); }}
                />
              </div>
              <div className="field">
                <label htmlFor="end">End Date</label>
                <input
                  id="end" type="date" className="input" value={endDate} min={startDate}
                  disabled={dayType === 'HALF'}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="days-preview">
              <IconSparkle width={16} height={16} />
              {days > 0 ? `This request covers ${days} day${days !== 1 ? 's' : ''}` : 'Select valid dates to see day count'}
            </div>

            <div className="field">
              <label htmlFor="reason">Reason</label>
              <textarea
                id="reason" className="textarea" placeholder="Briefly describe the reason for your leave…"
                value={reason} onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={submitting || success}>
              {submitting ? <span className="spinner" /> : <IconCheck width={16} height={16} />}
              {submitting ? 'Submitting…' : 'Submit Leave Request'}
            </button>
          </form>

          <MyLeaveRequests
            key={refreshKey}
            empId={session.user.empId}
            title="My Recent Leave Requests"
            subtitle={
              isMd
                ? "There's no one above the Managing Director — you approve your own leave from the MD dashboard."
                : isHod
                ? 'Your own leave requests are sent to the Managing Director for approval.'
                : undefined
            }
          />
        </div>
      </main>
    </div>
  );
}
