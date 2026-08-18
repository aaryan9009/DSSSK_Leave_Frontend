import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import LeaveBalanceRing from "../components/LeaveBalanceRing.jsx";
import StatusBadge from "../components/StatusBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getLeaveBalances,
  getMyLeaveRequests,
  cancelMyLeaveRequest,
  LEAVE_POLICY,
} from "../services/api.js";
import { IconPlus, IconInbox, IconX, IconClock } from "../components/Icons.jsx";

const TABS = ["ALL", "PENDING", "APPROVED", "CANCELLED"];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function EmployeeDashboard() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const empId = session.user.empId;

  const [balances, setBalances] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("ALL");
  const [toast, setToast] = useState(null);

  const load = useCallback(async (showLoader = false) => {
  try {
    if (showLoader) {
      setLoading(true);
    }

    const [bal, reqs] = await Promise.all([
      getLeaveBalances(empId),
      getMyLeaveRequests(empId),
    ]);

    setBalances(bal);
    setRequests(reqs);
  } catch (error) {
    console.error("Employee dashboard load error:", error);
  } finally {
    setLoading(false);
  }
}, [empId]);

// Initial load only
useEffect(() => {
  load(true);
}, [load]);

// Refresh silently when app/window becomes active
useEffect(() => {
  const handleFocus = () => {
    load(false);
  };

  window.addEventListener('focus', handleFocus);

  return () => {
    window.removeEventListener('focus', handleFocus);
  };
}, [load]);

// Silent background refresh
useEffect(() => {
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      load(false);
    }
  }, 10000);

  return () => clearInterval(interval);
}, [load]);


  const handleCancel = async (requestId) => {
    const res = await cancelMyLeaveRequest(requestId, empId);
    if (res.ok) {
      setToast({ type: "ok", msg: "Leave request withdrawn." });
      load();
    } else {
      setToast({ type: "err", msg: res.error });
    }
    setTimeout(() => setToast(null), 3000);
  };

  const filtered =
    tab === "ALL" ? requests : requests.filter((r) => r.status === tab);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-area">
        <div className="container">
          <div className="page-header anim-fade-up">
            <h1>Welcome back, {session.user.name.split(" ")[0]}</h1>
            <p>
              {session.user.designation} · {session.user.department} · {empId}
            </p>
          </div>

          <div className="section-title">
            <h2>Leave Balance</h2>
            {/* <button className="btn btn-primary btn-sm" onClick={() => navigate('/apply-leave')}>
              <IconPlus width={15} height={15} /> Apply for Leave
            </button> */}
          </div>

          <div className="rings-grid">
            {loading || !balances
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 190, borderRadius: 14 }}
                  />
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

          <div className="section-title">
            <h2>My Leave History</h2>
            <span className="count-chip">{requests.length} total</span>
          </div>

          <div className="filter-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={tab === t ? "active" : ""}
                onClick={() => setTab(t)}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="stack" style={{ gap: 12 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 90 }} />
              ))}
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
                        {LEAVE_POLICY?.[r.leaveType]?.label || r.leaveType} ·{" "}
                        {r.dayType === "HALF" ? "Half Day" : "Full Day"}
                      </div>
                      <div className="hi-dates">
                        {r.startDate === r.endDate
                          ? formatDate(r.startDate)
                          : `${formatDate(r.startDate)} – ${formatDate(
                              r.endDate,
                            )}`}
                        &nbsp;·&nbsp;{r.days} day{r.days !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="hi-reason">{r.reason}</div>
                  <div className="hi-meta-row">
                    <span>
                      <IconClock
                        width={12}
                        height={12}
                        style={{ verticalAlign: "-2px", marginRight: 4 }}
                      />
                      Applied {formatDate(r.appliedOn)}
                    </span>
                    {r.status === "PENDING" && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancel(r.requestId)}
                      >
                        <IconX width={13} height={13} /> Withdraw
                      </button>
                    )}
                    {r.remarks && r.status !== "PENDING" && (
                      <span>HR note: {r.remarks}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
