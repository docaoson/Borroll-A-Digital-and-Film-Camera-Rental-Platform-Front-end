import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import ProtectedRoute from "../components/shared/ProtectedRoute";

import HomePage from "../pages/public/HomePage";
import CameraListPage from "../pages/public/CameraListPage";
import CameraDetailPage from "../pages/public/CameraDetailPage";
import NotFoundPage from "../pages/error/NotFoundPage";

const RenterLayout = lazy(() => import("../layouts/RenterLayout"));
const AdminLayout = lazy(() => import("../layouts/AdminLayout"));

const AboutPage = lazy(() => import("../pages/public/AboutPage"));
const LoginPage = lazy(() => import("../pages/public/LoginPage"));
const RegisterPage = lazy(() => import("../pages/public/RegisterPage"));
const RentalPolicyPage = lazy(() => import("../pages/public/RentalPolicyPage"));
const DeliveryPolicyPage = lazy(
  () => import("../pages/public/DeliveryPolicyPage"),
);
const ReturnPolicyPage = lazy(() => import("../pages/public/ReturnPolicyPage"));
const PrivacyPolicyPage = lazy(
  () => import("../pages/public/PrivacyPolicyPage"),
);
const SupportPage = lazy(() => import("../pages/public/SupportPage"));

const CartPage = lazy(() => import("../pages/renter/CartPage"));
const CheckoutPage = lazy(() => import("../pages/renter/CheckoutPage"));
const OrdersPage = lazy(() => import("../pages/renter/OrdersPage"));
const OrderDetailPage = lazy(() => import("../pages/renter/OrderDetailPage"));
const ProfilePage = lazy(() => import("../pages/renter/ProfilePage"));
const FavoritesPage = lazy(() => import("../pages/renter/FavoritesPage"));

const AdminProductsPage = lazy(
  () => import("../pages/admin/AdminProductsPage"),
);
const AdminProductFormPage = lazy(
  () => import("../pages/admin/AdminProductFormPage"),
);
const AdminCategoriesPage = lazy(
  () => import("../pages/admin/AdminCategoriesPage"),
);
const AdminBrandsPage = lazy(() => import("../pages/admin/AdminBrandsPage"));
const AdminInventoryPage = lazy(
  () => import("../pages/admin/AdminInventoryPage"),
);
const AdminBranchesPage = lazy(
  () => import("../pages/admin/AdminBranchesPage"),
);
const AdminCalendarPage = lazy(
  () => import("../pages/admin/AdminCalendarPage"),
);
const AdminOrdersPage = lazy(() => import("../pages/admin/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(
  () => import("../pages/admin/AdminOrderDetailPage"),
);
const AdminUsersPage = lazy(() => import("../pages/admin/AdminUsersPage"));
const AdminPaymentsPage = lazy(
  () => import("../pages/admin/AdminPaymentsPage"),
);

const ForbiddenPage = lazy(() => import("../pages/error/ForbiddenPage"));
const ErrorPage = lazy(() => import("../pages/error/ErrorPage"));

function AppRoutes() {
  return (
    <Suspense fallback={null}>
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
              <PublicLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CartPage />} />
        </Route>
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <PublicLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<CheckoutPage />} />
        </Route>
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <PublicLayout />
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
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="orders" replace />} />
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
          <Route
            path="inventory"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminInventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/new"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminInventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="inventory/:id"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminInventoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="calendar"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminCalendarPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders/:id"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminOrderDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="payments"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminPaymentsPage />
              </ProtectedRoute>
            }
          />
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
    </Suspense>
  );
}

export default AppRoutes;
