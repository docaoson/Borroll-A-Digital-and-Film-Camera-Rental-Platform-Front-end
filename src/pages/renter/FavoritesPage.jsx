import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { catalogService } from "../../services/catalogService";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80";

function formatCurrency(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("vi-VN")} đ`;
}

function FavoritesPage() {
  const [fetchId, setFetchId] = useState(0);
  const [loadedFetchId, setLoadedFetchId] = useState(null);
  const loading = loadedFetchId !== fetchId;

  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [feedbackMsg, setFeedbackMsg] = useState("");

  useEffect(() => {
    let active = true;

    catalogService
      .getFavorites()
      .then((res) => {
        if (!active) return;
        const favItems = Array.isArray(res?.items) ? res.items : [];
        setItems(favItems);
        setError("");
        setLoadedFetchId(fetchId);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setError("Không thể tải danh sách thiết bị yêu thích lúc này.");
        setLoadedFetchId(fetchId);
      });

    return () => {
      active = false;
    };
  }, [fetchId]);

  const handleRemoveFavorite = async (modelId, modelName) => {
    if (!modelId) return;

    // Optimistically update list
    setItems((current) => current.filter((item) => item.id !== modelId));
    setFeedbackMsg(`Đã gỡ "${modelName || "thiết bị"}" khỏi danh sách yêu thích.`);

    try {
      await catalogService.toggleFavorite(modelId, false);
    } catch {
      // If error occurs, reload favorites
      setFetchId((v) => v + 1);
    }
  };

  return (
    <div className="favorites-page-shell">
      {/* Page Header */}
      <div className="favorites-header-row">
        <div>
          <p className="eyebrow">BỘ SƯU TẬP CỦA TÔI</p>
          <h1 className="favorites-title">Thiết bị yêu thích</h1>
          <p className="favorites-subheading">
            Lưu trữ và quản lý các mẫu máy ảnh, ống kính bạn quan tâm để sẵn sàng lên lịch thuê.
          </p>
        </div>
        <Link to="/cameras" className="button secondary-button small">
          + Khám phá thêm thiết bị
        </Link>
      </div>

      {feedbackMsg && (
        <div className="order-alert-banner success favorites-alert" role="status">
          <span>✓ {feedbackMsg}</span>
          <button
            type="button"
            className="order-alert-close"
            onClick={() => setFeedbackMsg("")}
            aria-label="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="favorites-loading-grid" aria-live="polite" aria-busy="true">
          {[1, 2, 3].map((n) => (
            <div key={n} className="fav-skeleton-card">
              <div className="skeleton-line fav-skeleton-img" />
              <div className="skeleton-line fav-skeleton-body" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="empty-state favorites-error-card">
          <span className="empty-state-icon" aria-hidden="true">⚠️</span>
          <h2>Không thể tải thiết bị yêu thích</h2>
          <p>{error}</p>
          <button
            type="button"
            className="button primary-button small"
            onClick={() => setFetchId((v) => v + 1)}
          >
            Thử lại
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state favorites-empty-card">
          <span className="empty-state-icon" aria-hidden="true">♥</span>
          <h2>Chưa có thiết bị yêu thích</h2>
          <p>
            Bạn chưa lưu thiết bị nào vào danh sách yêu thích. Hãy bấm vào biểu tượng trái tim
            trên bất kỳ máy ảnh hoặc ống kính nào bạn ưng ý để lưu lại tại đây!
          </p>
          <Link to="/cameras" className="button primary-button">
            Khám phá danh mục thiết bị
          </Link>
        </div>
      ) : (
        <>
          <div className="favorites-count-bar">
            <span>
              Đang lưu <strong>{items.length}</strong> thiết bị
            </span>
          </div>

          <div className="favorites-grid">
            {items.map((camera) => (
              <article key={camera.id} className="fav-card">
                <div className="fav-thumb-wrap">
                  <img
                    src={camera.thumbnailUrl || FALLBACK_IMAGE}
                    alt={camera.name}
                    className="fav-thumb-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                  <button
                    type="button"
                    className="fav-remove-btn"
                    onClick={() => handleRemoveFavorite(camera.id, camera.name)}
                    aria-label={`Bỏ yêu thích ${camera.name}`}
                    title="Bỏ yêu thích"
                  >
                    ♥
                  </button>
                  <span className="fav-kind-badge">
                    {camera.kind === "CAMERA"
                      ? camera.cameraType === "FILM"
                        ? "Máy ảnh Film"
                        : "Máy ảnh Số"
                      : "Ống kính"}
                  </span>
                </div>

                <div className="fav-body">
                  <div className="fav-meta-row">
                    <span className="fav-brand">{camera.brand?.name || "Borroll"}</span>
                    {camera.category?.name && (
                      <span className="fav-category">{camera.category.name}</span>
                    )}
                  </div>

                  <h3 className="fav-name">
                    <Link to={`/cameras/${camera.slug}`} className="fav-name-link">
                      {camera.name}
                    </Link>
                  </h3>

                  <div className="fav-pricing-row">
                    <div className="fav-price-col">
                      <span className="fav-price-label">Giá thuê:</span>
                      <strong className="fav-price-val">
                        {formatCurrency(camera.pricePerDay)}/ngày
                      </strong>
                    </div>
                    <div className="fav-deposit-col">
                      <span className="fav-deposit-label">Cọc:</span>
                      <span className="fav-deposit-val">
                        {formatCurrency(camera.deposit)}
                      </span>
                    </div>
                  </div>

                  <div className="fav-actions-row">
                    <Link
                      to={`/cameras/${camera.slug}`}
                      className="button primary-button small full-width"
                    >
                      Xem chi tiết & Đặt thuê →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default FavoritesPage;
