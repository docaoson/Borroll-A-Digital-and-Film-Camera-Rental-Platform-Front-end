import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../lib/apiClient";

function RegisterPage() {
  const { register, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError("");

    const errors = {};
    if (!fullName.trim()) {
      errors.fullName = "Vui lòng nhập họ và tên";
    }
    if (!email.trim()) {
      errors.email = "Vui lòng nhập email";
    }
    if (!/^0\d{9}$/.test(phone.trim())) {
      errors.phone = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0";
    }
    if (password.length < 8) {
      errors.password = "Mật khẩu phải có tối thiểu 8 ký tự";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      navigate("/", { replace: true });
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
            <h1>Đăng ký tài khoản</h1>
            <p className="auth-subtitle">
              Tạo tài khoản khách hàng BORROLL để đặt thuê máy nhanh hơn và
              quản lý thông tin cá nhân.
            </p>
          </div>

          {formError && (
            <div className="form-alert error" role="alert">
              {formError}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="form-field">
              <label htmlFor="register-fullName">Họ và tên</label>
              <input
                id="register-fullName"
                type="text"
                autoComplete="name"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              {fieldErrors.fullName && (
                <p className="field-error">{fieldErrors.fullName}</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                placeholder="a@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {fieldErrors.email && (
                <p className="field-error">{fieldErrors.email}</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="register-phone">Số điện thoại</label>
              <input
                id="register-phone"
                type="tel"
                autoComplete="tel"
                placeholder="0912345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {fieldErrors.phone && (
                <p className="field-error">{fieldErrors.phone}</p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="register-password">Mật khẩu</label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                placeholder="Tối thiểu 8 ký tự"
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
              {submitting ? "Đang tạo tài khoản..." : "Đăng ký"}
            </button>
          </form>

          <p className="auth-footer-text">
            Đã có tài khoản?{" "}
            <Link to="/login" className="auth-inline-link">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
