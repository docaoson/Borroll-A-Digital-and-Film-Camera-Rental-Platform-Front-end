function PagePlaceholder({ title, description }) {
  return (
    <section className="page-placeholder">
      <p className="page-kicker">BORROLL</p>
      <h1>{title}</h1>
      <p className="page-description">{description}</p>
    </section>
  );
}

export default PagePlaceholder;
