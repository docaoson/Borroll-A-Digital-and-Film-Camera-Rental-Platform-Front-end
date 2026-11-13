import { Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import RenterLayout from "../layouts/RenterLayout";
import AdminLayout from "../layouts/AdminLayout";
import ProtectedRoute from "../components/shared/ProtectedRoute";

import HomePage from "../pages/public/HomePage";
import CameraListPage from "../pages/public/CameraListPage";
import CameraDetailPage from "../pages/public/CameraDetailPage";
import AboutPage from "../pages/public/AboutPage";
import LoginPage from "../pages/public/LoginPage";
import RegisterPage from "../pages/public/RegisterPage";
import RentalPolicyPage from "../pages/public/RentalPolicyPage";
import DeliveryPolicyPage from "../pages/public/DeliveryPolicyPage";
import ReturnPolicyPage from "../pages/public/ReturnPolicyPage";
import PrivacyPolicyPage from "../pages/public/PrivacyPolicyPage";
import SupportPage from "../pages/public/SupportPage";

import CartPage from "../pages/renter/CartPage";
import CheckoutPage from "../pages/renter/CheckoutPage";
import OrdersPage from "../pages/renter/OrdersPage";
import OrderDetailPage from "../pages/renter/OrderDetailPage";
import ProfilePage from "../pages/renter/ProfilePage";
import FavoritesPage from "../pages/renter/FavoritesPage";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminProductsPage from "../pages/admin/AdminProductsPage";
import AdminProductFormPage from "../pages/admin/AdminProductFormPage";
import AdminCategoriesPage from "../pages/admin/AdminCategoriesPage";
import AdminBrandsPage from "../pages/admin/AdminBrandsPage";
import AdminInventoryPage from "../pages/admin/AdminInventoryPage";
import AdminBranchesPage from "../pages/admin/AdminBranchesPage";
import AdminCalendarPage from "../pages/admin/AdminCalendarPage";
import AdminOrdersPage from "../pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "../pages/admin/AdminOrderDetailPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";

import ForbiddenPage from "../pages/error/ForbiddenPage";
import ErrorPage from "../pages/error/ErrorPage";
import NotFoundPage from "../pages/error/NotFoundPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="cameras" element={<CameraListPage />} />
        <Route path="cameras/:id" element={<CameraDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="rental-policy" element={<RentalPolicyPage />} />
        <Route path="delivery-policy" element={<DeliveryPolicyPage />} />
        <Route path="return-policy" element={<ReturnPolicyPage />} />
        <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="faq" element={<SupportPage />} />
        <Route path="403" element={<ForbiddenPage />} />
        <Route path="error" element={<ErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route
        path="/cart"
        element={
          <ProtectedRoute>
            <RenterLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CartPage />} />
      </Route>
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <RenterLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CheckoutPage />} />
      </Route>
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <RenterLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OrdersPage />} />
        <Route path=":id" element={<OrderDetailPage />} />
      </Route>
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <RenterLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProfilePage />} />
      </Route>
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <RenterLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ProfilePage />} />
      </Route>
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <RenterLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<FavoritesPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["STAFF", "ADMIN"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        {/* Chỉ ADMIN mới có quyền: Thêm, sửa, ẩn mẫu máy (Row 7) */}
        <Route
          path="products"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminProductsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/new"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminProductFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminProductFormPage />
            </ProtectedRoute>
          }
        />
        {/* Chỉ ADMIN mới có quyền: Quản lý danh mục, hãng, chi nhánh (Row 9) */}
        <Route
          path="categories"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminCategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="brands"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminBrandsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="branches"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminBranchesPage />
            </ProtectedRoute>
          }
        />
        {/* KHO MÁY: Nhân viên & Admin xem chiếc máy & khóa bảo trì (Row 6), nhưng Thêm máy (Row 8) chỉ ADMIN */}
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route
          path="inventory/new"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminInventoryPage />
            </ProtectedRoute>
          }
        />
        <Route path="inventory/:id" element={<AdminInventoryPage />} />
        <Route path="calendar" element={<AdminCalendarPage />} />
        {/* VẬN HÀNH ĐƠN THUÊ: Nhân viên & Admin xem, xác nhận, giao/nhận máy (Row 2, 4, 5) */}
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        {/* TÀI KHOẢN: Chỉ ADMIN mới xem, gán vai trò, khóa/mở khóa (Row 10) */}
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
