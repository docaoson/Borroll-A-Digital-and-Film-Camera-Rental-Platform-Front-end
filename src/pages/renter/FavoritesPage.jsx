import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { catalogService } from "../../services/catalogService";

function FavoritesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    catalogService
      .getFavorites()
      .then((res) => {
        if (!active) return;
        setItems(res.items || []);
        setError("");
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        setError("Không thể tải danh sách yêu thích lúc này.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleToggleFavorite = async (modelId, shouldFavorite) => {
    if (!modelId) return;
    await catalogService.toggleFavorite(modelId, shouldFavorite);
    setItems((current) =>
      shouldFavorite ? current : current.filter((item) => item.id !== modelId),
    );
  };

  if (loading) {
    return (
      <section className="page-placeholder">
        <p className="page-kicker">BORROLL</p>
        <h1>Yêu thích</h1>
        <p className="page-description">Đang tải thiết bị bạn đã lưu...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="page-placeholder">
        <p className="page-kicker">BORROLL</p>
        <h1>Yêu thích</h1>
        <p className="page-description">{error}</p>
      </section>
    );
  }

  return (
    <div className="container page-shell">
      <header className="section-heading">
        <p className="eyebrow">BORROLL</p>
        <h1>Thiết bị yêu thích</h1>
      </header>

      {items.length === 0 ? (
        <div className="empty-state">
          <h2>Chưa có thiết bị yêu thích</h2>
          <p>
            Hãy lưu lại các máy ảnh hoặc ống kính bạn quan tâm để quay lại đặt
            thuê dễ dàng hơn.
          </p>
          <Link to="/cameras" className="button primary-button">
            Khám phá bộ sưu tập
          </Link>
        </div>
      ) : (
        <section className="camera-grid">
          {items.map((camera) => (
            <article key={camera.id} className="camera-card collection-card">
              <div className="image-placeholder card-placeholder">
                <span>{camera.category?.name || "Thiết bị"}</span>
              </div>

              <div className="camera-body">
                <div className="camera-card-header">
                  <span className="camera-category">
                    {camera.category?.name || "Máy ảnh"}
                  </span>
                  <button
                    type="button"
                    className="favorite-toggle active"
                    onClick={() => handleToggleFavorite(camera.id, false)}
                    aria-label="Bỏ yêu thích"
                    title="Bỏ yêu thích"
                  >
                    ♥
                  </button>
                </div>

                <h3>{camera.name}</h3>
                <p className="camera-meta">
                  {camera.brand?.name} · {camera.cameraType}
                </p>
                <p className="camera-description">{camera.description}</p>

                <div className="camera-footer">
                  <strong>
                    Giá thuê mẫu: {camera.pricePerDay?.toLocaleString("vi-VN")}
                    đ/ngày
                  </strong>
                  <Link to={`/cameras/${camera.slug}`}>Xem chi tiết</Link>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default FavoritesPage;
