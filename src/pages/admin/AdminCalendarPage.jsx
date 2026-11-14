import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";
import { adminService } from "../../services/adminService";
import { catalogService } from "../../services/catalogService";

function formatDate(isoStr) {
  if (!isoStr) return "--";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("vi-VN");
  } catch {
    return isoStr;
  }
}

const WEEKDAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

function AdminCalendarPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [branches, setBranches] = useState([]);

  // Selected Month (0-indexed month, 4-digit year)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0 - 11

  // Filters
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Selected Day for day details drawer
  const [selectedDayDate, setSelectedDayDate] = useState(null); // 'YYYY-MM-DD'
  const [refreshKey, setRefreshKey] = useState(0);

  // Load branches
  useEffect(() => {
    let active = true;
    catalogService.getBranches().then((res) => {
      if (!active) return;
      const bList = Array.isArray(res) ? res : res?.items || [];
      setBranches(bList);
    });
    return () => {
      active = false;
    };
  }, []);

  // Load bookings for calendar
  useEffect(() => {
    let active = true;

    const params = {
      page: 1,
      pageSize: 100,
    };
    if (selectedBranch !== "ALL") {
      params.branch = selectedBranch;
    }
    if (selectedStatus !== "ALL") {
      params.status = selectedStatus;
    }

    adminService
      .getStaffBookings(params)
      .then((data) => {
        if (!active) return;
        setBookings(data.items || []);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err?.message ||
            "Không thể tải dữ liệu lịch thuê từ máy chủ. Vui lòng thử lại.",
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedBranch, selectedStatus, refreshKey]);

  // Navigate Months
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDayDate(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDayDate(null);
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDayDate(null);
  };

  // Build Calendar Days for Current Month View
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Day of week: 0 (Sun) to 6 (Sat). We want Monday (1) as start of week.
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

    const totalDaysInMonth = lastDayOfMonth.getDate();
    const cells = [];

    // 1. Previous Month padding days
    const prevMonthLastDate = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // 2. Current Month days
    const now = new Date();
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayDateStr,
      });
    }

    // 3. Next Month padding days (fill out full 35 or 42 cells)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({
        dateStr,
        dayNum: i,
        isCurrentMonth: false,
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Map bookings to dates: { 'YYYY-MM-DD': [ { type: 'pickup' | 'return' | 'active', booking } ] }
  const eventsByDate = useMemo(() => {
    const map = {};

    bookings.forEach((b) => {
      const start = b.startDate; // YYYY-MM-DD
      const end = b.endDate; // YYYY-MM-DD
      if (!start || !end) return;

      // Pickup event on startDate
      if (!map[start]) map[start] = [];
      map[start].push({
        id: `${b.id}-pickup`,
        type: "pickup",
        label: `[Nhận] #${b.code || b.id.slice(0, 6)} - ${b.items?.[0]?.name || "Máy"}`,
        booking: b,
      });

      // Return event on endDate
      if (!map[end]) map[end] = [];
      map[end].push({
        id: `${b.id}-return`,
        type: "return",
        label: `[Trả] #${b.code || b.id.slice(0, 6)} - ${b.items?.[0]?.name || "Máy"}`,
        booking: b,
      });
    });

    return map;
  }, [bookings]);

  // Bookings on selected day
  const selectedDayEvents = useMemo(() => {
    if (!selectedDayDate) return [];
    return eventsByDate[selectedDayDate] || [];
  }, [selectedDayDate, eventsByDate]);

  return (
    <div className="admin-calendar-page">
      {/* HEADER SECTION */}
      <section className="admin-page-header">
        <div className="admin-page-titles">
          <div className="admin-breadcrumb">
            <Link to="/admin/orders">Đơn thuê</Link>
            <span className="sep">/</span>
            <span className="current">Lịch thuê máy trực quan</span>
          </div>
          <h1 className="admin-heading-title">Lịch thuê thiết bị</h1>
          <p className="admin-heading-sub">
            Theo dõi trực quan các mốc nhận máy, hoàn trả máy và các đơn thuê đang diễn ra theo dòng thời gian tháng.
          </p>
        </div>

        <div className="admin-header-actions">
          <Link to="/admin/orders" className="button secondary-button compact">
            Xem danh sách đơn thuê
          </Link>
          <button
            type="button"
            className="button secondary-button compact"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
          >
            <span aria-hidden="true">↻</span>
            <span>Làm mới</span>
          </button>
        </div>
      </section>

      {/* ERROR BANNER */}
      {error && (
        <div className="form-alert error admin-alert-bar" role="alert">
          <span>{error}</span>
        </div>
      )}

      {/* CALENDAR CONTROLS & MONTH NAVIGATION */}
      <div className="admin-calendar-controls-bar">
        <div className="admin-month-nav">
          <button
            type="button"
            className="button secondary-button compact"
            onClick={handlePrevMonth}
            title="Tháng trước"
          >
            ← Tháng trước
          </button>
          <h2 className="admin-current-month-title">
            Tháng {currentMonth + 1} / {currentYear}
          </h2>
          <button
            type="button"
            className="button secondary-button compact"
            onClick={handleNextMonth}
            title="Tháng sau"
          >
            Tháng sau →
          </button>
          <button
            type="button"
            className="button secondary-button compact"
            onClick={handleToday}
          >
            Hôm nay
          </button>
        </div>

        {/* Filter Dropdowns */}
        <div className="admin-calendar-filters">
          <select
            className="admin-select-filter"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            aria-label="Lọc chi nhánh"
          >
            <option value="ALL">Tất cả chi nhánh</option>
            {branches.map((b) => (
              <option key={b.id || b.slug} value={b.slug}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            className="admin-select-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Lọc trạng thái đơn"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="CONFIRMED">Shop đã xác nhận (Chờ nhận)</option>
            <option value="PICKED_UP">Đang thuê</option>
            <option value="RETURNED">Đã trả máy</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="PENDING">Chờ xác nhận</option>
          </select>
        </div>
      </div>

      {/* CALENDAR LEGEND */}
      <div className="admin-calendar-legend">
        <div className="legend-item">
          <span className="legend-dot pickup" />
          <span>Lịch nhận máy (Bắt đầu thuê)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot return" />
          <span>Lịch trả máy (Kết thúc thuê)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot overdue" />
          <span>Đơn quá hạn trả</span>
        </div>
      </div>

      {/* CALENDAR GRID */}
      <section className="admin-calendar-container">
        {loading ? (
          <div className="admin-table-loading" style={{ minHeight: "360px" }}>
            <span className="admin-spinner" />
            <p>Đang đồng bộ dữ liệu lịch thuê...</p>
          </div>
        ) : (
          <div className="admin-calendar-grid">
            {/* WEEKDAY HEADERS */}
            <div className="calendar-weekdays-row">
              {WEEKDAYS.map((w, idx) => (
                <div key={idx} className="calendar-weekday-cell">
                  {w}
                </div>
              ))}
            </div>

            {/* DAY CELLS */}
            <div className="calendar-cells-grid">
              {calendarCells.map((cell) => {
                const dayEvents = eventsByDate[cell.dateStr] || [];
                const isSelected = selectedDayDate === cell.dateStr;

                return (
                  <div
                    key={cell.dateStr}
                    className={`calendar-cell ${cell.isCurrentMonth ? "in-month" : "out-month"} ${cell.isToday ? "is-today" : ""} ${isSelected ? "is-selected" : ""}`}
                    onClick={() => {
                      if (dayEvents.length > 0) {
                        setSelectedDayDate(cell.dateStr);
                      }
                    }}
                  >
                    <div className="cell-top">
                      <span className="cell-day-num">{cell.dayNum}</span>
                      {dayEvents.length > 0 && (
                        <span className="cell-event-badge">
                          {dayEvents.length} đơn
                        </span>
                      )}
                    </div>

                    <div className="cell-events-list">
                      {dayEvents.slice(0, 3).map((ev) => (
                        <div
                          key={ev.id}
                          className={`calendar-event-pill ${ev.type} ${ev.booking.isOverdue ? "is-overdue" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/orders/${ev.booking.id}`);
                          }}
                          title={`#${ev.booking.code} - ${ev.booking.contactName || "Khách"} (${ev.booking.status})`}
                        >
                          <span className="pill-type">
                            {ev.type === "pickup" ? "Nhận" : "Trả"}
                          </span>
                          <span className="pill-title">
                            #{ev.booking.code || ev.booking.id.slice(0, 6)}
                          </span>
                        </div>
                      ))}

                      {dayEvents.length > 3 && (
                        <div className="cell-more-events">
                          +{dayEvents.length - 3} đơn nữa
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* SELECTED DAY SUMMARY DRAWER / CARD */}
      {selectedDayDate && (
        <section className="admin-day-summary-card">
          <div className="summary-card-header">
            <div>
              <h3>Lịch vận hành ngày: {formatDate(selectedDayDate)}</h3>
              <p>Có tổng cộng {selectedDayEvents.length} lượt giao/nhận thiết bị trong ngày này.</p>
            </div>
            <button
              type="button"
              className="button secondary-button compact"
              onClick={() => setSelectedDayDate(null)}
            >
              Đóng chi tiết ngày
            </button>
          </div>

          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Tác vụ</th>
                  <th scope="col">Mã đơn</th>
                  <th scope="col">Khách hàng & SĐT</th>
                  <th scope="col">Thiết bị thuê</th>
                  <th scope="col">Chi nhánh</th>
                  <th scope="col">Kỳ hạn</th>
                  <th scope="col">Trạng thái</th>
                  <th scope="col" className="text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {selectedDayEvents.map((ev, idx) => {
                  const b = ev.booking;
                  const isPickup = ev.type === "pickup";
                  return (
                    <tr key={idx}>
                      <td>
                        <span className={`admin-kind-badge ${isPickup ? "is-digital" : "is-film"}`}>
                          {isPickup ? "BÀN GIAO MÁY" : "NHẬN TRẢ MÁY"}
                        </span>
                      </td>
                      <td>
                        <strong>#{b.code || b.id.slice(0, 8)}</strong>
                      </td>
                      <td>
                        <div className="admin-user-cell">
                          <span className="user-name">{b.customer?.fullName || b.contactName || "Khách"}</span>
                          <span className="user-phone">{b.customer?.phone || b.contactPhone || "--"}</span>
                        </div>
                      </td>
                      <td>
                        <span className="admin-items-desc">
                          {b.items?.map((it) => it.name).join(", ") || "Thiết bị thuê"}
                        </span>
                      </td>
                      <td>
                        <span className="admin-branch-pill">{b.branch?.name || "Chi nhánh"}</span>
                      </td>
                      <td>
                        <div className="admin-date-cell">
                          <span>{formatDate(b.startDate)} → {formatDate(b.endDate)}</span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={b.status} isOverdue={b.isOverdue} />
                      </td>
                      <td className="text-right">
                        <Link
                          to={`/admin/orders/${b.id}`}
                          className="button primary-button compact"
                        >
                          Xử lý đơn →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default AdminCalendarPage;
