import { useEffect, useState } from "react";
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

function parseIsoUtcMs(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null;
  }
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
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
      {pending ? "…" : isFavorite ? "♥ Đã thích" : "♡ Thêm yêu thích"}
    </button>
  );
}

function CameraDetailPage() {
  const { id } = useParams();
  const {
    branchSlug: savedBranchSlug,
    setBranchSlug: saveBranchSlug,
    setStartDate: saveStartDate,
    setEndDate: saveEndDate,
    addItem,
  } = useRentalSelection();

  const todayString = getTodayVietnamIso();

  const [modelState, setModelState] = useState({
    slug: null,
    data: null,
    notFound: false,
  });
  const [branches, setBranches] = useState([]);
  const [branchSlug, setBranchSlug] = useState(savedBranchSlug || "tay-ho");
  const [pickupDate, setPickupDate] = useState(todayString);
  const [returnDate, setReturnDate] = useState("");
  const [pickupInvalid, setPickupInvalid] = useState(false);
  const [returnInvalid, setReturnInvalid] = useState(false);
  const [message, setMessage] = useState("");
  const [quoteState, setQuoteState] = useState({
    key: null,
    data: null,
    error: "",
  });

  useEffect(() => {
    let active = true;
    catalogService
      .getBranches()
      .then((res) => {
        if (active) setBranches(res.items || []);
      })
      .catch(() => {
        if (active) setBranches([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    let active = true;
    catalogService
      .getModelBySlug(id)
      .then((data) => {
        if (active) setModelState({ slug: id, data, notFound: false });
      })
      .catch(() => {
        if (active) setModelState({ slug: id, data: null, notFound: true });
      });
    return () => {
      active = false;
    };
  }, [id]);

  const camera = modelState.slug === id ? modelState.data : null;
  const isModelLoading = modelState.slug !== id;
  const isNotFound = modelState.slug === id && modelState.notFound;

  const pickupMs = parseIsoUtcMs(pickupDate);
  const returnMs = parseIsoUtcMs(returnDate);
  const isRangeInvalid =
    pickupMs !== null && returnMs !== null && returnMs <= pickupMs;
  const canRequestQuote = Boolean(
    camera &&
    branchSlug &&
    pickupMs !== null &&
    returnMs !== null &&
    returnMs > pickupMs,
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
              : "Không thể lấy báo giá từ máy chủ lúc này.";
          setQuoteState({ key: quoteRequestKey, data: null, error: msg });
        }
      });

    return () => {
      active = false;
    };
  }, [quoteRequestKey, branchSlug, pickupDate, returnDate, camera]);

  const handleToggleFavorite = async (modelId, shouldFavorite) => {
    if (!modelId) return;
    await catalogService.toggleFavorite(modelId, shouldFavorite);
    setModelState((current) => ({
      ...current,
      data: current.data
        ? { ...current.data, isFavorite: shouldFavorite }
        : current.data,
    }));
  };

  if (isNotFound) {
    return <NotFoundPage />;
  }

  if (isModelLoading || !camera) {
    return (
      <div className="camera-detail-page">
        <div className="container detail-shell">
          <div className="page-placeholder">
            <p className="page-kicker">BORROLL</p>
            <p>Đang tải thông tin thiết bị...</p>
          </div>
        </div>
      </div>
    );
  }

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

  const handlePickupChange = (nextPickupDate, isInvalid) => {
    setPickupDate(nextPickupDate);
    setPickupInvalid(isInvalid);
    setMessage("");
  };

  const handleReturnChange = (nextReturnDate, isInvalid) => {
    setReturnDate(nextReturnDate);
    setReturnInvalid(isInvalid);
    setMessage("");
  };

  const handleAddToSelection = () => {
    if (pickupInvalid || returnInvalid) {
      setMessage(
        "Ngày nhận hoặc ngày trả không hợp lệ. Vui lòng kiểm tra lại.",
      );
      return;
    }

    if (!pickupDate || !returnDate) {
      setMessage("Vui lòng nhập đầy đủ ngày nhận và ngày trả máy.");
      return;
    }

    if (isRangeInvalid) {
      setMessage("Ngày trả máy phải sau ngày nhận máy ít nhất 1 ngày.");
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
    setMessage("Đã thêm thiết bị vào danh sách chọn thuê.");
  };

  return (
    <div className="camera-detail-page">
      <div className="container detail-shell">
        <nav className="detail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/cameras">Bộ sưu tập</Link>
          <span>/</span>
          <span>{camera.name}</span>
        </nav>

        <div className="detail-layout">
          <div className="detail-visual">
            <div className="image-placeholder detail-placeholder">
              <span>{camera.category?.name}</span>
            </div>
          </div>

          <div className="detail-content">
            <div className="detail-header-row">
              <div>
                <p className="eyebrow">{camera.category?.name}</p>
                <h1>{camera.name}</h1>
              </div>
              <FavoriteToggle
                modelId={camera.id}
                isFavorite={Boolean(camera.isFavorite)}
                onToggle={handleToggleFavorite}
              />
            </div>

            <div className="detail-meta">
              <span>{camera.brand?.name}</span>
              <span>{camera.cameraType}</span>
            </div>

            <p className="detail-description">{camera.description}</p>

            <div className="detail-section">
              <h2>Thông tin kỹ thuật</h2>
              <ul className="info-list">
                <li>
                  <span>Thương hiệu</span>
                  <strong>{camera.brand?.name}</strong>
                </li>
                <li>
                  <span>Dòng máy</span>
                  <strong>{camera.cameraType}</strong>
                </li>
                <li>
                  <span>Phân loại</span>
                  <strong>{camera.category?.name}</strong>
                </li>
              </ul>
            </div>

            <div className="detail-section">
              <h2>Phụ kiện đi kèm</h2>
              <p>
                Pin, dây đeo, túi bảo vệ và hướng dẫn sử dụng cơ bản. Nhận và
                trả máy trực tiếp tại chi nhánh đã chọn.
              </p>
            </div>
          </div>
        </div>

        <div className="checkout-card detail-booking-box">
          <div className="checkout-section-header">
            <div>
              <p className="eyebrow">Thuê ngay</p>
              <h2>Đặt lịch nhận máy</h2>
            </div>
          </div>

          <div className="booking-grid">
            <div>
              <label htmlFor="branch-select">Chi nhánh</label>
              <select
                id="branch-select"
                value={branchSlug}
                onChange={(event) => setBranchSlug(event.target.value)}
              >
                {branches.map((branch) => (
                  <option key={branch.slug} value={branch.slug}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <DateInput
              label="Ngày nhận"
              value={pickupDate}
              onChange={handlePickupChange}
              minDate={todayString}
            />

            <DateInput
              label="Ngày trả"
              value={returnDate}
              onChange={handleReturnChange}
              minDate={pickupDate || todayString}
            />
          </div>

          <div className="detail-price-panel">
            <div className="price-row">
              <span>Giá thuê / ngày</span>
              <strong>{camera.pricePerDay.toLocaleString("vi-VN")}đ</strong>
            </div>
            <div className="price-row">
              <span>Phí đặt cọc</span>
              <strong>{camera.deposit.toLocaleString("vi-VN")}đ</strong>
            </div>
          </div>

          {message && <p className="status-message success">{message}</p>}

          {quoteError && <p className="status-message error">{quoteError}</p>}

          {isQuoteLoading && (
            <p className="status-message muted">Đang tính báo giá...</p>
          )}

          {quote && (
            <div className="quote-summary">
              <div className="price-row">
                <span>Thời gian thuê</span>
                <strong>{quote.days} ngày</strong>
              </div>
              <div className="price-row">
                <span>Tổng thuê</span>
                <strong>{quote.rentalAmount.toLocaleString("vi-VN")}đ</strong>
              </div>
              <div className="price-row">
                <span>Tổng đặt cọc</span>
                <strong>{quote.depositAmount.toLocaleString("vi-VN")}đ</strong>
              </div>
            </div>
          )}

          <button
            type="button"
            className="button primary-button"
            onClick={handleAddToSelection}
            disabled={!canRequestQuote}
          >
            Thêm vào danh sách chọn thuê
          </button>
        </div>
      </div>
    </div>
  );
}

export default CameraDetailPage;
