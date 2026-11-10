import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { catalogService } from "../../services/catalogService";

const sanitizeNumericInput = (value) => value.replace(/[^0-9]/g, "");

function CameraListPage() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(
    () => searchParams.get("category") || "",
  );
  const [selectedBrand, setSelectedBrand] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("default");

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [modelsResult, setModelsResult] = useState({ items: [], total: 0 });

  useEffect(() => {
    let active = true;
    Promise.all([catalogService.getCategories(), catalogService.getBrands()])
      .then(([catRes, brandRes]) => {
        if (!active) return;
        setCategories(catRes.items || []);
        setBrands(brandRes.items || []);
      })
      .catch(() => {
        if (!active) return;
        setCategories([]);
        setBrands([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    catalogService
      .getModels({
        q: searchTerm.trim(),
        category: selectedCategory,
        brand: selectedBrand,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sort: sortBy,
      })
      .then((res) => {
        if (active) {
          setModelsResult({
            items: res.items || [],
            total: res.total ?? (res.items?.length || 0),
          });
        }
      })
      .catch(() => {
        if (active) setModelsResult({ items: [], total: 0 });
      });

    return () => {
      active = false;
    };
  }, [searchTerm, selectedCategory, selectedBrand, minPrice, maxPrice, sortBy]);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedBrand("");
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
            <span>{modelsResult.total} mẫu thiết bị</span>
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
                <option value="">Tất cả</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>
                    {cat.name}
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
                <option value="">Tất cả</option>
                {brands.map((brand) => (
                  <option key={brand.slug} value={brand.slug}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="min-price">Giá thấp nhất</label>
              <input
                id="min-price"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={minPrice}
                placeholder="0"
                onChange={(event) =>
                  setMinPrice(sanitizeNumericInput(event.target.value))
                }
              />
            </div>

            <div>
              <label htmlFor="max-price">Giá cao nhất</label>
              <input
                id="max-price"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={maxPrice}
                placeholder="2000000"
                onChange={(event) =>
                  setMaxPrice(sanitizeNumericInput(event.target.value))
                }
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
                <option value="price_asc">Giá thấp đến cao</option>
                <option value="price_desc">Giá cao đến thấp</option>
                <option value="newest">Mới nhất</option>
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

        {modelsResult.items.length === 0 ? (
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
            {modelsResult.items.map((camera) => (
              <article key={camera.id} className="camera-card collection-card">
                <div className="image-placeholder card-placeholder">
                  <span>{camera.category?.name}</span>
                </div>

                <div className="camera-body">
                  <span className="camera-category">
                    {camera.category?.name}
                  </span>
                  <h3>{camera.name}</h3>
                  <p className="camera-meta">
                    {camera.brand?.name} · {camera.cameraType}
                  </p>
                  <p className="camera-description">{camera.description}</p>

                  <div className="camera-footer">
                    <strong>
                      Giá thuê mẫu: {camera.pricePerDay.toLocaleString("vi-VN")}
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
    </div>
  );
}

export default CameraListPage;
