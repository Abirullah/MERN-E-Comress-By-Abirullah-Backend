const PAYMENT_METHOD_ALIASES = {
  banktransfer: "bankTransfer",
  bank_transfer: "bankTransfer",
  "bank-transfer": "bankTransfer",
  cod: "cod",
  "cash on delivery": "cod",
  "cash-on-delivery": "cod",
  card: "creditCard",
  creditcard: "creditCard",
  "credit card": "creditCard",
};

export const normalizePaymentMethod = (value) => {
  const normalized = String(value || "bankTransfer")
    .trim()
    .toLowerCase();

  return PAYMENT_METHOD_ALIASES[normalized] || value || "bankTransfer";
};

export const normalizeOrderStatus = (value) => {
  const normalized = String(value || "Pending").trim().toLowerCase();

  if (normalized === "delivered" || normalized === "completed") {
    return "Delivered";
  }

  if (normalized === "shipped" || normalized === "shipping") {
    return "Shipped";
  }

  if (normalized === "processing") {
    return "Processing";
  }

  if (normalized === "cancelled" || normalized === "canceled") {
    return "Cancelled";
  }

  return "Pending";
};

export const normalizePaymentStatus = (value) => {
  const normalized = String(value || "Pending").trim().toLowerCase();

  if (normalized === "paid" || normalized === "success" || normalized === "succeeded") {
    return "Paid";
  }

  if (normalized === "submitted" || normalized === "submitted for review") {
    return "Submitted";
  }

  if (normalized === "failed" || normalized === "declined") {
    return "Failed";
  }

  if (normalized === "refunded") {
    return "Refunded";
  }

  return "Pending";
};

export const normalizeShippingAddress = (shippingDetails = {}) => {
  if (!shippingDetails || typeof shippingDetails !== "object") {
    return null;
  }

  const normalized = {
    firstName: String(shippingDetails.firstName || "").trim(),
    lastName: String(shippingDetails.lastName || "").trim(),
    address1: String(shippingDetails.address1 || shippingDetails.line1 || shippingDetails.address || "").trim(),
    address2: String(shippingDetails.address2 || shippingDetails.line2 || "").trim(),
    city: String(shippingDetails.city || "").trim(),
    state: String(shippingDetails.state || "").trim(),
    zip: String(shippingDetails.zip || shippingDetails.postalCode || "").trim(),
    country: String(shippingDetails.country || shippingDetails.countryName || "").trim(),
  };

  return Object.values(normalized).some(Boolean) ? normalized : null;
};

export const normalizeSelectedVariant = (selectedVariant) => {
  if (!selectedVariant || typeof selectedVariant !== "object") {
    return null;
  }

  return {
    size:
      selectedVariant.size !== undefined && selectedVariant.size !== null
        ? Number(selectedVariant.size)
        : null,
    color: selectedVariant.color ? String(selectedVariant.color) : null,
    stock:
      selectedVariant.stock !== undefined && selectedVariant.stock !== null
        ? Number(selectedVariant.stock)
        : null,
  };
};

export const normalizePaymentDetails = (paymentDetails = {}) => {
  if (!paymentDetails || typeof paymentDetails !== "object") {
    return null;
  }

  const normalizedPaymentType = normalizePaymentMethod(
    paymentDetails.paymentType || paymentDetails.method
  );

  return {
    ...paymentDetails,
    paymentType: normalizedPaymentType,
    paymentSlipData:
      typeof paymentDetails.paymentSlipData === "string"
        ? paymentDetails.paymentSlipData
        : null,
    paymentSlipName:
      typeof paymentDetails.paymentSlipName === "string"
        ? paymentDetails.paymentSlipName
        : null,
    paymentSlipMimeType:
      typeof paymentDetails.paymentSlipMimeType === "string"
        ? paymentDetails.paymentSlipMimeType
        : null,
  };
};

export const buildOrderPayload = ({
  product,
  quantity,
  totalAmount,
  shippingDetails,
  paymentDetails,
  selectedVariant,
  stripeSessionId = null,
  orderStatus = "Pending",
  paymentStatus,
}) => {
  const normalizedPaymentDetails = normalizePaymentDetails(paymentDetails) || {};
  const paymentMethod = normalizePaymentMethod(
    normalizedPaymentDetails.paymentType
  );
  const normalizedQuantity = Math.max(1, Number(quantity || 1));
  const normalizedTotal = Number(totalAmount || 0);
  const normalizedShipping = normalizeShippingAddress(shippingDetails);
  const normalizedVariant = normalizeSelectedVariant(selectedVariant);
  const derivedPaymentStatus =
    paymentStatus ||
    (paymentMethod === "bankTransfer" && normalizedPaymentDetails.paymentSlipData
      ? "Submitted"
      : "Pending");

  return {
    product: product._id,
    productName: product.name,
    productBrand: product.brand,
    brand: product.brand,
    productImage: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null,
    image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null,
    quantity: normalizedQuantity,
    totalAmount: normalizedTotal,
    orderDate: new Date(),
    isReceived: false,
    orderStatus: normalizeOrderStatus(orderStatus),
    paymentMethod,
    paymentStatus: normalizePaymentStatus(derivedPaymentStatus),
    shippingAddress: normalizedShipping,
    paymentDetails: normalizedPaymentDetails,
    paymentSlipData: normalizedPaymentDetails.paymentSlipData || null,
    paymentSlipName: normalizedPaymentDetails.paymentSlipName || null,
    paymentSlipMimeType: normalizedPaymentDetails.paymentSlipMimeType || null,
    selectedVariant: normalizedVariant,
    stripeSessionId,
    adminMessage: "",
    trackingNumber: "",
    courierName: "",
  };
};

export const summarizeOrder = (order) => {
  if (!order) {
    return null;
  }

  return {
    _id: order._id,
    product: order.product,
    productName: order.productName,
    productBrand: order.productBrand,
    brand: order.brand,
    productImage: order.productImage,
    image: order.image,
    quantity: order.quantity,
    totalAmount: order.totalAmount,
    orderDate: order.orderDate,
    isReceived: order.isReceived,
    orderStatus: order.orderStatus,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    shippingAddress: order.shippingAddress,
    paymentSlipData: order.paymentSlipData,
    paymentSlipName: order.paymentSlipName,
    paymentSlipMimeType: order.paymentSlipMimeType,
    selectedVariant: order.selectedVariant,
    stripeSessionId: order.stripeSessionId,
    adminMessage: order.adminMessage,
    trackingNumber: order.trackingNumber,
    courierName: order.courierName,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};
