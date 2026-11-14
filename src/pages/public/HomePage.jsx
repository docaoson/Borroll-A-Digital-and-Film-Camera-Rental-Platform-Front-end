import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import heroBackground from "../../assets/background-picture for homepage.jpg";
import { catalogService } from "../../services/catalogService";

const highlights = [
  {
    badge: "01",
    title: "Thân thiện khách hàng",
    description: "Tư vấn nhẹ nhàng, quy trình đặt thuê rõ ràng",
  },
  {
    badge: "02",
    title: "Máy ảnh chất lượng",
    description: "Kiểm tra và vệ sinh cẩn thận trước khi giao",
  },
  {
    badge: "03",
    title: "Thuê máy 3 bước",
    description: "Chọn máy, chọn ngày và nhận tại chi nhánh",
  },
  {
    badge: "04",
    title: "Chi phí hợp lý",
    description: "Giá thuê minh bạch, phù hợp sinh viên",
  },
];

function CameraGroupIcon({ film }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {film ? (
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 4v16m10-16v16M3 9h4m-4 6h4m10-6h4m-4 6h4" />
        </>
      ) : (
        <>
          <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
          <circle cx="12" cy="13" r="3.5" />
        </>
      )}
    </svg>
  );
}

function ProductCard({ camera, onSelect }) {
  return (
    <article
      className="camera-card clickable-card"
      onMouseEnter={() => catalogService.prefetchModelBySlug(camera.slug)}
      onFocus={() => catalogService.prefetchModelBySlug(camera.slug)}
      onClick={() => onSelect(camera.slug)}
    >
      <div className="camera-card-media">
        {camera.thumbnailUrl ? (
          <img
            src={camera.thumbnailUrl}
            alt={camera.name}
            className="camera-card-image"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget.parentElement?.querySelector(
                ".camera-image-fallback",
              );
              if (fallback) fallback.classList.remove("hidden");
            }}
          />
        ) : null}
        <div
          className={`camera-image-fallback ${camera.thumbnailUrl ? "hidden" : ""}`}
        >
          <span className="fallback-category">
            {camera.category?.name || "Máy ảnh"}
          </span>
        </div>
      </div>
      <div className="camera-body">
        <span className="camera-category">
          {camera.category?.name ||
            (camera.cameraType === "FILM" ? "Máy ảnh Film" : "Digital")}
        </span>
        {camera.filmFormat && <span className="camera-category">{camera.filmFormat}</span>}
        {camera.sensorSize && <span className="camera-category">{camera.sensorSize}</span>}
        <h3>{camera.name}</h3>
        <p className="camera-meta">{camera.brand?.name}</p>
        <div className="camera-footer">
          <strong>
            {camera.pricePerDay
              ? `${camera.pricePerDay.toLocaleString("vi-VN")} đ/ngày`
              : "Liên hệ"}
          </strong>
        </div>
      </div>
    </article>
  );
}

function HomePage() {
  const navigate = useNavigate();
  const [featuredModels, setFeaturedModels] = useState(() => {
    const cachedFeatured =
      catalogService.peekModels({ featured: true, pageSize: 4 })?.items || [];
    if (cachedFeatured.length > 0) return cachedFeatured;
    return (
      catalogService.peekModels({ sort: "newest", pageSize: 4 })?.items || []
    );
  });
  const [recommendedModels, setRecommendedModels] = useState(
    () =>
      catalogService.peekModels({ sort: "newest", pageSize: 4 })?.items || [],
  );

  useEffect(() => {
    let active = true;
    Promise.all([
      catalogService.getModels({ featured: true, pageSize: 4 }),
      catalogService.getModels({ sort: "newest", pageSize: 4 }),
    ])
      .then(([featuredRes, newestRes]) => {
        if (!active) return;
        const featured = featuredRes?.items || [];
        const newest = newestRes?.items || [];
        setFeaturedModels(featured.length > 0 ? featured : newest);
        setRecommendedModels(newest);

        // Prefetch trang Thiết bị ở chế độ nền sau khi trang chủ tải xong
        catalogService.prefetchCatalogList();
      })
      .catch(() => {
        if (!active) return;
        setFeaturedModels([]);
        setRecommendedModels([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleOpenCamera = (slug) => {
    navigate(`/cameras/${slug}`);
  };

  return (
    <div className="home-page">
      {/* PHẦN TRÊN (Cấu trúc theo ảnh 3: Hero Banner -> 4 điểm nổi bật -> Lựa chọn nổi bật) */}
      <section className="home-top-section">
        <div className="container">
          <div
            className="home-hero-banner"
            style={{ "--home-hero-bg": `url("${heroBackground}")` }}
          >
            <div className="hero-copy">
              <p className="eyebrow">BORROLL</p>
              <h1>Mỗi khoảnh khắc, một góc nhìn riêng.</h1>
              <p className="hero-text">
                Thuê máy ảnh phim và kỹ thuật số dễ dàng, linh hoạt và đáng tin
                cậy ngay từ cửa hàng BORROLL.
              </p>

              <div className="hero-actions">
                <Link to="/cameras" className="button primary-button">
                  Khám phá máy ảnh
                </Link>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true" />
          </div>

          <div className="home-highlights-strip">
            {highlights.map((item) => (
              <div className="highlight-strip-item" key={item.badge}>
                <span className="highlight-strip-badge">{item.badge}</span>
                <div className="highlight-strip-text">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LỰA CHỌN NỔI BẬT */}
      <section className="home-section">
        <div className="container">
          <div className="section-header-inline">
            <h2>Lựa chọn nổi bật</h2>
            <Link to="/cameras" className="section-view-all">
              Xem tất cả →
            </Link>
          </div>

          {featuredModels.length === 0 ? (
            <div className="empty-state">
              <p>Hiện chưa có mẫu thiết bị nổi bật nào được hiển thị.</p>
            </div>
          ) : (
            <div className="featured-grid">
              {featuredModels.map((camera) => (
                <ProductCard
                  key={camera.id}
                  camera={camera}
                  onSelect={handleOpenCamera}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PHẦN DƯỚI (Cấu trúc theo ảnh 1: Danh mục -> Banner ngang -> Thiết bị đề xuất) */}
      <section className="home-section">
        <div className="container">
          <div className="section-header-inline">
            <h2>Danh mục</h2>
          </div>

          <div className="camera-group-grid">
            <Link to="/cameras?cameraType=FILM" className="camera-group-card">
              <span className="camera-group-icon"><CameraGroupIcon film /></span>
              <span className="camera-group-copy">
                <strong>Máy ảnh Film</strong>
                <span>SLR · Compact · Rangefinder · 120 · Instant</span>
              </span>
              <span className="camera-group-arrow" aria-hidden="true">→</span>
            </Link>
            <Link to="/cameras?cameraType=DIGITAL" className="camera-group-card">
              <span className="camera-group-icon"><CameraGroupIcon /></span>
              <span className="camera-group-copy">
                <strong>Máy ảnh Digital</strong>
                <span>Mirrorless · DSLR · Compact · Bridge · Medium Format</span>
              </span>
              <span className="camera-group-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="home-promo-banner">
            <div className="promo-banner-copy">
              <p className="eyebrow">Về BORROLL</p>
              <h2>Thỏa sức sáng tạo bằng một trải nghiệm thuê máy linh hoạt.</h2>
              <p>
                BORROLL được khởi xướng bởi nhóm sinh viên yêu nhiếp ảnh, xây
                dựng mô hình cửa hàng sở hữu và quản lý thiết bị trực tiếp để
                khách hàng dễ tiếp cận, kiểm tra và trải nghiệm máy rõ ràng.
              </p>
              <Link to="/cameras" className="button primary-button">
                Khám phá bộ sưu tập
              </Link>
            </div>

            <div
              className="promo-banner-visual"
              style={{ backgroundImage: `url("${heroBackground}")` }}
              aria-label="Không gian máy ảnh BORROLL"
            />
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="container">
          <div className="section-header-inline">
            <h2>Thiết bị đề xuất</h2>
            <Link to="/cameras" className="section-view-all">
              Xem tất cả →
            </Link>
          </div>

          {recommendedModels.length === 0 ? (
            <div className="empty-state">
              <p>Hiện chưa có thiết bị nào được hiển thị.</p>
            </div>
          ) : (
            <div className="featured-grid">
              {recommendedModels.map((camera) => (
                <ProductCard
                  key={camera.id}
                  camera={camera}
                  onSelect={handleOpenCamera}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
