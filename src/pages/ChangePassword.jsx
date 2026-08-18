import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { changeEmployeePassword, changeHodPassword, changeMdPassword } from "../services/api.js";
import { IconLock, IconCheck } from "../components/Icons.jsx";
import { Eye, EyeOff } from "lucide-react";

export default function ChangePassword() {
  const { session } = useAuth();
  const isHod = session.role === "HOD";
  const isMd = session.role === "MD";
  const loginId = isMd ? session.user.mdId : isHod ? session.user.hodId : session.user.empId;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (!current || !next || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (next.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (next !== confirm) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    const res = isMd
      ? await changeMdPassword(current, next)
      : isHod
      ? await changeHodPassword(current, next)
      : await changeEmployeePassword(session.user.empId, current, next);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSuccess(true);
    setCurrent("");
    setNext("");
    setConfirm("");
  };

  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-area">
        <div className="container" style={{ maxWidth: 520 }}>
          <div className="page-header anim-fade-up">
            <h1>Change Password</h1>
            <p>
              Update your login password for {loginId}. Keep it
              private.
            </p>
          </div>

          <form
            className="card anim-fade-up"
            style={{ padding: 24 }}
            onSubmit={handleSubmit}
          >
            {error && (
              <div className="alert alert-error">
                <IconLock width={16} height={16} />
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success">
                <IconCheck width={16} height={16} />
                Password updated successfully.
              </div>
            )}

            <div className="field">
              <label htmlFor="cur">Current Password</label>

              <div style={{ position: "relative" }}>
                <input
                  id="cur"
                  type={showCurrent ? "text" : "password"}
                  className="input"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: "45px" }}
                />

                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "12px",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <span className="field-hint">
                Default password is your {isMd ? "MD ID" : isHod ? "HOD ID" : "Employee ID"}, unless already changed.
              </span>
            </div>

            <div className="field">
              <label htmlFor="new">New Password</label>

              <div style={{ position: "relative" }}>
                <input
                  id="new"
                  type={showNew ? "text" : "password"}
                  className="input"
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: "45px" }}
                />

                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "12px",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor="conf">Confirm New Password</label>

              <div style={{ position: "relative" }}>
                <input
                  id="conf"
                  type={showConfirm ? "text" : "password"}
                  className="input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  style={{ paddingRight: "45px" }}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "12px",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner" />
              ) : (
                <IconLock width={16} height={16} />
              )}
              {loading ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
