import Stripe from "stripe";
import asyncHandler from "../middlewares/asyncHandler.js";
import Product from "../models/ProductModel.js";
import User from "../models/userModel.js";

const getStripeClient = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET;

  if (!secretKey) {
    throw new Error("Stripe secret key is not configured");
  }

  return new Stripe(secretKey);
};

const getClientUrl = () => {
  const clientUrl =process.env.CLIENT_URL || "http://localhost:5173";

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

const CreateCheckOut = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return res.status(404).json({
      message: "Product not found",
    });
  }

  const quantity = normalizeQuantity(req.body?.quantity);
  if (quantity > product.countInStock) {
    return res.status(400).json({
      message: "Requested quantity exceeds available stock",
    });
  }
  const stripe = getStripeClient();

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
    },
  });

  res.status(200).json({
    sessionId: session.id,
    url: session.url,
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
    const { userId, productId, quantity } = session.metadata || {};

    if (!userId || !productId) {
      return res.status(400).json({
        message: "Checkout session metadata is missing",
      });
    }

    const user = await User.findById(userId);
    const product = await Product.findById(productId);

    if (!user || !product) {
      return res.status(404).json({
        message: "User or product not found",
      });
    }

    const orderQuantity = normalizeQuantity(quantity);
    const orderedProducts = Array.isArray(user.OrderedProducts)
      ? user.OrderedProducts
      : [];

    const alreadyProcessed = orderedProducts.some(
      (order) => order.stripeSessionId === session.id
    );

    if (alreadyProcessed) {
      return res.json({ received: true });
    }

    if (!Array.isArray(user.OrderedProducts)) {
      user.OrderedProducts = [];
    }

    user.OrderedProducts.push({
      product: product._id,
      quantity: orderQuantity,
      totalAmount: getCheckoutUnitPrice(product) * orderQuantity,
      orderDate: new Date(),
      isReceived: false,
      orderStatus: "Pending",
      stripeSessionId: session.id,
    });

    await user.save();
  }

  res.json({ received: true });
});

export { CreateCheckOut, StripeWebhook };
