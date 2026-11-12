# BORROLL FRONTEND (CỬA HÀNG) — HƯỚNG DẪN CHO AI AGENT / NGƯỜI LÀM FE

Repo: `borroll-frontend`. Đọc hết file này trước khi viết code.

## 0. Bối cảnh

Borroll là **website của một cửa hàng cho thuê máy ảnh** (số và film). Shop sở hữu máy, khách đặt trên web rồi **nhận và trả máy tại cửa hàng** (Tây Hồ, Thanh Xuân) và **thanh toán tại quầy**. Không có chủ máy, giỏ hàng, hay thanh toán online.

Ba vai trò: Khách (`RENTER`), nhân viên (`STAFF`), `ADMIN`.

- Backend ở repo `borroll-backend`. **Hình dạng mọi request/response nằm trong `docs/BORROLL_FE_BE_CONTRACT.md`** (hợp đồng API). Làm đúng theo đó, không tự đoán trường dữ liệu.
- Bối cảnh và lý do thiết kế: `BORROLL_STORE_PLAN.md`.
- **Phong cách giao diện (màu, bố cục) do người làm FE tự quyết**; file này không quy định.
- Giao diện tiếng Việt, có sẵn khung i18n để thêm tiếng Anh sau. Tên biến, file, code: tiếng Anh. Mobile-first.

## 1. Stack gợi ý

Next.js (App Router) + TypeScript, Tailwind CSS, TanStack Query, Zustand, React Hook Form + Zod, MSW (mock), `openapi-typescript` (sinh kiểu từ `docs/openapi.yaml` của BE).

## 2. Danh sách trang

**Công khai:** Trang chủ `/`; Cho thuê máy `/rent`; Chi tiết máy `/rent/[slug]`; Đăng nhập `/login`; Đăng ký `/register`; Trang lỗi (403, 404, lỗi chung); Giới thiệu và cửa hàng `/about`; Chính sách thuê, cọc, hư hỏng `/policy`; Hướng dẫn cho người mới `/guide`; Liên hệ `/contact`.

**Khách (cần đăng nhập):** Xác nhận đặt thuê `/checkout`; Đơn của tôi `/bookings`; Chi tiết đơn `/bookings/[id]`; Hồ sơ cá nhân `/settings`; Yêu thích `/favorites`.

**Nhân viên và admin (`/admin/*`):** Tổng quan; Danh sách đơn; Chi tiết đơn (xác nhận, giao máy, nhận máy, hoàn tất); Lịch kho (khóa bảo trì). **Chỉ ADMIN:** Mẫu máy (kèm ảnh và thông số), Từng chiếc máy, Danh mục/hãng/chi nhánh/film, Người dùng.

**Thành phần dùng chung:** Header, thanh menu, Footer, widget liên hệ nổi, menu tài khoản, thẻ máy, badge trạng thái đơn, bộ chọn ngày, bộ chọn chi nhánh, thẻ cấu hình AI.

**Ưu tiên:** P1 = công khai, đăng nhập/đăng ký, đặt thuê, đơn của tôi, hồ sơ. P2 = khu vực nhân viên/admin. P3 = yêu thích, Trợ lý AI.

**Không có:** khu vực chủ máy, hồ sơ chủ máy, duyệt tin, xác minh danh tính, giỏ hàng, thanh toán online, đánh giá của khách (dùng nội dung mẫu hoặc ẩn).

## 3. Cách gọi API

- Base URL từ `NEXT_PUBLIC_API_URL` (dạng `.../api/v1`). Mọi request gửi `credentials: 'include'`.
- **Access token** giữ **trong bộ nhớ** (store), gửi header `Authorization: Bearer <token>`. Không lưu localStorage/sessionStorage. Refresh token nằm trong cookie `httpOnly`.
- Khi khởi động ứng dụng gọi `POST /auth/refresh` để khôi phục phiên.
- Gặp `401 TOKEN_EXPIRED`: gọi `POST /auth/refresh` **một lần** (dùng một promise chung) rồi gửi lại request; refresh cũng `401` thì chuyển `/login?next=<trang hiện tại>`.
- Tập trung mọi lời gọi API vào `lib/api/`, không gọi `fetch` rải rác trong component.
- **Quyền nằm trong token:** sau khi admin đổi vai trò của ai đó, người đó phải đăng nhập lại mới thấy quyền mới.

## 4. Quy ước dữ liệu

- **Tiền:** số nguyên VND, FE tự định dạng (`350.000 đ`). **Ngày thuê:** `YYYY-MM-DD`. **Số ngày thuê** = ngày trả − ngày nhận (tối thiểu 1); ngày trả máy không bị tính là kín. "Hôm nay" theo múi giờ Việt Nam.
- **Danh sách:** `{ items, page, pageSize, total }`; `GET /models` có thêm `facets` để vẽ sidebar lọc kèm số lượng `(n)`.
- **Lỗi:** `{ error: { code, message, details } }`. `message` tiếng Việt, hiển thị thẳng được. `VALIDATION_ERROR` có `details.fields` → hiển thị dưới từng ô. Bảng mã lỗi ở hợp đồng mục 1.4.
- Giá trị lạ (trạng thái mới BE thêm sau) phải có nhãn mặc định, không làm vỡ giao diện.

## 5. Nhãn trạng thái đơn

`PENDING` Chờ shop xác nhận; `CONFIRMED` Shop đã xác nhận, chờ nhận máy; `PICKED_UP` Đang thuê (kèm nhãn **Quá hạn** nếu `isOverdue`); `RETURNED` Đã trả máy, chờ hoàn cọc; `COMPLETED` Hoàn tất; `REJECTED` Bị từ chối; `CANCELLED` Đã hủy.

## 6. Quy tắc quan trọng

- **Nút hành động trên đơn** chỉ hiển thị theo `allowedActions` BE trả về (`cancel`, `confirm`, `reject`, `pickup`, `return`, `complete`). Không tự suy luận từ vai trò và trạng thái.
- **Phân quyền giao diện chỉ để trải nghiệm,** bảo mật thật nằm ở BE. `middleware.ts`: chưa đăng nhập vào khu vực cần đăng nhập → `/login?next=...`; thiếu vai trò → trang 403. Dùng một hàm tập trung (ví dụ `can(action)`) thay vì rải `if (role === ...)`.
- **Đặt thuê = một đơn nhiều món.** Khách chọn chi nhánh, ngày nhận/trả, thân máy, tùy chọn ống kính (chỉ gợi ý ống kính cùng ngàm: `GET /models?kind=LENS&mount=...`) và film. Gọi `POST /bookings/quote` để hiện chi phí rồi `POST /bookings`. Trang xác nhận phải ghi rõ: **"Bạn thanh toán tại cửa hàng khi nhận máy"** và tách riêng dòng **Cọc (hoàn lại khi trả máy nếu máy không hỏng)**.
- **Chi nhánh là bắt buộc khi xem lịch trống:** `GET /models/:id/availability?branch=&month=` cần `branch`. Dù FE đã chặn ngày, vẫn xử lý `409 NO_UNIT_AVAILABLE` khi gửi đơn (người khác có thể vừa đặt xong).
- **Biên bản và ảnh:** ảnh giao nhận là URL tạm thời, không lưu lại. Khách chỉ xem biên bản của đơn mình.
- **Tải ảnh (hai bước):** xin URL bằng `.../presign` → `PUT` file thẳng lên `uploadUrl` (đúng `Content-Type`; nếu bị từ chối thì dùng `uploadToSignedUrl` của `supabase-js` với `path` và `token` BE đã trả) → gọi API đăng ký/ghi nhận với `path`. Tối đa 5 MB mỗi ảnh (ảnh đại diện 2 MB), JPG/PNG/WebP.
- **Bộ lọc `/rent`** đồng bộ lên URL query để chia sẻ được. Chưa đăng nhập mà bấm "yêu thích" thì chuyển `/login?next=...`.
- **Trợ lý AI:** chỉ hiện khi `aiSetupAvailable = true`; luôn hiển thị `disclaimer`; xử lý `429` (hết lượt trong ngày) và `503` bằng thông báo thân thiện; lỗi AI không được làm hỏng luồng đặt thuê.
- **Số điện thoại và dữ liệu cá nhân của khách** chỉ nhân viên thấy; khách xem đơn của mình thì thấy thông tin liên hệ mình đã nhập.

## 7. Cấu trúc thư mục

```
src/
├─ app/ (public) (auth) (account) checkout admin
├─ features/ catalog booking favorites ai-setup admin auth
├─ components/ui  components/layout
├─ lib/ api (client.ts, generated/) auth i18n utils
├─ hooks stores types mocks
└─ middleware.ts
```

## 8. Khi BE chưa xong

Dùng MSW (`src/mocks/`) trả dữ liệu **đúng như các ví dụ JSON trong hợp đồng**, bật bằng `NEXT_PUBLIC_USE_MOCK=true`. Khi BE sẵn sàng, tắt mock. Nếu hợp đồng và `docs/openapi.yaml` khác nhau thì `openapi.yaml` đúng; báo BE sửa tài liệu. Chạy `gen:api` mỗi khi BE cập nhật API.

## 9. Biến môi trường (`.env.example`)

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_FACEBOOK_URL=
NEXT_PUBLIC_ZALO_URL=
NEXT_PUBLIC_MESSENGER_URL=
```
