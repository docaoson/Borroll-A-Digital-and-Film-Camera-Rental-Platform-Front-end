import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../lib/apiClient";

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

const ROLE_LABELS = {
  RENTER: "Khách hàng thuê máy",
  STAFF: "Nhân viên vận hành",
  ADMIN: "Quản trị viên",
};

function ProfilePage() {
  const { user, updateProfile, uploadAvatar } = useAuth();

  const [fullNameDraft, setFullNameDraft] = useState(null);
  const [phoneDraft, setPhoneDraft] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fullName = fullNameDraft ?? user?.fullName ?? "";
  const phone = phoneDraft ?? user?.phone ?? "";

  const isDirty =
    (fullNameDraft !== null && fullNameDraft !== (user?.fullName || "")) ||
    (phoneDraft !== null && phoneDraft !== (user?.phone || ""));

  const handleResetForm = () => {
    setFullNameDraft(null);
    setPhoneDraft(null);
    setFieldErrors({});
    setStatusMessage("");
    setErrorMessage("");
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setFieldErrors({});
    setStatusMessage("");
    setErrorMessage("");

    const errors = {};
    if (!fullName.trim()) {
      errors.fullName = "Họ và tên không được để trống";
    }
    if (phone.trim() && !/^0\d{9}$/.test(phone.trim())) {
      errors.phone = "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0 (ví dụ: 0912345678)";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    try {
      const payload = { fullName: fullName.trim() };
      if (phone.trim()) {
        payload.phone = phone.trim();
      }
      await updateProfile(payload);
      setFullNameDraft(null);
      setPhoneDraft(null);
      setStatusMessage("Hồ sơ cá nhân đã được cập nhật thành công.");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details?.fields) {
          setFieldErrors(error.details.fields);
        }
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Không thể cập nhật hồ sơ. Vui lòng thử lại sau.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setStatusMessage("");
    setErrorMessage("");

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setErrorMessage("Chỉ hỗ trợ ảnh định dạng JPG, PNG hoặc WebP.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setErrorMessage("Dung lượng ảnh tối đa là 2 MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
      await uploadAvatar(file);
      setStatusMessage("Ảnh đại diện đã được cập nhật thành công.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Không thể tải ảnh đại diện lên lúc này. Vui lòng thử lại sau.",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setStatusMessage("");
    setErrorMessage("");
    setUploadingAvatar(true);
    try {
      await updateProfile({ avatarPath: null });
      setStatusMessage("Đã xóa ảnh đại diện.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Không thể xóa ảnh đại diện lúc này.",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const initials = (user?.fullName || "B")
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="profile-layout-container">
      {/* LEFT COLUMN: Main Profile Info & Form */}
      <section className="profile-card profile-main-card">
        <div className="profile-header">
          <div>
            <p className="eyebrow">QUẢN LÝ TÀI KHOẢN</p>
            <h1 className="profile-title">{user?.fullName || "Hồ sơ của bạn"}</h1>
            <p className="profile-email">{user?.email}</p>
          </div>
          <div className="profile-roles">
            {(user?.roles || []).map((role) => (
              <span key={role} className="role-badge">
                {ROLE_LABELS[role] || role}
              </span>
            ))}
          </div>
        </div>

        {statusMessage && (
          <div className="form-alert success" role="status">
            <span>✓ {statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="form-alert error" role="alert">
            <span>⚠️ {errorMessage}</span>
          </div>
        )}

        {/* Avatar Section */}
        <div className="profile-avatar-row">
          <div className="avatar-preview">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.fullName} />
            ) : (
              <span className="avatar-initials">{initials}</span>
            )}
          </div>
          <div className="avatar-actions">
            <div className="avatar-buttons-group">
              <label className="button secondary-button small avatar-upload-label">
                {uploadingAvatar ? "Đang xử lý..." : "Đổi ảnh đại diện"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  disabled={uploadingAvatar}
                  hidden
                />
              </label>
              {user?.avatarUrl && (
                <button
                  type="button"
                  className="button secondary-button small danger-text"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                >
                  Xóa ảnh
                </button>
              )}
            </div>
            <small className="avatar-hint">Định dạng JPG, PNG hoặc WebP, dung lượng tối đa 2 MB.</small>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form className="profile-form" onSubmit={handleSaveProfile} noValidate>
          <div className="form-field">
            <label htmlFor="profile-email">
              Địa chỉ Email <span className="field-note">(Dùng để đăng nhập)</span>
            </label>
            <input
              id="profile-email"
              type="email"
              value={user?.email || ""}
              disabled
              className="input-disabled"
              aria-describedby="profile-email-desc"
            />
            <small id="profile-email-desc" className="field-hint">
              Email đăng nhập được cố định nhằm đảm bảo an toàn tài khoản.
            </small>
          </div>

          <div className="form-field">
            <label htmlFor="profile-fullName">
              Họ và tên <span className="required-mark">*</span>
            </label>
            <input
              id="profile-fullName"
              type="text"
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullNameDraft(e.target.value)}
              className={fieldErrors.fullName ? "input-error" : ""}
            />
            {fieldErrors.fullName && (
              <p className="field-error">{fieldErrors.fullName}</p>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="profile-phone">
              Số điện thoại liên hệ <span className="required-mark">*</span>
            </label>
            <input
              id="profile-phone"
              type="tel"
              placeholder="0912345678"
              value={phone}
              onChange={(e) => setPhoneDraft(e.target.value)}
              className={fieldErrors.phone ? "input-error" : ""}
            />
            {fieldErrors.phone && (
              <p className="field-error">{fieldErrors.phone}</p>
            )}
            <small className="field-hint">
              Dùng để cửa hàng liên hệ xác nhận đơn thuê và nhận máy tại quầy.
            </small>
          </div>

          <div className="profile-form-actions">
            <button
              type="submit"
              className="button primary-button"
              disabled={saving || !isDirty}
            >
              {saving ? "Đang lưu thay đổi..." : "Lưu thay đổi"}
            </button>
            {isDirty && (
              <button
                type="button"
                className="button secondary-button"
                onClick={handleResetForm}
                disabled={saving}
              >
                Hủy thay đổi
              </button>
            )}
          </div>
        </form>
      </section>

      {/* RIGHT COLUMN: Account Overview, KYC & Shortcuts */}
      <aside className="profile-side-col">
        {/* Verification / KYC Card (Part 4) */}
        <div className="profile-card profile-kyc-card">
          <div className="profile-card-header-row">
            <h3 className="profile-card-subtitle">Xác thực danh tính (KYC)</h3>
            <span className="kyc-status-badge verified">Tại quầy chi nhánh</span>
          </div>
          <p className="kyc-desc">
            Nhằm bảo mật tuyệt đối thông tin cá nhân và dữ liệu nhạy cảm, Borroll thực hiện đối chiếu
            giấy tờ tùy thân trực tiếp tại quầy chi nhánh khi bàn giao thiết bị.
          </p>
          <ul className="kyc-checklist">
            <li>✓ Xuất trình CCCD gắn chip hoặc ứng dụng VNeID mức 2 khi nhận máy</li>
            <li>✓ Thông tin người nhận phải trùng khớp với hồ sơ đơn thuê</li>
            <li>✓ Ký biên bản bàn giao và kiểm tra ngoại quan máy tại cửa hàng</li>
          </ul>
        </div>

        {/* Account Details Card */}
        <div className="profile-card profile-info-card">
          <h3 className="profile-card-subtitle">Thông tin tài khoản</h3>
          <div className="profile-stat-list">
            <div className="profile-stat-item">
              <span className="stat-label">Mã định danh (User ID)</span>
              <strong className="stat-value monospace">{user?.id || "—"}</strong>
            </div>
            <div className="profile-stat-item">
              <span className="stat-label">Vai trò hệ thống</span>
              <strong className="stat-value">
                {user?.roles?.map((r) => ROLE_LABELS[r] || r).join(", ") || "Khách"}
              </strong>
            </div>
            <div className="profile-stat-item">
              <span className="stat-label">Trạng thái tài khoản</span>
              <strong className="stat-value status-active">● Đang hoạt động</strong>
            </div>
          </div>
        </div>

        {/* Quick Navigation Shortcuts */}
        <div className="profile-card profile-shortcuts-card">
          <h3 className="profile-card-subtitle">Lối tắt nhanh</h3>
          <div className="profile-shortcuts-list">
            <Link to="/orders" className="shortcut-link">
              <span>📋 Đơn thuê của tôi</span>
              <span className="shortcut-arrow">→</span>
            </Link>
            <Link to="/favorites" className="shortcut-link">
              <span>♥ Thiết bị yêu thích</span>
              <span className="shortcut-arrow">→</span>
            </Link>
            <Link to="/cart" className="shortcut-link">
              <span>🛒 Giỏ thuê máy</span>
              <span className="shortcut-arrow">→</span>
            </Link>
            <Link to="/support" className="shortcut-link">
              <span>❓ Trung tâm hỗ trợ & FAQ</span>
              <span className="shortcut-arrow">→</span>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default ProfilePage;
