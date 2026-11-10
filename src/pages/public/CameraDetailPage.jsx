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

  if (isNotFound) {
    return <NotFoundPage />;
  }

  if (isModelLoading || !camera) {
    return (
      <div className="camera-detail-page">
        <div className="container detail-shell">
          <div className="page-placeholder">
            <p className="eyebrow">BORROLL</p>
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
      setMessage("Ngày nhận hoặc ngày trả không hợp lệ. Vui lòng kiểm tra lại.");
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
            <p className="eyebrow">{camera.category?.name}</p>
            <h1>{camera.name}</h1>
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

        <div className="booking-panel">
          <div className="booking-form">
            <h2>Chọn thời gian thuê</h2>

            <div className="form-field branch-field">
              <label htmlFor="branch-select">Chi nhánh nhận và trả máy</label>
              <select
                id="branch-select"
                value={branchSlug}
                onChange={(event) => {
                  setBranchSlug(event.target.value);
                  setMessage("");
                }}
              >
                {branches.map((branch) => (
                  <option key={branch.slug} value={branch.slug}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="date-row">
              <div>
                <label htmlFor="pickup-date">Ngày nhận</label>
                <DateInput
                  id="pickup-date"
                  label="Ngày nhận"
                  min={todayString}
                  value={pickupDate}
                  onChange={handlePickupChange}
                />
              </div>

              <div>
                <label htmlFor="return-date">Ngày trả</label>
                <DateInput
                  id="return-date"
                  label="Ngày trả"
                  min={pickupDate || todayString}
                  value={returnDate}
                  onChange={handleReturnChange}
                />
              </div>
            </div>

            <div className="summary-box">
              <div>
                <span>Thời gian thuê</span>
                <strong>
                  {isRangeInvalid
                    ? "Không hợp lệ"
                    : isQuoteLoading
                      ? "Đang tính..."
                      : quote
                        ? `${quote.days} ngày`
                        : "Chưa chọn"}
                </strong>
              </div>
              <div>
                <span>Tiền thuê (từ báo giá)</span>
                <strong>
                  {isQuoteLoading
                    ? "Đang tính..."
                    : quote
                      ? `${quote.rentalAmount.toLocaleString("vi-VN")} đ`
                      : "—"}
                </strong>
              </div>
              <div>
                <span>Tiền cọc (hoàn lại khi trả)</span>
                <strong>
                  {isQuoteLoading
                    ? "Đang tính..."
                    : quote
                      ? `${quote.depositAmount.toLocaleString("vi-VN")} đ`
                      : "—"}
                </strong>
              </div>
              <div>
                <span>Tổng thanh toán tại cửa hàng</span>
                <strong>
                  {isQuoteLoading
                    ? "Đang tính..."
                    : quote
                      ? `${quote.totalDueAtPickup.toLocaleString("vi-VN")} đ`
                      : "—"}
                </strong>
              </div>
            </div>

            {quote && quote.available === false && (
              <div className="form-alert error" role="alert">
                Hết máy trong khoảng ngày này tại chi nhánh đã chọn.
              </div>
            )}

            {quoteError && (
              <div className="form-alert error" role="alert">
                {quoteError}
              </div>
            )}

            <button
              type="button"
              className="button primary-button full-width"
              onClick={handleAddToSelection}
            >
              Thêm vào giỏ thuê
            </button>

            {(pickupInvalid || returnInvalid) && !message && (
              <p className="cart-message field-error">
                Ngày nhập chưa đúng lịch (ví dụ: 01–31 theo tháng).
              </p>
            )}
            {isRangeInvalid && !message && (
              <p className="cart-message field-error">
                Ngày trả máy phải sau ngày nhận máy ít nhất 1 ngày.
              </p>
            )}
            {message && <p className="cart-message">{message}</p>}

            {message.includes("Đã thêm") && (
              <Link
                to="/cart"
                className="button secondary-button full-width cart-link"
              >
                Đi đến giỏ thuê
              </Link>
            )}
          </div>

          <div className="booking-notes">
            <h3>Lưu ý thuê máy</h3>
            <ul>
              <li>
                Nhận và trả máy tại cùng một chi nhánh đã chọn. Cửa hàng không
                giao hàng tận nơi.
              </li>
              <li>
                Bạn thanh toán trực tiếp tại cửa hàng khi nhận máy. Tiền cọc sẽ
                được hoàn lại khi trả máy nếu thiết bị không hư hỏng.
              </li>
              <li>
                Thời gian thuê tính theo công thức ngày trả trừ ngày nhận (tối
                thiểu 1 ngày).
              </li>
              <li>
                Báo giá chi tiết được tính qua <code>POST /bookings/quote</code>
                .
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraDetailPage;
