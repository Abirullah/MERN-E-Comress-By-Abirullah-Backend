import Stripe from "stripe";
import asyncHandler from "../middlewares/asyncHandler.js";
import Product from "../models/ProductModel.js";
import User from "../models/userModel.js";
import {
  buildOrderPayload,
  normalizePaymentMethod,
  summarizeOrder,
} from "../HealpingMaterials/OrderHelper.js";

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;

  if (!secretKey) {
    throw new Error("Stripe secret key is not configured");
  }

  return new Stripe(secretKey);
};

const getClientUrl = () => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

  return clientUrl
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");
};

const normalizeQuantity = (value) => {
  const quantity = Number(value);

  if (!Number.isFinite(quantity) || quantity < 1) {
    return 1;
  }

  return Math.trunc(quantity);
};

const buildStripeProductData = (product) => {
  const productData = {
    name: product.name,
  };

  if (product.description) {
    productData.description = product.description;
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    productData.images = product.images.filter(Boolean);
  }

  return productData;
};

const getCheckoutUnitPrice = (product) => {
  const basePrice = Number(product.price || 0);
  const discountPrice = Number(product.discountPrice || 0);

  if (discountPrice > 0 && discountPrice < basePrice) {
    return discountPrice;
  }

  return basePrice;
};

const parseMaybeJson = (value) => {
  if (!value || typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const createOrderRecord = async ({
  user,
  product,
  quantity,
  shippingDetails,
  paymentDetails,
  selectedVariant,
  stripeSessionId = null,
  orderStatus = "Pending",
  paymentStatus,
}) => {
  const totalAmount = getCheckoutUnitPrice(product) * quantity;
  const orderPayload = buildOrderPayload({
    product,
    quantity,
    totalAmount,
    shippingDetails,
    paymentDetails,
    selectedVariant,
    stripeSessionId,
    orderStatus,
    paymentStatus,
  });

  if (!Array.isArray(user.OrderedProducts)) {
    user.OrderedProducts = [];
  }

  const order = user.OrderedProducts.create(orderPayload);
  user.OrderedProducts.push(order);
  await user.save();

  return order;
};

const updateOrderRecord = async ({
  user,
  order,
  stripeSessionId,
  paymentStatus = "Paid",
  orderStatus = "Processing",
}) => {
  order.stripeSessionId = stripeSessionId || order.stripeSessionId;
  order.paymentStatus = paymentStatus;
  order.orderStatus = orderStatus;
  await user.save();
  return order;
};

const CreateCheckOut = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  const quantity = normalizeQuantity(req.body?.quantity);
  const paymentType = normalizePaymentMethod(req.body?.paymentType);
  const shippingDetails = parseMaybeJson(req.body?.shippingDetails) || {};
  const paymentDetails = parseMaybeJson(req.body?.paymentDetails) || {};
  const selectedVariant = parseMaybeJson(req.body?.selectedVariant) || null;

  if (quantity > product.countInStock) {
    return res.status(400).json({
      message: "Requested quantity exceeds available stock",
    });
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  if (paymentType === "bankTransfer") {
    const paymentSlipData =
      typeof paymentDetails.paymentSlipData === "string"
        ? paymentDetails.paymentSlipData
        : req.body?.paymentSlipData || null;

    if (!paymentSlipData) {
      return res.status(400).json({
        message: "Bank transfer orders require a payment slip screenshot",
      });
    }

    const order = await createOrderRecord({
      user,
      product,
      quantity,
      shippingDetails,
      paymentDetails: {
        ...paymentDetails,
        paymentType,
        paymentSlipData,
      },
      selectedVariant,
      paymentStatus: "Submitted",
    });

    return res.status(201).json({
      success: true,
      message: "Bank transfer order saved successfully",
      order: summarizeOrder(order),
    });
  }

  if (paymentType === "cod") {
    const order = await createOrderRecord({
      user,
      product,
      quantity,
      shippingDetails,
      paymentDetails: {
        ...paymentDetails,
        paymentType,
      },
      selectedVariant,
      paymentStatus: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Cash on delivery order saved successfully",
      order: summarizeOrder(order),
    });
  }

  const stripe = getStripeClient();
  const order = await createOrderRecord({
    user,
    product,
    quantity,
    shippingDetails,
    paymentDetails: {
      ...paymentDetails,
      paymentType: "creditCard",
    },
    selectedVariant,
    paymentStatus: "Pending",
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: buildStripeProductData(product),
          unit_amount: Math.round(getCheckoutUnitPrice(product) * 100),
        },
        quantity,
      },
    ],
    success_url: `${getClientUrl()}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getClientUrl()}/cancel`,
    metadata: {
      userId: req.user._id.toString(),
      productId: product._id.toString(),
      quantity: quantity.toString(),
      orderId: order._id.toString(),
    },
  });

  order.stripeSessionId = session.id;
  await user.save();

  res.status(201).json({
    success: true,
    message: "Checkout session created",
    sessionId: session.id,
    url: session.url,
    order: summarizeOrder(order),
  });
});

const StripeWebhook = asyncHandler(async (req, res) => {
  const stripe = getStripeClient();
  const signature = req.headers["stripe-signature"];
  const webhookSecret =
    process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_KEY;

  if (!webhookSecret) {
    return res.status(500).json({
      message: "Stripe webhook secret is not configured",
    });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { userId, orderId, productId, quantity } = session.metadata || {};

    if (!userId) {
      return res.status(400).json({
        message: "Checkout session metadata is missing",
      });
    }

    const user = await User.findById(userId).populate("OrderedProducts.product");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let order = null;

    if (orderId) {
      order = user.OrderedProducts.id(orderId);
    }

    if (!order && session.id) {
      order = (user.OrderedProducts || []).find(
        (entry) => entry.stripeSessionId === session.id
      );
    }

    if (!order) {
      const product = productId ? await Product.findById(productId) : null;

      if (product) {
        order = await createOrderRecord({
          user,
          product,
          quantity: normalizeQuantity(quantity),
          shippingDetails: {},
          paymentDetails: {
            paymentType: "creditCard",
          },
          selectedVariant: null,
          stripeSessionId: session.id,
          orderStatus: "Pending",
          paymentStatus: "Paid",
        });
      }
    } else {
      await updateOrderRecord({
        user,
        order,
        stripeSessionId: session.id,
        paymentStatus: "Paid",
        orderStatus: "Processing",
      });
    }
  }

  res.json({ received: true });
});

export { CreateCheckOut, StripeWebhook };

