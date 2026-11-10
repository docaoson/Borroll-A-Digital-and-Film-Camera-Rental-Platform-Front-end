import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ApiError } from "../../lib/apiClient";

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const ROLE_LABELS = {
  RENTER: "Khách",
  STAFF: "Nhân viên",
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
      errors.phone = "Số điện thoại phải gồm 10 chữ số bắt đầu bằng 0";
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
      setStatusMessage("Đã cập nhật thông tin hồ sơ.");
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.details?.fields) {
          setFieldErrors(error.details.fields);
        }
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Không thể cập nhật hồ sơ. Vui lòng thử lại.");
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
      setStatusMessage("Đã cập nhật ảnh đại diện.");
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Không thể tải ảnh đại diện lúc này.",
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
    <section className="profile-card">
      <div className="profile-header">
        <div>
          <p className="eyebrow">HỒ SƠ CÁ NHÂN</p>
          <h1>{user?.fullName}</h1>
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
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="form-alert error" role="alert">
          {errorMessage}
        </div>
      )}

      <div className="profile-avatar-row">
        <div className="avatar-preview">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="avatar-actions">
          <label className="button secondary-button avatar-upload-label">
            {uploadingAvatar ? "Đang tải ảnh..." : "Đổi ảnh đại diện"}
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
              className="button secondary-button"
              onClick={handleRemoveAvatar}
              disabled={uploadingAvatar}
            >
              Xóa ảnh
            </button>
          )}
          <small>Hỗ trợ JPG, PNG, WebP tối đa 2 MB.</small>
        </div>
      </div>

      <form className="auth-form" onSubmit={handleSaveProfile} noValidate>
        <div className="form-field">
          <label htmlFor="profile-email">Email</label>
          <input id="profile-email" type="email" value={user?.email || ""} disabled />
        </div>

        <div className="form-field">
          <label htmlFor="profile-fullName">Họ và tên</label>
          <input
            id="profile-fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullNameDraft(e.target.value)}
          />
          {fieldErrors.fullName && (
            <p className="field-error">{fieldErrors.fullName}</p>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="profile-phone">Số điện thoại</label>
          <input
            id="profile-phone"
            type="tel"
            placeholder="0912345678"
            value={phone}
            onChange={(e) => setPhoneDraft(e.target.value)}
          />
          {fieldErrors.phone && (
            <p className="field-error">{fieldErrors.phone}</p>
          )}
        </div>

        <button
          type="submit"
          className="button primary-button"
          disabled={saving}
        >
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </form>
    </section>
  );
}

export default ProfilePage;
