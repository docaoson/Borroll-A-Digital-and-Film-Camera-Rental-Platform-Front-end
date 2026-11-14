import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { uploadFileToPresignedUrl } from "../../lib/apiClient";
import { adminService } from "../../services/adminService";
import { bookingService } from "../../services/bookingService";

const statusNames = {
  UNPAID: "Chưa thanh toán",
  PENDING_VERIFICATION: "Chờ xác nhận",
  REJECTED: "Bị từ chối",
  PAID: "Đã thanh toán",
};
const cash = (amount) => `${Number(amount || 0).toLocaleString("vi-VN")} ₫`;

export default function AdminPaymentsPage() {
  const { user } = useAuth();
  const roles = user?.roles || (user?.role ? [user.role] : []);
  const isAdmin = roles.includes("ADMIN");
  const [status, setStatus] = useState("PENDING_VERIFICATION");
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const [listResult, settingsResult] = await Promise.allSettled([
        adminService.getPayments(status ? { status } : {}),
        bookingService.getPaymentSettings(),
      ]);
      if (listResult.status === "fulfilled") setItems(listResult.value);
      else setError(listResult.reason?.message || "Khong the tai danh sach thanh toan.");
      if (settingsResult.status === "fulfilled") setSettings(settingsResult.value);
      else setError(settingsResult.reason?.message || "Khong the tai cau hinh thanh toan.");
    } catch (err) {
      setError(err?.message || "Không thể tải danh sách thanh toán.");
    }
  }, [status]);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);

  const saveSettings = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      let path = settings.qrPath || "";
      if (qrFile) {
        const presign = await adminService.presignPaymentQr(qrFile.type, qrFile.size);
        await uploadFileToPresignedUrl(presign.uploadUrl, qrFile);
        path = presign.path;
      }
      const saved = await adminService.updateContactSettings({
        paymentBankName: settings.bankName || null,
        paymentAccountNumber: settings.accountNumber || null,
        paymentAccountName: settings.accountName || null,
        paymentQrPath: path || null,
        paymentInstructions: settings.instructions || null,
        paymentEnabled: settings.enabled,
      });
      if (saved?.payment) setSettings(saved.payment);
      setQrFile(null);
      setNotice("Đã lưu thông tin nhận thanh toán.");
      await load();
    } catch (err) {
      setError(err?.message || "Không thể lưu thông tin thanh toán.");
    } finally {
      setBusy(false);
    }
  };

  const decide = async (item, approve) => {
    if (
      approve &&
      !window.confirm(
        `Xác nhận đã nhận ${cash(item.amount)} cho đơn ${item.booking.code}?`,
      )
    )
      return;
    const reason = approve
      ? ""
      : window.prompt("Nhập lý do từ chối minh chứng:");
    if (!approve && !reason?.trim()) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (approve) await adminService.confirmPayment(item.id);
      else await adminService.rejectPayment(item.id, reason.trim());
      setNotice(approve ? "Đã xác nhận thanh toán." : "Đã từ chối minh chứng.");
      await load();
    } catch (err) {
      setError(err?.message || "Không thể cập nhật thanh toán.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-payments-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">VẬN HÀNH</p>
          <h1>Thanh toán chuyển khoản</h1>
          <p>
            Đối chiếu ảnh minh chứng với giao dịch ngân hàng trước khi xác nhận.
          </p>
        </div>
      </header>
      {error && (
        <div className="form-alert error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="form-alert success" role="status">
          {notice}
        </div>
      )}
      {isAdmin && settings && (
        <form className="payment-settings-card" onSubmit={saveSettings}>
          <h2>Thông tin nhận thanh toán</h2>
          <div className="payment-settings-grid">
            <label>
              Tên ngân hàng
              <input
                required
                value={settings.bankName || ""}
                onChange={(e) =>
                  setSettings({ ...settings, bankName: e.target.value })
                }
              />
            </label>
            <label>
              Số tài khoản
              <input
                required
                value={settings.accountNumber || ""}
                onChange={(e) =>
                  setSettings({ ...settings, accountNumber: e.target.value })
                }
              />
            </label>
            <label>
              Chủ tài khoản
              <input
                required
                value={settings.accountName || ""}
                onChange={(e) =>
                  setSettings({ ...settings, accountName: e.target.value })
                }
              />
            </label>
            <label>
              Hướng dẫn chuyển khoản
              <textarea
                rows="2"
                value={settings.instructions || ""}
                onChange={(e) =>
                  setSettings({ ...settings, instructions: e.target.value })
                }
              />
            </label>
          </div>
          <label className="payment-qr-upload">
            Ảnh QR cố định (JPG/PNG, tối đa 5 MB)
            <input
              type="file"
              accept="image/jpeg,image/png"
          onChange={(e) => {
            const selected = e.target.files?.[0] || null;
            if (selected && (!/^image\/(jpeg|png)$/.test(selected.type) || selected.size > 5 * 1024 * 1024)) {
              setQrFile(null);
              setError("Ảnh QR chỉ nhận JPG hoặc PNG tối đa 5 MB.");
              e.target.value = "";
              return;
            }
            setError("");
            setQrFile(selected);
          }}
            />
            {settings.qrImageUrl && (
              <img src={settings.qrImageUrl} alt="QR hiện tại" />
            )}
          </label>
          <label className="payment-enabled">
            <input
              type="checkbox"
              checked={Boolean(settings.enabled)}
              onChange={(e) =>
                setSettings({ ...settings, enabled: e.target.checked })
              }
            />{" "}
            Hiển thị phương thức thanh toán cho renter
          </label>
          <button className="button primary-button" disabled={busy}>
            {busy ? "Đang lưu..." : "Lưu thông tin thanh toán"}
          </button>
        </form>
      )}
      <section className="payment-review-card">
        <div className="payment-review-heading">
          <h2>Minh chứng thanh toán</h2>
          <label>
            Lọc trạng thái
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="PENDING_VERIFICATION">Chờ xác nhận</option>
              <option value="REJECTED">Bị từ chối</option>
              <option value="PAID">Đã thanh toán</option>
            </select>
          </label>
        </div>
        {items.length === 0 ? (
          <p>Không có khoản thanh toán phù hợp.</p>
        ) : (
          <div className="payment-review-list">
            {items.map((item) => (
              <article className="payment-review-row" key={item.id}>
                <div>
                  <strong>Đơn {item.booking.code}</strong>
                  <span>
                    {item.booking.user?.fullName || item.booking.contactName}
                  </span>
                  <span>{item.booking.user?.email || ""}</span>
                </div>
                <strong>{cash(item.amount)}</strong>
                <span className={`payment-status ${item.status.toLowerCase()}`}>
                  {statusNames[item.status] || item.status}
                </span>
                {item.latestProof && (
                  <div className="payment-review-proof">
                    <a
                      href={item.latestProof.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img
                        src={item.latestProof.imageUrl}
                        alt={`Minh chứng đơn ${item.booking.code}`}
                      />
                    </a>
                    <span>
                      Gửi lúc{" "}
                      {new Date(item.latestProof.submittedAt).toLocaleString(
                        "vi-VN",
                      )}
                    </span>
                  </div>
                )}
                <div className="payment-review-actions">
                  <Link
                    className="button secondary-button small"
                    to={`/admin/orders/${item.booking.id}`}
                  >
                    Lịch sử đơn
                  </Link>
                  {item.status === "PENDING_VERIFICATION" && (
                    <>
                      <button
                        className="button primary-button small"
                        disabled={busy}
                        onClick={() => decide(item, true)}
                      >
                        Xác nhận đã nhận tiền
                      </button>
                      <button
                        className="button danger-button small"
                        disabled={busy}
                        onClick={() => decide(item, false)}
                      >
                        Từ chối
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
