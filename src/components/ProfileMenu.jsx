import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut, X } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const ROLE_BADGE_STYLES = {
  MD: { background: "#f6ecff", color: "#6b2fb5" },
  HOD: { background: "#e9f2ff", color: "#1a5ea8" },
  ADMIN: { background: "#eef1f4", color: "#2c3e50" },
  EMPLOYEE: { background: "#edf6f1", color: "#21634d" },
};

export default function ProfileMenu() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  const name =
    user.name ||
    user.fullName ||
    user.FULL_NAME ||
    user.username ||
    "User";

  const empId =
    user.empId ||
    user.employeeId ||
    user.EMP_ID ||
    user.mdId ||
    user.MD_ID ||
    user.hodId ||
    user.HOD_ID ||
    user.username ||
    "-";

  const department =
    user.department ||
    user.DEPARTMENT ||
    "-";

  const role =
    user.role ||
    session.role ||
    "EMPLOYEE";

  const designation =
    user.designation ||
    user.DESIGNATION ||
    "";

  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [open]);

  const handleLogout = () => {
    setOpen(false);

    if (typeof logout === "function") {
      logout();
    }

    navigate("/");
  };

  return (
    <>
      <style>{`

        /* =========================================
           PROFILE MENU
        ========================================= */

        .pm-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          z-index: 2000;
        }

        /* Profile circular button */

        .pm-avatar-button {
          width: 40px;
          height: 40px;
          min-width: 40px;

          border-radius: 50%;

          border: 2px solid #eadfbd;

          background: linear-gradient(135deg, #fff8df 0%, #fbedc0 100%);

          color: #8c6b19;

          font-size: 13px;
          font-weight: 800;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease,
            background 0.18s ease;

          -webkit-tap-highlight-color: transparent;
        }

        .pm-avatar-button:hover {
          transform: scale(1.06);

          box-shadow:
            0 4px 14px rgba(0, 0, 0, 0.14);
        }

        .pm-avatar-button:active {
          transform: scale(0.95);
        }


        /* =========================================
           DARK OVERLAY
        ========================================= */

        .pm-overlay {
          position: fixed;

          inset: 0;

          background: rgba(15, 23, 20, 0.28);
          backdrop-filter: blur(1.5px);

          z-index: 1998;

          animation: pmFadeIn 0.15s ease;
        }

        @keyframes pmFadeIn {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }


        /* =========================================
           PROFILE POPUP
        ========================================= */

        .pm-popup {
          position: fixed;

          top: 68px;
          right: 14px;

          width: 250px;

          max-width: calc(100vw - 28px);

          background: #ffffff;

          border-radius: 16px;

          padding: 14px 16px 16px;

          box-sizing: border-box;

          box-shadow:
            0 10px 32px rgba(0, 0, 0, 0.16),
            0 2px 6px rgba(0, 0, 0, 0.06);

          border: 1px solid rgba(18, 63, 49, 0.08);

          z-index: 1999;

          animation: pmSlideDown 0.18s cubic-bezier(.2,.8,.3,1.1);

          transform-origin: top right;
        }

        @keyframes pmSlideDown {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.96);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }


        /* =========================================
           POPUP HEADER
        ========================================= */

        .pm-header {
          display: flex;

          align-items: flex-start;

          justify-content: space-between;

          gap: 10px;
        }


        /* Large profile icon */

        .pm-large-avatar {
          width: 46px;
          height: 46px;

          border-radius: 50%;

          background: linear-gradient(135deg, #fff8df 0%, #fbedc0 100%);

          border: 2px solid #eadfbd;

          color: #8c6b19;

          font-size: 16px;
          font-weight: 800;

          display: flex;
          align-items: center;
          justify-content: center;

          box-shadow: 0 3px 10px rgba(140, 107, 25, 0.16);
        }


        /* Close button */

        .pm-close-button {
          width: 28px;
          height: 28px;

          border: none;

          border-radius: 50%;

          background: #f4f5f3;

          color: #68706b;

          display: flex;
          align-items: center;
          justify-content: center;

          cursor: pointer;

          transition:
            background 0.15s ease,
            color 0.15s ease;
        }

        .pm-close-button:hover {
          background: #e9ece9;
          color: #123f31;
        }


        /* =========================================
           USER NAME
        ========================================= */

        .pm-name {
          margin-top: 10px;

          color: #123f31;

          font-size: 15.5px;

          line-height: 1.25;

          font-weight: 750;

          word-break: break-word;
        }

        .pm-designation {
          margin-top: 2px;

          color: #737a76;

          font-size: 12px;

          line-height: 1.4;
        }


        /* =========================================
           USER DETAILS
        ========================================= */

        .pm-details {
          margin-top: 12px;

          padding: 6px 0;

          border-top: 1px solid #edf0ed;

          border-bottom: 1px solid #edf0ed;
        }

        .pm-detail-row {
          display: flex;

          align-items: center;

          justify-content: space-between;

          gap: 12px;

          padding: 6px 0;
        }

        .pm-detail-label {
          color: #7a817d;

          font-size: 12px;

          flex-shrink: 0;
        }

        .pm-detail-value {
          color: #25332d;

          font-size: 12px;

          font-weight: 650;

          text-align: right;

          word-break: break-word;
        }


        /* =========================================
           ROLE BADGE
        ========================================= */

        .pm-role-badge {
          display: inline-flex;

          align-items: center;

          justify-content: center;

          margin-top: 8px;

          padding: 3px 9px;

          border-radius: 999px;

          background: #edf6f1;

          color: #21634d;

          font-size: 10px;

          font-weight: 750;

          letter-spacing: 0.4px;

          text-transform: uppercase;
        }


        /* =========================================
           LOGOUT BUTTON
        ========================================= */

        .pm-logout-button {
          width: 100%;

          min-height: 38px;

          margin-top: 12px;

          border: none;

          border-radius: 10px;

          background: #f9e9e7;

          color: #b5402f;

          font-size: 13.5px;

          font-weight: 700;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 7px;

          cursor: pointer;

          transition:
            background 0.18s ease,
            transform 0.12s ease;
        }

        .pm-logout-button:hover {
          background: #f5dcd8;
        }

        .pm-logout-button:active {
          transform: scale(0.98);
        }


        /* =========================================
           MOBILE
        ========================================= */

        @media (max-width: 480px) {

          .pm-avatar-button {
            width: 38px;
            height: 38px;
            min-width: 38px;

            font-size: 12px;
          }

          .pm-popup {
            top: 64px;

            right: 10px;

            width: calc(100vw - 20px);

            max-width: 270px;

            padding: 12px 14px 14px;

            border-radius: 15px;
          }

          .pm-large-avatar {
            width: 42px;
            height: 42px;

            font-size: 15px;
          }

          .pm-name {
            font-size: 14.5px;
          }

          .pm-detail-row {
            padding: 5px 0;
          }
        }

      `}</style>
      

      <div
        className="pm-wrapper"
        ref={menuRef}
      >

        {/* ==============================
            PROFILE ICON
        ============================== */}

        <button
          type="button"
          className="pm-avatar-button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Open profile"
        >
          {initials}
        </button>


        {/* ==============================
            PROFILE POPUP
        ============================== */}

        {open && (
          <>
            <div
              className="pm-overlay"
              onClick={() => setOpen(false)}
            />

            <div className="pm-popup">

              {/* Header */}

              <div className="pm-header">

                <div className="pm-large-avatar">
                  {initials}
                </div>

                <button
                  type="button"
                  className="pm-close-button"
                  onClick={() => setOpen(false)}
                  aria-label="Close profile"
                >
                  <X size={18} />
                </button>

              </div>


              {/* Name */}

              <div className="pm-name">
                {name}
              </div>


              {/* Designation */}

              {designation && (
                <div className="pm-designation">
                  {designation}
                </div>
              )}


              {/* Role */}

              <div
                className="pm-role-badge"
                style={ROLE_BADGE_STYLES[role] || ROLE_BADGE_STYLES.EMPLOYEE}
              >
                {role}
              </div>


              {/* Details */}

              <div className="pm-details">

                <div className="pm-detail-row">

                  <span className="pm-detail-label">
                    {role === "MD"
                      ? "MD ID"
                      : role === "HOD"
                      ? "HOD ID"
                      : role === "ADMIN"
                      ? "Username"
                      : "Employee ID"}
                  </span>

                  <strong className="pm-detail-value">
                    {empId}
                  </strong>

                </div>


                <div className="pm-detail-row">

                  <span className="pm-detail-label">
                    Department
                  </span>

                  <strong className="pm-detail-value">
                    {department}
                  </strong>

                </div>

              </div>


              {/* Logout */}

              <button
                type="button"
                className="pm-logout-button"
                onClick={handleLogout}
              >
                <LogOut size={18} />

                <span>
                  Logout
                </span>
              </button>

            </div>
          </>
        )}

      </div>
    </>
  );
}