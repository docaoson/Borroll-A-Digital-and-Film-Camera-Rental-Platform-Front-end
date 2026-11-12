const STATUS_LABELS = {
  PENDING: "Chờ shop xác nhận",
  CONFIRMED: "Shop đã xác nhận",
  PICKED_UP: "Đang thuê",
  RETURNED: "Đã trả máy",
  COMPLETED: "Hoàn tất",
  REJECTED: "Bị từ chối",
  CANCELLED: "Đã hủy",
};

const STATUS_CLASS = {
  PENDING: "warning",
  CONFIRMED: "info",
  PICKED_UP: "success",
  RETURNED: "info",
  COMPLETED: "neutral",
  REJECTED: "danger",
  CANCELLED: "danger",
};

function StatusBadge({ status, isOverdue = false }) {
  const normalizedStatus = String(status || "").toUpperCase();
  const tone = STATUS_CLASS[normalizedStatus] || "neutral";

  if (normalizedStatus === "PICKED_UP" && isOverdue) {
    return (
      <span className={`status-badge ${tone}`}>
        {`${STATUS_LABELS[normalizedStatus] || "Đang thuê"} • Quá hạn`}
      </span>
    );
  }

  const label = STATUS_LABELS[normalizedStatus] || "Không xác định";
  return <span className={`status-badge ${tone}`}>{label}</span>;
}

export default StatusBadge;
