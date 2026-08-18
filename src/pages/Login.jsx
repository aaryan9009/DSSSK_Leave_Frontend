
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  loginUser,
  findUserById,
} from "../services/api.js";
import logo from "../assets/logo.jpg";
import { IconLock } from "../components/Icons.jsx";
import { Eye, EyeOff } from "lucide-react";

const initials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { session, loading: authLoading, login } = useAuth();
  const navigate = useNavigate();

  // If a session is already stored (app reopened, not logged out), skip the
  // login screen entirely and go straight to the right dashboard.
  useEffect(() => {
    if (authLoading || !session) return;
    if (session.role === 'ADMIN') navigate('/admin', { replace: true });
    else if (session.role === 'MD') navigate('/md', { replace: true });
    else if (session.role === 'HOD') navigate('/hod', { replace: true });
    else navigate('/dashboard', { replace: true });
  }, [authLoading, session, navigate]);

  useEffect(() => {
    let active = true;

    if (userId.trim().length < 2) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      const user = await findUserById(userId.trim());

      if (active) {
        setPreview(user);
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!userId || !password) {
      setError("Enter User ID and Password.");
      return;
    }

    setLoading(true);

    const res = await loginUser(
      userId.trim(),
      password
    );

    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    login(res.user.role, res.user, res.token);

    if (res.user.role === "ADMIN") {
      navigate("/admin");
    } else if (res.user.role === "MD") {
      navigate("/md");
    } else if (res.user.role === "HOD") {
      navigate("/hod");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="auth-page simple">
      <div className="auth-card-simple anim-fade-up">

        <div className="auth-brand-block">
          <img
            src={logo}
            alt="Shree Datta SSSK"
            className="auth-logo"
          />
          <h1>Shree Datta SSSK</h1>
          <p>Leave Management Portal</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <IconLock width={16} height={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="field">
            <label>User ID</label>
            <input
              className="input"
              placeholder="Employee ID / HOD ID / MD ID / Admin Username"
              value={userId}
              onChange={(e) =>
                setUserId(e.target.value.toUpperCase())
              }
            />

            {preview && (
              <div className="employee-preview">
                <div className="avatar">
                  {initials(preview.name)}
                </div>

                <div>
                  <div className="ep-name">
                    {preview.name}
                  </div>

                  <div className="ep-meta">
                    {preview.designation}
                    {" · "}
                    {preview.department}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    {preview.type}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="field">
            <label>Password</label>

            <div
              style={{
                position: "relative",
                width: "100%",
              }}
            >
              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                className="input"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                style={{
                  width: "100%",
                  paddingRight: "45px",
                }}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "12px",
                  transform:
                    "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>

        </form>
      </div>
    </div>
  );
}