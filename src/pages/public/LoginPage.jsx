import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../lib/apiClient";
import { healthService } from "../../services/healthService";

function getSafeNextPath(rawNext) {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return "/profile";
  }
  return rawNext;
}

function LoginPage() {
  const { user, login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    let active = true;
    healthService
      .checkHealth()
      .then((res) => {
        if (active) setHealth(res);
      })
      .catch(() => {
        if (active) setHealth({ status: "down", database: "down" });
      });
    return () => {
      active = false;
    };
  }, []);

  const hasCustomNext = Boolean(searchParams.get("next"));
  const defaultTarget = hasCustomNext ? nextPath : "/";

  if (!isLoading && isAuthenticated) {
    return <Navigate to={defaultTarget} replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");

    const errors = {};
    if (!email.trim()) {
      errors.email = "Vui lòng nhập email";
    }
    if (!password) {
      errors.password = "Vui lòng nhập mật khẩu";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      const target = hasCustomNext ? nextPath : "/";
      navigate(target, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details?.fields) {
          setFieldErrors(error.details.fields);
        }
        setFormError(error.message);
      } else {
        setFormError("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container auth-shell">
        <div className="auth-card">
          <div className="auth-header">
            <p className="eyebrow">BORROLL ACCOUNT</p>
            <h1>Đăng nhập</h1>
            <p className="auth-subtitle">
              Đăng nhập để quản lý hồ sơ, theo dõi đơn thuê và nhận hỗ trợ từ
              cửa hàng BORROLL.
            </p>
          </div>

          {health && (
            <div
              className={`health-pill ${health.status === "ok" ? "ok" : "down"}`}
              role="status"
            >
              API: {health.status === "ok" ? "Đã kết nối" : "Chưa kết nối"} · DB:{" "}
              {health.database === "up" ? "Sẵn sàng" : "Gián đoạn"}
            </div>
          )}

          {formError && (
            <div className="form-alert error" role="alert">
              {formError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="ban@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && (
                <p className="field-error">{fieldErrors.email}</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Mật khẩu</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {fieldErrors.password && (
                <p className="field-error">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              className="button primary-button full-width"
              disabled={submitting}
            >
              {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          <p className="auth-footer-text">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="auth-inline-link">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
