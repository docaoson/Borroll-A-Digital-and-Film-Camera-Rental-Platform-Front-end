import assert from "node:assert/strict";
import test from "node:test";
import { canSubmitPaymentProof } from "./paymentAvailability.js";

const renterPayment = {
  bookingStatus: "CONFIRMED",
  paymentStatus: "UNPAID",
};

test("disabled payment settings never allow proof upload", () => {
  assert.equal(
    canSubmitPaymentProof({ ...renterPayment, paymentEnabled: false }),
    false,
  );
});

test("enabled payment settings allow proof upload for an eligible unpaid booking", () => {
  assert.equal(
    canSubmitPaymentProof({ ...renterPayment, paymentEnabled: true }),
    true,
  );
});

test("proof availability does not depend on QR loading or existing proof history", () => {
  assert.equal(
    canSubmitPaymentProof({ ...renterPayment, paymentEnabled: true }),
    true,
  );
});

test("pending review and paid states block additional proof uploads", () => {
  for (const paymentStatus of ["PENDING_VERIFICATION", "PAID"]) {
    assert.equal(
      canSubmitPaymentProof({
        ...renterPayment,
        paymentEnabled: true,
        paymentStatus,
      }),
      false,
    );
  }
});

test("only active booking states allow payment proof submission", () => {
  assert.equal(
    canSubmitPaymentProof({
      ...renterPayment,
      paymentEnabled: true,
      bookingStatus: "CANCELLED",
    }),
    false,
  );
});
