import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { adminService } from "../../services/adminService";
import { ApiError } from "../../lib/apiClient";

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

const MODEL_KINDS = [
  { value: "CAMERA", label: "Máy ảnh (Camera)" },
  { value: "LENS", label: "Ống kính (Lens)" },
  { value: "ACCESSORY", label: "Phụ kiện (Accessory)" },
];

const CAMERA_TYPES = [
  { value: "DIGITAL", label: "Máy ảnh Kỹ thuật số (Digital)" },
  { value: "FILM", label: "Máy ảnh Film (Film 35mm / 120)" },
  { value: "INSTANT", label: "Máy chụp lấy liền (Instant)" },
];

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function AdminProductFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEditMode = Boolean(id);
  const initialType = searchParams.get("type");
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Loading & submit states
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");

  // Options
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  // Basic Details Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [kind, setKind] = useState(() =>
    initialType === "accessory" ? "ACCESSORY" : "CAMERA",
  );
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [cameraType, setCameraType] = useState("DIGITAL");
  const [mount, setMount] = useState("");
  const [filmFormat, setFilmFormat] = useState("");
  const [sensorSize, setSensorSize] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [pricePerWeek, setPricePerWeek] = useState("");
  const [deposit, setDeposit] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Specs Form State
  const [specsExposure, setSpecsExposure] = useState("");
  const [specsControls, setSpecsControls] = useState("");
  const [specsPower, setSpecsPower] = useState("");
  const [specsQuirks, setSpecsQuirks] = useState("");
  const [specsBeginnerNotes, setSpecsBeginnerNotes] = useState("");

  // Server Images (in Edit mode)
  const [serverImages, setServerImages] = useState([]);

  // Local Selected Files (for both Create & Edit modes)
  // item: { id, file, previewUrl, kind: 'PRODUCT'|'SAMPLE', caption: '', isPrimary: boolean }
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);

  // Load Categories and Brands
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      adminService.getAdminCategories(),
      adminService.getAdminBrands(),
    ]).then(([catRes, brandRes]) => {
      if (!active) return;
      if (catRes.status === "fulfilled") {
        const catList = catRes.value.items || catRes.value || [];
        setCategories(catList);
        if (catList.length > 0) {
          setCategoryId((prev) => prev || catList[0].id);
        }
      }
      if (brandRes.status === "fulfilled") {
        const brandList = brandRes.value.items || brandRes.value || [];
        setBrands(brandList);
        if (brandList.length > 0) {
          setBrandId((prev) => prev || brandList[0].id);
        }
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // In Edit mode: Load existing model data
  useEffect(() => {
    if (!id) return;
    let active = true;

    adminService
      .getAdminModel(id)
      .then((data) => {
        if (!active) return;
        setName(data.name || "");
        setSlug(data.slug || "");
        setKind(data.kind || "CAMERA");
        setCategoryId(data.categoryId || "");
        setBrandId(data.brandId || "");
        setCameraType(data.cameraType || "DIGITAL");
        setMount(data.mount || "");
        setFilmFormat(data.filmFormat || "");
        setPricePerDay(data.pricePerDay !== undefined ? String(data.pricePerDay) : "");
        setPricePerWeek(
          data.pricePerWeek !== null && data.pricePerWeek !== undefined
            ? String(data.pricePerWeek)
            : "",
        );
        setDeposit(data.deposit !== undefined ? String(data.deposit) : "");
        setDescription(data.description || "");
        setIsActive(data.isActive ?? true);
        setIsFeatured(data.isFeatured ?? false);
        setServerImages(data.images || []);

        if (data.specs?.specs) {
          const s = data.specs.specs;
          setSpecsExposure(
            typeof s.exposure === "object"
              ? JSON.stringify(s.exposure, null, 2)
              : s.exposure || "",
          );
          setSensorSize(typeof s.sensorSize === "string" ? s.sensorSize : "");
          setSpecsControls(
            Array.isArray(s.controls) ? s.controls.join(", ") : s.controls || "",
          );
          setSpecsPower(s.power || "");
          setSpecsQuirks(
            Array.isArray(s.quirks) ? s.quirks.join(", ") : s.quirks || "",
          );
          setSpecsBeginnerNotes(
            Array.isArray(s.beginnerNotes)
              ? s.beginnerNotes.join(", ")
              : s.beginnerNotes || "",
          );
        }
      })
      .catch((err) => {
        if (active) {
          setFormError(
            err?.message || "Không thể tải thông tin mẫu máy cần chỉnh sửa.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [selectedFiles]);

  // Handle auto-generating slug on Name blur
  const handleNameBlur = () => {
    if (!slug.trim() && name.trim()) {
      setSlug(slugify(name));
    }
  };

  // Add files to local preview list with validation
  const processIncomingFiles = (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const errors = [];
    const validItems = [];

    Array.from(fileList).forEach((file) => {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        errors.push(`"${file.name}": Chỉ hỗ trợ JPG, PNG hoặc WebP.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`"${file.name}": Dung lượng vượt quá 8MB.`);
        return;
      }

      validItems.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        file,
        previewUrl: URL.createObjectURL(file),
        kind: "PRODUCT",
        caption: "",
        isPrimary: false,
      });
    });

    if (errors.length > 0) {
      setFormError(errors.join(" "));
    }

    if (validItems.length > 0) {
      setSelectedFiles((prev) => {
        const updated = [...prev, ...validItems];
        // Ensure at least one image is primary if none is set
        const hasPrimary = updated.some((img) => img.isPrimary);
        if (!hasPrimary && updated.length > 0) {
          updated[0].isPrimary = true;
        }
        return updated;
      });
    }
  };

  // Set an image as primary
  const handleSetPrimary = (targetId) => {
    setSelectedFiles((prev) =>
      prev.map((item) => ({
        ...item,
        isPrimary: item.id === targetId,
      })),
    );
  };

  // Remove a local preview image
  const handleRemoveLocalFile = (targetId) => {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === targetId);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      const remaining = prev.filter((item) => item.id !== targetId);
      if (target?.isPrimary && remaining.length > 0) {
        remaining[0].isPrimary = true;
      }
      return remaining;
    });
  };

  // Update caption or kind for a local image
  const handleUpdateLocalFileMeta = (targetId, updates) => {
    setSelectedFiles((prev) =>
      prev.map((item) => (item.id === targetId ? { ...item, ...updates } : item)),
    );
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Vui lòng nhập tên mẫu máy";
    if (!slug.trim()) errors.slug = "Vui lòng nhập slug định danh URL";
    if (!categoryId) errors.categoryId = "Vui lòng chọn danh mục thiết bị";
    if (!brandId) errors.brandId = "Vui lòng chọn thương hiệu sản xuất";
    if (!description.trim()) errors.description = "Vui lòng nhập mô tả chi tiết mẫu máy";

    const pDay = parseInt(pricePerDay, 10);
    if (isNaN(pDay) || pDay < 0) {
      errors.pricePerDay = "Giá thuê theo ngày phải là số dương hợp lệ";
    }

    const dep = parseInt(deposit, 10);
    if (isNaN(dep) || dep < 0) {
      errors.deposit = "Tiền đặt cọc phải là số dương hợp lệ";
    }

    if (pricePerWeek.trim()) {
      const pWeek = parseInt(pricePerWeek, 10);
      if (isNaN(pWeek) || pWeek < 0) {
        errors.pricePerWeek = "Giá thuê theo tuần phải là số hợp lệ";
      }
    }

    return errors;
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    setSuccessMsg("");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormError("Vui lòng kiểm tra lại các trường thông tin được đánh dấu.");
      return;
    }

    setSubmitting(true);

    // Build payload strictly adhering to CreateModelDto / UpdateModelDto
    const payload = {
      kind,
      categoryId,
      brandId,
      name: name.trim(),
      slug: slugify(slug),
      description: description.trim(),
      cameraType: kind === "CAMERA" ? cameraType : null,
      mount: mount.trim() || null,
      filmFormat: kind === "CAMERA" && cameraType === "FILM" ? filmFormat.trim() || null : null,
      pricePerDay: parseInt(pricePerDay, 10),
      pricePerWeek: pricePerWeek.trim() ? parseInt(pricePerWeek, 10) : null,
      deposit: parseInt(deposit, 10),
      isActive,
      isFeatured,
    };

    try {
      if (isEditMode) {
        // --- 1. UPDATE EXISTING MODEL ---
        await adminService.updateAdminModel(id, payload);

        // Update technical specifications if provided
        if (
          specsExposure ||
          sensorSize ||
          specsControls ||
          specsPower ||
          specsQuirks ||
          specsBeginnerNotes
        ) {
          const specsPayload = {};
          if (sensorSize.trim()) specsPayload.sensorSize = sensorSize.trim();
          if (specsExposure) {
            try {
              specsPayload.exposure = JSON.parse(specsExposure);
            } catch {
              specsPayload.exposure = { description: specsExposure };
            }
          }
          if (specsControls) {
            specsPayload.controls = specsControls
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
          if (specsPower) {
            specsPayload.power = specsPower.trim();
          }
          if (specsQuirks) {
            specsPayload.quirks = specsQuirks
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
          if (specsBeginnerNotes) {
            specsPayload.beginnerNotes = specsBeginnerNotes
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }

          await adminService.updateModelSpecs(id, specsPayload);
        }

        // Upload any newly selected local images
        if (selectedFiles.length > 0) {
          setUploadStatus(`Đang tải lên ${selectedFiles.length} ảnh mới...`);
          const sortedUploads = [...selectedFiles].sort((a, b) =>
            a.isPrimary ? -1 : b.isPrimary ? 1 : 0,
          );

          let failedUploads = 0;
          for (let i = 0; i < sortedUploads.length; i++) {
            const item = sortedUploads[i];
            try {
              await adminService.uploadModelImage(id, item.file, {
                kind: item.kind,
                caption: item.caption || null,
                sortOrder: serverImages.length + i,
              });
            } catch {
              failedUploads += 1;
            }
          }

          // Clean up local previews after uploading
          selectedFiles.forEach((item) => {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
          });
          setSelectedFiles([]);

          if (failedUploads > 0) {
            setFormError(
              `Đã lưu thông tin mẫu máy, nhưng có ${failedUploads} ảnh tải lên thất bại.`,
            );
          }
        }

        // Reload fresh server model data to ensure all UI components display updated values
        const freshModel = await adminService.getAdminModel(id);
        setName(freshModel.name || "");
        setSlug(freshModel.slug || "");
        setServerImages(freshModel.images || []);
        setUploadStatus("");
        setSuccessMsg("Cập nhật thông tin và hình ảnh mẫu máy thành công.");
      } else {
        // --- 2. CREATE NEW MODEL ---
        const created = await adminService.createAdminModel(payload);

        const specsPayload = {};
        if (sensorSize.trim()) specsPayload.sensorSize = sensorSize.trim();
        if (specsExposure) {
          try { specsPayload.exposure = JSON.parse(specsExposure); }
          catch { specsPayload.exposure = { description: specsExposure }; }
        }
        if (specsControls) specsPayload.controls = specsControls.split(",").map((s) => s.trim()).filter(Boolean);
        if (specsPower) specsPayload.power = specsPower.trim();
        if (specsQuirks) specsPayload.quirks = specsQuirks.split(",").map((s) => s.trim()).filter(Boolean);
        if (specsBeginnerNotes) specsPayload.beginnerNotes = specsBeginnerNotes.split(",").map((s) => s.trim()).filter(Boolean);
        if (Object.keys(specsPayload).length > 0) {
          await adminService.updateModelSpecs(created.id, specsPayload);
        }

        // Upload any selected local images to the newly created product
        if (selectedFiles.length > 0) {
          setUploadStatus(`Mẫu máy đã tạo. Đang tải lên ${selectedFiles.length} ảnh...`);
          const sortedUploads = [...selectedFiles].sort((a, b) =>
            a.isPrimary ? -1 : b.isPrimary ? 1 : 0,
          );

          let failedUploads = 0;
          for (let i = 0; i < sortedUploads.length; i++) {
            const item = sortedUploads[i];
            try {
              await adminService.uploadModelImage(created.id, item.file, {
                kind: item.kind,
                caption: item.caption || null,
                sortOrder: i,
              });
            } catch {
              failedUploads += 1;
            }
          }

          // Clean up local preview URLs
          selectedFiles.forEach((item) => {
            if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
          });
          setSelectedFiles([]);

          if (failedUploads > 0) {
            setSuccessMsg(
              `Tạo mẫu máy thành công, nhưng có ${failedUploads} ảnh tải lên thất bại. Đang chuyển đến trang chỉnh sửa...`,
            );
          } else {
            setSuccessMsg("Tạo mẫu máy và tải toàn bộ ảnh thành công! Đang chuyển đến trang quản lý...");
          }
        } else {
          setSuccessMsg("Tạo mẫu máy thành công! Đang chuyển đến trang quản lý...");
        }

        setTimeout(() => {
          navigate(`/admin/products/${created.id}/edit`, { replace: true });
        }, 1200);
      }
    } catch (err) {
      if (err instanceof ApiError && err.details?.fields) {
        setFieldErrors(err.details.fields);
        setFormError(err.message || "Dữ liệu không hợp lệ.");
      } else {
        setFormError(
          err?.message || "Đã có lỗi xảy ra khi lưu mẫu máy. Vui lòng thử lại.",
        );
      }
    } finally {
      setSubmitting(false);
      setUploadStatus("");
    }
  };

  // Delete an existing server image (Edit Mode)
  const handleDeleteServerImage = async (imageId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi hệ thống?")) return;
    try {
      await adminService.deleteModelImage(id, imageId);
      setServerImages((prev) => prev.filter((img) => img.id !== imageId));
      setSuccessMsg("Đã xóa ảnh thành công.");
    } catch (err) {
      setFormError(err?.message || "Không thể xóa ảnh lúc này.");
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files) {
      processIncomingFiles(e.dataTransfer.files);
    }
  };

  const categoryOptions = (() => {
    if (kind !== "CAMERA") {
      return categories.flatMap((root) => [root, ...(root.children || [])]);
    }
    const rootSlug = cameraType === "FILM" ? "may-film" : cameraType === "DIGITAL" ? "may-digital" : "may-instant";
    return categories.find((root) => root.slug === rootSlug)?.children || [];
  })();

  if (loading) {
    return (
      <div className="admin-page-loading">
        <span className="admin-spinner" aria-hidden="true" />
        <p>Đang tải thông tin mẫu máy...</p>
      </div>
    );
  }

  return (
    <div className="admin-product-form-page">
      {/* HEADER SECTION */}
      <section className="admin-page-header">
        <div className="admin-page-titles">
          <div className="admin-breadcrumb">
            <Link to="/admin">Bảng điều khiển</Link>
            <span className="sep">/</span>
            <Link to="/admin/products">Mẫu máy & Thiết bị</Link>
            <span className="sep">/</span>
            <span className="current">
              {isEditMode
                ? `Chỉnh sửa: ${name || "Sản phẩm"}`
                : kind === "CAMERA"
                  ? "Thêm máy ảnh"
                  : "Thêm thiết bị (Phụ kiện / Film)"}
            </span>
          </div>
          <h1 className="admin-heading-title">
            {isEditMode
              ? `Chỉnh sửa: ${name || "Mẫu máy"}`
              : kind === "CAMERA"
                ? "Thêm máy ảnh mới"
                : "Thêm thiết bị & Phụ kiện mới (Cuộn film, ống kính, pin...)"}
          </h1>
          <p className="admin-heading-sub">
            {isEditMode
              ? "Cập nhật thông tin định danh, cấu hình giá thuê, tiền cọc, thông số kỹ thuật và thư viện ảnh."
              : kind === "CAMERA"
                ? "Nhập thông tin chi tiết về thân máy ảnh số hoặc máy phim để đưa vào hệ thống cho thuê."
                : "Nhập thông tin phụ kiện của máy ảnh như cuộn film, ống kính, pin sạc, chân máy... để khách hàng thuê kèm."}
          </p>
        </div>

        <div className="admin-header-actions">
          <Link to="/admin/products" className="button secondary-button compact">
            Quay lại danh sách
          </Link>
          {isEditMode && slug && (
            <a
              href={`/cameras/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button secondary-button compact"
            >
              <span>Xem trang khách</span>
            </a>
          )}
        </div>
      </section>

      {/* MODE TABS (Chỉ hiện khi Thêm mới): Thêm máy ảnh vs Thêm thiết bị/phụ kiện */}
      {!isEditMode && (
        <div className="product-kind-tabs-wrapper">
          <div className="product-kind-tabs" role="tablist">
            <button
              type="button"
              className={`product-kind-tab ${kind === "CAMERA" ? "active" : ""}`}
              onClick={() => setKind("CAMERA")}
              role="tab"
              aria-selected={kind === "CAMERA"}
            >
              <span className="kind-tab-icon">📷</span>
              <div className="kind-tab-text">
                <strong>Thêm máy ảnh</strong>
                <span>Máy ảnh số, máy phim 35mm/120, máy polaroid</span>
              </div>
            </button>
            <button
              type="button"
              className={`product-kind-tab ${kind === "ACCESSORY" || kind === "LENS" ? "active" : ""}`}
              onClick={() => setKind("ACCESSORY")}
              role="tab"
              aria-selected={kind === "ACCESSORY" || kind === "LENS"}
            >
              <span className="kind-tab-icon">🎞️</span>
              <div className="kind-tab-text">
                <strong>Thêm thiết bị (Phụ kiện / Cuộn film)</strong>
                <span>Cuộn film, ống kính rời, pin sạc, chân máy, thẻ nhớ</span>
              </div>
            </button>
          </div>
        </div>
      )}

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

      {formError && (
        <div className="form-alert error admin-alert-bar" role="alert">
          <span>{formError}</span>
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setFormError("")}
          >
            Đóng
          </button>
        </div>
      )}

      {uploadStatus && (
        <div className="form-alert info admin-alert-bar" role="status">
          <span className="admin-spinner compact" aria-hidden="true" />
          <span>{uploadStatus}</span>
        </div>
      )}

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} noValidate className="admin-form-shell">
        {/* SECTION 1: THÔNG TIN CƠ BẢN */}
        <div className="admin-form-card">
          <div className="admin-card-header">
            <span className="admin-section-num">01</span>
            <div>
              <h3>Thông tin cơ bản và Định danh</h3>
              <p>Các thuộc tính định danh chính thức của mẫu thiết bị trên hệ thống.</p>
            </div>
          </div>

          <div className="admin-form-grid">
            {/* Tên mẫu máy */}
            <div className={`admin-field-group col-span-2 ${fieldErrors.name ? "has-error" : ""}`}>
              <label htmlFor="model-name">
                Tên mẫu máy ảnh <span className="req">*</span>
              </label>
              <input
                id="model-name"
                type="text"
                placeholder="Ví dụ: Fujifilm X-T5, Canon EOS R6 Mark II, Leica M6..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                required
              />
              {fieldErrors.name && (
                <span className="field-error-msg">{fieldErrors.name}</span>
              )}
            </div>

            {/* Slug */}
            <div className={`admin-field-group col-span-2 ${fieldErrors.slug ? "has-error" : ""}`}>
              <label htmlFor="model-slug">
                Slug URL định danh <span className="req">*</span>
              </label>
              <div className="admin-input-prefix-box">
                <span className="input-prefix">/cameras/</span>
                <input
                  id="model-slug"
                  type="text"
                  placeholder="fujifilm-x-t5"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  required
                />
              </div>
              <span className="field-hint">
                Dùng cho đường dẫn SEO công khai. Chỉ gồm chữ cái thường, số và dấu gạch ngang (-).
              </span>
              {fieldErrors.slug && (
                <span className="field-error-msg">{fieldErrors.slug}</span>
              )}
            </div>

            {/* Phân loại ModelKind */}
            <div className="admin-field-group">
              <label htmlFor="model-kind">
                Loại sản phẩm <span className="req">*</span>
              </label>
              <select
                id="model-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
                required
              >
                {MODEL_KINDS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Phân loại CameraType (nếu là CAMERA) */}
            {kind === "CAMERA" ? (
              <div className="admin-field-group">
                <label htmlFor="model-cameratype">
                  Công nghệ máy ảnh <span className="req">*</span>
                </label>
                <select
                  id="model-cameratype"
                  value={cameraType}
                  onChange={(e) => {
                    setCameraType(e.target.value);
                    setCategoryId("");
                  }}
                  required
                >
                  {CAMERA_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="admin-field-group">
                <label>Phân loại phụ trợ</label>
                <input
                  type="text"
                  disabled
                  value={kind === "LENS" ? "Ống kính quang học" : "Phụ kiện hỗ trợ quay chụp"}
                />
              </div>
            )}

            {/* Thương hiệu */}
            <div className={`admin-field-group ${fieldErrors.brandId ? "has-error" : ""}`}>
              <label htmlFor="model-brand">
                Thương hiệu sản xuất <span className="req">*</span>
              </label>
              <select
                id="model-brand"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                required
              >
                <option value="">-- Chọn thương hiệu --</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {fieldErrors.brandId && (
                <span className="field-error-msg">{fieldErrors.brandId}</span>
              )}
            </div>

            {/* Danh mục */}
            <div className={`admin-field-group ${fieldErrors.categoryId ? "has-error" : ""}`}>
              <label htmlFor="model-category">
                Danh mục thiết bị <span className="req">*</span>
              </label>
              <select
                id="model-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {fieldErrors.categoryId && (
                <span className="field-error-msg">{fieldErrors.categoryId}</span>
              )}
            </div>

            {/* Ngàm ống kính Mount */}
            <div className="admin-field-group">
              <label htmlFor="model-mount">Ngàm ống kính (Lens Mount)</label>
              <input
                id="model-mount"
                type="text"
                placeholder="Ví dụ: Sony E, Canon RF, Fujifilm X, Leica M, Nikon F..."
                value={mount}
                onChange={(e) => setMount(e.target.value)}
              />
            </div>

            {/* Khổ phim FilmFormat */}
            {kind === "CAMERA" && cameraType === "FILM" ? (
              <div className="admin-field-group">
                <label htmlFor="model-filmformat">Khổ phim</label>
                <input
                  id="model-filmformat"
                  type="text"
                  placeholder="Ví dụ: 35mm (135), 120 (Medium Format)..."
                  value={filmFormat}
                  onChange={(e) => setFilmFormat(e.target.value)}
                />
              </div>
            ) : (
              <div className="admin-field-group">
                <label htmlFor="model-filmformat">Ghi chú định dạng</label>
                <input
                  id="model-filmformat"
                  type="text"
                  placeholder="Không áp dụng"
                  value={filmFormat}
                  onChange={(e) => setFilmFormat(e.target.value)}
                  disabled={kind !== "CAMERA" || cameraType !== "FILM"}
                />
              </div>
            )}
            {kind === "CAMERA" && cameraType === "DIGITAL" && (
              <div className="admin-field-group">
                <label htmlFor="model-sensor-size">Cỡ cảm biến</label>
                <input
                  id="model-sensor-size"
                  type="text"
                  placeholder="Ví dụ: Full Frame, APS-C, Micro Four Thirds"
                  value={sensorSize}
                  onChange={(e) => setSensorSize(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: GIÁ THUÊ & TIỀN CỌC */}
        <div className="admin-form-card">
          <div className="admin-card-header">
            <span className="admin-section-num">02</span>
            <div>
              <h3>Giá thuê và Tiền cọc tiêu chuẩn</h3>
              <p>Mức giá thuê cơ bản và hạn mức cọc đối với khách thuê thông thường.</p>
            </div>
          </div>

          <div className="admin-form-grid">
            {/* Giá ngày */}
            <div className={`admin-field-group ${fieldErrors.pricePerDay ? "has-error" : ""}`}>
              <label htmlFor="model-price-day">
                Giá thuê theo ngày (VNĐ / ngày) <span className="req">*</span>
              </label>
              <input
                id="model-price-day"
                type="number"
                min="0"
                step="10000"
                placeholder="Ví dụ: 250000"
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                required
              />
              <span className="field-hint">
                {pricePerDay ? `${Number(pricePerDay).toLocaleString("vi-VN")} đ / ngày` : "Số tiền tính trên 1 ngày thuê"}
              </span>
              {fieldErrors.pricePerDay && (
                <span className="field-error-msg">{fieldErrors.pricePerDay}</span>
              )}
            </div>

            {/* Giá tuần */}
            <div className="admin-field-group">
              <label htmlFor="model-price-week">Giá thuê theo tuần (VNĐ / tuần - Tùy chọn)</label>
              <input
                id="model-price-week"
                type="number"
                min="0"
                step="50000"
                placeholder="Ví dụ: 1400000"
                value={pricePerWeek}
                onChange={(e) => setPricePerWeek(e.target.value)}
              />
              <span className="field-hint">
                {pricePerWeek ? `${Number(pricePerWeek).toLocaleString("vi-VN")} đ / tuần` : "Để trống nếu tính theo ngày x 7"}
              </span>
            </div>

            {/* Tiền cọc */}
            <div className={`admin-field-group ${fieldErrors.deposit ? "has-error" : ""}`}>
              <label htmlFor="model-deposit">
                Tiền đặt cọc tiêu chuẩn (VNĐ) <span className="req">*</span>
              </label>
              <input
                id="model-deposit"
                type="number"
                min="0"
                step="100000"
                placeholder="Ví dụ: 3000000"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
                required
              />
              <span className="field-hint">
                {deposit ? `${Number(deposit).toLocaleString("vi-VN")} đ cọc` : "Tiền cọc đảm bảo thiết bị"}
              </span>
              {fieldErrors.deposit && (
                <span className="field-error-msg">{fieldErrors.deposit}</span>
              )}
            </div>

            {/* Trạng thái hiển thị & Nổi bật */}
            <div className="admin-field-group admin-checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span><strong>Kích hoạt hiển thị (isActive)</strong> - Cho phép hiển thị trên website công khai</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <span><strong>Sản phẩm nổi bật (isFeatured)</strong> - Đưa lên danh sách ưu tiên trang chủ</span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: MÔ TẢ CHI TIẾT */}
        <div className="admin-form-card">
          <div className="admin-card-header">
            <span className="admin-section-num">03</span>
            <div>
              <h3>Mô tả chi tiết và Giới thiệu máy</h3>
              <p>Nội dung giới thiệu đặc điểm nổi bật, chất ảnh và đối tượng người dùng phù hợp.</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className={`admin-field-group col-span-2 ${fieldErrors.description ? "has-error" : ""}`}>
              <label htmlFor="model-desc">
                Mô tả chi tiết <span className="req">*</span>
              </label>
              <textarea
                id="model-desc"
                rows={5}
                placeholder="Nhập thông tin giới thiệu về cảm biến, màu sắc, khả năng quay phim, ống kính phù hợp..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              {fieldErrors.description && (
                <span className="field-error-msg">{fieldErrors.description}</span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: THÔNG SỐ KỸ THUẬT (SPECS) */}
        <div className="admin-form-card">
          <div className="admin-card-header">
            <span className="admin-section-num">04</span>
            <div>
              <h3>Thông số kỹ thuật và Hướng dẫn sử dụng</h3>
              <p>Chi tiết về hệ thống đo sáng, lấy nét, nguồn pin và lưu ý cho người mới.</p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="admin-field-group">
              <label htmlFor="specs-exposure">Cảm biến / Đo sáng & Màn trập (Exposure)</label>
              <input
                id="specs-exposure"
                type="text"
                placeholder="Ví dụ: 40.2MP X-Trans CMOS 5 HR, Tốc độ 1/180000s..."
                value={specsExposure}
                onChange={(e) => setSpecsExposure(e.target.value)}
              />
            </div>

            <div className="admin-field-group">
              <label htmlFor="specs-controls">Hệ thống điều khiển (Controls)</label>
              <input
                id="specs-controls"
                type="text"
                placeholder="Ví dụ: Vòng xoay ISO cơ học, Joystick 8 hướng..."
                value={specsControls}
                onChange={(e) => setSpecsControls(e.target.value)}
              />
            </div>

            <div className="admin-field-group">
              <label htmlFor="specs-power">Loại pin & Nguồn (Power)</label>
              <input
                id="specs-power"
                type="text"
                placeholder="Ví dụ: Pin NP-W235 (khoảng 580 shot), hỗ trợ sạc USB-C..."
                value={specsPower}
                onChange={(e) => setSpecsPower(e.target.value)}
              />
            </div>

            <div className="admin-field-group">
              <label htmlFor="specs-quirks">Đặc điểm lưu ý (Quirks)</label>
              <input
                id="specs-quirks"
                type="text"
                placeholder="Ví dụ: Cần gạt lên cò nhẹ tay, không để máy ở môi trường ẩm..."
                value={specsQuirks}
                onChange={(e) => setSpecsQuirks(e.target.value)}
              />
            </div>

            <div className="admin-field-group col-span-2">
              <label htmlFor="specs-beginner">Ghi chú cho người mới chụp (Beginner Notes)</label>
              <input
                id="specs-beginner"
                type="text"
                placeholder="Ví dụ: Phù hợp chụp du lịch, ảnh đường phố; có giả lập màu phim sẵn..."
                value={specsBeginnerNotes}
                onChange={(e) => setSpecsBeginnerNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: QUẢN LÝ HÌNH ẢNH (CHO CẢ CREATE VÀ EDIT MODE) */}
        <div className="admin-form-card">
          <div className="admin-card-header">
            <span className="admin-section-num">05</span>
            <div>
              <h3>Thư viện hình ảnh sản phẩm</h3>
              <p>Chọn ảnh từ máy tính để tải lên. Bạn có thể chọn nhiều ảnh, chỉ định ảnh chính và xóa ảnh trước khi lưu.</p>
            </div>
          </div>

          {/* DROPZONE CHO PHÉP CHỌN NHIỀU ẢNH */}
          <div
            className={`admin-upload-box ${dragOver ? "is-dragover" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                processIncomingFiles(e.target.files);
                e.target.value = "";
              }}
              style={{ display: "none" }}
              id="multi-image-upload-input"
            />
            <label htmlFor="multi-image-upload-input" className="admin-upload-label">
              <span className="upload-text">
                <strong>Nhấp để chọn ảnh</strong> hoặc kéo thả tệp hình ảnh vào đây
              </span>
              <span className="upload-sub">
                Hỗ trợ định dạng JPG, JPEG, PNG, WebP (Tối đa 8MB mỗi ảnh, cho phép chọn nhiều ảnh)
              </span>
            </label>
          </div>

          {/* DANH SÁCH ẢNH MỚI CHỌN ĐANG CHỜ LƯU */}
          {selectedFiles.length > 0 && (
            <div className="admin-selected-files-section">
              <div className="admin-section-subtitle">
                <strong>Ảnh mới chọn ({selectedFiles.length})</strong>
                <span className="field-hint">
                  {isEditMode
                    ? "Các ảnh này sẽ được tải lên khi bạn nhấn Lưu các thay đổi."
                    : "Các ảnh này sẽ tự động tải lên ngay sau khi mẫu máy được khởi tạo thành công."}
                </span>
              </div>

              <div className="admin-images-grid">
                {selectedFiles.map((item) => (
                  <div
                    key={item.id}
                    className={`admin-image-item ${item.isPrimary ? "is-primary-card" : ""}`}
                  >
                    <div className="admin-image-preview">
                      <img src={item.previewUrl} alt="Xem trước" />
                      {item.isPrimary && (
                        <span className="admin-main-badge">Ảnh chính</span>
                      )}
                    </div>
                    <div className="admin-image-meta-inputs">
                      <select
                        value={item.kind}
                        onChange={(e) =>
                          handleUpdateLocalFileMeta(item.id, { kind: e.target.value })
                        }
                        className="admin-meta-select"
                        aria-label="Phân loại ảnh"
                      >
                        <option value="PRODUCT">Ảnh thiết bị</option>
                        <option value="SAMPLE">Ảnh chụp mẫu</option>
                      </select>

                      <div className="admin-image-item-actions">
                        {!item.isPrimary && (
                          <button
                            type="button"
                            className="admin-btn-set-primary"
                            onClick={() => handleSetPrimary(item.id)}
                          >
                            Đặt làm ảnh chính
                          </button>
                        )}
                        <button
                          type="button"
                          className="admin-delete-img-btn"
                          onClick={() => handleRemoveLocalFile(item.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DANH SÁCH ẢNH HIỆN CÓ TRÊN MÁY CHỦ (EDIT MODE) */}
          {isEditMode && (
            <div className="admin-server-images-section">
              <div className="admin-section-subtitle">
                <strong>Ảnh hiện có trên máy chủ ({serverImages.length})</strong>
              </div>

              {serverImages.length === 0 ? (
                <div className="admin-empty-images">
                  <p>Mẫu máy này chưa có ảnh lưu trên máy chủ.</p>
                </div>
              ) : (
                <div className="admin-images-grid">
                  {serverImages.map((img, idx) => (
                    <div key={img.id} className="admin-image-item">
                      <div className="admin-image-preview">
                        {img.url ? (
                          <img src={img.url} alt={img.caption || `Ảnh ${idx + 1}`} />
                        ) : (
                          <div className="no-preview">Không có xem trước</div>
                        )}
                        {idx === 0 && <span className="admin-main-badge">Ảnh đầu</span>}
                      </div>
                      <div className="admin-image-info">
                        <span className="image-kind-tag">
                          {img.kind === "PRODUCT" ? "Ảnh thiết bị" : "Ảnh chụp mẫu"}
                        </span>
                        <button
                          type="button"
                          className="admin-delete-img-btn"
                          onClick={() => handleDeleteServerImage(img.id)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* FORM ACTIONS */}
        <div className="admin-form-actions">
          <Link to="/admin/products" className="button secondary-button">
            Hủy bỏ
          </Link>
          <button
            type="submit"
            className="button primary-button"
            disabled={submitting}
          >
            {submitting
              ? "Đang lưu dữ liệu..."
              : isEditMode
                ? "Lưu các thay đổi"
                : "Tạo mẫu máy mới"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminProductFormPage;
