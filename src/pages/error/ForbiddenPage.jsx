import PagePlaceholder from "../../components/shared/PagePlaceholder";

function ForbiddenPage() {
  return (
    <PagePlaceholder
      title="403 - Không có quyền truy cập"
      description="Bạn không có quyền xem trang này. Hãy quay lại danh mục máy hoặc đăng nhập bằng tài khoản phù hợp."
    />
  );
}

export default ForbiddenPage;
