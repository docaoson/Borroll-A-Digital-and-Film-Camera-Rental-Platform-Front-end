import { useState } from "react";
import { NavLink } from "react-router-dom";

const navSections = [
  {
    title: "TỔNG QUAN",
    items: [
      {
        to: "/admin",
        label: "Tổng quan vận hành",
        icon: "📊",
        end: true,
      },
    ],
  },
  {
    title: "CATALOG & MẪU MÁY",
    items: [
      {
        to: "/admin/inventory",
        label: "Mẫu máy ảnh",
        icon: "📷",
        end: true,
      },
      {
        label: "Danh mục thiết bị",
        icon: "📑",
        upcoming: "Phase 7B",
        description: "Quản lý thêm, sửa, xóa danh mục máy ảnh kỹ thuật số & máy film.",
      },
      {
        label: "Thương hiệu máy",
        icon: "🏷️",
        upcoming: "Phase 7B",
        description: "Quản lý thương hiệu (Canon, Sony, Fujifilm, Leica, Nikon...).",
      },
    ],
  },
  {
    title: "KHO MÁY & SERIAL",
    items: [
      {
        to: "/admin/inventory",
        label: "Thiết bị & Số serial",
        icon: "📦",
      },
      {
        to: "/admin/inventory/new",
        label: "Thêm máy mới",
        icon: "➕",
      },
      {
        to: "/admin/calendar",
        label: "Lịch thuê máy",
        icon: "📅",
      },
    ],
  },
  {
    title: "VẬN HÀNH ĐƠN THUÊ",
    items: [
      {
        to: "/admin/orders",
        label: "Quản lý đơn thuê",
        icon: "📋",
      },
      {
        label: "Bàn giao & Trả máy",
        icon: "🤝",
        upcoming: "Phase 7C",
        description: "Quy trình kiểm tra thiết bị, upload ảnh biên bản và đối soát cọc.",
      },
      {
        label: "Chi nhánh cửa hàng",
        icon: "🏢",
        upcoming: "Phase 7D",
        description: "Quản lý địa chỉ chi nhánh, kho lưu trữ và phân bổ nguồn thiết bị.",
      },
    ],
  },
  {
    title: "TÀI KHOẢN & NGƯỜI DÙNG",
    items: [
      {
        to: "/admin/customers",
        label: "Khách hàng",
        icon: "👥",
      },
      {
        label: "Phân quyền & Nhân sự",
        icon: "🛡️",
        upcoming: "Phase 7E",
        description: "Quản lý tài khoản nhân viên, cấp quyền STAFF/ADMIN và trạng thái kích hoạt.",
      },
    ],
  },
  {
    title: "NỘI DUNG & HỆ THỐNG",
    items: [
      {
        label: "Quản trị CMS & Bài viết",
        icon: "📰",
        upcoming: "Phase 7F",
        description: "Chỉnh sửa nội dung trang giới thiệu, chính sách thuê và thông báo banner.",
      },
      {
        label: "Cài đặt hệ thống",
        icon: "⚙️",
        upcoming: "Phase 7F",
        description: "Cấu hình tỉ lệ cọc, thời gian giữ chỗ mặc định và thông số vận hành.",
      },
    ],
  },
];

function AdminSidebar({ isOpen, onClose }) {
  const [upcomingInfo, setUpcomingInfo] = useState(null);

  const handleUpcomingClick = (item) => {
    setUpcomingInfo(item);
  };

  return (
    <>
      <aside
        className={`admin-sidebar-panel ${isOpen ? "is-open" : ""}`}
        aria-label="Danh mục điều hướng quản trị"
      >
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-heading">
            <span className="admin-sidebar-role-tag">HỆ THỐNG QUẢN TRỊ</span>
            <span className="admin-sidebar-sub">Borroll Platform v2.0</span>
          </div>
          {onClose && (
            <button
              type="button"
              className="admin-sidebar-close-btn"
              onClick={onClose}
              aria-label="Đóng thanh điều hướng"
            >
              ✕
            </button>
          )}
        </div>

        <nav className="admin-nav-sections">
          {navSections.map((sec) => (
            <div key={sec.title} className="admin-nav-group">
              <span className="admin-nav-group-title">{sec.title}</span>
              <div className="admin-nav-items">
                {sec.items.map((item, idx) => {
                  if (item.upcoming) {
                    return (
                      <button
                        key={`${sec.title}-${item.label}-${idx}`}
                        type="button"
                        className="admin-link upcoming-link"
                        onClick={() => handleUpcomingClick(item)}
                        title={`${item.label} (Kế hoạch: ${item.upcoming})`}
                      >
                        <span className="admin-link-icon" aria-hidden="true">
                          {item.icon}
                        </span>
                        <span className="admin-link-text">{item.label}</span>
                        <span className="admin-upcoming-badge">
                          {item.upcoming}
                        </span>
                      </button>
                    );
                  }

                  return (
                    <NavLink
                      key={item.to + item.label}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        isActive ? "admin-link active" : "admin-link"
                      }
                      onClick={onClose}
                    >
                      <span className="admin-link-icon" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="admin-link-text">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-status">
            <span className="admin-version-tag">Phase 7A Active</span>
            <span className="admin-sync-tag">Sync: Back-End API v1</span>
          </div>
        </div>
      </aside>

      {/* Modal thông báo tính năng theo phân kỳ Roadmap */}
      {upcomingInfo && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setUpcomingInfo(null)}
        >
          <div
            className="admin-roadmap-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge">
                LỘ TRÌNH TRIỂN KHAI · {upcomingInfo.upcoming}
              </span>
              <h3>{upcomingInfo.label}</h3>
            </div>
            <div className="admin-dialog-body">
              <p>{upcomingInfo.description}</p>
              <div className="admin-dialog-meta">
                <span>Phân kỳ thực hiện: <strong>{upcomingInfo.upcoming}</strong></span>
                <span>Trạng thái: <strong>Đã lập kế hoạch & cấu trúc API</strong></span>
              </div>
              <p className="admin-dialog-note">
                Theo kế hoạch phát triển 6 phân kỳ của Phase 7, chức năng này sẽ được xây dựng và kết nối hoàn chỉnh ở phân kỳ tương ứng sau khi hoàn tất nền tảng Phase 7A.
              </p>
            </div>
            <div className="admin-dialog-actions">
              <button
                type="button"
                className="button primary-button compact"
                onClick={() => setUpcomingInfo(null)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AdminSidebar;
