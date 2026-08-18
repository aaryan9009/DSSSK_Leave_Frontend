export default function LeaveBalanceRing({ label, total, used, remaining, color, size = 108 }) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(used / total, 1) : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="ring-card card anim-fade-up">
      <div
        className="ring-svg-wrap"
        style={{ '--ring-circumference': circumference, '--ring-offset': offset }}
      >
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="xMidYMid meet">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line-soft)" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ animation: 'growRing 1s cubic-bezier(.25,.8,.25,1) both', animationDelay: '.1s' }}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="ring-center">
          <span className="ring-value">{remaining}</span>
          <span className="ring-total">/ {total}</span>
        </div>
      </div>
      <div className="ring-label">{label}</div>
      <div className="ring-used">{used} used this year</div>
    </div>
  );
}
