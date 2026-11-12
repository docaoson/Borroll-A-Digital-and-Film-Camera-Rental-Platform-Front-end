import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { catalogService } from "../../services/catalogService";

const sanitizeNumericInput = (value) => value.replace(/[^0-9]/g, "");

const PAGE_SIZE = 9;

function formatCameraType(type) {
  switch (type) {
    case "FILM":
      return "Máy ảnh Film";
    case "DIGITAL":
      return "Máy ảnh Digital";
    case "INSTANT":
      return "Máy chụp lấy liền";
    default:
      return type || "Thiết bị";
  }
}

function FavoriteToggle({ modelId, isFavorite, onToggle }) {
  const [pending, setPending] = useState(false);

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (pending || !modelId) return;
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
      className={`favorite-toggle ${isFavorite ? "active" : ""}`}
      onClick={handleClick}
      aria-label={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      disabled={pending}
      title={isFavorite ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
    >
      {pending ? "…" : isFavorite ? "♥" : "♡"}
    </button>
  );
}

function CameraCardSkeleton() {
  return (
    <div className="camera-card camera-card-skeleton" aria-hidden="true">
      <div className="skeleton-image" />
      <div className="camera-body">
        <div className="skeleton-line skeleton-meta" />
        <div className="skeleton-line skeleton-title" />
        <div className="skeleton-line skeleton-desc" />
        <div className="skeleton-line skeleton-footer" />
      </div>
    </div>
  );
}

function CameraListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL query parameters
  const initialQ = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialMinPrice = searchParams.get("minPrice") || "";
  const initialMaxPrice = searchParams.get("maxPrice") || "";
  const initialSort = searchParams.get("sort") || "default";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [searchInput, setSearchInput] = useState(initialQ);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sortBy, setSortBy] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(
    Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1,
  );

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  const queryKey = `${debouncedSearch}|${selectedCategory}|${selectedBrand}|${minPrice}|${maxPrice}|${sortBy}|${currentPage}|${reloadKey}`;

  const [resultState, setResultState] = useState({
    key: null,
    items: [],
    total: 0,
    error: "",
  });

  const isLoading = resultState.key !== queryKey;
  const modelsResult = {
    items: resultState.items,
    total: resultState.total,
  };
  const loadError = resultState.error;

  // Debounce search input (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load categories and brands on mount
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

  // Synchronize state changes to URL search params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sortBy && sortBy !== "default") params.set("sort", sortBy);
    if (currentPage > 1) params.set("page", String(currentPage));

    setSearchParams(params, { replace: true });
  }, [
    debouncedSearch,
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    sortBy,
    currentPage,
    setSearchParams,
  ]);

  // Fetch models with filters and pagination
  useEffect(() => {
    let active = true;

    catalogService
      .getModels({
        q: debouncedSearch,
        category: selectedCategory,
        brand: selectedBrand,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sort: sortBy,
        page: currentPage,
        pageSize: PAGE_SIZE,
      })
      .then((res) => {
        if (!active) return;
        setResultState({
          key: queryKey,
          items: (res.items || []).map((item) => ({
            ...item,
            isFavorite: Boolean(item.isFavorite),
          })),
          total: res.total ?? (res.items?.length || 0),
          error: "",
        });
      })
      .catch(() => {
        if (!active) return;
        setResultState({
          key: queryKey,
          items: [],
          total: 0,
          error: "Không thể tải danh sách thiết bị. Vui lòng thử lại.",
        });
      });

    return () => {
      active = false;
    };
  }, [
    debouncedSearch,
    selectedCategory,
    selectedBrand,
    minPrice,
    maxPrice,
    sortBy,
    currentPage,
    reloadKey,
    queryKey,
  ]);

  const handleToggleFavorite = async (modelId, shouldFavorite) => {
    if (!modelId) return;
    try {
      await catalogService.toggleFavorite(modelId, shouldFavorite);
      setResultState((current) => ({
        ...current,
        items: current.items.map((camera) =>
          camera.id === modelId
            ? { ...camera, isFavorite: shouldFavorite }
            : camera,
        ),
      }));
    } catch {
      // Toggle favorite error handled silently or rollback
    }
  };

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setSearchInput("");
    setDebouncedSearch("");
    setSelectedCategory("");
    setSelectedBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("default");
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(modelsResult.total / PAGE_SIZE));

  const categoryNameMap = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => map.set(cat.slug, cat.name));
    return map;
  }, [categories]);

  const brandNameMap = useMemo(() => {
    const map = new Map();
    brands.forEach((brand) => map.set(brand.slug, brand.name));
    return map;
  }, [brands]);

  const hasActiveFilters = Boolean(
    debouncedSearch ||
      selectedCategory ||
      selectedBrand ||
      minPrice ||
      maxPrice ||
      (sortBy && sortBy !== "default"),
  );

  return (
    <div className="collection-page">
      <div className="container collection-shell">
        <header className="collection-header">
          <div>
            <p className="eyebrow">BORROLL</p>
            <h1>Khám phá bộ sưu tập máy ảnh</h1>
          </div>
          <p className="collection-intro">
            Trải nghiệm các dòng máy ảnh Digital và Film cổ điển cùng hệ thống phụ kiện chất lượng cao. Thuê máy dễ dàng, thủ tục minh bạch, sẵn sàng cho mọi hành trình sáng tạo.
          </p>
          <div className="collection-summary">
            <span>
              {isLoading
                ? "Đang tải dữ liệu..."
                : `Tìm thấy ${modelsResult.total} mẫu thiết bị`}
            </span>
          </div>
        </header>

        {/* SEARCH & FILTERS PANEL */}
        <section className="filters-panel" aria-label="Bộ lọc thiết bị">
          <div className="search-box">
            <label htmlFor="camera-search">Tìm kiếm máy ảnh</label>
            <div className="search-input-wrapper">
              <input
                id="camera-search"
                type="text"
                value={searchInput}
                placeholder="Tìm theo tên máy, model hoặc thương hiệu..."
                onChange={(event) => {
                  setSearchInput(event.target.value);
                  setCurrentPage(1);
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => {
                    setSearchInput("");
                    setCurrentPage(1);
                  }}
                  aria-label="Xóa từ khóa tìm kiếm"
                  title="Xóa tìm kiếm"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="filter-group inline-filters">
            <div>
              <label htmlFor="category-filter">Phân loại</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={handleFilterChange(setSelectedCategory)}
              >
                <option value="">Tất cả phân loại</option>
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
                onChange={handleFilterChange(setSelectedBrand)}
              >
                <option value="">Tất cả thương hiệu</option>
                {brands.map((brand) => (
                  <option key={brand.slug} value={brand.slug}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="min-price">Giá thấp nhất (₫/ngày)</label>
              <input
                id="min-price"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={minPrice}
                placeholder="0"
                onChange={(event) => {
                  setMinPrice(sanitizeNumericInput(event.target.value));
                  setCurrentPage(1);
                }}
              />
            </div>

            <div>
              <label htmlFor="max-price">Giá cao nhất (₫/ngày)</label>
              <input
                id="max-price"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={maxPrice}
                placeholder="2.000.000"
                onChange={(event) => {
                  setMaxPrice(sanitizeNumericInput(event.target.value));
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          <div className="filter-footer">
            <div className="sort-box">
              <label htmlFor="sort-by">Sắp xếp theo</label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={handleFilterChange(setSortBy)}
              >
                <option value="default">Mặc định</option>
                <option value="price_asc">Giá thuê: Thấp đến cao</option>
                <option value="price_desc">Giá thuê: Cao đến thấp</option>
                <option value="newest">Thiết bị mới nhất</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="button secondary-button reset-filter-btn"
                onClick={resetAllFilters}
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>

          {/* ACTIVE FILTER CHIPS */}
          {hasActiveFilters && (
            <div className="active-filters-chips" aria-label="Bộ lọc đang áp dụng">
              <span className="chips-label">Đang lọc theo:</span>
              {debouncedSearch && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => {
                    setSearchInput("");
                    setCurrentPage(1);
                  }}
                >
                  Từ khóa: <strong>{debouncedSearch}</strong> <span aria-hidden="true">×</span>
                </button>
              )}
              {selectedCategory && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => {
                    setSelectedCategory("");
                    setCurrentPage(1);
                  }}
                >
                  Phân loại: <strong>{categoryNameMap.get(selectedCategory) || selectedCategory}</strong> <span aria-hidden="true">×</span>
                </button>
              )}
              {selectedBrand && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => {
                    setSelectedBrand("");
                    setCurrentPage(1);
                  }}
                >
                  Thương hiệu: <strong>{brandNameMap.get(selectedBrand) || selectedBrand}</strong> <span aria-hidden="true">×</span>
                </button>
              )}
              {(minPrice || maxPrice) && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    setCurrentPage(1);
                  }}
                >
                  Giá: <strong>{minPrice ? `${Number(minPrice).toLocaleString("vi-VN")}₫` : "0₫"} – {maxPrice ? `${Number(maxPrice).toLocaleString("vi-VN")}₫` : "∞"}</strong> <span aria-hidden="true">×</span>
                </button>
              )}
              {sortBy !== "default" && (
                <button
                  type="button"
                  className="filter-chip"
                  onClick={() => {
                    setSortBy("default");
                    setCurrentPage(1);
                  }}
                >
                  Sắp xếp: <strong>{sortBy === "price_asc" ? "Giá tăng dần" : sortBy === "price_desc" ? "Giá giảm dần" : "Mới nhất"}</strong> <span aria-hidden="true">×</span>
                </button>
              )}
              <button
                type="button"
                className="clear-all-chips-btn"
                onClick={resetAllFilters}
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </section>

        {/* ERROR STATE */}
        {loadError && (
          <div className="form-alert error catalog-error-box" role="alert">
            <p>{loadError}</p>
            <button
              type="button"
              className="button primary-button small-button"
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Thử lại
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading ? (
          <section className="camera-grid" aria-label="Đang tải thiết bị">
            {Array.from({ length: 6 }).map((_, idx) => (
              <CameraCardSkeleton key={idx} />
            ))}
          </section>
        ) : modelsResult.items.length === 0 ? (
          /* EMPTY STATE */
          <div className="empty-state">
            <div className="empty-state-icon" aria-hidden="true">📷</div>
            <h2>Không tìm thấy thiết bị phù hợp</h2>
            <p>
              Hãy thử thay đổi từ khóa, điều chỉnh khoảng giá hoặc bỏ bớt các bộ lọc để khám phá các dòng máy ảnh khác.
            </p>
            <button
              type="button"
              className="button primary-button"
              onClick={resetAllFilters}
            >
              Xóa tất cả bộ lọc
            </button>
          </div>
        ) : (
          /* PRODUCT GRID */
          <>
            <div className="catalog-meta-bar">
              <span className="results-count">
                Hiển thị{" "}
                <strong>
                  {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, modelsResult.total)}
                </strong>{" "}
                trong số <strong>{modelsResult.total}</strong> thiết bị
              </span>
            </div>

            <section className="camera-grid" aria-label="Danh sách thiết bị máy ảnh">
              {modelsResult.items.map((camera) => {
                const hasBranches =
                  Array.isArray(camera.availableAtBranches) &&
                  camera.availableAtBranches.length > 0;

                return (
                  <article key={camera.id} className="camera-card collection-card">
                    {/* CARD MEDIA / THUMBNAIL */}
                    <div className="camera-card-media">
                      {camera.thumbnailUrl ? (
                        <img
                          src={camera.thumbnailUrl}
                          alt={camera.name}
                          className="camera-card-image"
                          loading="lazy"
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
                        className={`camera-image-fallback ${
                          camera.thumbnailUrl ? "hidden" : ""
                        }`}
                      >
                        <span className="fallback-camera-icon" aria-hidden="true">📷</span>
                        <span className="fallback-brand">
                          {camera.brand?.name || "BORROLL"}
                        </span>
                      </div>

                      {camera.category?.name && (
                        <span className="camera-category-badge">
                          {camera.category.name}
                        </span>
                      )}

                      <div className="card-favorite-wrapper">
                        <FavoriteToggle
                          modelId={camera.id}
                          isFavorite={Boolean(camera.isFavorite)}
                          onToggle={handleToggleFavorite}
                        />
                      </div>
                    </div>

                    {/* CARD BODY */}
                    <div className="camera-body">
                      <div className="camera-card-header">
                        <div className="camera-meta-tags">
                          <span className="camera-brand-tag">
                            {camera.brand?.name || "Máy ảnh"}
                          </span>
                          <span className="meta-separator">·</span>
                          <span className="camera-type-tag">
                            {formatCameraType(camera.cameraType)}
                          </span>
                        </div>
                      </div>

                      <h3 className="camera-card-title">
                        <Link to={`/cameras/${camera.slug}`}>{camera.name}</Link>
                      </h3>

                      <p className="camera-description">
                        {camera.description ||
                          "Thiết bị chất lượng cao, bảo dưỡng chuyên nghiệp sẵn sàng cho dự án sáng tạo của bạn."}
                      </p>

                      <div className="camera-availability-row">
                        {hasBranches ? (
                          <span className="status-badge success">
                            ● Sẵn sàng thuê ({camera.availableAtBranches.length} chi nhánh)
                          </span>
                        ) : (
                          <span className="status-badge neutral">
                            ○ Đang cập nhật kho
                          </span>
                        )}
                      </div>

                      <div className="camera-footer">
                        <div className="camera-price-block">
                          <span className="price-label">Giá thuê theo ngày</span>
                          <strong className="camera-price">
                            {camera.pricePerDay.toLocaleString("vi-VN")} ₫
                            <small>/ngày</small>
                          </strong>
                          {camera.deposit ? (
                            <span className="camera-deposit-hint">
                              Cọc: {camera.deposit.toLocaleString("vi-VN")} ₫
                            </span>
                          ) : null}
                        </div>

                        <Link
                          to={`/cameras/${camera.slug}`}
                          className="button primary-button small-button view-detail-btn"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <nav className="pagination-nav" aria-label="Phân trang danh mục">
                <button
                  type="button"
                  className="pagination-btn prev-btn"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 300, behavior: "smooth" });
                  }}
                  aria-label="Trang trước"
                >
                  ← Trước
                </button>

                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        className={`pagination-num-btn ${
                          pageNum === currentPage ? "active" : ""
                        }`}
                        onClick={() => {
                          setCurrentPage(pageNum);
                          window.scrollTo({ top: 300, behavior: "smooth" });
                        }}
                        aria-label={`Trang ${pageNum}`}
                        aria-current={pageNum === currentPage ? "page" : undefined}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  className="pagination-btn next-btn"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 300, behavior: "smooth" });
                  }}
                  aria-label="Trang tiếp theo"
                >
                  Sau →
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default CameraListPage;
