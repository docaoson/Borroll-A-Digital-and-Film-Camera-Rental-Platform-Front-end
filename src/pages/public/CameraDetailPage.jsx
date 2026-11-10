import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import cameras from "../../data/cameras";
import NotFoundPage from "../error/NotFoundPage";

const STORAGE_KEY = "borroll_cart";

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
  const [message, setMessage] = useState("");

  if (!camera) {
    return <NotFoundPage />;
  }

  const rentalDays =
    pickupDate && returnDate
      ? Math.max(
          1,
          Math.ceil(
            (new Date(returnDate) - new Date(pickupDate)) /
              (1000 * 60 * 60 * 24) || 1,
          ),
        )
      : 1;

  const estimatedTotal = camera.price * rentalDays;

  const handlePickupChange = (event) => {
    const nextPickupDate = event.target.value;
    setPickupDate(nextPickupDate);

    if (returnDate && new Date(returnDate) < new Date(nextPickupDate)) {
      setReturnDate(nextPickupDate);
    }
  };

  const handleAddToCart = () => {
    if (!pickupDate || !returnDate) {
      setMessage("Vui lòng chọn ngày nhận và ngày trả máy.");
      return;
    }

    if (new Date(returnDate) < new Date(pickupDate)) {
      setMessage("Ngày trả máy không được trước ngày nhận máy.");
      return;
    }

    const finalDays = Math.max(
      1,
      Math.ceil(
        (new Date(returnDate) - new Date(pickupDate)) / (1000 * 60 * 60 * 24),
      ) + 1,
    );

    const cartItem = {
      cameraId: camera.id,
      cameraName: camera.name,
      dailyPrice: camera.price,
      startDate: pickupDate,
      endDate: returnDate,
      rentalDays: finalDays,
      estimatedTotal: camera.price * finalDays,
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

            <div className="detail-price-box">
              <p>Giá thuê mẫu</p>
              <strong>{camera.price.toLocaleString("vi-VN")}đ/ngày</strong>
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
                <input
                  id="pickup-date"
                  type="date"
                  min={todayString}
                  value={pickupDate}
                  onChange={handlePickupChange}
                />
              </div>

              <div>
                <label htmlFor="return-date">Ngày trả</label>
                <input
                  id="return-date"
                  type="date"
                  min={pickupDate || todayString}
                  value={returnDate}
                  onChange={(event) => setReturnDate(event.target.value)}
                />
              </div>
            </div>

            <div className="summary-box">
              <div>
                <span>Thời gian thuê</span>
                <strong>{rentalDays} ngày</strong>
              </div>
              <div>
                <span>Giá thuê dự kiến</span>
                <strong>{estimatedTotal.toLocaleString("vi-VN")}đ</strong>
              </div>
            </div>

            <button
              type="button"
              className="button primary-button full-width"
              onClick={handleAddToCart}
            >
              Thêm vào giỏ thuê
            </button>

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
