import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminTopbar from "../components/layout/AdminTopbar";
import AdminSidebar from "../components/layout/AdminSidebar";

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="admin-app-shell">
      <AdminTopbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />
      <div className="admin-body-container">
        {isSidebarOpen && (
          <div
            className="admin-sidebar-backdrop"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
        <main className="admin-main-viewport">
          <div className="admin-content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
