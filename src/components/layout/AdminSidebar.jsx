import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function NavIcon({ type }) {
  switch (type) {
    case "dashboard":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      );
    case "products":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
          <circle cx="12" cy="13" r="3"/>
        </svg>
      );
    case "categories":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      );
    case "brands":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
      );
    case "inventory":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
          <line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      );
    case "plus":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      );
    case "calendar":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      );
    case "orders":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
        </svg>
      );
    case "handover":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      );
    case "branches":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18"/>
          <path d="M5 21V7l8-4v18"/>
          <path d="M19 21V11l-6-4"/>
        </svg>
      );
    case "roles":
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      );
    default:
      return null;
  }
}

function getNavSections(isAdmin) {
  const sections = [
    {
      title: "TỔNG QUAN",
      items: [
        {
          to: "/admin",
          label: "Tổng quan vận hành",
          iconType: "dashboard",
          end: true,
        },
      ],
    },
  ];

  // CATALOG & MẪU MÁY: Chỉ ADMIN mới có quyền Thêm, sửa, ẩn mẫu máy & quản lý danh mục, hãng (Row 7 & 9)
  if (isAdmin) {
    sections.push({
      title: "CATALOG & MẪU MÁY",
      items: [
        {
          to: "/admin/products",
          label: "Mẫu máy ảnh & Thiết bị",
          iconType: "products",
          end: true,
        },
        {
          to: "/admin/products/new?type=camera",
          label: "+ Thêm máy ảnh",
          iconType: "plus",
        },
        {
          to: "/admin/products/new?type=accessory",
          label: "+ Thêm thiết bị (Phụ kiện/Film)",
          iconType: "plus",
        },
        {
          to: "/admin/categories",
          label: "Danh mục thiết bị",
          iconType: "categories",
          end: true,
        },
        {
          to: "/admin/brands",
          label: "Thương hiệu máy",
          iconType: "brands",
          end: true,
        },
      ],
    });
  }

  // VẬN HÀNH ĐƠN THUÊ: Cả Nhân viên & Admin đều có quyền xem mọi đơn, xác nhận, từ chối, giao/nhận máy (Row 2, 4, 5)
  // Chi nhánh (Row 9) chỉ dành cho ADMIN
  const operationItems = [
    {
      to: "/admin/orders",
      label: "Quản lý đơn thuê",
      iconType: "orders",
    },
    {
      to: "/admin/orders?status=CONFIRMED",
      label: "Bàn giao & Trả máy",
      iconType: "handover",
    },
  ];

  if (isAdmin) {
    operationItems.push({
      to: "/admin/branches",
      label: "Chi nhánh cửa hàng",
      iconType: "branches",
      end: true,
    });
  }

  sections.push({
    title: "VẬN HÀNH ĐƠN THUÊ",
    items: operationItems,
  });

  // KHO MÁY & SERIAL: Cả Nhân viên & Admin đều xem máy, khóa bảo trì, mở khóa (Row 6)
  sections.push({
    title: "KHO MÁY & SERIAL",
    items: [
      {
        to: "/admin/inventory",
        label: "Kho thiết bị & Số serial",
        iconType: "inventory",
      },
      {
        to: "/admin/calendar",
        label: "Lịch thuê máy",
        iconType: "calendar",
      },
    ],
  });

  // TÀI KHOẢN & NGƯỜI DÙNG: Chỉ ADMIN mới xem, gán vai trò, khóa/mở khóa tài khoản (Row 10)
  if (isAdmin) {
    sections.push({
      title: "TÀI KHOẢN & NGƯỜI DÙNG",
      items: [
        {
          to: "/admin/users",
          label: "Tài khoản người dùng",
          iconType: "roles",
        },
      ],
    });
  }

  return sections;
}

function AdminSidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const rawRoles = user?.roles || (user?.role ? [user.role] : []);
  const isAdmin = rawRoles.includes("ADMIN");
  const navSections = getNavSections(isAdmin);

  return (
    <aside
      className={`admin-sidebar-panel ${isOpen ? "is-open" : ""}`}
      aria-label="Danh mục điều hướng quản trị"
    >
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-heading">
          <span className="admin-sidebar-role-tag">
            {isAdmin ? "QUẢN TRỊ VIÊN (ADMIN)" : "NHÂN VIÊN (STAFF)"}
          </span>
          <span className="admin-sidebar-sub">Borroll Platform v2.0</span>
        </div>
        {onClose && (
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={onClose}
            aria-label="Đóng thanh điều hướng"
          >
            <span aria-hidden="true">✕</span>
          </button>
        )}
      </div>

      <nav className="admin-nav-sections">
        {navSections.map((sec) => (
          <div key={sec.title} className="admin-nav-group">
            <span className="admin-nav-group-title">{sec.title}</span>
            <div className="admin-nav-items">
              {sec.items.map((item) => (
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
                    <NavIcon type={item.iconType} />
                  </span>
                  <span className="admin-link-text">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default AdminSidebar;
