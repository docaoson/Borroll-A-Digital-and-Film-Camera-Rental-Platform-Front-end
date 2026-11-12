import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DateInput from "../../components/shared/DateInput";
import { useRentalSelection } from "../../hooks/useRentalSelection";
import { ApiError } from "../../lib/apiClient";
import { bookingService } from "../../services/bookingService";
import { catalogService } from "../../services/catalogService";
import NotFoundPage from "../error/NotFoundPage";

function getTodayVietnamIso() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date());
}

function getCurrentMonthIso() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  return `${year}-${month}`;
}

function parseIsoUtcMs(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null;
  }
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function formatCameraType(type) {
  switch (type) {
    case "FILM":
      return "Máy ảnh Film";
    case "DIGITAL":
      return "Máy ảnh Digital";
    case "INSTANT":
      return "Máy chụp lấy liền";
    default:
      return type || "Thiết bị";
  }
}

function FavoriteToggle({ modelId, isFavorite, onToggle }) {
  const [pending, setPending] = useState(false);

  const handleToggle = async () => {
    if (!modelId || pending) return;
    setPending(true);
    try {
      await onToggle(modelId, !isFavorite);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      className={`favorite-toggle detail-favorite-toggle ${
        isFavorite ? "active" : ""
      }`}
      onClick={handleToggle}
      disabled={pending}
      aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
    >
      {pending ? "…" : isFavorite ? "♥ Đã yêu thích" : "♡ Thêm vào yêu thích"}
    </button>
  );
}

const DEFAULT_INSPECTION_ITEMS = [
  "Thấu kính & Kính ngắm: Quang học trong trẻo, không trầy xước, không mốc rễ tre.",
  "Màn trập & Đo sáng: Hoạt động chính xác ở mọi dải tốc độ, đo sáng chuẩn sáng.",
  "Cơ học & Buồng phim / Cảm biến: Ron chống sáng (light seals) nguyên vẹn, cảm biến sạch bụi.",
  "Pin, tiếp điểm & phụ kiện: Đầy đủ pin, sạc, nắp đậy và dây đeo tiêu chuẩn.",
];

function CameraDetailPage() {
  const { id } = useParams();
  const {
    branchSlug: savedBranchSlug,
    startDate: savedStartDate,
    endDate: savedEndDate,
    setBranchSlug: saveBranchSlug,
    setStartDate: saveStartDate,
    setEndDate: saveEndDate,
    addItem,
  } = useRentalSelection();

  const todayString = getTodayVietnamIso();

  const [prevId, setPrevId] = useState(id);
  const [modelState, setModelState] = useState({
    slug: null,
    data: null,
    notFound: false,
    error: "",
  });
  const [branches, setBranches] = useState([]);
  const [branchSlug, setBranchSlug] = useState(savedBranchSlug || "tay-ho");
  const [pickupDate, setPickupDate] = useState(savedStartDate || todayString);
  const [returnDate, setReturnDate] = useState(savedEndDate || "");
  const [pickupInvalid, setPickupInvalid] = useState(false);
  const [returnInvalid, setReturnInvalid] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [validationAlert, setValidationAlert] = useState("");

  if (id !== prevId) {
    setPrevId(id);
    setActiveImageIndex(0);
    setAddedSuccess(false);
  }

  // Calendar State
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(getCurrentMonthIso);

  // Quote State
  const [quoteState, setQuoteState] = useState({
    key: null,
    data: null,
    error: "",
  });

  // Load branches
  useEffect(() => {
    let active = true;
    catalogService
      .getBranches()
      .then((res) => {
        if (!active) return;
        const branchList = res.items || [];
        setBranches(branchList);
        if (branchList.length > 0 && !savedBranchSlug) {
          setBranchSlug(branchList[0].slug);
        }
      })
      .catch(() => {
        if (active) setBranches([]);
      });
    return () => {
      active = false;
    };
  }, [savedBranchSlug]);

  // Load model detail by slug
  useEffect(() => {
    if (!id) return;
    let active = true;

    catalogService
      .getModelBySlug(id)
      .then((data) => {
        if (active) {
          setModelState({ slug: id, data, notFound: false, error: "" });
        }
      })
      .catch((err) => {
        if (!active) return;
        const is404 = err instanceof ApiError && err.status === 404;
        setModelState({
          slug: id,
          data: null,
          notFound: is404,
          error: is404 ? "" : "Không thể tải thông tin thiết bị lúc này.",
        });
      });

    return () => {
      active = false;
    };
  }, [id]);

  const camera = modelState.slug === id ? modelState.data : null;
  const isModelLoading = modelState.slug !== id && !modelState.notFound && !modelState.error;
  const isNotFound = modelState.slug === id && modelState.notFound;

  // Calendar availability state
  const availabilityKey =
    camera?.id && branchSlug && currentCalendarMonth
      ? `${camera.id}|${branchSlug}|${currentCalendarMonth}`
      : null;

  const [availabilityState, setAvailabilityState] = useState({
    key: null,
    data: [],
  });

  const isCalendarLoading = Boolean(
    availabilityKey && availabilityState.key !== availabilityKey,
  );

  const unavailableDatesSet = useMemo(() => {
    const dates =
      availabilityKey && availabilityState.key === availabilityKey
        ? availabilityState.data
        : [];
    return new Set(dates);
  }, [availabilityKey, availabilityState.key, availabilityState.data]);

  // Fetch model availability when availabilityKey changes
  useEffect(() => {
    if (!availabilityKey || !camera?.id) return;

    let active = true;

    catalogService
      .getModelAvailability(camera.id, branchSlug, currentCalendarMonth)
      .then((res) => {
        if (active) {
          setAvailabilityState({
            key: availabilityKey,
            data: res.unavailableDates || [],
          });
        }
      })
      .catch(() => {
        if (active) {
          setAvailabilityState({
            key: availabilityKey,
            data: [],
          });
        }
      });

    return () => {
      active = false;
    };
  }, [availabilityKey, camera?.id, branchSlug, currentCalendarMonth]);

  // Quote request calculation
  const pickupMs = parseIsoUtcMs(pickupDate);
  const returnMs = parseIsoUtcMs(returnDate);
  const isRangeInvalid =
    pickupMs !== null && returnMs !== null && returnMs <= pickupMs;

  const canRequestQuote = Boolean(
    camera &&
      branchSlug &&
      pickupMs !== null &&
      returnMs !== null &&
      returnMs > pickupMs &&
      !pickupInvalid &&
      !returnInvalid,
  );

  const quoteRequestKey = canRequestQuote
    ? `${branchSlug}|${pickupDate}|${returnDate}|${camera.id}`
    : null;

  useEffect(() => {
    if (!quoteRequestKey || !camera) return;

    let active = true;
    bookingService
      .quote({
        branchSlug,
        startDate: pickupDate,
        endDate: returnDate,
        items: [{ modelId: camera.id }],
        addons: [],
      })
      .then((data) => {
        if (active) {
          setQuoteState({ key: quoteRequestKey, data, error: "" });
        }
      })
      .catch((error) => {
        if (active) {
          const msg =
            error instanceof ApiError
              ? error.message
              : "Không thể tính báo giá từ máy chủ lúc này.";
          setQuoteState({ key: quoteRequestKey, data: null, error: msg });
        }
      });

    return () => {
      active = false;
    };
  }, [quoteRequestKey, branchSlug, pickupDate, returnDate, camera]);

  const handleToggleFavorite = async (modelId, shouldFavorite) => {
    if (!modelId) return;
    try {
      await catalogService.toggleFavorite(modelId, shouldFavorite);
      setModelState((current) => ({
        ...current,
        data: current.data
          ? { ...current.data, isFavorite: shouldFavorite }
          : current.data,
      }));
    } catch {
      // rollback or ignore
    }
  };

  const handlePickupChange = (nextDate, isInvalid) => {
    setPickupDate(nextDate);
    setPickupInvalid(isInvalid);
    setAddedSuccess(false);
    setValidationAlert("");
  };

  const handleReturnChange = (nextDate, isInvalid) => {
    setReturnDate(nextDate);
    setReturnInvalid(isInvalid);
    setAddedSuccess(false);
    setValidationAlert("");
  };

  // Month navigation for availability calendar
  const handlePrevMonth = () => {
    const [yearStr, monthStr] = currentCalendarMonth.split("-");
    let y = Number(yearStr);
    let m = Number(monthStr) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    const nextMonthStr = `${y}-${String(m).padStart(2, "0")}`;
    // Don't go before current real-time month
    if (nextMonthStr >= getCurrentMonthIso()) {
      setCurrentCalendarMonth(nextMonthStr);
    }
  };

  const handleNextMonth = () => {
    const [yearStr, monthStr] = currentCalendarMonth.split("-");
    let y = Number(yearStr);
    let m = Number(monthStr) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setCurrentCalendarMonth(`${y}-${String(m).padStart(2, "0")}`);
  };

  // Interactive calendar date click
  const handleDateClick = (isoString) => {
    setAddedSuccess(false);
    setValidationAlert("");

    // If no pickup date, or clicked date is earlier than current pickup date, or both dates already selected:
    if (!pickupDate || isoString < pickupDate || (pickupDate && returnDate)) {
      setPickupDate(isoString);
      setReturnDate("");
      setPickupInvalid(false);
      setReturnInvalid(false);
      return;
    }

    // If pickupDate is selected and user clicked a later date:
    if (pickupDate && isoString > pickupDate) {
      // Validate that no unavailable dates exist within the selected range [pickupDate, isoString]
      let hasUnavailable = false;
      const startMs = parseIsoUtcMs(pickupDate);
      const endMs = parseIsoUtcMs(isoString);
      const oneDay = 24 * 60 * 60 * 1000;

      for (let time = startMs; time <= endMs; time += oneDay) {
        const d = new Date(time);
        const y = d.getUTCFullYear();
        const m = String(d.getUTCMonth() + 1).padStart(2, "0");
        const day = String(d.getUTCDate()).padStart(2, "0");
        const probeIso = `${y}-${m}-${day}`;
        if (unavailableDatesSet.has(probeIso)) {
          hasUnavailable = true;
          break;
        }
      }

      if (hasUnavailable) {
        setValidationAlert(
          "Khoảng ngày bạn chọn chứa ngày thiết bị đã kín lịch hoặc bảo dưỡng. Vui lòng chọn khoảng thời gian khác.",
        );
        setPickupDate(isoString);
        setReturnDate("");
        return;
      }

      setReturnDate(isoString);
      setReturnInvalid(false);
    }
  };

  // Add to cart action
  const handleAddToCart = () => {
    setValidationAlert("");

    if (pickupInvalid || returnInvalid) {
      setValidationAlert("Ngày nhận hoặc ngày trả không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }

    if (!pickupDate || !returnDate) {
      setValidationAlert("Vui lòng chọn đầy đủ ngày nhận và ngày trả máy trên lịch thuê.");
      return;
    }

    if (isRangeInvalid) {
      setValidationAlert("Ngày trả máy phải sau ngày nhận máy ít nhất 1 ngày.");
      return;
    }

    if (unavailableDatesSet.has(pickupDate) || unavailableDatesSet.has(returnDate)) {
      setValidationAlert("Ngày nhận hoặc ngày trả rơi vào ngày kín lịch thuê. Vui lòng chọn ngày khác.");
      return;
    }

    saveBranchSlug(branchSlug);
    saveStartDate(pickupDate);
    saveEndDate(returnDate);
    addItem({
      modelId: camera.id,
      slug: camera.slug,
      name: camera.name,
      kind: camera.kind,
      mount: camera.mount,
    });

    setAddedSuccess(true);
  };

  if (isNotFound) {
    return <NotFoundPage />;
  }

  if (isModelLoading || !camera) {
    return (
      <div className="camera-detail-page">
        <div className="container detail-shell">
          <div className="detail-loading-skeleton" aria-label="Đang tải thông tin thiết bị...">
            <div className="skeleton-line skeleton-breadcrumb" />
            <div className="detail-layout">
              <div className="skeleton-visual-box" />
              <div className="skeleton-info-col">
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-meta" />
                <div className="skeleton-line skeleton-desc" />
                <div className="skeleton-line skeleton-desc" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const galleryImages =
    Array.isArray(camera.images) && camera.images.length > 0
      ? camera.images
      : camera.thumbnailUrl
        ? [{ id: "thumb", url: camera.thumbnailUrl, kind: "PRODUCT", caption: camera.name }]
        : [];

  const activeImage = galleryImages[activeImageIndex] || galleryImages[0];

  const isQuoteLoading = Boolean(
    quoteRequestKey && quoteState.key !== quoteRequestKey,
  );
  const quote =
    quoteRequestKey && quoteState.key === quoteRequestKey
      ? quoteState.data
      : null;
  const quoteError =
    quoteRequestKey && quoteState.key === quoteRequestKey
      ? quoteState.error
      : "";

  // Calendar rendering calculations
  const [cYear, cMonth] = currentCalendarMonth.split("-").map(Number);
  const daysInMonth = new Date(cYear, cMonth, 0).getDate();
  const firstDayOfWeek = (new Date(cYear, cMonth - 1, 1).getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const monthTitle = `Tháng ${cMonth} / ${cYear}`;
  const isCurrentMonth = currentCalendarMonth === getCurrentMonthIso();

  return (
    <div className="camera-detail-page">
      <div className="container detail-shell">
        {/* BREADCRUMB */}
        <nav className="detail-breadcrumb" aria-label="Đường dẫn trang">
          <Link to="/">Trang chủ</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/cameras">Thiết bị</Link>
          <span className="breadcrumb-separator">/</span>
          {camera.category?.name && (
            <>
              <Link to={`/cameras?category=${camera.category.slug}`}>
                {camera.category.name}
              </Link>
              <span className="breadcrumb-separator">/</span>
            </>
          )}
          <span className="breadcrumb-current" aria-current="page">
            {camera.name}
          </span>
        </nav>

        {/* MAIN DETAIL GRID */}
        <div className="detail-layout">
          {/* LEFT COLUMN: MEDIA GALLERY */}
          <section className="detail-visual-col" aria-label="Hình ảnh sản phẩm">
            <div className="detail-main-image-card">
              {activeImage?.url ? (
                <img
                  src={activeImage.url}
                  alt={activeImage.caption || camera.name}
                  className="detail-main-img"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fb = e.currentTarget.parentElement?.querySelector(
                      ".camera-image-fallback",
                    );
                    if (fb) fb.classList.remove("hidden");
                  }}
                />
              ) : null}

              <div
                className={`camera-image-fallback detail-fallback ${
                  activeImage?.url ? "hidden" : ""
                }`}
              >
                <span className="fallback-camera-icon" aria-hidden="true">📷</span>
                <span className="fallback-brand">{camera.brand?.name || "BORROLL"}</span>
              </div>

              {activeImage?.sampleLens && (
                <span className="sample-lens-pill">
                  Ống kính mẫu: {activeImage.sampleLens}
                </span>
              )}
            </div>

            {activeImage?.caption && (
              <p className="detail-image-caption">{activeImage.caption}</p>
            )}

            {/* THUMBNAILS STRIP */}
            {galleryImages.length > 1 && (
              <div className="detail-thumbnails-strip" aria-label="Danh sách ảnh thu nhỏ">
                {galleryImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    className={`thumb-btn ${idx === activeImageIndex ? "active" : ""}`}
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`Xem ảnh số ${idx + 1}`}
                  >
                    <img src={img.url} alt="" loading="lazy" />
                  </button>
                ))}
              </div>
            )}

            {/* BORROLL QUALITY GUARANTEE */}
            <div className="detail-guarantee-card">
              <div className="guarantee-header">
                <span className="guarantee-icon" aria-hidden="true">🛡️</span>
                <h3>Cam kết kỹ thuật & tiêu chuẩn bàn giao</h3>
              </div>
              <ul className="guarantee-list">
                {(camera.inspection?.items && camera.inspection.items.length > 0
                  ? camera.inspection.items
                  : DEFAULT_INSPECTION_ITEMS
                ).map((item, i) => (
                  <li key={i}>
                    <span className="check-bullet" aria-hidden="true">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="guarantee-note">
                Tất cả thiết bị đều được đội ngũ chuyên viên Borroll kiểm tra, vệ sinh sensor / thấu kính và dán tem bảo dưỡng trước mỗi lượt giao nhận.
              </p>
            </div>
          </section>

          {/* RIGHT COLUMN: PRODUCT INFO & PRICING */}
          <section className="detail-content-col" aria-label="Thông tin thiết bị">
            <div className="detail-header-card">
              <div className="detail-badges-row">
                {camera.category?.name && (
                  <span className="camera-category-badge">
                    {camera.category.name}
                  </span>
                )}
                <span className="camera-type-tag">
                  {formatCameraType(camera.cameraType)}
                </span>
              </div>

              <div className="detail-title-row">
                <h1 className="detail-product-title">{camera.name}</h1>
                <FavoriteToggle
                  modelId={camera.id}
                  isFavorite={Boolean(camera.isFavorite)}
                  onToggle={handleToggleFavorite}
                />
              </div>

              <p className="detail-brand-line">
                Thương hiệu: <strong>{camera.brand?.name}</strong>
                {camera.mount ? ` · Ngàm: ${camera.mount}` : ""}
                {camera.filmFormat ? ` · Khổ phim: ${camera.filmFormat}` : ""}
              </p>

              <div className="detail-price-highlight">
                <div className="price-item">
                  <span className="price-subtitle">Giá thuê ngày</span>
                  <strong className="price-value">
                    {camera.pricePerDay.toLocaleString("vi-VN")} ₫
                    <small>/ngày</small>
                  </strong>
                </div>

                <div className="price-item">
                  <span className="price-subtitle">Tiền đặt cọc</span>
                  <strong className="deposit-value">
                    {camera.deposit.toLocaleString("vi-VN")} ₫
                  </strong>
                </div>

                {camera.pricePerWeek ? (
                  <div className="price-item">
                    <span className="price-subtitle">Thuê tuần (7 ngày)</span>
                    <strong className="week-value">
                      {camera.pricePerWeek.toLocaleString("vi-VN")} ₫
                    </strong>
                  </div>
                ) : null}
              </div>

              <div className="deposit-policy-hint">
                <span className="info-icon" aria-hidden="true">ℹ</span>
                <span>
                  Chính sách cọc linh hoạt: Giữ CCCD gắn chip / Hộ chiếu gốc + đặt cọc 30-50% hoặc chuyển khoản cọc 100% (hoàn cọc ngay sau khi bàn giao máy).
                </span>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="detail-section-block">
              <h2>Mô tả thiết bị</h2>
              <p className="detail-description-text">
                {camera.description ||
                  "Thiết bị chất lượng cao được tuyển chọn và bảo dưỡng kỹ lưỡng tại Borroll, mang lại trải nghiệm ghi hình và chụp ảnh tối ưu cho cả nhiếp ảnh gia chuyên nghiệp lẫn người mới bắt đầu."}
              </p>
            </div>

            {/* TECHNICAL SPECIFICATIONS */}
            <div className="detail-section-block">
              <h2>Thông số kỹ thuật chi tiết</h2>
              <div className="specs-table-wrapper">
                <table className="specs-table">
                  <tbody>
                    <tr>
                      <th scope="row">Thương hiệu</th>
                      <td>{camera.brand?.name || "Đang cập nhật"}</td>
                    </tr>
                    <tr>
                      <th scope="row">Dòng thiết bị</th>
                      <td>{formatCameraType(camera.cameraType)}</td>
                    </tr>
                    <tr>
                      <th scope="row">Phân loại danh mục</th>
                      <td>{camera.category?.name || "Đang cập nhật"}</td>
                    </tr>
                    {camera.mount && (
                      <tr>
                        <th scope="row">Ngàm ống kính (Lens Mount)</th>
                        <td>{camera.mount}</td>
                      </tr>
                    )}
                    {camera.filmFormat && (
                      <tr>
                        <th scope="row">Định dạng phim / Cảm biến</th>
                        <td>{camera.filmFormat}</td>
                      </tr>
                    )}
                    {camera.specs?.exposure && (
                      <tr>
                        <th scope="row">Hệ thống phơi sáng & đo sáng</th>
                        <td>{camera.specs.exposure}</td>
                      </tr>
                    )}
                    {camera.specs?.controls && (
                      <tr>
                        <th scope="row">Vận hành & nút điều khiển</th>
                        <td>{camera.specs.controls}</td>
                      </tr>
                    )}
                    {camera.specs?.power && (
                      <tr>
                        <th scope="row">Nguồn điện / Pin sử dụng</th>
                        <td>{camera.specs.power}</td>
                      </tr>
                    )}
                    {camera.specs?.quirks && (
                      <tr>
                        <th scope="row">Đặc tính / Lưu ý vận hành</th>
                        <td>{camera.specs.quirks}</td>
                      </tr>
                    )}
                    {camera.specs?.beginnerNotes && (
                      <tr>
                        <th scope="row">Lời khuyên cho người mới</th>
                        <td>{camera.specs.beginnerNotes}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* INCLUDED ACCESSORIES */}
            <div className="detail-section-block">
              <h2>Phụ kiện đi kèm khi thuê</h2>
              <ul className="accessories-checklist">
                <li>1x Thân máy kèm nắp đậy (Body Cap)</li>
                <li>1x Pin chính hãng + Sạc tương thích (với máy Digital) hoặc Pin máy đo sáng đã lắp sẵn (với máy Film)</li>
                <li>1x Dây đeo cổ hoặc dây đeo tay thời trang</li>
                <li>1x Túi chống sốc bảo vệ thiết bị trong quá trình di chuyển</li>
                <li>Tài liệu hướng dẫn sử dụng nhanh từ Borroll Lab</li>
              </ul>
            </div>
          </section>
        </div>

        {/* BOOKING & AVAILABILITY SECTION */}
        <section className="checkout-card detail-booking-box" aria-label="Đặt lịch thuê máy">
          <div className="checkout-section-header">
            <div>
              <p className="eyebrow">ĐẶT LỊCH THUÊ NGAY</p>
              <h2>Chọn chi nhánh & Lịch thuê thiết bị</h2>
            </div>
            <p className="booking-subtitle">
              Xem lịch trống trực tiếp theo thời gian thực và đặt giữ máy nhanh chóng.
            </p>
          </div>

          <div className="booking-controls-grid">
            <div className="form-field">
              <label htmlFor="branch-select">Chi nhánh nhận và trả máy</label>
              <select
                id="branch-select"
                value={branchSlug}
                onChange={(event) => {
                  setBranchSlug(event.target.value);
                  setAddedSuccess(false);
                }}
              >
                {branches.map((b) => (
                  <option key={b.slug} value={b.slug}>
                    Chi nhánh {b.name} ({b.address})
                  </option>
                ))}
              </select>
            </div>

            <DateInput
              id="pickup-date-input"
              label="Ngày nhận máy"
              value={pickupDate}
              onChange={handlePickupChange}
              minDate={todayString}
            />

            <DateInput
              id="return-date-input"
              label="Ngày trả máy"
              value={returnDate}
              onChange={handleReturnChange}
              minDate={pickupDate || todayString}
            />
          </div>

          {/* INTERACTIVE MONTHLY AVAILABILITY CALENDAR */}
          <div className="calendar-widget-shell">
            <div className="calendar-header-bar">
              <div className="calendar-nav-controls">
                <button
                  type="button"
                  className="cal-nav-btn"
                  onClick={handlePrevMonth}
                  disabled={isCurrentMonth}
                  aria-label="Tháng trước"
                  title="Tháng trước"
                >
                  ◀
                </button>
                <h3 className="cal-month-title">{monthTitle}</h3>
                <button
                  type="button"
                  className="cal-nav-btn"
                  onClick={handleNextMonth}
                  aria-label="Tháng sau"
                  title="Tháng sau"
                >
                  ▶
                </button>
              </div>

              <div className="calendar-legend">
                <span className="legend-item">
                  <span className="legend-swatch available" aria-hidden="true" /> Sẵn sàng
                </span>
                <span className="legend-item">
                  <span className="legend-swatch unavailable" aria-hidden="true" /> Kín lịch
                </span>
                <span className="legend-item">
                  <span className="legend-swatch selected" aria-hidden="true" /> Ngày bạn chọn
                </span>
              </div>
            </div>

            {isCalendarLoading ? (
              <div className="calendar-loading-cover">
                <span>Đang kiểm tra lịch trống máy tại chi nhánh...</span>
              </div>
            ) : null}

            <div className="calendar-grid-container">
              {/* WEEKDAY HEADERS */}
              <div className="calendar-weekdays-row" aria-hidden="true">
                <span>T2</span>
                <span>T3</span>
                <span>T4</span>
                <span>T5</span>
                <span>T6</span>
                <span>T7</span>
                <span>CN</span>
              </div>

              {/* CALENDAR CELLS */}
              <div className="calendar-days-grid" role="grid" aria-label="Lịch kiểm tra tình trạng máy">
                {/* Blank days before day 1 */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="cal-cell empty-cell" aria-hidden="true" />
                ))}

                {/* Days of current month */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dayIso = `${cYear}-${String(cMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const isPast = dayIso < todayString;
                  const isUnavailable = unavailableDatesSet.has(dayIso);
                  const isPickup = dayIso === pickupDate;
                  const isReturn = dayIso === returnDate;
                  const isInRange =
                    pickupDate &&
                    returnDate &&
                    dayIso > pickupDate &&
                    dayIso < returnDate;

                  const isDisabled = isPast || isUnavailable;

                  let cellClass = "cal-cell day-cell";
                  if (isPast) cellClass += " is-past";
                  if (isUnavailable) cellClass += " is-unavailable";
                  if (isPickup) cellClass += " is-pickup-date";
                  if (isReturn) cellClass += " is-return-date";
                  if (isInRange) cellClass += " is-in-range";

                  return (
                    <button
                      key={dayIso}
                      type="button"
                      className={cellClass}
                      disabled={isDisabled}
                      onClick={() => handleDateClick(dayIso)}
                      title={
                        isPast
                          ? "Ngày đã qua"
                          : isUnavailable
                            ? "Thiết bị đã kín lịch trong ngày này"
                            : isPickup
                              ? "Ngày nhận máy đã chọn"
                              : isReturn
                                ? "Ngày trả máy đã chọn"
                                : `Chọn ngày ${dayNum}/${cMonth}`
                      }
                      aria-label={`Ngày ${dayNum}/${cMonth}/${cYear}${
                        isUnavailable ? " - Kín lịch" : isPast ? " - Đã qua" : ""
                      }`}
                    >
                      <span className="cal-day-num">{dayNum}</span>
                      {isUnavailable && !isPast && (
                        <span className="cal-unavail-badge">Hết máy</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="calendar-click-hint">
              💡 <em>Mẹo: Bạn có thể bấm chọn ngày nhận và ngày trả trực tiếp trên lịch ở trên.</em>
            </p>
          </div>

          {/* PRICING & QUOTE BREAKDOWN */}
          <div className="detail-price-panel">
            <div className="price-row">
              <span>Đơn giá niêm yết:</span>
              <strong>{camera.pricePerDay.toLocaleString("vi-VN")} ₫ / ngày</strong>
            </div>
            <div className="price-row">
              <span>Phí đặt cọc thiết bị:</span>
              <strong>{camera.deposit.toLocaleString("vi-VN")} ₫</strong>
            </div>
          </div>

          {/* STATUS MESSAGES */}
          {validationAlert && (
            <div className="status-message error" role="alert">
              ⚠️ {validationAlert}
            </div>
          )}

          {quoteError && (
            <div className="status-message error" role="alert">
              {quoteError}
            </div>
          )}

          {isQuoteLoading && (
            <div className="status-message muted">
              ⏳ Đang tính tổng chi phí dự tính...
            </div>
          )}

          {quote && (
            <div className="quote-summary" aria-label="Báo giá thuê ước tính">
              <div className="price-row">
                <span>Thời gian thuê thực tế:</span>
                <strong>{quote.days} ngày</strong>
              </div>
              <div className="price-row">
                <span>Tổng tiền thuê dự kiến:</span>
                <strong className="text-terra">
                  {quote.rentalAmount.toLocaleString("vi-VN")} ₫
                </strong>
              </div>
              <div className="price-row">
                <span>Tổng tiền cọc yêu cầu:</span>
                <strong>{quote.depositAmount.toLocaleString("vi-VN")} ₫</strong>
              </div>
            </div>
          )}

          {/* ADDED TO CART SUCCESS NOTIFICATION */}
          {addedSuccess && (
            <div className="added-success-card" role="status">
              <div className="success-icon" aria-hidden="true">✓</div>
              <div className="success-content">
                <h4>Đã thêm &quot;{camera.name}&quot; vào giỏ thuê thành công!</h4>
                <p>
                  Thời gian: {pickupDate} đến {returnDate} tại Chi nhánh{" "}
                  {branches.find((b) => b.slug === branchSlug)?.name || branchSlug}.
                </p>
                <div className="success-actions">
                  <Link to="/cart" className="button primary-button small-button">
                    Đi tới giỏ thuê ngay →
                  </Link>
                  <Link to="/cameras" className="button secondary-button small-button">
                    Tiếp tục xem thiết bị khác
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ACTION BUTTON */}
          <div className="booking-cta-bar">
            <button
              type="button"
              className="button primary-button full-width large-cta"
              onClick={handleAddToCart}
              disabled={!canRequestQuote}
            >
              Thêm thiết bị vào giỏ thuê
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default CameraDetailPage;
