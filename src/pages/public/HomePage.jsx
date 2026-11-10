import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroBackground from "../../assets/background-picture for homepage.jpg";
import { catalogService } from "../../services/catalogService";

const categories = [
  {
    slug: "may-film",
    title: "Máy ảnh Film",
    description:
      "Khám phá chất ảnh cổ điển, cảm giác tương tác và phong cách sáng tạo riêng cho dự án của bạn.",
    label: "Film",
  },
  {
    slug: "may-digital",
    title: "Máy ảnh Digital",
    description:
      "Dành cho quay video, chụp dự án và trải nghiệm hình ảnh rõ nét, linh hoạt trong nhiều tình huống.",
    label: "Digital",
  },
];

const steps = [
  "Chọn chiếc máy phù hợp",
  "Lựa chọn thời gian thuê",
  "Nhận máy và bắt đầu trải nghiệm",
];

function HomePage() {
  const [featuredModels, setFeaturedModels] = useState([]);

  useEffect(() => {
    let active = true;
    catalogService
      .getModels({ featured: true, pageSize: 4 })
      .then((res) => {
        if (active) setFeaturedModels(res.items || []);
      })
      .catch(() => {
        if (active) setFeaturedModels([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="home-page">
      <section
        className="home-hero section-shell"
        style={{ "--home-hero-bg": `url("${heroBackground}")` }}
      >
        <div className="container home-hero-inner">
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
              <Link to="/#how-it-works" className="button secondary-button">
                Cách thức thuê
              </Link>
            </div>

            <div className="hero-meta">
              <div>
                <strong>100+</strong>
                <span>mẫu thiết bị</span>
              </div>
              <div>
                <strong>3 bước</strong>
                <span>thuê dễ dàng</span>
              </div>
              <div>
                <strong>Hà Nội</strong>
                <span>ưu tiên trải nghiệm</span>
              </div>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true" />
        </div>
      </section>

      <section className="section-shell">
        <div className="container">
          <div className="section-heading center-heading">
            <p className="eyebrow">Khám phá</p>
            <h2>Khám phá thế giới máy ảnh</h2>
          </div>

          <div className="category-grid">
            {categories.map((category) => (
              <Link
                to={`/cameras?category=${category.slug}`}
                className="category-card"
                key={category.slug}
              >
                <div className="image-placeholder category-placeholder">
                  <span>{category.label}</span>
                </div>
                <div className="card-body">
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell featured-shell">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">Lựa chọn</p>
            <h2>Lựa chọn nổi bật</h2>
          </div>

          <div className="featured-grid">
            {featuredModels.map((camera) => (
              <article className="camera-card" key={camera.id}>
                <div className="image-placeholder card-placeholder">
                  <span>{camera.category?.name}</span>
                </div>
                <div className="camera-body">
                  <span className="sample-tag">
                    {camera.cameraType === "FILM" ? "Máy ảnh Film" : "Digital"}
                  </span>
                  <h3>{camera.name}</h3>
                  <p>{camera.brand?.name}</p>
                  <div className="camera-footer">
                    <strong>
                      {camera.pricePerDay.toLocaleString("vi-VN")} đ/ngày
                    </strong>
                    <Link to={`/cameras/${camera.slug}`}>Xem chi tiết</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="section-shell process-shell">
        <div className="container">
          <div className="section-heading center-heading">
            <p className="eyebrow">Quy trình</p>
            <h2>Thuê máy thật dễ dàng</h2>
          </div>

          <div className="process-grid">
            {steps.map((step, index) => (
              <div className="process-card" key={step}>
                <span className="process-number">0{index + 1}</span>
                <h3>{step}</h3>
                <p>
                  {index === 0 &&
                    "Khách hàng xem bộ sưu tập, so sánh phong cách và chọn máy phù hợp với mục tiêu ghi hình."}
                  {index === 1 &&
                    "Lựa chọn khoảng thời gian thuê phù hợp với lịch trình và dự án của bạn."}
                  {index === 2 &&
                    "Nhận máy tại chi nhánh và bắt đầu trải nghiệm tạo hình riêng."}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell brand-shell">
        <div className="container brand-intro">
          <div className="brand-copy">
            <p className="eyebrow">Về BORROLL</p>
            <h2>Thỏa sức sáng tạo bằng một trải nghiệm thuê máy linh hoạt.</h2>
            <p>
              BORROLL mang đến không gian tìm kiếm, thử nghiệm và thuê máy ảnh
              cho người yêu nhiếp ảnh, người sáng tạo nội dung và các dự án cá
              nhân. Mỗi thiết bị được lựa chọn để hỗ trợ cảm hứng, hiệu suất và
              sự thoải mái khi bắt đầu một hành trình sáng tạo mới.
            </p>
          </div>

          <div className="brand-visual">
            <div className="image-placeholder square-placeholder">
              <span>Góc nhìn sáng tạo</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell cta-shell">
        <div className="container">
          <div className="cta-box">
            <div>
              <p className="eyebrow">Khám phá ngay</p>
              <h2>Chọn chiếc máy phù hợp với từng dự án của bạn.</h2>
            </div>
            <Link to="/cameras" className="button primary-button">
              Khám phá bộ sưu tập
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
