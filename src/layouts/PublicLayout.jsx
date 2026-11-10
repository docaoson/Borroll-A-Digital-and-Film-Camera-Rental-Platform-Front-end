import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";
import FloatingContactWidget from "../components/shared/FloatingContactWidget";
import { Outlet } from "react-router-dom";

function PublicLayout() {
  return (
    <div className="app-shell public-shell">
      <Header variant="public" />
      <main className="page-main">
        <Outlet />
      </main>
      <FloatingContactWidget />
      <Footer />
    </div>
  );
}

export default PublicLayout;
