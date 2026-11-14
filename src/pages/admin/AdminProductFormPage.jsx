import { useEffect, useState, useRef } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { adminService } from "../../services/adminService";
import { ApiError } from "../../lib/apiClient";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getCameraCategoryRoot(categories, cameraType) {
  const rootSlugs = { FILM: "may-film", DIGITAL: "may-digital" };
  const rootSlug = rootSlugs[cameraType];
  return categories.find((category) => category.slug === rootSlug) || null;
}

function getFilmMetadata(specs = {}) {
  const exposure = specs.exposure;
  return exposure && typeof exposure === "object" && !Array.isArray(exposure)
    ? { ...specs, ...exposure }
    : specs;
}

function buildFilmSpecsPayload(existingSpecs, filmValues) {
  const metadata = { ...getFilmMetadata(existingSpecs) };
  delete metadata.exposure;
  const payload = {
    exposure: { ...metadata, ...filmValues },
  };
  ["controls", "power", "quirks", "beginnerNotes"].forEach((key) => {
    if (existingSpecs[key] !== undefined) payload[key] = existingSpecs[key];
  });
  return payload;
}

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
  const [savedSlug, setSavedSlug] = useState("");
  const [kind, setKind] = useState(() =>
    initialType === "accessory" ? "ACCESSORY" : "CAMERA",
  );
  const [isStoredFilmRoll, setIsStoredFilmRoll] = useState(false);
  const [cameraType, setCameraType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [savedCameraType, setSavedCameraType] = useState("");
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
  const [savedSpecs, setSavedSpecs] = useState({});
  const [filmType, setFilmType] = useState("");
  const [filmIso, setFilmIso] = useState("");
  const [filmExposures, setFilmExposures] = useState("");
  const [filmProcessing, setFilmProcessing] = useState("");

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
        setSavedSlug(data.slug || "");
        setKind(data.kind || "CAMERA");
        const loadedSpecs =
          data.specs?.specs &&
          typeof data.specs.specs === "object" &&
          !Array.isArray(data.specs.specs)
            ? data.specs.specs
            : {};
        const loadedFilmMetadata = getFilmMetadata(loadedSpecs);
        setSavedSpecs(loadedSpecs);
        setIsStoredFilmRoll(
          data.kind === "ACCESSORY" &&
            Boolean(
              loadedFilmMetadata.productType === "FILM_ROLL" ||
              data.filmFormat ||
              ["filmType", "iso", "exposuresPerRoll", "processing"].some(
                (key) => loadedFilmMetadata[key] !== undefined,
              ),
            ),
        );
        setCategoryId(data.categoryId || "");
        setBrandId(data.brandId || "");
        setSavedCameraType(data.cameraType || "");
        setCameraType(
          data.cameraType === "FILM" || data.cameraType === "DIGITAL"
            ? data.cameraType
            : "",
        );
        setMount(data.mount || "");
        setFilmFormat(data.filmFormat || "");
        setPricePerDay(
          data.pricePerDay !== undefined ? String(data.pricePerDay) : "",
        );
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

        if (Object.keys(loadedSpecs).length > 0) {
          const s = loadedSpecs;
          setSpecsExposure(
            typeof s.exposure === "object"
              ? JSON.stringify(s.exposure, null, 2)
              : s.exposure || "",
          );
          setSensorSize(typeof s.sensorSize === "string" ? s.sensorSize : "");
          setSpecsControls(
            Array.isArray(s.controls)
              ? s.controls.join(", ")
              : s.controls || "",
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
          setFilmType(
            typeof loadedFilmMetadata.filmType === "string"
              ? loadedFilmMetadata.filmType
              : "",
          );
          setFilmIso(
            loadedFilmMetadata.iso !== undefined &&
              loadedFilmMetadata.iso !== null
              ? String(loadedFilmMetadata.iso)
              : "",
          );
          setFilmExposures(
            loadedFilmMetadata.exposuresPerRoll !== undefined &&
              loadedFilmMetadata.exposuresPerRoll !== null
              ? String(loadedFilmMetadata.exposuresPerRoll)
              : "",
          );
          setFilmProcessing(
            typeof loadedFilmMetadata.processing === "string"
              ? loadedFilmMetadata.processing
              : "",
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
      prev.map((item) =>
        item.id === targetId ? { ...item, ...updates } : item,
      ),
    );
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Vui lòng nhập tên mẫu máy";
    if (kind === "CAMERA") {
      const cameraRoot = getCameraCategoryRoot(categories, cameraType);
      if (cameraType !== "FILM" && cameraType !== "DIGITAL") {
        errors.cameraType = "Vui lòng chọn loại máy ảnh Film hoặc Digital.";
      } else if (!cameraRoot) {
        errors.cameraType =
          "Không tìm thấy danh mục gốc tương ứng với loại máy ảnh.";
      } else if (
        categoryId &&
        categoryId !== cameraRoot.id &&
        !cameraRoot.children?.some((category) => category.id === categoryId) &&
        !(isEditMode && savedCameraType !== cameraType)
      ) {
        errors.cameraType =
          "Danh mục đã lưu không khớp với loại máy ảnh. Hãy chọn đúng loại trước khi lưu.";
      }
    } else if (!categoryId) {
      errors.categoryId = "Vui lòng chọn danh mục sản phẩm";
    }
    if (!brandId) errors.brandId = "Vui lòng chọn thương hiệu sản xuất";
    if (!description.trim())
      errors.description = "Vui lòng nhập mô tả chi tiết mẫu máy";
    if (isFilmRollForm) {
      if (!isEditMode && !filmFormat.trim())
        errors.filmFormat = "Vui lòng chọn khổ phim.";
      const iso = Number(filmIso);
      if (!isEditMode && !filmIso) {
        errors.filmIso = "ISO phải là số nguyên lớn hơn 0.";
      } else if (filmIso && (!Number.isInteger(iso) || iso < 1)) {
        errors.filmIso = "ISO phải là số nguyên lớn hơn 0.";
      }
      if (!isEditMode && !filmType)
        errors.filmType = "Vui lòng chọn loại film.";
      if (
        filmExposures &&
        (!Number.isInteger(Number(filmExposures)) || Number(filmExposures) < 1)
      ) {
        errors.filmExposures = "Số kiểu ảnh phải là số nguyên lớn hơn 0.";
      }
    }

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
    const cameraRoot = getCameraCategoryRoot(categories, cameraType);
    const categoryBelongsToSelectedCameraType =
      cameraRoot &&
      (categoryId === cameraRoot.id ||
        cameraRoot.children?.some((category) => category.id === categoryId));
    const effectiveCategoryId =
      kind === "CAMERA"
        ? categoryBelongsToSelectedCameraType
          ? categoryId
          : cameraRoot?.id || ""
        : categoryId;
    const payload = {
      kind,
      categoryId: effectiveCategoryId,
      brandId,
      name: name.trim(),
      description: description.trim(),
      cameraType: kind === "CAMERA" ? cameraType : null,
      mount: mount.trim() || null,
      filmFormat: isFilmRollForm
        ? filmFormat.trim() || (isEditMode ? undefined : null)
        : kind !== "CAMERA"
          ? isEditMode
            ? undefined
            : null
          : cameraType === "FILM"
            ? filmFormat.trim() || null
            : isEditMode
              ? undefined
              : null,
      pricePerDay: parseInt(pricePerDay, 10),
      pricePerWeek: pricePerWeek.trim() ? parseInt(pricePerWeek, 10) : null,
      deposit: parseInt(deposit, 10),
      isActive,
      isFeatured,
    };
    const cameraClassificationChanged = Boolean(
      isEditMode && kind === "CAMERA" && savedCameraType !== cameraType,
    );

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
          specsBeginnerNotes ||
          cameraClassificationChanged ||
          isFilmRollForm
        ) {
          const specsPayload = isFilmRollForm
            ? buildFilmSpecsPayload(isEditMode ? savedSpecs : {}, {
                productType: "FILM_ROLL",
                ...(filmType ? { filmType } : {}),
                ...(filmIso ? { iso: Number(filmIso) } : {}),
                ...(filmExposures
                  ? { exposuresPerRoll: Number(filmExposures) }
                  : {}),
                ...(filmProcessing ? { processing: filmProcessing } : {}),
              })
            : {};
          if (cameraClassificationChanged && cameraType !== "DIGITAL") {
            specsPayload.sensorSize = null;
          }
          if (!isFilmRollForm && sensorSize.trim())
            specsPayload.sensorSize = sensorSize.trim();
          if (!isFilmRollForm && specsExposure) {
            try {
              specsPayload.exposure = JSON.parse(specsExposure);
            } catch {
              specsPayload.exposure = { description: specsExposure };
            }
          }
          if (!isFilmRollForm && specsControls) {
            specsPayload.controls = specsControls
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
          if (!isFilmRollForm && specsPower) {
            specsPayload.power = specsPower.trim();
          }
          if (!isFilmRollForm && specsQuirks) {
            specsPayload.quirks = specsQuirks
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
          }
          if (!isFilmRollForm && specsBeginnerNotes) {
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
              `Đã lưu thông tin sản phẩm, nhưng có ${failedUploads} ảnh tải lên thất bại.`,
            );
          }
        }

        // Reload fresh server model data to ensure all UI components display updated values
        const freshModel = await adminService.getAdminModel(id);
        setName(freshModel.name || "");
        setSavedSlug(freshModel.slug || "");
        setFilmFormat(freshModel.filmFormat || "");
        setCategoryId(freshModel.categoryId || "");
        setCameraType(
          freshModel.cameraType === "FILM" ||
            freshModel.cameraType === "DIGITAL"
            ? freshModel.cameraType
            : "",
        );
        setSavedCameraType(freshModel.cameraType || "");
        const refreshedSpecs =
          freshModel.specs?.specs &&
          typeof freshModel.specs.specs === "object" &&
          !Array.isArray(freshModel.specs.specs)
            ? freshModel.specs.specs
            : {};
        const refreshedFilmMetadata = getFilmMetadata(refreshedSpecs);
        setSavedSpecs(refreshedSpecs);
        setIsStoredFilmRoll(
          freshModel.kind === "ACCESSORY" &&
            Boolean(
              refreshedFilmMetadata.productType === "FILM_ROLL" ||
              freshModel.filmFormat ||
              ["filmType", "iso", "exposuresPerRoll", "processing"].some(
                (key) => refreshedFilmMetadata[key] !== undefined,
              ),
            ),
        );
        setFilmType(
          typeof refreshedFilmMetadata.filmType === "string"
            ? refreshedFilmMetadata.filmType
            : "",
        );
        setFilmIso(
          refreshedFilmMetadata.iso !== undefined &&
            refreshedFilmMetadata.iso !== null
            ? String(refreshedFilmMetadata.iso)
            : "",
        );
        setFilmExposures(
          refreshedFilmMetadata.exposuresPerRoll !== undefined &&
            refreshedFilmMetadata.exposuresPerRoll !== null
            ? String(refreshedFilmMetadata.exposuresPerRoll)
            : "",
        );
        setFilmProcessing(
          typeof refreshedFilmMetadata.processing === "string"
            ? refreshedFilmMetadata.processing
            : "",
        );
        setServerImages(freshModel.images || []);
        setUploadStatus("");
        setSuccessMsg("Cập nhật thông tin và hình ảnh sản phẩm thành công.");
      } else {
        // --- 2. CREATE NEW MODEL ---
        const created = await adminService.createAdminModel(payload);

        const specsPayload = isFilmRollForm
          ? buildFilmSpecsPayload(
              {},
              {
                productType: "FILM_ROLL",
                ...(filmType ? { filmType } : {}),
                ...(filmIso ? { iso: Number(filmIso) } : {}),
                ...(filmExposures
                  ? { exposuresPerRoll: Number(filmExposures) }
                  : {}),
                ...(filmProcessing ? { processing: filmProcessing } : {}),
              },
            )
          : {};
        if (!isFilmRollForm && sensorSize.trim())
          specsPayload.sensorSize = sensorSize.trim();
        if (!isFilmRollForm && specsExposure) {
          try {
            specsPayload.exposure = JSON.parse(specsExposure);
          } catch {
            specsPayload.exposure = { description: specsExposure };
          }
        }
        if (!isFilmRollForm && specsControls)
          specsPayload.controls = specsControls
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (!isFilmRollForm && specsPower)
          specsPayload.power = specsPower.trim();
        if (!isFilmRollForm && specsQuirks)
          specsPayload.quirks = specsQuirks
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (!isFilmRollForm && specsBeginnerNotes)
          specsPayload.beginnerNotes = specsBeginnerNotes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (Object.keys(specsPayload).length > 0) {
          await adminService.updateModelSpecs(created.id, specsPayload);
        }

        // Upload any selected local images to the newly created product
        if (selectedFiles.length > 0) {
          setUploadStatus(
            `Sản phẩm đã tạo. Đang tải lên ${selectedFiles.length} ảnh...`,
          );
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
              `${isFilmRollForm ? "Tạo cuộn film" : "Tạo sản phẩm"} thành công, nhưng có ${failedUploads} ảnh tải lên thất bại. Đang chuyển đến trang chỉnh sửa...`,
            );
          } else {
            setSuccessMsg(
              `${isFilmRollForm ? "Tạo cuộn film" : "Tạo sản phẩm"} và tải toàn bộ ảnh thành công! Đang chuyển đến trang quản lý...`,
            );
          }
        } else {
          setSuccessMsg(
            `${isFilmRollForm ? "Tạo cuộn film" : "Tạo sản phẩm"} thành công! Đang chuyển đến trang quản lý...`,
          );
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
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi hệ thống?"))
      return;
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

  const isFilmRollForm =
    kind === "ACCESSORY" && (!isEditMode || isStoredFilmRoll);
  const categoryOptions =
    kind === "CAMERA"
      ? []
      : categories.flatMap((root) => [
          { ...root, displayName: root.name },
          ...(root.children || []).map((child) => ({
            ...child,
            displayName: `${root.name} — ${child.name}`,
          })),
        ]);

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
            <Link to="/admin/orders">Đơn thuê</Link>
            <span className="sep">/</span>
            <Link to="/admin/products">Danh mục sản phẩm</Link>
            <span className="sep">/</span>
            <span className="current">
              {isEditMode
                ? `Chỉnh sửa${isFilmRollForm ? " cuộn film" : ""}: ${name || "Sản phẩm"}`
                : kind === "CAMERA"
                  ? "Thêm sản phẩm"
                  : "Thêm cuộn film"}
            </span>
          </div>
          <h1 className="admin-heading-title">
            {isEditMode
              ? `Chỉnh sửa${isFilmRollForm ? " cuộn film" : ""}: ${name || "Sản phẩm"}`
              : kind === "CAMERA"
                ? "Thêm sản phẩm"
                : "Thêm cuộn film"}
          </h1>
          <p className="admin-heading-sub">
            {isEditMode
              ? isFilmRollForm
                ? "Cập nhật thông tin cuộn film, cấu hình giá, mô tả, trạng thái và hình ảnh."
                : "Cập nhật thông tin định danh, cấu hình giá thuê, tiền cọc, thông số kỹ thuật và thư viện ảnh."
              : kind === "CAMERA"
                ? "Nhập thông tin chi tiết về thân máy ảnh số hoặc máy phim để đưa vào hệ thống cho thuê."
                : "Nhập thông tin cuộn film, khổ phim, ISO và các thông số cần thiết để quản lý sản phẩm."}
          </p>
        </div>

        <div className="admin-header-actions">
          <Link
            to="/admin/products"
            className="button secondary-button compact"
          >
            Quay lại danh sách
          </Link>
          {isEditMode && savedSlug && !isFilmRollForm && (
            <a
              href={`/cameras/${savedSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button secondary-button compact"
            >
              <span>Xem trang khách</span>
            </a>
          )}
        </div>
      </section>

      {/* MODE TABS (Chỉ hiện khi Thêm mới): Máy ảnh hoặc cuộn film */}
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
              className={`product-kind-tab ${kind === "ACCESSORY" ? "active" : ""}`}
              onClick={() => setKind("ACCESSORY")}
              role="tab"
              aria-selected={kind === "ACCESSORY"}
            >
              <span className="kind-tab-icon">🎞️</span>
              <div className="kind-tab-text">
                <strong>Thêm cuộn film</strong>
                <span>Quản lý film theo khổ, loại film và ISO</span>
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
      <form onSubmit={handleSubmit} noValidate className="admin-form-shell">        {/* SECTION 1: BASIC INFORMATION */}
        <div className="admin-form-card">
          <div className="admin-card-header">
            <span className="admin-section-num">01</span>
            <div>
              <h3>Thông tin cơ bản và Định danh</h3>
              <p>
                Các thuộc tính định danh chính thức của mẫu thiết bị trên hệ
                thống.
              </p>
            </div>
          </div>

          <div className="admin-form-grid">
            {/* Tên mẫu máy */}
            <div
              className={`admin-field-group col-span-2 ${fieldErrors.name ? "has-error" : ""}`}
            >
              <label htmlFor="model-name">
                Tên sản phẩm <span className="req">*</span>
              </label>
              <input
                id="model-name"
                type="text"
                placeholder="Ví dụ: Fujifilm X-T5, Canon EOS R6 Mark II, Leica M6..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {fieldErrors.name && (
                <span className="field-error-msg">{fieldErrors.name}</span>
              )}
            </div>

            {/* Loại sản phẩm được xác định từ tab tạo mới hoặc giữ nguyên khi sửa. */}
            <div className="admin-field-group">
              <label>Loại sản phẩm</label>
              <input
                type="text"
                value={
                  isFilmRollForm
                    ? "Cuộn film (ACCESSORY)"
                    : kind === "CAMERA"
                      ? "Máy ảnh (CAMERA)"
                      : kind === "LENS"
                        ? "Ống kính (LENS)"
                        : "Phụ kiện (ACCESSORY)"
                }
                disabled
                readOnly
              />
            </div>

            {/* Thương hiệu */}
            <div
              className={`admin-field-group ${fieldErrors.brandId ? "has-error" : ""}`}
            >
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

            {kind === "CAMERA" && (
              <div
                className={`admin-field-group col-span-2 ${fieldErrors.cameraType ? "has-error" : ""}`}
              >
                <label htmlFor="camera-type">
                  Loại máy ảnh <span className="req">*</span>
                </label>
                <select
                  id="camera-type"
                  value={cameraType}
                  onChange={(event) => {
                    const nextType = event.target.value;
                    setCameraType(nextType);
                    if (nextType !== "DIGITAL") setSensorSize("");
                    setFieldErrors((prev) => ({
                      ...prev,
                      cameraType: undefined,
                    }));
                  }}
                  required
                >
                  {(!isEditMode || !cameraType) && (
                    <option value="" disabled>
                      Chọn loại máy ảnh
                    </option>
                  )}
                  <option value="FILM">FILM</option>
                  <option value="DIGITAL">DIGITAL</option>
                </select>
                <span className="field-hint">
                  Danh mục gốc Film hoặc Digital được lưu tự động; danh mục con
                  hiện có được giữ nếu thuộc nhóm đã chọn.
                </span>
                {fieldErrors.cameraType && (
                  <span className="field-error-msg">
                    {fieldErrors.cameraType}
                  </span>
                )}
              </div>
            )}

            {kind !== "CAMERA" && (
              <div
                className={`admin-field-group ${fieldErrors.categoryId ? "has-error" : ""}`}
              >
                <label htmlFor="model-category">
                  Danh mục sản phẩm <span className="req">*</span>
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
                      {c.displayName || c.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.categoryId && (
                  <span className="field-error-msg">
                    {fieldErrors.categoryId}
                  </span>
                )}
              </div>
            )}

            {/* Ngàm chỉ dùng cho camera và bản ghi legacy dạng lens/accessory. */}
            {!isFilmRollForm && (
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
            )}

            {/* Khổ phim FilmFormat */}
            {isFilmRollForm ? (
              <>
                <div
                  className={`admin-field-group ${fieldErrors.filmFormat ? "has-error" : ""}`}
                >
                  <label htmlFor="model-filmformat">
                    Khổ phim <span className="req">*</span>
                  </label>
                  <select
                    id="model-filmformat"
                    value={filmFormat}
                    onChange={(e) => setFilmFormat(e.target.value)}
                    required={!isEditMode}
                  >
                    <option value="">-- Chọn khổ phim --</option>
                    {["35mm (135)", "120", "4x5 / Large Format"].map(
                      (format) => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ),
                    )}
                    {filmFormat &&
                      !["35mm (135)", "120", "4x5 / Large Format"].includes(
                        filmFormat,
                      ) && <option value={filmFormat}>{filmFormat}</option>}
                  </select>
                  {fieldErrors.filmFormat && (
                    <span className="field-error-msg">
                      {fieldErrors.filmFormat}
                    </span>
                  )}
                </div>
                <div
                  className={`admin-field-group ${fieldErrors.filmType ? "has-error" : ""}`}
                >
                  <label htmlFor="film-type">
                    Loại film <span className="req">*</span>
                  </label>
                  <select
                    id="film-type"
                    value={filmType}
                    onChange={(e) => setFilmType(e.target.value)}
                    required={!isEditMode}
                  >
                    <option value="">-- Chọn loại film --</option>
                    <option value="COLOR_NEGATIVE">Color Negative</option>
                    <option value="BLACK_AND_WHITE">Black &amp; White</option>
                    <option value="SLIDE_REVERSAL">Slide / Reversal</option>
                    {filmType &&
                      ![
                        "COLOR_NEGATIVE",
                        "BLACK_AND_WHITE",
                        "SLIDE_REVERSAL",
                      ].includes(filmType) && (
                        <option value={filmType}>{filmType}</option>
                      )}
                  </select>
                  {fieldErrors.filmType && (
                    <span className="field-error-msg">
                      {fieldErrors.filmType}
                    </span>
                  )}
                </div>
                <div
                  className={`admin-field-group ${fieldErrors.filmIso ? "has-error" : ""}`}
                >
                  <label htmlFor="film-iso">
                    ISO <span className="req">*</span>
                  </label>
                  <input
                    id="film-iso"
                    type="number"
                    min="1"
                    step="1"
                    value={filmIso}
                    onChange={(e) => setFilmIso(e.target.value)}
                    required={!isEditMode}
                  />
                  {fieldErrors.filmIso && (
                    <span className="field-error-msg">
                      {fieldErrors.filmIso}
                    </span>
                  )}
                </div>
                <div
                  className={`admin-field-group ${fieldErrors.filmExposures ? "has-error" : ""}`}
                >
                  <label htmlFor="film-exposures">Số kiểu ảnh mỗi cuộn</label>
                  <input
                    id="film-exposures"
                    type="number"
                    min="1"
                    step="1"
                    value={filmExposures}
                    onChange={(e) => setFilmExposures(e.target.value)}
                    placeholder="Ví dụ: 24 hoặc 36"
                  />
                  {fieldErrors.filmExposures && (
                    <span className="field-error-msg">
                      {fieldErrors.filmExposures}
                    </span>
                  )}
                </div>
                <div className="admin-field-group">
                  <label htmlFor="film-processing">Quy trình xử lý</label>
                  <select
                    id="film-processing"
                    value={filmProcessing}
                    onChange={(e) => setFilmProcessing(e.target.value)}
                  >
                    <option value="">-- Chọn quy trình --</option>
                    <option value="C-41">C-41</option>
                    <option value="E-6">E-6</option>
                    <option value="B&W">B&amp;W</option>
                    {filmProcessing &&
                      !["C-41", "E-6", "B&W"].includes(filmProcessing) && (
                        <option value={filmProcessing}>{filmProcessing}</option>
                      )}
                  </select>
                </div>
              </>
            ) : kind === "CAMERA" && cameraType === "FILM" ? (
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
              !isFilmRollForm && (
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
              )
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
              <p>
                Mức giá thuê cơ bản và hạn mức cọc đối với khách thuê thông
                thường.
              </p>
            </div>
          </div>

          <div className="admin-form-grid">
            {/* Giá ngày */}
            <div
              className={`admin-field-group ${fieldErrors.pricePerDay ? "has-error" : ""}`}
            >
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
                {pricePerDay
                  ? `${Number(pricePerDay).toLocaleString("vi-VN")} đ / ngày`
                  : "Số tiền tính trên 1 ngày thuê"}
              </span>
              {fieldErrors.pricePerDay && (
                <span className="field-error-msg">
                  {fieldErrors.pricePerDay}
                </span>
              )}
            </div>

            {/* Giá tuần */}
            <div className="admin-field-group">
              <label htmlFor="model-price-week">
                Giá thuê theo tuần (VNĐ / tuần - Tùy chọn)
              </label>
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
                {pricePerWeek
                  ? `${Number(pricePerWeek).toLocaleString("vi-VN")} đ / tuần`
                  : "Để trống nếu tính theo ngày x 7"}
              </span>
            </div>

            {/* Tiền cọc */}
            <div
              className={`admin-field-group ${fieldErrors.deposit ? "has-error" : ""}`}
            >
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
                {deposit
                  ? `${Number(deposit).toLocaleString("vi-VN")} đ cọc`
                  : "Tiền cọc đảm bảo thiết bị"}
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
                <span>
                  <strong>Kích hoạt hiển thị (isActive)</strong> - Cho phép hiển
                  thị trên website công khai
                </span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                />
                <span>
                  <strong>Sản phẩm nổi bật (isFeatured)</strong> - Đưa lên danh
                  sách ưu tiên trang chủ
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* SECTION 3: MÔ TẢ CHI TIẾT */}
        <div className="admin-form-card">
          <div className="admin-card-header">
            <span className="admin-section-num">03</span>
            <div>
              <h3>
                {isFilmRollForm
                  ? "Mô tả chi tiết cuộn film"
                  : "Mô tả chi tiết và Giới thiệu máy"}
              </h3>
              <p>
                {isFilmRollForm
                  ? "Mô tả màu sắc, chất ảnh, điều kiện bảo quản và cách sử dụng cuộn film."
                  : "Nội dung giới thiệu đặc điểm nổi bật, chất ảnh và đối tượng người dùng phù hợp."}
              </p>
            </div>
          </div>

          <div className="admin-form-grid">
            <div
              className={`admin-field-group col-span-2 ${fieldErrors.description ? "has-error" : ""}`}
            >
              <label htmlFor="model-desc">
                Mô tả chi tiết <span className="req">*</span>
              </label>
              <textarea
                id="model-desc"
                rows={5}
                placeholder={
                  isFilmRollForm
                    ? "Mô tả màu sắc, chất ảnh, điều kiện bảo quản và cách sử dụng cuộn film..."
                    : "Nhập thông tin giới thiệu về cảm biến, màu sắc, khả năng quay phim, ống kính phù hợp..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              {fieldErrors.description && (
                <span className="field-error-msg">
                  {fieldErrors.description}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 4: THÔNG SỐ KỸ THUẬT (SPECS) */}
        {!isFilmRollForm && (
          <div className="admin-form-card">
            <div className="admin-card-header">
              <span className="admin-section-num">04</span>
              <div>
                <h3>Thông số kỹ thuật và Hướng dẫn sử dụng</h3>
                <p>
                  Chi tiết về hệ thống đo sáng, lấy nét, nguồn pin và lưu ý cho
                  người mới.
                </p>
              </div>
            </div>

            <div className="admin-form-grid">
              <div className="admin-field-group">
                <label htmlFor="specs-exposure">
                  Cảm biến / Đo sáng & Màn trập (Exposure)
                </label>
                <input
                  id="specs-exposure"
                  type="text"
                  placeholder="Ví dụ: 40.2MP X-Trans CMOS 5 HR, Tốc độ 1/180000s..."
                  value={specsExposure}
                  onChange={(e) => setSpecsExposure(e.target.value)}
                />
              </div>

              <div className="admin-field-group">
                <label htmlFor="specs-controls">
                  Hệ thống điều khiển (Controls)
                </label>
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
                <label htmlFor="specs-beginner">
                  Ghi chú cho người mới chụp (Beginner Notes)
                </label>
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
        )}

        {/* SECTION 5: QUẢN LÝ HÌNH ẢNH (CHO CẢ CREATE VÀ EDIT MODE) */}
        <div className="admin-form-card">
          <div className="admin-card-header">
            <span className="admin-section-num">05</span>
            <div>
              <h3>Thư viện hình ảnh sản phẩm</h3>
              <p>
                Chọn ảnh từ máy tính để tải lên. Bạn có thể chọn nhiều ảnh, chỉ
                định ảnh chính và xóa ảnh trước khi lưu.
              </p>
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
            <label
              htmlFor="multi-image-upload-input"
              className="admin-upload-label"
            >
              <span className="upload-text">
                <strong>Nhấp để chọn ảnh</strong> hoặc kéo thả tệp hình ảnh vào
                đây
              </span>
              <span className="upload-sub">
                Hỗ trợ định dạng JPG, JPEG, PNG, WebP (Tối đa 8MB mỗi ảnh, cho
                phép chọn nhiều ảnh)
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
                    : `Các ảnh này sẽ tự động tải lên ngay sau khi ${isFilmRollForm ? "cuộn film" : "sản phẩm"} được tạo thành công.`}
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
                          handleUpdateLocalFileMeta(item.id, {
                            kind: e.target.value,
                          })
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
                <strong>
                  Ảnh hiện có trên máy chủ ({serverImages.length})
                </strong>
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
                          <img
                            src={img.url}
                            alt={img.caption || `Ảnh ${idx + 1}`}
                          />
                        ) : (
                          <div className="no-preview">Không có xem trước</div>
                        )}
                        {idx === 0 && (
                          <span className="admin-main-badge">Ảnh đầu</span>
                        )}
                      </div>
                      <div className="admin-image-info">
                        <span className="image-kind-tag">
                          {img.kind === "PRODUCT"
                            ? "Ảnh thiết bị"
                            : "Ảnh chụp mẫu"}
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
                : isFilmRollForm
                  ? "Tạo cuộn film"
                  : "Tạo sản phẩm"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AdminProductFormPage;
