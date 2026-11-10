import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import cameras from "../../data/cameras";

const categoryOptions = ["Tất cả", "Máy ảnh Film", "Máy ảnh Digital"];

function CameraListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedBrand, setSelectedBrand] = useState("Tất cả");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const brands = useMemo(
    () => ["Tất cả", ...new Set(cameras.map((camera) => camera.brand))],
    [],
  );

  const filteredCameras = useMemo(() => {
    const min = Number(minPrice) || 0;
    const max = Number(maxPrice) || Number.MAX_SAFE_INTEGER;

    const result = cameras.filter((camera) => {
      const matchesSearch =
        camera.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        camera.brand.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === "Tất cả" || camera.category === selectedCategory;
      const matchesBrand =
        selectedBrand === "Tất cả" || camera.brand === selectedBrand;
      const matchesMinPrice = camera.price >= min;
      const matchesMaxPrice = camera.price <= max;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesMinPrice &&
        matchesMaxPrice
      );
    });

    if (sortBy === "low-to-high") {
      return [...result].sort((a, b) => a.price - b.price);
    }

    if (sortBy === "high-to-low") {
      return [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [searchTerm, selectedCategory, selectedBrand, minPrice, maxPrice, sortBy]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("Tất cả");
    setSelectedBrand("Tất cả");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("default");
  };

  return (
    <div className="collection-page">
      <div className="container collection-shell">
        <header className="collection-header">
          <div>
            <p className="eyebrow">BORROLL</p>
            <h1>Khám phá bộ sưu tập</h1>
          </div>
          <p className="collection-intro">
            Khám phá thiết bị máy ảnh film và digital với phong cách thuê linh
            hoạt, phù hợp cho từng dự án sáng tạo.
          </p>
          <div className="collection-summary">
            <span>{filteredCameras.length} sản phẩm mẫu</span>
          </div>
        </header>

        <section className="filters-panel">
          <div className="search-box">
            <label htmlFor="camera-search">Tìm máy ảnh</label>
            <input
              id="camera-search"
              type="text"
              value={searchTerm}
              placeholder="Tìm theo tên hoặc thương hiệu"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="filter-group inline-filters">
            <div>
              <label htmlFor="category-filter">Phân loại</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="brand-filter">Thương hiệu</label>
              <select
                id="brand-filter"
                value={selectedBrand}
                onChange={(event) => setSelectedBrand(event.target.value)}
              >
                {brands.map((brand) => (
                  <option key={brand} value={brand}>
                    {brand}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="min-price">Giá thấp nhất</label>
              <input
                id="min-price"
                type="number"
                min="0"
                value={minPrice}
                placeholder="0"
                onChange={(event) => setMinPrice(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="max-price">Giá cao nhất</label>
              <input
                id="max-price"
                type="number"
                min="0"
                value={maxPrice}
                placeholder="2000000"
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </div>
          </div>

          <div className="filter-footer">
            <div className="sort-box">
              <label htmlFor="sort-by">Sắp xếp</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
              >
                <option value="default">Mặc định</option>
                <option value="low-to-high">Giá thấp đến cao</option>
                <option value="high-to-low">Giá cao đến thấp</option>
              </select>
            </div>

            <button
              type="button"
              className="button secondary-button"
              onClick={resetFilters}
            >
              Đặt lại bộ lọc
            </button>
          </div>
        </section>

        {filteredCameras.length === 0 ? (
          <div className="empty-state">
            <h2>Không tìm thấy sản phẩm phù hợp</h2>
            <p>
              Hãy thử thay đổi từ khóa, danh mục hoặc mức giá để xem thêm mẫu
              máy ảnh khác.
            </p>
            <button
              type="button"
              className="button primary-button"
              onClick={resetFilters}
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <section className="camera-grid">
            {filteredCameras.map((camera) => (
              <article key={camera.id} className="camera-card collection-card">
                <div className="image-placeholder card-placeholder">
                  <span>{camera.category}</span>
                </div>

                <div className="camera-body">
                  <span className="camera-category">{camera.category}</span>
                  <h3>{camera.name}</h3>
                  <p className="camera-meta">
                    {camera.brand} · {camera.type}
                  </p>
                  <p className="camera-description">{camera.description}</p>

                  <div className="camera-footer">
                    <strong>
                      Giá thuê mẫu: {camera.price.toLocaleString("vi-VN")}đ/ngày
                    </strong>
                    <Link to={`/cameras/${camera.id}`}>Xem chi tiết</Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

export default CameraListPage;
