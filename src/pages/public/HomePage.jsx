import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import heroBackground from "../../assets/background-picture for homepage.jpg";
import { catalogService } from "../../services/catalogService";

const fallbackCategories = [
  { slug: "may-film", name: "Máy ảnh Film", label: "Film" },
  { slug: "may-digital", name: "Máy ảnh Digital", label: "Digital" },
  { slug: "may-instant", name: "Máy ảnh Instant", label: "Instant" },
  { slug: "ong-kinh", name: "Ống kính", label: "Lens" },
  { slug: "film-slr", name: "SLR 35mm", label: "SLR" },
  { slug: "film-compact", name: "Compact 35mm", label: "Compact" },
  { slug: "digital-mirrorless", name: "Mirrorless", label: "Mirrorless" },
];

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

function flattenCategories(tree = []) {
  const result = [];
  for (const node of tree) {
    result.push({
      id: node.id || node.slug,
      slug: node.slug,
      name: node.name,
      label: node.name.split(/\s+/)[0] || "Cam",
    });
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        result.push({
          id: child.id || child.slug,
          slug: child.slug,
          name: child.name,
          label: child.name.split(/\s+/)[0] || "Cam",
        });
      }
    }
  }
  return result;
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
  const [featuredModels, setFeaturedModels] = useState([]);
  const [recommendedModels, setRecommendedModels] = useState([]);
  const [categoryList, setCategoryList] = useState(fallbackCategories);

  useEffect(() => {
    let active = true;
    Promise.all([
      catalogService.getModels({ featured: true, pageSize: 4 }),
      catalogService.getModels({ sort: "newest", pageSize: 4 }),
      catalogService.getCategories(),
    ])
      .then(([featuredRes, newestRes, catRes]) => {
        if (!active) return;
        const featured = featuredRes?.items || [];
        const newest = newestRes?.items || [];
        setFeaturedModels(featured.length > 0 ? featured : newest);
        setRecommendedModels(newest);

        const flatCats = flattenCategories(catRes?.items || []);
        if (flatCats.length > 0) {
          setCategoryList(flatCats.slice(0, 7));
        }

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

          <div className="category-tiles-row">
            {categoryList.map((category) => (
              <Link
                to={`/cameras?category=${category.slug}`}
                className="category-tile"
                key={category.slug}
              >
                <div className="category-tile-icon">
                  <span>{category.label}</span>
                </div>
                <span className="category-tile-name">{category.name}</span>
              </Link>
            ))}
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
