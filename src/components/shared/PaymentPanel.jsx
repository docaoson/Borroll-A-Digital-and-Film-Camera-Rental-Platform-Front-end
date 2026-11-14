import { useEffect, useMemo, useRef, useState } from "react";
import { bookingService } from "../../services/bookingService";
import { canSubmitPaymentProof } from "../../services/paymentAvailability";

const labels = {
  UNPAID: "Chưa thanh toán",
  PENDING_VERIFICATION: "Đang chờ xác nhận",
  REJECTED: "Thanh toán bị từ chối",
  PAID: "Đã thanh toán",
};

function money(value) {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
}

export default function PaymentPanel({ booking, onSubmitted }) {
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");
  const [qrLoadError, setQrLoadError] = useState(false);
  const [paymentData, setPaymentData] = useState(
    booking.payment || {
      status: "UNPAID",
      amount: booking.totalDueAtPickup,
      proofs: [],
    },
  );
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [file, setFile] = useState(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const [busy, setBusy] = useState(false);
  const uploadLock = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const payment = paymentData;
  const proofs = payment.proofs || [];
  const rejected =
    proofs.findLast?.((proof) => proof.status === "REJECTED") ||
    [...proofs].reverse().find((proof) => proof.status === "REJECTED");
  const canSubmitProof = canSubmitPaymentProof({
    paymentEnabled: settings?.enabled,
    bookingStatus: booking.status,
    paymentStatus: payment.status,
  });

  const loadPaymentHistory = async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const history = await bookingService.getPaymentHistory(booking.id);
      setPaymentData((current) => ({
        ...current,
        ...history,
        amount: history.amount ?? booking.totalDueAtPickup,
        proofs: history.proofs || [],
      }));
    } catch (err) {
      setHistoryError(err?.message || "Không thể tải lịch sử minh chứng.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadPaymentSettings = async () => {
    setSettingsLoading(true);
    setSettingsError("");
    try {
      setSettings(await bookingService.getPaymentSettings());
    } catch (err) {
      setSettings(null);
      setSettingsError(err?.message || "Không thể tải thông tin thanh toán.");
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    bookingService
      .getPaymentSettings()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch((err) => {
        if (active) {
          setSettings(null);
          setSettingsError(err?.message || "Không thể tải thông tin thanh toán.");
        }
      })
      .finally(() => {
        if (active) setSettingsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    bookingService
      .getPaymentHistory(booking.id)
      .then((history) => {
        if (active) {
          setPaymentData((current) => ({
            ...current,
            ...history,
            amount: history.amount ?? booking.totalDueAtPickup,
            proofs: history.proofs || [],
          }));
        }
      })
      .catch((err) => {
        if (active) setHistoryError(err?.message || "Không thể tải lịch sử minh chứng.");
      })
      .finally(() => {
        if (active) setHistoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [booking.id, booking.totalDueAtPickup]);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const copy = async (value) => {
    try {
      await navigator.clipboard.writeText(String(value));
      setMessage("Đã sao chép.");
    } catch {
      setError("Không thể sao chép trên thiết bị này.");
    }
  };

  const selectProof = async (event) => {
    const input = event.currentTarget;
    const selected = input.files?.[0] || null;
    input.value = "";
    setError("");
    setMessage("");
    if (!selected) return;
    if (!/^image\/(jpeg|png)$/.test(selected.type)) {
      setFile(null);
      setError("Chỉ nhận ảnh JPG hoặc PNG.");
      return;
    }
    if (selected.size < 1 || selected.size > 5 * 1024 * 1024) {
      setFile(null);
      setError("Ảnh phải có dung lượng từ 1 byte đến 5 MB.");
      return;
    }

    try {
      const signature = new Uint8Array(await selected.slice(0, 8).arrayBuffer());
      const isJpeg = selected.type === "image/jpeg" && signature.length >= 3 &&
        signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
      const isPng = selected.type === "image/png" && signature.length >= 8 &&
        signature[0] === 0x89 && signature[1] === 0x50 && signature[2] === 0x4e &&
        signature[3] === 0x47 && signature[4] === 0x0d && signature[5] === 0x0a &&
        signature[6] === 0x1a && signature[7] === 0x0a;
      if (!isJpeg && !isPng) {
        setFile(null);
        setError("Nội dung ảnh không khớp định dạng JPG/PNG. Vui lòng chọn ảnh khác.");
        return;
      }
      setFile(selected);
    } catch {
      setFile(null);
      setError("Không thể đọc ảnh đã chọn. Vui lòng thử ảnh khác.");
    }
  };

  const clearProof = () => {
    setFile(null);
    setError("");
    setMessage("");
  };

  const submit = async () => {
    if (uploadLock.current) return;
    setError("");
    setMessage("");
    if (!file) {
      setError("Vui lòng chọn ảnh xác nhận giao dịch.");
      return;
    }
    uploadLock.current = true;
    setBusy(true);
    try {
      const result = await bookingService.submitPaymentProof(booking.id, file);
      setPaymentData((current) => ({
        ...current,
        status: result.status || current.status,
        proofs: current.proofs || [],
      }));
      setFile(null);
      setMessage("Đã gửi minh chứng. Thanh toán đang chờ cửa hàng xác nhận.");
      try {
        const history = await bookingService.getPaymentHistory(booking.id);
        setPaymentData((current) => ({ ...current, ...history, proofs: history.proofs || [] }));
        setHistoryError("");
      } catch (historyErr) {
        setHistoryError(historyErr?.message || "Không thể tải lịch sử minh chứng.");
      }
      await onSubmitted?.();
    } catch (err) {
      setError(err?.message || "Không thể gửi minh chứng. Vui lòng thử lại.");
    } finally {
      uploadLock.current = false;
      setBusy(false);
    }
  };

  return (
    <section className="payment-panel" aria-labelledby="payment-title">
      <header className="payment-panel-header">
        <div>
          <p className="eyebrow">THANH TOÁN CHUYỂN KHOẢN</p>
          <h2 id="payment-title">Thanh toán đơn {booking.code}</h2>
        </div>
        <span className={`payment-status ${payment.status.toLowerCase()}`}>
          {labels[payment.status] || payment.status}
        </span>
      </header>
      <div className="payment-amount">
        <div className="payment-amount-copy">
        <span>Số tiền cần chuyển</span>
        <strong>{money(payment.amount ?? booking.totalDueAtPickup)}</strong>
        </div>
        <button
          type="button"
          className="button secondary-button small"
          onClick={() => copy(payment.amount ?? booking.totalDueAtPickup)}
        >
          Sao chép
        </button>
      </div>
      {settingsLoading ? (
        <p className="payment-unavailable" role="status">Đang tải thông tin chuyển khoản...</p>
      ) : settingsError ? (
        <div className="payment-unavailable" role="alert">
          <p>{settingsError}</p>
          <button type="button" className="button secondary-button small" onClick={loadPaymentSettings}>Thử lại</button>
        </div>
      ) : settings ? (
        <div className="payment-details-grid">
          <div className="payment-bank-details">
            <h3>Thông tin nhận tiền</h3>
            <p>
              Ngân hàng <strong>{settings.bankName}</strong>
            </p>
            <p>
              Số tài khoản <strong>{settings.accountNumber}</strong>{" "}
              <button
                className="payment-copy"
                type="button"
                onClick={() => copy(settings.accountNumber)}
              >
                Sao chép
              </button>
            </p>
            <p>
              Chủ tài khoản <strong>{settings.accountName}</strong>
            </p>
            <p>
              Nội dung chuyển khoản{" "}
              <strong>THANHTOAN BORROLL {booking.code}</strong>{" "}
              <button
                className="payment-copy"
                type="button"
                onClick={() => copy(`THANHTOAN BORROLL ${booking.code}`)}
              >
                Sao chép
              </button>
            </p>
            {settings.instructions && (
              <p className="payment-instructions">{settings.instructions}</p>
            )}
          </div>
          {settings.qrImageUrl && !qrLoadError && (
            <figure className="payment-qr">
              <img src={settings.qrImageUrl} alt="Mã QR chuyển khoản Borroll" onError={() => setQrLoadError(true)} />
              <figcaption>
                Quét QR để chuyển đúng số tiền và nội dung.
              </figcaption>
            </figure>
          )}
          {qrLoadError && <p className="payment-unavailable" role="alert">Không tải được ảnh QR. Vui lòng kiểm tra cấu hình ảnh.</p>}
          {!settings.enabled && (
            <p className="payment-unavailable">
              Cửa hàng chưa bật thanh toán chuyển khoản. Bạn chưa thể gửi ảnh minh chứng; vui lòng liên hệ cửa hàng.
            </p>
          )}
        </div>
      ) : (
        <p className="payment-unavailable">
          Thông tin chuyển khoản hiện chưa được cấu hình. Vui lòng liên hệ cửa
          hàng.
        </p>
      )}
      {rejected && (
        <div className="payment-rejection">
          <strong>Lý do từ chối:</strong>{" "}
          {rejected.rejectionReason || "Vui lòng gửi lại ảnh giao dịch rõ hơn."}
        </div>
      )}
      {payment.status === "PAID" && (
        <p className="payment-success">
          Cửa hàng đã xác nhận thanh toán. Bạn không cần gửi lại minh chứng.
        </p>
      )}
      {payment.status === "PENDING_VERIFICATION" && (
        <p className="payment-waiting">
          Minh chứng đã gửi. Cửa hàng đang đối chiếu giao dịch.
        </p>
      )}
      {canSubmitProof && (
        <div className="payment-proof-form">
          <div className="payment-upload-heading">
            <div>
              <h3>Gửi minh chứng chuyển khoản</h3>
              <p>Chọn ảnh giao dịch JPG hoặc PNG, dung lượng tối đa 5 MB.</p>
            </div>
          </div>
          <div className={`payment-upload-zone${file ? " has-file" : ""}`}>
            {preview ? (
              <figure className="payment-proof-preview-wrap">
                <img className="payment-proof-preview" src={preview} alt="Xem trước ảnh minh chứng" />
                <figcaption>{file.name} · {(file.size / (1024 * 1024)).toFixed(2)} MB</figcaption>
              </figure>
            ) : (
              <div className="payment-upload-empty" aria-hidden="true">
                <span className="payment-upload-icon">↑</span>
                <span>Chọn ảnh từ thiết bị để xem trước</span>
              </div>
            )}
            <input
              id="payment-proof"
              className="payment-file-input"
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              onChange={selectProof}
              disabled={busy}
              aria-describedby="payment-proof-hint"
            />
            <div className="payment-upload-actions">
              <label className="button secondary-button small" htmlFor="payment-proof">
                {file ? "Thay ảnh" : "Chọn ảnh"}
              </label>
              {file && (
                <button type="button" className="payment-remove-file" onClick={clearProof} disabled={busy}>
                  Xóa ảnh
                </button>
              )}
            </div>
          </div>
          <p id="payment-proof-hint" className="payment-proof-hint">
            Ảnh riêng tư, chỉ bạn và nhân viên có quyền mới xem được.
          </p>
          {error && (
            <p className="form-alert error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="form-alert success" role="status">
              {message}
            </p>
          )}
          <button
            type="button"
            className="button primary-button payment-submit-button"
            onClick={submit}
            disabled={!file || busy}
            aria-live="polite"
          >
            {busy ? "Đang tải ảnh và gửi..." : "Gửi minh chứng thanh toán"}
          </button>
        </div>
      )}
      <div className="payment-history">
        <h3>Lịch sử minh chứng</h3>
        {historyLoading ? (
          <p role="status">Đang tải lịch sử minh chứng...</p>
        ) : historyError ? (
          <div className="form-alert error" role="alert">
            <p>{historyError}</p>
            <button type="button" className="payment-copy" onClick={loadPaymentHistory}>Thử lại</button>
          </div>
        ) : proofs.length ? (
          proofs.map((proof) => (
            <article key={proof.id} className="payment-history-row">
              <a href={proof.imageUrl} target="_blank" rel="noreferrer">
                Xem ảnh minh chứng
              </a>
              <span>{new Date(proof.submittedAt).toLocaleString("vi-VN")}</span>
              <strong>
                {proof.status === "APPROVED"
                  ? "Đã duyệt"
                  : proof.status === "REJECTED"
                    ? "Bị từ chối"
                    : "Đang chờ"}
              </strong>
              {proof.rejectionReason && <p>{proof.rejectionReason}</p>}
            </article>
          ))
        ) : (
          <p>Chưa có minh chứng được gửi.</p>
        )}
      </div>
    </section>
  );
}
