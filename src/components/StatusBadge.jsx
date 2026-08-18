const MAP = {
  PENDING: { cls: 'badge-pending', label: 'Pending' },
  APPROVED: { cls: 'badge-approved', label: 'Approved' },
  CANCELLED: { cls: 'badge-cancelled', label: 'Cancelled' },
  REJECTED: { cls: 'badge-rejected', label: 'Rejected' },
};

export default function StatusBadge({ status }) {
  const m = MAP[status] || MAP.PENDING;
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}
