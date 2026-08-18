import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import {
  findUserById,
  getMdList,
  setMdDesignation,
} from "../services/api.js";

const initials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function AdminManageMd() {
  const [empId, setEmpId] = useState("");
  const [employee, setEmployee] = useState(null);
  const [mds, setMds] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  const loadMds = async () => {
    setListLoading(true);
    const res = await getMdList();
    setMds(res.ok ? res.mds : []);
    setListLoading(false);
  };

  useEffect(() => {
    loadMds();
  }, []);

  const searchEmployee = async () => {
    setMessage("");
    setError("");
    setEmployee(null);

    if (!empId.trim()) {
      setError("Please enter an Employee ID.");
      return;
    }

    setLoading(true);
    const data = await findUserById(empId.trim());
    setLoading(false);

    if (!data || data.type === "ADMIN") {
      setError("Employee not found. They must already exist in the HR system before being made MD.");
      return;
    }

    setEmployee(data);
  };

  const alreadyMd = (code) => mds.some((m) => m.isActive && String(m.employeeCode) === String(code));

  const grantMd = async () => {
    setMessage("");
    setError("");
    const id = employee?.id || empId.trim();
    const res = await setMdDesignation(id, true);
    if (res.ok) {
      setMessage(`${employee?.name || id} can now log in as Managing Director using their existing Employee ID and password.`);
      await loadMds();
    } else {
      setError(res.error || "Could not grant MD access.");
    }
  };

  const revokeMd = async (code) => {
    setMessage("");
    setError("");
    const res = await setMdDesignation(code, false);
    if (res.ok) {
      setMessage(`MD access revoked for ${code}.`);
      await loadMds();
    } else {
      setError(res.error || "Could not revoke MD access.");
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="main-area">
        <div className="container">
          <div className="page-header anim-fade-up">
            <h1>Manage Managing Director Access</h1>
            <p>
              Grant or revoke the MD designation for an existing employee. Granting MD access
              doesn't create a new account — the employee logs in with their existing Employee ID
              and password, exactly like an HOD does.
            </p>
          </div>

          <div className="card" style={{ maxWidth: 700, margin: "0 auto 24px", padding: 24 }}>
            <h3 style={{ marginBottom: 6 }}>Grant MD Access</h3>
            <p style={{ color: "var(--ink-500)", fontSize: 14, marginBottom: 16 }}>
              Search for the employee, then confirm.
            </p>

            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="input"
                placeholder="Enter Employee ID"
                value={empId}
                onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                style={{ height: 44 }}
              />
              <button className="btn btn-primary" onClick={searchEmployee} disabled={loading}>
                {loading ? "Searching…" : "Search"}
              </button>
            </div>

            {employee && (
              <div className="card" style={{ marginTop: 18, padding: 16, background: "var(--cane-50)" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: "50%", background: "#6b2fb5", color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                  }}>
                    {initials(employee.name)}
                  </div>
                  <div>
                    <strong>{employee.name}</strong>
                    <div style={{ color: "var(--ink-500)", fontSize: 13 }}>
                      {employee.id || empId} · {employee.department} · {employee.designation}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  {alreadyMd(employee.id || empId) ? (
                    <span className="badge">Already MD</span>
                  ) : (
                    <button className="btn btn-primary" onClick={grantMd}>
                      Grant MD Access
                    </button>
                  )}
                </div>
              </div>
            )}

            {message && <div className="alert alert-success" style={{ marginTop: 18 }}>{message}</div>}
            {error && <div className="alert alert-error" style={{ marginTop: 18 }}>{error}</div>}
          </div>

          <div className="card" style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Current MD Designations</h3>
            {listLoading ? (
              <div className="skeleton" style={{ height: 60 }} />
            ) : mds.filter((m) => m.isActive).length === 0 ? (
              <p style={{ color: "var(--ink-500)" }}>
                No one is currently designated MD — MD login won't work for anyone until you grant it above.
              </p>
            ) : (
              <div className="stack" style={{ gap: 10 }}>
                {mds.filter((m) => m.isActive).map((m) => (
                  <div key={m.employeeCode} className="row" style={{ justifyContent: "space-between", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 10 }}>
                    <div>
                      <strong>{m.name || m.employeeCode}</strong>
                      <div style={{ color: "var(--ink-500)", fontSize: 13 }}>
                        {m.employeeCode}{m.department ? ` · ${m.department}` : ""}
                      </div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => revokeMd(m.employeeCode)}>
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
