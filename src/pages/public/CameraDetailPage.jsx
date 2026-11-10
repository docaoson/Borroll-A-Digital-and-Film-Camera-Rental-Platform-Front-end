import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DateInput from "../../components/shared/DateInput";
import cameras from "../../data/cameras";
import NotFoundPage from "../error/NotFoundPage";

const STORAGE_KEY = "borroll_cart";
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseIsoUtcMs(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null;
  }
  const [year, month, day] = isoDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function CameraDetailPage() {
  const { id } = useParams();
  const camera = useMemo(() => cameras.find((item) => item.id === id), [id]);

  const today = new Date();
  const todayString = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .split("T")[0];

  const [pickupDate, setPickupDate] = useState(todayString);
  const [returnDate, setReturnDate] = useState("");
  const [pickupInvalid, setPickupInvalid] = useState(false);
  const [returnInvalid, setReturnInvalid] = useState(false);
  const [message, setMessage] = useState("");

  if (!camera) {
    return <NotFoundPage />;
  }

  const pickupMs = parseIsoUtcMs(pickupDate);
  const returnMs = parseIsoUtcMs(returnDate);
  const isRangeInvalid =
    pickupMs !== null && returnMs !== null && returnMs < pickupMs;

  const hasValidRange =
    pickupMs !== null && returnMs !== null && returnMs >= pickupMs;

  const rentalDays = hasValidRange
    ? Math.max(1, Math.round((returnMs - pickupMs) / MS_PER_DAY))
    : null;

  const estimatedTotal =
    rentalDays !== null ? camera.price * rentalDays : null;

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

  const handleAddToCart = () => {
    if (pickupInvalid || returnInvalid) {
      setMessage("Ngày nhận hoặc ngày trả không hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }

    if (!pickupDate || !returnDate) {
      setMessage("Vui lòng nhập đầy đủ ngày nhận và ngày trả máy.");
      return;
    }

    if (isRangeInvalid) {
      setMessage("Ngày trả máy không được trước ngày nhận máy.");
      return;
    }

    const cartItem = {
      cameraId: camera.id,
      cameraName: camera.name,
      dailyPrice: camera.price,
      startDate: pickupDate,
      endDate: returnDate,
      rentalDays,
      estimatedTotal,
    };

    try {
      const previousCart = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]",
      );
      const nextCart = [...previousCart, cartItem];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextCart));
      setMessage("Máy ảnh đã được thêm vào giỏ thuê thành công.");
    } catch {
      setMessage("Không thể lưu giỏ thuê. Vui lòng thử lại.");
    }
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
              <span>{camera.category}</span>
            </div>
          </div>

          <div className="detail-content">
            <p className="eyebrow">{camera.category}</p>
            <h1>{camera.name}</h1>
            <div className="detail-meta">
              <span>{camera.brand}</span>
              <span>{camera.type}</span>
            </div>

            <p className="detail-description">{camera.description}</p>

            <div className="detail-section">
              <h2>Thông tin kỹ thuật</h2>
              <ul className="info-list">
                <li>
                  <span>Thương hiệu</span>
                  <strong>{camera.brand}</strong>
                </li>
                <li>
                  <span>Loại máy</span>
                  <strong>{camera.type}</strong>
                </li>
                <li>
                  <span>Phân loại</span>
                  <strong>{camera.category}</strong>
                </li>
              </ul>
            </div>

            <div className="detail-section">
              <h2>Phụ kiện đi kèm</h2>
              <p>
                Pin, dây đeo, túi bảo vệ và hướng dẫn sử dụng cơ bản. Dành cho
                mục đích demo giao diện.
              </p>
            </div>
          </div>
        </div>

        <div className="booking-panel">
          <div className="booking-form">
            <h2>Chọn thời gian thuê</h2>

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
                    : rentalDays !== null
                      ? `${rentalDays} ngày`
                      : "Chưa chọn"}
                </strong>
              </div>
              <div>
                <span>Giá thuê dự kiến</span>
                <strong>
                  {estimatedTotal !== null
                    ? `${estimatedTotal.toLocaleString("vi-VN")}đ`
                    : "—"}
                </strong>
              </div>
            </div>

            <button
              type="button"
              className="button primary-button full-width"
              onClick={handleAddToCart}
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
                Ngày trả máy không được trước ngày nhận máy.
              </p>
            )}
            {message && <p className="cart-message">{message}</p>}

            {message.includes("thành công") && (
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
                Giá thuê là mô hình demo và không phải thông tin kinh doanh thực
                tế.
              </li>
              <li>
                Khách hàng cần chọn ngày nhận và ngày trả trước khi thêm thiết
                bị vào giỏ thuê.
              </li>
              <li>Thời gian thuê tối thiểu là một ngày.</li>
              <li>
                Quy trình đơn giản giúp khách hàng kiểm tra và về sau có thể
                nâng cấp sang tính năng đầy đủ.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CameraDetailPage;
