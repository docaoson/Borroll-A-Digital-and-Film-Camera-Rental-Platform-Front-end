import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import StatusBadge from "../../components/shared/StatusBadge";
import { adminService } from "../../services/adminService";

function formatCurrency(amount) {
  if (typeof amount !== "number") return "0 đ";
  return `${amount.toLocaleString("vi-VN")} đ`;
}

function formatDate(isoStr) {
  if (!isoStr) return "--";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("vi-VN");
  } catch {
    return isoStr;
  }
}

function formatDateTime(isoStr) {
  if (!isoStr) return "--";
  try {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString("vi-VN")} ${d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  } catch {
    return isoStr;
  }
}

const DEFAULT_PICKUP_CHECKLIST = [
  { item: "Thân máy & Cảm biến", ok: true, note: "" },
  { item: "Ống kính & Kính ngắm", ok: true, note: "" },
  { item: "Pin & Bộ sạc", ok: true, note: "" },
  { item: "Thẻ nhớ & Nắp đậy", ok: true, note: "" },
  { item: "Dây đeo & Túi đựng", ok: true, note: "" },
];

const DEFAULT_RETURN_CHECKLIST = [
  { item: "Thân máy hoạt động tốt", ok: true, note: "" },
  { item: "Cảm biến & Ống kính sạch", ok: true, note: "" },
  { item: "Đầy đủ pin, sạc, nắp che", ok: true, note: "" },
  { item: "Thẻ nhớ & Phụ kiện đi kèm", ok: true, note: "" },
];

function AdminOrderDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [booking, setBooking] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Active Modals: 'confirm' | 'reject' | 'cancel' | 'pickup' | 'return' | 'complete' | null
  const [activeModal, setActiveModal] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");

  // Reject / Cancel Reason State
  const [reasonText, setReasonText] = useState("");

  // Pickup Form State
  const [pickupChecklist, setPickupChecklist] = useState(DEFAULT_PICKUP_CHECKLIST);
  const [pickupConditionNotes, setPickupConditionNotes] = useState("");
  const [pickupIdChecked, setPickupIdChecked] = useState(false);
  const [pickupRentalMethod, setPickupRentalMethod] = useState("CASH");
  const [pickupDepositMethod, setPickupDepositMethod] = useState("BANK_TRANSFER");
  const [pickupFiles, setPickupFiles] = useState([]); // Array of File
  const [pickupFilePreviews, setPickupFilePreviews] = useState([]); // URLs
  const [uploadProgressText, setUploadProgressText] = useState("");

  // Return Form State
  const [returnChecklist, setReturnChecklist] = useState(DEFAULT_RETURN_CHECKLIST);
  const [returnConditionNotes, setReturnConditionNotes] = useState("");
  const [returnFiles, setReturnFiles] = useState([]);
  const [returnFilePreviews, setReturnFilePreviews] = useState([]);

  // Complete Form State
  const [refundMethod, setRefundMethod] = useState("BANK_TRANSFER");
  const [completeNote, setCompleteNote] = useState("");
  const [charges, setCharges] = useState([]); // [{ type: 'DAMAGE_CHARGE' | 'LATE_FEE', amount: 0, note: '' }]

  // Photo viewer lightbox
  const [lightboxUrl, setLightboxUrl] = useState(null);

  // Load Booking Details from GET /bookings/:id
  useEffect(() => {
    let active = true;

    adminService
      .getBookingDetail(id)
      .then((data) => {
        if (!active) return;
        setBooking(data);
        setError(null);

        // Open modal if URL query specifies action
        const actionParam = searchParams.get("action");
        if (actionParam && data.allowedActions?.includes(actionParam)) {
          setActiveModal(actionParam);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err?.message ||
            "Không thể tải thông tin chi tiết đơn thuê. Vui lòng thử lại sau.",
        );
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, searchParams, refreshKey]);

  // Handle Close Modal & Cleanup
  const handleCloseModal = () => {
    if (modalSubmitting) return;
    setActiveModal(null);
    setModalError("");
    setReasonText("");
    setUploadProgressText("");
    // Cleanup local preview URLs
    pickupFilePreviews.forEach((u) => URL.revokeObjectURL(u));
    returnFilePreviews.forEach((u) => URL.revokeObjectURL(u));
    setPickupFiles([]);
    setPickupFilePreviews([]);
    setReturnFiles([]);
    setReturnFilePreviews([]);
    setCharges([]);
  };

  // 1. Submit Confirm Booking
  const handleConfirmSubmit = async () => {
    setModalSubmitting(true);
    setModalError("");
    try {
      await adminService.confirmBooking(id);
      setSuccessMsg("Đã phê duyệt thành công đơn thuê.");
      handleCloseModal();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setModalError(
        err?.message || "Không thể phê duyệt đơn thuê lúc này.",
      );
    } finally {
      setModalSubmitting(false);
    }
  };

  // 2. Submit Reject Booking
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!reasonText.trim()) {
      setModalError("Vui lòng nhập lý do từ chối đơn thuê.");
      return;
    }
    setModalSubmitting(true);
    setModalError("");
    try {
      await adminService.rejectBooking(id, reasonText.trim());
      setSuccessMsg("Đã từ chối đơn thuê thành công.");
      handleCloseModal();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setModalError(err?.message || "Không thể từ chối đơn thuê.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // 3. Submit Cancel Booking
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!reasonText.trim()) {
      setModalError("Vui lòng nhập lý do hủy đơn thuê.");
      return;
    }
    setModalSubmitting(true);
    setModalError("");
    try {
      await adminService.cancelBooking(id, reasonText.trim());
      setSuccessMsg("Đã hủy đơn thuê thành công.");
      handleCloseModal();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setModalError(err?.message || "Không thể hủy đơn thuê.");
    } finally {
      setModalSubmitting(false);
    }
  };

  // 4. Submit Pickup Booking (Giao máy & thu tiền)
  const handlePickupSubmit = async (e) => {
    e.preventDefault();
    if (!pickupIdChecked) {
      setModalError("Bắt buộc phải đối chiếu và xác nhận CCCD / Giấy tờ tùy thân của khách.");
      return;
    }
    if (pickupFiles.length === 0) {
      setModalError("Cần tải lên tối thiểu 1 ảnh biên bản hiện trạng bàn giao thiết bị.");
      return;
    }

    setModalSubmitting(true);
    setModalError("");

    try {
      // Step A: Upload handover photos to presigned storage
      setUploadProgressText(`Đang tải lên ${pickupFiles.length} ảnh biên bản...`);
      const photoPaths = [];
      for (let i = 0; i < pickupFiles.length; i++) {
        const file = pickupFiles[i];
        setUploadProgressText(`Đang tải ảnh ${i + 1}/${pickupFiles.length}...`);
        const path = await adminService.uploadHandoverPhoto(id, file);
        photoPaths.push(path);
      }

      // Step B: Prepare payment records
      setUploadProgressText("Đang ghi nhận biên bản giao nhận & thanh toán...");
      const rentalRequired = (booking.rentalAmount || 0) + (booking.addonsAmount || 0);
      const depositRequired = booking.depositAmount || 0;

      const payments = [
        {
          type: "RENTAL_RECEIVED",
          amount: rentalRequired,
          method: pickupRentalMethod,
          note: "Thu tiền thuê tại quầy lúc giao máy",
        },
        {
          type: "DEPOSIT_RECEIVED",
          amount: depositRequired,
          method: pickupDepositMethod,
          note: "Thu tiền cọc đảm bảo thiết bị lúc giao máy",
        },
      ];

      const payload = {
        checklist: pickupChecklist,
        conditionNotes: pickupConditionNotes.trim() || null,
        photoPaths,
        idChecked: true,
        payments,
      };

      await adminService.pickupBooking(id, payload);
      setSuccessMsg("Bàn giao máy và thu tiền cọc thành công! Đơn chuyển sang trạng thái ĐANG THUÊ.");
      handleCloseModal();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setModalError(
        err?.message || "Đã có lỗi xảy ra khi hoàn tất bàn giao máy. Vui lòng kiểm tra lại.",
      );
    } finally {
      setModalSubmitting(false);
      setUploadProgressText("");
    }
  };

  // 5. Submit Return Booking (Nhận lại máy)
  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (returnFiles.length === 0) {
      setModalError("Cần tải lên tối thiểu 1 ảnh biên bản hiện trạng khi nhận lại thiết bị.");
      return;
    }

    setModalSubmitting(true);
    setModalError("");

    try {
      setUploadProgressText(`Đang tải lên ${returnFiles.length} ảnh hiện trạng...`);
      const photoPaths = [];
      for (let i = 0; i < returnFiles.length; i++) {
        const file = returnFiles[i];
        setUploadProgressText(`Đang tải ảnh ${i + 1}/${returnFiles.length}...`);
        const path = await adminService.uploadHandoverPhoto(id, file);
        photoPaths.push(path);
      }

      setUploadProgressText("Đang ghi nhận biên bản trả máy...");
      const payload = {
        checklist: returnChecklist,
        conditionNotes: returnConditionNotes.trim() || null,
        photoPaths,
      };

      await adminService.returnBooking(id, payload);
      setSuccessMsg("Đã tiếp nhận máy hoàn trả thành công! Đơn chuyển sang trạng thái ĐÃ TRẢ MÁY.");
      handleCloseModal();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setModalError(
        err?.message || "Đã có lỗi xảy ra khi xác nhận trả máy. Vui lòng thử lại.",
      );
    } finally {
      setModalSubmitting(false);
      setUploadProgressText("");
    }
  };

  // 6. Submit Complete Booking (Nghiệm thu & Hoàn cọc)
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setModalSubmitting(true);
    setModalError("");

    try {
      const depositCollected = (booking?.payments || [])
        .filter((p) => p.type === "DEPOSIT_RECEIVED")
        .reduce((sum, p) => sum + p.amount, 0);

      const totalCharges = charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
      if (totalCharges > depositCollected) {
        setModalError("Tổng tiền khấu trừ không được vượt quá số tiền cọc đã thu từ khách.");
        setModalSubmitting(false);
        return;
      }

      const payload = {
        charges: charges.filter((c) => Number(c.amount) > 0).map((c) => ({
          type: c.type,
          amount: Number(c.amount),
          note: c.note?.trim() || null,
        })),
        refundMethod,
        note: completeNote.trim() || null,
      };

      await adminService.completeBooking(id, payload);
      setSuccessMsg("Nghiệm thu đơn thuê và hoàn cọc thành công! Đơn hàng đã HOÀN TẤT.");
      handleCloseModal();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setModalError(
        err?.message || "Đã có lỗi xảy ra khi nghiệm thu đơn thuê. Vui lòng thử lại.",
      );
    } finally {
      setModalSubmitting(false);
    }
  };

  // Helper for checklist edits
  const updateChecklistItem = (listSetter, index, field, value) => {
    listSetter((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Helper for adding/removing charges
  const handleAddCharge = (type) => {
    setCharges((prev) => [...prev, { type, amount: 0, note: "" }]);
  };

  const handleUpdateCharge = (idx, field, val) => {
    setCharges((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  };

  const handleRemoveCharge = (idx) => {
    setCharges((prev) => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="admin-page-loading">
        <span className="admin-spinner" aria-hidden="true" />
        <p>Đang tải thông tin chi tiết đơn thuê #{id}...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="admin-detail-error-shell">
        <div className="form-alert error" role="alert">
          <strong>Lỗi truy xuất:</strong> {error || "Không tìm thấy đơn thuê."}
        </div>
        <Link to="/admin/orders" className="button secondary-button compact">
          ← Quay lại danh sách đơn thuê
        </Link>
      </div>
    );
  }

  const allowedActions = booking.allowedActions || [];
  const customerName = booking.customer?.fullName || booking.contactName || "Khách thuê";
  const customerPhone = booking.customer?.phone || booking.contactPhone || "--";
  const depositCollected = (booking.payments || [])
    .filter((p) => p.type === "DEPOSIT_RECEIVED")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalCharges = charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const refundDue = Math.max(0, depositCollected - totalCharges);

  return (
    <div className="admin-order-detail-page">
      {/* HEADER SECTION */}
      <section className="admin-page-header">
        <div className="admin-page-titles">
          <div className="admin-breadcrumb">
            <Link to="/admin">Bảng điều khiển</Link>
            <span className="sep">/</span>
            <Link to="/admin/orders">Quản lý đơn thuê</Link>
            <span className="sep">/</span>
            <span className="current">#{booking.code || booking.id.slice(0, 8)}</span>
          </div>
          <div className="admin-title-status-wrap">
            <h1 className="admin-heading-title">
              Đơn thuê #{booking.code || booking.id.slice(0, 8)}
            </h1>
            <StatusBadge status={booking.status} isOverdue={booking.isOverdue} />
          </div>
          <p className="admin-heading-sub">
            Khách hàng <strong>{customerName}</strong> · Đặt lúc {formatDateTime(booking.createdAt)} · Chi nhánh {booking.branch?.name || "Hệ thống"}
          </p>
        </div>

        {/* TOP OPERATIONAL ACTIONS TOOLBAR */}
        <div className="admin-header-actions">
          {allowedActions.includes("confirm") && (
            <button
              type="button"
              className="button primary-button"
              onClick={() => setActiveModal("confirm")}
            >
              Phê duyệt đơn
            </button>
          )}

          {allowedActions.includes("pickup") && (
            <button
              type="button"
              className="button primary-button"
              onClick={() => {
                setPickupIdChecked(false);
                setPickupChecklist(DEFAULT_PICKUP_CHECKLIST);
                setActiveModal("pickup");
              }}
            >
              Bàn giao máy cho khách
            </button>
          )}

          {allowedActions.includes("return") && (
            <button
              type="button"
              className="button primary-button"
              onClick={() => {
                setReturnChecklist(DEFAULT_RETURN_CHECKLIST);
                setActiveModal("return");
              }}
            >
              Tiếp nhận trả máy
            </button>
          )}

          {allowedActions.includes("complete") && (
            <button
              type="button"
              className="button primary-button"
              onClick={() => {
                setCharges([]);
                setActiveModal("complete");
              }}
            >
              Nghiệm thu & Hoàn cọc
            </button>
          )}

          {allowedActions.includes("reject") && (
            <button
              type="button"
              className="button danger-button compact"
              onClick={() => {
                setReasonText("");
                setActiveModal("reject");
              }}
            >
              Từ chối đơn
            </button>
          )}

          {allowedActions.includes("cancel") && !allowedActions.includes("reject") && (
            <button
              type="button"
              className="button danger-button compact"
              onClick={() => {
                setReasonText("");
                setActiveModal("cancel");
              }}
            >
              Hủy đơn thuê
            </button>
          )}

          <Link to="/admin/orders" className="button secondary-button compact">
            Quay lại
          </Link>
        </div>
      </section>

      {/* SUCCESS ALERTS */}
      {successMsg && (
        <div className="form-alert success admin-alert-bar" role="status">
          <span>{successMsg}</span>
          <button
            type="button"
            className="admin-alert-close"
            onClick={() => setSuccessMsg("")}
          >
            Đóng
          </button>
        </div>
      )}

      {/* OVERDUE WARNING BANNER */}
      {booking.isOverdue && (
        <div className="admin-critical-banner" role="status">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <div className="critical-text">
            <strong>Đơn thuê quá hạn trả:</strong> Hợp đồng thuê đã hết hạn vào ngày{" "}
            <strong>{formatDate(booking.endDate)}</strong> nhưng khách hàng chưa hoàn trả máy. Vui lòng liên hệ khách theo số <strong>{customerPhone}</strong> để xử lý.
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN DETAILS GRID */}
      <div className="admin-order-grid">
        {/* LEFT COLUMN: RENTAL TIMELINE, EQUIPMENT, HANDOVERS */}
        <div className="admin-order-main-col">
          {/* CARD 1: THỜI GIAN THUÊ & HÀNH TRÌNH ĐƠN */}
          <div className="admin-detail-card">
            <div className="admin-card-header">
              <span className="admin-section-num">01</span>
              <div>
                <h3>Lịch trình thuê & Hành trình đơn hàng</h3>
                <p>Kỳ hạn hợp đồng và các mốc thời gian thực hiện của chu trình thuê.</p>
              </div>
            </div>

            <div className="admin-schedule-banner">
              <div className="admin-schedule-item">
                <span className="schedule-label">Bắt đầu nhận máy:</span>
                <strong className="schedule-date">{formatDate(booking.startDate)}</strong>
              </div>
              <div className="admin-schedule-divider">
                <span>{booking.days} ngày thuê</span>
                <span className="divider-arrow">→</span>
              </div>
              <div className="admin-schedule-item">
                <span className="schedule-label">Hoàn trả thiết bị:</span>
                <strong className="schedule-date">{formatDate(booking.endDate)}</strong>
              </div>
            </div>

            <div className="admin-timeline-list">
              <div className="admin-timeline-step done">
                <span className="step-dot" />
                <div className="step-body">
                  <strong>Khởi tạo yêu cầu thuê:</strong>
                  <span>{formatDateTime(booking.createdAt)}</span>
                </div>
              </div>

              {booking.confirmedAt && (
                <div className="admin-timeline-step done">
                  <span className="step-dot" />
                  <div className="step-body">
                    <strong>Đơn vị phê duyệt xác nhận:</strong>
                    <span>{formatDateTime(booking.confirmedAt)}</span>
                  </div>
                </div>
              )}

              {booking.pickedUpAt && (
                <div className="admin-timeline-step done">
                  <span className="step-dot" />
                  <div className="step-body">
                    <strong>Bàn giao thiết bị cho khách:</strong>
                    <span>{formatDateTime(booking.pickedUpAt)}</span>
                  </div>
                </div>
              )}

              {booking.returnedAt && (
                <div className="admin-timeline-step done">
                  <span className="step-dot" />
                  <div className="step-body">
                    <strong>Khách hàng hoàn trả máy:</strong>
                    <span>{formatDateTime(booking.returnedAt)}</span>
                  </div>
                </div>
              )}

              {booking.completedAt && (
                <div className="admin-timeline-step done">
                  <span className="step-dot" />
                  <div className="step-body">
                    <strong>Nghiệm thu và hoàn cọc:</strong>
                    <span>{formatDateTime(booking.completedAt)}</span>
                  </div>
                </div>
              )}

              {booking.rejectedReason && (
                <div className="admin-timeline-step rejected">
                  <span className="step-dot" />
                  <div className="step-body">
                    <strong className="text-danger">Đơn bị từ chối:</strong>
                    <p className="reason-text">{booking.rejectedReason}</p>
                  </div>
                </div>
              )}

              {booking.cancelledReason && (
                <div className="admin-timeline-step cancelled">
                  <span className="step-dot" />
                  <div className="step-body">
                    <strong className="text-danger">Đơn bị hủy:</strong>
                    <p className="reason-text">{booking.cancelledReason}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: THIẾT BỊ ĐƯỢC THUÊ & SỐ SERIAL PHÂN BỔ */}
          <div className="admin-detail-card">
            <div className="admin-card-header">
              <span className="admin-section-num">02</span>
              <div>
                <h3>Thiết bị cho thuê & Số serial phân bổ</h3>
                <p>Danh sách mẫu máy ảnh, phụ kiện kèm theo và số serial cụ thể trong kho.</p>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Thiết bị</th>
                    <th scope="col">Số Serial</th>
                    <th scope="col">Đơn giá / ngày</th>
                    <th scope="col">Tiền thuê</th>
                    <th scope="col">Tiền cọc</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.items && booking.items.map((item, idx) => {
                    const unitInfo = booking.units?.find((u) => u.modelId === item.modelId);
                    return (
                      <tr key={item.modelId || idx}>
                        <td>
                          <div className="admin-product-info-cell">
                            <strong>{item.name}</strong>
                            <span className="admin-product-slug">{item.kind}</span>
                          </div>
                        </td>
                        <td>
                          {unitInfo?.serialNumber ? (
                            <span className="admin-serial-badge">
                              {unitInfo.serialNumber}
                            </span>
                          ) : (
                            <span className="text-muted">Tự động gán</span>
                          )}
                        </td>
                        <td className="amount-cell">{formatCurrency(item.pricePerDay)}</td>
                        <td className="amount-cell">
                          <strong>{formatCurrency(item.rentalAmount)}</strong>
                        </td>
                        <td className="amount-cell text-muted">
                          {formatCurrency(item.depositAmount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PHỤ KIỆN / FILM MUA KÈM */}
            {booking.addons && booking.addons.length > 0 && (
              <div className="admin-addons-section">
                <h4>Phụ kiện & Cuộn phim mua kèm ({booking.addons.length})</h4>
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th scope="col">Tên sản phẩm</th>
                        <th scope="col">Số lượng</th>
                        <th scope="col">Đơn giá</th>
                        <th scope="col">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.addons.map((add, idx) => (
                        <tr key={idx}>
                          <td>{add.name}</td>
                          <td>x{add.quantity}</td>
                          <td className="amount-cell">{formatCurrency(add.unitPrice)}</td>
                          <td className="amount-cell">
                            <strong>{formatCurrency(add.amount)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: BIÊN BẢN BÀN GIAO & TRẢ MÁY KÈM ẢNH */}
          <div className="admin-detail-card">
            <div className="admin-card-header">
              <span className="admin-section-num">03</span>
              <div>
                <h3>Biên bản bàn giao, kiểm tra tình trạng & Ảnh chụp</h3>
                <p>Chi tiết biên bản kiểm tra thiết bị khi giao máy và khi nhận lại từ khách.</p>
              </div>
            </div>

            {!booking.handovers || booking.handovers.length === 0 ? (
              <div className="admin-empty-handovers">
                <p>
                  Chưa có biên bản giao nhận nào được tạo. Khi nhân viên thực hiện thao tác{" "}
                  <strong>"Bàn giao máy cho khách"</strong> hoặc <strong>"Tiếp nhận trả máy"</strong>, biên bản kiểm tra và ảnh chụp hiện trạng sẽ tự động lưu trữ tại đây.
                </p>
              </div>
            ) : (
              <div className="admin-handovers-list">
                {booking.handovers.map((h, idx) => {
                  const isPickup = h.kind === "PICKUP";
                  return (
                    <div key={idx} className="admin-handover-record">
                      <div className="admin-handover-head">
                        <span className={`admin-handover-badge ${isPickup ? "pickup" : "return"}`}>
                          {isPickup ? "BIÊN BẢN BÀN GIAO MÁY (PICKUP)" : "BIÊN BẢN TIẾP NHẬN TRẢ MÁY (RETURN)"}
                        </span>
                        <span className="admin-subtext">{formatDateTime(h.createdAt)}</span>
                      </div>

                      {isPickup && (
                        <div className="admin-id-checked-tag">
                          <span>Đã đối chiếu và kiểm tra Giấy tờ tùy thân / CCCD của khách</span>
                        </div>
                      )}

                      {/* Checklist */}
                      {h.checklist && Array.isArray(h.checklist) && (
                        <div className="admin-checklist-summary">
                          <strong>Danh mục hạng mục kiểm tra:</strong>
                          <ul className="admin-checklist-summary-list">
                            {h.checklist.map((item, cIdx) => (
                              <li key={cIdx} className={item.ok ? "is-ok" : "is-not-ok"}>
                                <span className="status-indicator">{item.ok ? "✓" : "✕"}</span>
                                <span className="item-title">{item.item}</span>
                                {item.note && <span className="item-note">({item.note})</span>}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Condition Notes */}
                      {h.conditionNotes && (
                        <div className="admin-condition-box">
                          <strong>Ghi chú hiện trạng:</strong>
                          <p>{h.conditionNotes}</p>
                        </div>
                      )}

                      {/* Photo Gallery with Signed URLs */}
                      {h.photoUrls && h.photoUrls.length > 0 && (
                        <div className="admin-handover-photos-wrap">
                          <strong>Hình ảnh biên bản ({h.photoUrls.length} ảnh):</strong>
                          <div className="admin-handover-photos-grid">
                            {h.photoUrls.map((pUrl, pIdx) => (
                              <div
                                key={pIdx}
                                className="admin-handover-photo-thumb"
                                onClick={() => setLightboxUrl(pUrl)}
                                title="Nhấp để phóng to ảnh"
                              >
                                <img src={pUrl} alt={`Ảnh biên bản ${pIdx + 1}`} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CUSTOMER, BRANCH & FINANCIAL SUMMARY */}
        <div className="admin-order-side-col">
          {/* CUSTOMER CARD */}
          <div className="admin-detail-card">
            <div className="admin-card-header">
              <span className="admin-section-num">C</span>
              <div>
                <h3>Thông tin khách hàng</h3>
                <p>Dữ liệu tài khoản người thuê và liên hệ nhận máy.</p>
              </div>
            </div>

            <div className="admin-info-stack">
              <div className="admin-info-row">
                <span className="info-label">Tên khách hàng:</span>
                <strong>{customerName}</strong>
              </div>
              <div className="admin-info-row">
                <span className="info-label">Số điện thoại:</span>
                <strong>{customerPhone}</strong>
              </div>
              <div className="admin-info-row">
                <span className="info-label">Email:</span>
                <span>{booking.customer?.email || "--"}</span>
              </div>
              <div className="admin-info-row">
                <span className="info-label">Tài khoản & KYC:</span>
                <div className="admin-kyc-tags">
                  <span className="admin-status-chip active">
                    {booking.customer?.status || "ACTIVE"}
                  </span>
                  <span className="admin-order-badge">
                    KYC: {booking.customer?.kycStatus || "NONE"}
                  </span>
                </div>
              </div>
              <div className="admin-info-row">
                <span className="info-label">Ghi chú từ khách:</span>
                <p className="admin-note-text">
                  {booking.note || "Không có ghi chú thêm từ khách hàng."}
                </p>
              </div>
            </div>
          </div>

          {/* BRANCH CARD */}
          <div className="admin-detail-card">
            <div className="admin-card-header">
              <span className="admin-section-num">B</span>
              <div>
                <h3>Chi nhánh phục vụ</h3>
                <p>Địa điểm bàn giao và tiếp nhận thiết bị.</p>
              </div>
            </div>

            <div className="admin-info-stack">
              <div className="admin-info-row">
                <span className="info-label">Chi nhánh:</span>
                <strong>{booking.branch?.name || "Chi nhánh chính"}</strong>
              </div>
              <div className="admin-info-row">
                <span className="info-label">Địa chỉ:</span>
                <span>{booking.branch?.address || "Hà Nội"}</span>
              </div>
              <div className="admin-info-row">
                <span className="info-label">Hotline:</span>
                <span>{booking.branch?.phone || "--"}</span>
              </div>
            </div>
          </div>

          {/* FINANCIAL SUMMARY & PAYMENTS CARD */}
          <div className="admin-detail-card">
            <div className="admin-card-header">
              <span className="admin-section-num">$</span>
              <div>
                <h3>Phân tích tài chính & Tiền cọc</h3>
                <p>Cơ cấu tiền thuê, tiền cọc và lịch sử các khoản giao dịch.</p>
              </div>
            </div>

            <div className="admin-finance-breakdown">
              <div className="finance-line">
                <span>Tiền thuê thiết bị ({booking.days} ngày):</span>
                <span>{formatCurrency(booking.rentalAmount)}</span>
              </div>
              {booking.addonsAmount > 0 && (
                <div className="finance-line">
                  <span>Phụ kiện & Cuộn phim:</span>
                  <span>{formatCurrency(booking.addonsAmount)}</span>
                </div>
              )}
              <div className="finance-line total">
                <strong>Tổng tiền thuê:</strong>
                <strong>{formatCurrency((booking.rentalAmount || 0) + (booking.addonsAmount || 0))}</strong>
              </div>
              <div className="finance-line deposit">
                <span>Tiền cọc thiết bị:</span>
                <span>{formatCurrency(booking.depositAmount)}</span>
              </div>
              <div className="finance-line pickup-due">
                <strong>Tổng cần thu lúc nhận máy:</strong>
                <strong className="text-primary">{formatCurrency(booking.totalDueAtPickup)}</strong>
              </div>
            </div>

            {/* PAYMENT RECORDS HISTORY */}
            <div className="admin-payments-history">
              <h4>Lịch sử giao dịch & Phiếu thu/chi ({booking.payments?.length || 0})</h4>
              {!booking.payments || booking.payments.length === 0 ? (
                <p className="admin-subtext text-muted">Chưa phát sinh giao dịch nào.</p>
              ) : (
                <div className="admin-payment-records-list">
                  {booking.payments.map((p, idx) => (
                    <div key={idx} className="admin-payment-item">
                      <div className="payment-top">
                        <span className={`payment-type-badge ${p.type.toLowerCase()}`}>
                          {p.type === "RENTAL_RECEIVED" && "Tiền thuê đã thu"}
                          {p.type === "DEPOSIT_RECEIVED" && "Tiền cọc đã thu"}
                          {p.type === "DEPOSIT_REFUNDED" && "Hoàn cọc cho khách"}
                          {p.type === "DAMAGE_CHARGE" && "Khấu trừ hư hỏng"}
                          {p.type === "LATE_FEE" && "Khấu trừ trễ hạn"}
                        </span>
                        <strong className="payment-amount">
                          {p.type === "DEPOSIT_REFUNDED" ? "-" : "+"}
                          {formatCurrency(p.amount)}
                        </strong>
                      </div>
                      <div className="payment-sub">
                        <span>Hình thức: {p.method === "CASH" ? "Tiền mặt" : "Chuyển khoản"}</span>
                        <span>{formatDateTime(p.createdAt)}</span>
                      </div>
                      {p.note && <div className="payment-note">{p.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIGHTBOX FOR HANDOVER PHOTOS */}
      {lightboxUrl && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="admin-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="admin-lightbox-close"
              onClick={() => setLightboxUrl(null)}
            >
              ✕
            </button>
            <img src={lightboxUrl} alt="Phóng to ảnh biên bản" />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIRM BOOKING */}
      {/* ========================================================================= */}
      {activeModal === "confirm" && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseModal}
        >
          <div className="admin-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge">PHÊ DUYỆT ĐƠN THUÊ</span>
              <h3>Xác nhận duyệt đơn #{booking.code || booking.id.slice(0, 8)}</h3>
            </div>
            {modalError && <div className="form-alert error">{modalError}</div>}
            <div className="admin-dialog-body">
              <p>
                Bạn có chắc chắn muốn phê duyệt đơn thuê của khách hàng <strong>{customerName}</strong>?
              </p>
              <p className="admin-dialog-note">
                Đơn thuê sẽ chuyển sang trạng thái <strong>ĐÃ XÁC NHẬN</strong>.
                Khách hàng sẽ nhận thông báo đến chi nhánh {booking.branch?.name} vào ngày {formatDate(booking.startDate)} để nhận thiết bị.
              </p>
            </div>
            <div className="admin-dialog-actions">
              <button
                type="button"
                className="button secondary-button compact"
                onClick={handleCloseModal}
                disabled={modalSubmitting}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="button primary-button compact"
                onClick={handleConfirmSubmit}
                disabled={modalSubmitting}
              >
                {modalSubmitting ? "Đang xử lý..." : "Xác nhận duyệt"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REJECT BOOKING */}
      {/* ========================================================================= */}
      {activeModal === "reject" && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseModal}
        >
          <div className="admin-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge danger">TỪ CHỐI ĐƠN THUÊ</span>
              <h3>Từ chối đơn #{booking.code || booking.id.slice(0, 8)}</h3>
            </div>
            {modalError && <div className="form-alert error">{modalError}</div>}
            <form onSubmit={handleRejectSubmit} className="admin-dialog-form">
              <p>
                Khách hàng: <strong>{customerName}</strong> ({customerPhone})
              </p>
              <div className="admin-field-group">
                <label htmlFor="modal-reject-reason">
                  Lý do từ chối đơn thuê <span className="req">*</span>
                </label>
                <textarea
                  id="modal-reject-reason"
                  rows={3}
                  placeholder="Ví dụ: Thiết bị cần kiểm tra kỹ thuật, không thể đáp ứng thời gian thuê..."
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  required
                />
              </div>
              <div className="admin-dialog-actions">
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={handleCloseModal}
                  disabled={modalSubmitting}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="button danger-button compact"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Đang lưu..." : "Xác nhận từ chối"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: CANCEL BOOKING */}
      {/* ========================================================================= */}
      {activeModal === "cancel" && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseModal}
        >
          <div className="admin-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge danger">HỦY ĐƠN THUÊ</span>
              <h3>Hủy đơn #{booking.code || booking.id.slice(0, 8)}</h3>
            </div>
            {modalError && <div className="form-alert error">{modalError}</div>}
            <form onSubmit={handleCancelSubmit} className="admin-dialog-form">
              <p>
                Hủy đơn thuê của khách hàng <strong>{customerName}</strong>.
              </p>
              <div className="admin-field-group">
                <label htmlFor="modal-cancel-reason">
                  Lý do hủy đơn thuê <span className="req">*</span>
                </label>
                <textarea
                  id="modal-cancel-reason"
                  rows={3}
                  placeholder="Ví dụ: Khách hàng yêu cầu hủy đơn qua điện thoại..."
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  required
                />
              </div>
              <div className="admin-dialog-actions">
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={handleCloseModal}
                  disabled={modalSubmitting}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="button danger-button compact"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Đang xử lý..." : "Xác nhận hủy đơn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PICKUP BOOKING (BÀN GIAO MÁY & THU TIỀN) */}
      {/* ========================================================================= */}
      {activeModal === "pickup" && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseModal}
        >
          <div className="admin-operation-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge">QUY TRÌNH BÀN GIAO THIẾT BỊ</span>
              <h3>Bàn giao máy & Thu tiền đơn #{booking.code || booking.id.slice(0, 8)}</h3>
            </div>

            {modalError && <div className="form-alert error">{modalError}</div>}
            {uploadProgressText && (
              <div className="form-alert info">
                <span className="admin-spinner compact" />
                <span>{uploadProgressText}</span>
              </div>
            )}

            <form onSubmit={handlePickupSubmit} className="admin-dialog-form">
              {/* Step 1: Kiểm tra CCCD */}
              <div className="admin-form-block">
                <h4>1. Xác thực danh tính khách hàng</h4>
                <label className="checkbox-label admin-id-check-box">
                  <input
                    type="checkbox"
                    checked={pickupIdChecked}
                    onChange={(e) => setPickupIdChecked(e.target.checked)}
                    required
                  />
                  <span>
                    <strong>Xác nhận đã đối chiếu CCCD / Giấy tờ tùy thân</strong> của khách{" "}
                    <strong>{customerName}</strong> khớp với hợp đồng.
                  </span>
                </label>
              </div>

              {/* Step 2: Checklist bàn giao */}
              <div className="admin-form-block">
                <h4>2. Kiểm tra hiện trạng thiết bị bàn giao</h4>
                <div className="admin-checklist-editor">
                  {pickupChecklist.map((item, idx) => (
                    <div key={idx} className="admin-checklist-editor-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={item.ok}
                          onChange={(e) =>
                            updateChecklistItem(setPickupChecklist, idx, "ok", e.target.checked)
                          }
                        />
                        <span>{item.item}</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ghi chú (nếu có trầy xước, thiếu nắp...)"
                        value={item.note || ""}
                        onChange={(e) =>
                          updateChecklistItem(setPickupChecklist, idx, "note", e.target.value)
                        }
                        className="admin-checklist-note-input"
                      />
                    </div>
                  ))}
                </div>

                <div className="admin-field-group" style={{ marginTop: "0.75rem" }}>
                  <label htmlFor="pickup-condition">Ghi chú tổng thể tình trạng thiết bị:</label>
                  <textarea
                    id="pickup-condition"
                    rows={2}
                    placeholder="Máy hoạt động bình thường, cảm biến sạch, thân máy mới..."
                    value={pickupConditionNotes}
                    onChange={(e) => setPickupConditionNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Step 3: Tải ảnh biên bản */}
              <div className="admin-form-block">
                <h4>3. Ảnh chụp biên bản hiện trạng bàn giao <span className="req">*</span></h4>
                <p className="field-hint">
                  Chụp hoặc tải lên tối thiểu 1 ảnh chụp rõ thân máy và phụ kiện bàn giao để làm bằng chứng bảo toàn cọc.
                </p>
                <div className="admin-upload-box">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    id="pickup-photos-input"
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files);
                        setPickupFiles((prev) => [...prev, ...newFiles]);
                        const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
                        setPickupFilePreviews((prev) => [...prev, ...newPreviews]);
                      }
                      e.target.value = "";
                    }}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="pickup-photos-input" className="admin-upload-label">
                    <span className="upload-text">Nhấp để chọn ảnh biên bản bàn giao</span>
                    <span className="upload-sub">Định dạng JPG, PNG, WebP (Tối đa 8MB mỗi ảnh)</span>
                  </label>
                </div>

                {pickupFilePreviews.length > 0 && (
                  <div className="admin-previews-grid">
                    {pickupFilePreviews.map((pUrl, idx) => (
                      <div key={idx} className="admin-preview-item">
                        <img src={pUrl} alt="Xem trước" />
                        <button
                          type="button"
                          className="admin-preview-remove"
                          onClick={() => {
                            URL.revokeObjectURL(pUrl);
                            setPickupFiles((prev) => prev.filter((_, i) => i !== idx));
                            setPickupFilePreviews((prev) => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 4: Thu tiền tại quầy */}
              <div className="admin-form-block">
                <h4>4. Thu tiền lúc giao máy</h4>
                <div className="admin-pickup-payments-box">
                  <div className="admin-payment-row">
                    <div>
                      <strong>Tiền thuê máy & phụ kiện:</strong>
                      <span className="amount-highlight">
                        {formatCurrency((booking.rentalAmount || 0) + (booking.addonsAmount || 0))}
                      </span>
                    </div>
                    <div className="admin-field-group">
                      <label>Hình thức thu tiền:</label>
                      <select
                        value={pickupRentalMethod}
                        onChange={(e) => setPickupRentalMethod(e.target.value)}
                      >
                        <option value="CASH">Tiền mặt tại quầy</option>
                        <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-payment-row">
                    <div>
                      <strong>Tiền cọc thiết bị:</strong>
                      <span className="amount-highlight">
                        {formatCurrency(booking.depositAmount || 0)}
                      </span>
                    </div>
                    <div className="admin-field-group">
                      <label>Hình thức thu cọc:</label>
                      <select
                        value={pickupDepositMethod}
                        onChange={(e) => setPickupDepositMethod(e.target.value)}
                      >
                        <option value="BANK_TRANSFER">Chuyển khoản ngân hàng (Khuyên dùng)</option>
                        <option value="CASH">Tiền mặt tại quầy</option>
                      </select>
                    </div>
                  </div>

                  <div className="admin-pickup-total-bar">
                    <span>Tổng tiền cần thu thực tế:</span>
                    <strong>{formatCurrency(booking.totalDueAtPickup)}</strong>
                  </div>
                </div>
              </div>

              <div className="admin-dialog-actions">
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={handleCloseModal}
                  disabled={modalSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="button primary-button compact"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Đang xử lý..." : "Xác nhận bàn giao & Thu tiền"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: RETURN BOOKING (TIẾP NHẬN TRẢ MÁY) */}
      {/* ========================================================================= */}
      {activeModal === "return" && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseModal}
        >
          <div className="admin-operation-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge">QUY TRÌNH TIẾP NHẬN THIẾT BỊ</span>
              <h3>Kiểm tra & Nhận lại máy đơn #{booking.code || booking.id.slice(0, 8)}</h3>
            </div>

            {modalError && <div className="form-alert error">{modalError}</div>}
            {uploadProgressText && (
              <div className="form-alert info">
                <span className="admin-spinner compact" />
                <span>{uploadProgressText}</span>
              </div>
            )}

            <form onSubmit={handleReturnSubmit} className="admin-dialog-form">
              {/* Checklist kiểm tra khi trả máy */}
              <div className="admin-form-block">
                <h4>1. Kiểm tra thiết bị khi khách hoàn trả</h4>
                <div className="admin-checklist-editor">
                  {returnChecklist.map((item, idx) => (
                    <div key={idx} className="admin-checklist-editor-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={item.ok}
                          onChange={(e) =>
                            updateChecklistItem(setReturnChecklist, idx, "ok", e.target.checked)
                          }
                        />
                        <span>{item.item}</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ghi chú (nếu phát hiện hư hỏng, trầy xước...)"
                        value={item.note || ""}
                        onChange={(e) =>
                          updateChecklistItem(setReturnChecklist, idx, "note", e.target.value)
                        }
                        className="admin-checklist-note-input"
                      />
                    </div>
                  ))}
                </div>

                <div className="admin-field-group" style={{ marginTop: "0.75rem" }}>
                  <label htmlFor="return-condition">Ghi chú tình trạng thiết bị khi thu hồi:</label>
                  <textarea
                    id="return-condition"
                    rows={2}
                    placeholder="Thiết bị hoạt động ổn định, phụ kiện đầy đủ..."
                    value={returnConditionNotes}
                    onChange={(e) => setReturnConditionNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Tải ảnh biên bản nhận máy */}
              <div className="admin-form-block">
                <h4>2. Ảnh chụp hiện trạng thiết bị khi thu hồi <span className="req">*</span></h4>
                <p className="field-hint">
                  Chụp rõ tình trạng ngoại hình, cảm biến và các phụ kiện được hoàn trả.
                </p>
                <div className="admin-upload-box">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    id="return-photos-input"
                    onChange={(e) => {
                      if (e.target.files) {
                        const newFiles = Array.from(e.target.files);
                        setReturnFiles((prev) => [...prev, ...newFiles]);
                        const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
                        setReturnFilePreviews((prev) => [...prev, ...newPreviews]);
                      }
                      e.target.value = "";
                    }}
                    style={{ display: "none" }}
                  />
                  <label htmlFor="return-photos-input" className="admin-upload-label">
                    <span className="upload-text">Nhấp để chọn ảnh hiện trạng trả máy</span>
                    <span className="upload-sub">Định dạng JPG, PNG, WebP (Tối đa 8MB mỗi ảnh)</span>
                  </label>
                </div>

                {returnFilePreviews.length > 0 && (
                  <div className="admin-previews-grid">
                    {returnFilePreviews.map((pUrl, idx) => (
                      <div key={idx} className="admin-preview-item">
                        <img src={pUrl} alt="Xem trước" />
                        <button
                          type="button"
                          className="admin-preview-remove"
                          onClick={() => {
                            URL.revokeObjectURL(pUrl);
                            setReturnFiles((prev) => prev.filter((_, i) => i !== idx));
                            setReturnFilePreviews((prev) => prev.filter((_, i) => i !== idx));
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="admin-dialog-actions">
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={handleCloseModal}
                  disabled={modalSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="button primary-button compact"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Đang xử lý..." : "Xác nhận nhận lại máy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: COMPLETE BOOKING (NGHIỆM THU & HOÀN CỌC) */}
      {/* ========================================================================= */}
      {activeModal === "complete" && (
        <div
          className="admin-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseModal}
        >
          <div className="admin-operation-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dialog-header">
              <span className="admin-dialog-badge success">NGHIỆM THU & ĐỐI SOÁT CỌC</span>
              <h3>Nghiệm thu đơn #{booking.code || booking.id.slice(0, 8)}</h3>
            </div>

            {modalError && <div className="form-alert error">{modalError}</div>}

            <form onSubmit={handleCompleteSubmit} className="admin-dialog-form">
              {/* Thống kê tiền cọc */}
              <div className="admin-deposit-summary-box">
                <div className="summary-item">
                  <span>Tiền cọc đã thu từ khách:</span>
                  <strong>{formatCurrency(depositCollected)}</strong>
                </div>
                <div className="summary-item">
                  <span>Tổng tiền khấu trừ:</span>
                  <strong className="text-danger">-{formatCurrency(totalCharges)}</strong>
                </div>
                <div className="summary-item highlight">
                  <span>Số tiền thực tế hoàn trả cho khách:</span>
                  <strong className="text-success">{formatCurrency(refundDue)}</strong>
                </div>
              </div>

              {/* Các khoản khấu trừ */}
              <div className="admin-form-block">
                <div className="admin-section-subtitle">
                  <h4>Các khoản khấu trừ cọc (nếu có)</h4>
                  <div className="admin-charge-add-buttons">
                    <button
                      type="button"
                      className="button secondary-button compact"
                      onClick={() => handleAddCharge("DAMAGE_CHARGE")}
                    >
                      + Khấu trừ hư hại / trầy xước
                    </button>
                    <button
                      type="button"
                      className="button secondary-button compact"
                      onClick={() => handleAddCharge("LATE_FEE")}
                    >
                      + Phí quá hạn / trễ hẹn
                    </button>
                  </div>
                </div>

                {charges.length === 0 ? (
                  <p className="admin-subtext text-muted">
                    Không có khoản khấu trừ nào. Hoàn trả toàn bộ 100% tiền cọc cho khách.
                  </p>
                ) : (
                  <div className="admin-charges-editor-list">
                    {charges.map((charge, idx) => (
                      <div key={idx} className="admin-charge-row">
                        <span className="charge-type-tag">
                          {charge.type === "DAMAGE_CHARGE" ? "Hư hại thiết bị" : "Phí trả trễ"}
                        </span>
                        <div className="admin-field-group">
                          <input
                            type="number"
                            min="0"
                            step="10000"
                            placeholder="Số tiền khấu trừ (VNĐ)"
                            value={charge.amount || ""}
                            onChange={(e) =>
                              handleUpdateCharge(idx, "amount", e.target.value)
                            }
                            required
                          />
                        </div>
                        <div className="admin-field-group" style={{ flex: 2 }}>
                          <input
                            type="text"
                            placeholder="Ghi chú chi tiết lý do khấu trừ..."
                            value={charge.note || ""}
                            onChange={(e) =>
                              handleUpdateCharge(idx, "note", e.target.value)
                            }
                          />
                        </div>
                        <button
                          type="button"
                          className="admin-remove-btn"
                          onClick={() => handleRemoveCharge(idx)}
                          title="Xóa khoản khấu trừ này"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Phương thức hoàn cọc */}
              <div className="admin-form-block">
                <h4>Phương thức hoàn trả cọc cho khách</h4>
                <div className="admin-field-group">
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                  >
                    <option value="BANK_TRANSFER">Chuyển khoản ngân hàng (Khuyên dùng)</option>
                    <option value="CASH">Tiền mặt tại quầy</option>
                  </select>
                </div>

                <div className="admin-field-group" style={{ marginTop: "0.75rem" }}>
                  <label htmlFor="complete-note">Ghi chú đối soát hoàn cọc (Tùy chọn):</label>
                  <input
                    id="complete-note"
                    type="text"
                    placeholder="Ví dụ: Đã chuyển khoản qua STK Vietcombank của khách lúc..."
                    value={completeNote}
                    onChange={(e) => setCompleteNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="admin-dialog-actions">
                <button
                  type="button"
                  className="button secondary-button compact"
                  onClick={handleCloseModal}
                  disabled={modalSubmitting}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="button primary-button compact"
                  disabled={modalSubmitting}
                >
                  {modalSubmitting ? "Đang xử lý..." : "Xác nhận nghiệm thu & Hoàn cọc"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrderDetailPage;