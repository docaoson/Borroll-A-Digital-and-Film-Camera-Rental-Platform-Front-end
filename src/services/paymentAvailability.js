const ACCEPTED_BOOKING_STATES = new Set(["PENDING", "CONFIRMED"]);
const BLOCKED_PAYMENT_STATES = new Set(["PENDING_VERIFICATION", "PAID"]);

export function canSubmitPaymentProof({
  paymentEnabled,
  bookingStatus,
  paymentStatus,
}) {
  return (
    paymentEnabled === true &&
    ACCEPTED_BOOKING_STATES.has(bookingStatus) &&
    !BLOCKED_PAYMENT_STATES.has(paymentStatus)
  );
}
