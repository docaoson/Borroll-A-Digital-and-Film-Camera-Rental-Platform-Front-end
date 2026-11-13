import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/adminService";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function AdminBrandsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [brands, setBrands] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalMode, setModalMode] = useState(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [modalError, setModalError] = useState("");

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load Brands
  useEffect(() => {
    let active = true;
    adminService
      .getAdminBrands()
      .then((data) => {
        if (!active) return;
        setBrands(data.items || data || []);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "Không thể tải danh sách thương hiệu.");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  // Filter Brands by search
  const filteredBrands = useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const q = searchQuery.toLowerCase().trim();
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q),
    );
  }, [brands, searchQuery]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setName("");
    setSlug("");
    setModalError("");
    setModalMode("create");
  };

  // Open Edit Modal
  const handleOpenEdit = (brand) => {
    setName(brand.name);
    setSlug(brand.slug);
    setModalError("");
    setModalMode(brand);
  };

  // Close Modal
  const handleCloseModal = () => {
    setModalMode(null);
    setModalError("");
  };

  // Submit Modal Form
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setModalError("Vui lòng nhập tên thương hiệu.");
      return;
    }
    if (!slug.trim()) {
      setModalError("Vui lòng nhập slug định danh.");
      return;
    }

    setSubmitting(true);
    setModalError("");

    const payload = {
      name: name.trim(),
      slug: slugify(slug),
    };

    try {
      if (modalMode === "create") {
        await adminService.createAdminBrand(payload);
        setSuccessMsg(`Đã thêm thương hiệu "${name.trim()}".`);
      } else {
        await adminService.updateAdminBrand(modalMode.id, payload);
        setSuccessMsg(`Đã cập nhật thương hiệu "${name.trim()}".`);
      }
      handleCloseModal();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setModalError(err?.message || "Đã có lỗi xảy ra khi lưu thương hiệu.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Brand
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await adminService.deleteAdminBrand(deleteTarget.id);
      setSuccessMsg(`Đã xóa thương hiệu "${deleteTarget.name}".`);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(
        err?.message ||
          "Không thể xóa hãng này. Có thể hãng đang chứa các mẫu máy ảnh trong hệ thống.",
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-brands-page">
      {/* HEADER SECTION */}
      <section className="admin-page-header">
        <div className="admin-page-titles">
          <div className="admin-breadcrumb">
            <Link to="/admin">Bảng điều khiển</Link>
            <span className="sep">/</span>
            <span className="current">Thương hiệu máy</span>
          </div>
          <h1 className="admin-heading-title">Quản lý thương hiệu máy ảnh</h1>
          <p className="admin-heading-sub">
            Quản trị danh sách các hãng sản xuất thiết bị (Fujifilm, Sony, Canon, Leica, Nikon, Olympus, Pentax...).
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="button primary-button admin-action-cta"
            onClick={handleOpenCreate}
          >
            <span>Thêm thương hiệu mới</span>
          </button>
        </div>
      </section>

      {/* ALERTS */}
      {successMsg && (
        <div className="form-alert success admin-alert-bar" role="status">
          <span>{successMsg}</span>
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setSuccessMsg("")}
          >
            Đóng
          </button>
        </div>
      )}

      {error && (
        <div className="form-alert error admin-alert-bar" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setError(null)}
          >
            Đóng
          </button>
        </div>
      )}

      {/* SEARCH TOOLBAR */}
      <section className="admin-filter-toolbar">
        <div className="admin-search-box">
          <span className="search-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Tìm theo tên hãng, slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="admin-search-clear"
              onClick={() => setSearchQuery("")}
            >
              ✕
            </button>
          )}
        </div>
        <div className="admin-quick-stat-pill">
          <span>Tổng số thương hiệu:</span>
          <strong>{brands.length}</strong>
        </div>
      </section>

      {/* TABLE */}
      <section className="admin-table-container">
        {loading ? (
          <div className="admin-table-loading">
            <span className="admin-spinner" aria-hidden="true" />
            <p>Đang tải danh sách thương hiệu...</p>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="admin-table-empty">
            <span className="empty-icon" aria-hidden="true">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            </span>
            <h3>Chưa có thương hiệu nào</h3>
            <p>Thêm thương hiệu đầu tiên để phân loại các dòng máy ảnh cho thuê.</p>
            <button
              type="button"
              className="button primary-button compact"
              onClick={handleOpenCreate}
            >
              Thêm thương hiệu ngay
            </button>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Tên thương hiệu</th>
                  <th scope="col">Slug định danh</th>
                  <th scope="col" className="text-right">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBrands.map((brand) => (
                  <tr key={brand.id}>
                    <td>
                      <div className="admin-brand-cell">
                        <span className="brand-dot" aria-hidden="true" />
                        <strong>{brand.name}</strong>
                      </div>
                    </td>
                    <td>
                      <span className="admin-product-slug">/{brand.slug}</span>
                    </td>
                    <td className="text-right">
                      <div className="admin-table-actions">
                        <button
                          type="button"
                          className="button secondary-button compact"
                          onClick={() => handleOpenEdit(brand)}
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          className="button danger-button compact"
                          onClick={() => setDeleteTarget(brand)}
                          title="Xóa thương hiệu"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CREATE / EDIT MODAL */}
      {modalMode && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseModal}
        >
          <div
            className="admin-roadmap-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge">
                {modalMode === "create" ? "THÊM MỚI" : "CHỈNH SỬA"}
              </span>
              <h3>
                {modalMode === "create"
                  ? "Thêm thương hiệu sản xuất mới"
                  : `Chỉnh sửa thương hiệu: ${name}`}
              </h3>
            </div>

            {modalError && (
              <div className="form-alert error" role="alert">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="admin-dialog-form">
              <div className="admin-field-group">
                <label htmlFor="brand-name">
                  Tên thương hiệu <span className="req">*</span>
                </label>
                <input
                  id="brand-name"
                  type="text"
                  placeholder="Ví dụ: Fujifilm, Sony, Canon, Leica, Nikon..."
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (modalMode === "create" && !slug) {
                      setSlug(slugify(e.target.value));
                    }
                  }}
                  required
                />
              </div>

              <div className="admin-field-group">
                <label htmlFor="brand-slug">
                  Slug định danh <span className="req">*</span>
                </label>
                <input
                  id="brand-slug"
                  type="text"
                  placeholder="fujifilm"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>

              <div className="admin-dialog-actions">
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="button primary-button compact"
                  disabled={submitting}
                >
                  {submitting ? "Đang lưu..." : "Lưu thương hiệu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            className="admin-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge danger">XÁC NHẬN XÓA</span>
              <h3>Xóa thương hiệu máy ảnh</h3>
            </div>
            <div className="admin-dialog-body">
              <p>
                Bạn có chắc chắn muốn xóa thương hiệu <strong>"{deleteTarget.name}"</strong>?
              </p>
              <p className="admin-dialog-note">
                Lưu ý: Nếu thương hiệu này đang gắn với các mẫu máy ảnh trong hệ thống, Back-end sẽ chặn thao tác xóa để đảm bảo toàn vẹn dữ liệu.
              </p>
            </div>
            <div className="admin-dialog-actions">
              <button
                type="button"
                className="button secondary-button compact"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="button danger-button compact"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminBrandsPage;