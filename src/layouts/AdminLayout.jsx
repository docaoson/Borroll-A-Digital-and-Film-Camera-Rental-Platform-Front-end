import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/layout/AdminSidebar";
import Header from "../components/shared/Header";

function AdminLayout() {
  return (
    <div className="app-shell admin-shell">
      <Header variant="admin" />
      <main className="admin-main">
        <AdminSidebar />
        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
