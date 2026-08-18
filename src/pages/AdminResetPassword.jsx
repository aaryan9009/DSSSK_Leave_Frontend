import { useState } from "react";
import Navbar from "../components/Navbar.jsx";
import {
  findUserById,
  resetEmployeePassword,
  resetHodPassword,
  resetMdPassword,
} from "../services/api.js";

const initials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function AdminResetPassword() {
  const [empId, setEmpId] = useState("");
  const [employee, setEmployee] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isHod = employee?.type === "HOD";
  const isMd = employee?.type === "MD";

  const searchEmployee = async () => {
    setMessage("");
    setError("");
    setEmployee(null);

    if (!empId.trim()) {
      setError("Please enter Employee ID / HOD ID.");
      return;
    }

    setLoading(true);

    const data = await findUserById(empId.trim());

    setLoading(false);

    if (!data || data.type === "ADMIN") {
      setError("Employee or HOD not found.");
      return;
    }

    setEmployee(data);
  };

  const handleReset = async () => {
    setMessage("");
    setError("");

    const id = employee?.id || empId.trim();
    const res = isMd
      ? await resetMdPassword(id)
      : isHod
      ? await resetHodPassword(id)
      : await resetEmployeePassword(id);

    if (res.ok) {
      setMessage(
        `Password reset successfully. Default password is ${isMd ? "MD ID" : isHod ? "HOD ID" : "Employee ID"} (${id}).`
      );
    } else {
      setError(res.error || "Password reset failed.");
    }
  };

  return (
    <div className="app-shell">
      <Navbar />

      <main className="main-area">
        <div className="container">
          <div className="page-header anim-fade-up">
            <h1>Reset Password</h1>
            <p>
              Search an employee or HOD and reset their password to the
              default (their Employee ID / HOD ID).
            </p>
          </div>

          <div
            className="card"
            style={{
              maxWidth: "700px",
              margin: "0 auto",
              padding: "24px",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ marginBottom: "6px" }}>
                Employee / HOD Search
              </h3>

              <p
                style={{
                  color: "var(--ink-500)",
                  fontSize: "14px",
                }}
              >
                Enter Employee ID, HOD ID, or MD ID and search.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <label
                style={{
                  fontWeight: "600",
                }}
              >
                Employee ID / HOD ID
              </label>

              <input
                className="input"
                placeholder="Enter Employee ID, HOD ID, or MD ID"
                value={empId}
                onChange={(e) =>
                  setEmpId(
                    e.target.value.toUpperCase()
                  )
                }
                style={{
                  height: "48px",
                  fontSize: "15px",
                }}
              />

              <button
                className="btn btn-primary"
                onClick={searchEmployee}
                disabled={loading}
                style={{
                  width: "160px",
                }}
              >
                {loading
                  ? "Searching..."
                  : "Search"}
              </button>
            </div>

            {employee && (
              <div
                className="card"
                style={{
                  marginTop: "24px",
                  padding: "20px",
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      background: "#2563eb",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "18px",
                    }}
                  >
                    {initials(employee.name)}
                  </div>

                  <div>
                    <h3
                      style={{
                        margin: 0,
                      }}
                    >
                      {employee.name}
                    </h3>

                    <div
                      style={{
                        color: "#64748b",
                        marginTop: "4px",
                      }}
                    >
                      {employee.id || empId}
                      {" · "}
                      <span
                        style={{
                          fontWeight: 600,
                          color: isMd ? "#6b2fb5" : isHod ? "#7c3aed" : "#2563eb",
                        }}
                      >
                        {isMd ? "MD" : isHod ? "HOD" : "Employee"}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "18px",
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit,minmax(180px,1fr))",
                    gap: "12px",
                  }}
                >
                  <div>
                    <strong>Department</strong>
                    <div>{employee.department}</div>
                  </div>

                  <div>
                    <strong>Designation</strong>
                    <div>{employee.designation}</div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "24px",
                  }}
                >
                  <button
                    className="btn btn-danger"
                    onClick={handleReset}
                  >
                    Reset Password
                  </button>
                </div>
              </div>
            )}

            {message && (
              <div
                className="alert alert-success"
                style={{
                  marginTop: "20px",
                }}
              >
                {message}
              </div>
            )}

            {error && (
              <div
                className="alert alert-error"
                style={{
                  marginTop: "20px",
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}