import asyncHandler from "express-async-handler";

import User from "../models/userModel.js";
import Product from "../models/ProductModel.js";
import {
  normalizeOrderStatus,
  normalizePaymentStatus,
  summarizeOrder,
} from "../HealpingMaterials/OrderHelper.js";

const collectAllOrders = async () => {
  const users = await User.find({})
    .select("username email Profile accountStatus OrderedProducts")
    .populate("OrderedProducts.product");

  return users.flatMap((user) => {
    const orders = Array.isArray(user.OrderedProducts) ? user.OrderedProducts : [];

    return orders.map((order) => ({
      ...summarizeOrder(order),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profile: user.Profile || null,
        accountStatus: user.accountStatus,
      },
    }));
  });
};

export const getAdminDashboard = asyncHandler(async (req, res) => {
  const [users, products, orders] = await Promise.all([
    User.find({}).select("OrderedProducts accountStatus"),
    Product.find({}),
    collectAllOrders(),
  ]);

  const pendingOrders = orders.filter((order) => order.orderStatus !== "Delivered");
  const deliveredOrders = orders.filter((order) => order.orderStatus === "Delivered");
  const submittedPayments = orders.filter(
    (order) => order.paymentStatus === "Submitted"
  );

  res.json({
    summary: {
      users: users.length,
      products: products.length,
      orders: orders.length,
      pendingOrders: pendingOrders.length,
      deliveredOrders: deliveredOrders.length,
      submittedPayments: submittedPayments.length,
    },
    recentOrders: orders
      .sort((left, right) => {
        const leftDate = new Date(left.orderDate || left.createdAt || 0).getTime();
        const rightDate = new Date(right.orderDate || right.createdAt || 0).getTime();

        return rightDate - leftDate;
      })
      .slice(0, 8),
  });
});

export const getAdminOrders = asyncHandler(async (req, res) => {
  const orders = await collectAllOrders();

  orders.sort((left, right) => {
    const leftDate = new Date(left.orderDate || left.createdAt || 0).getTime();
    const rightDate = new Date(right.orderDate || right.createdAt || 0).getTime();

    return rightDate - leftDate;
  });

  res.json({ orders });
});

export const updateAdminOrder = asyncHandler(async (req, res) => {
  const { userId, orderId } = req.params;
  const {
    orderStatus,
    paymentStatus,
    adminMessage,
    trackingNumber,
    courierName,
  } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const order =
    user.OrderedProducts.id(orderId) ||
    (user.OrderedProducts || []).find(
      (entry) => entry.stripeSessionId === orderId.toString()
    );

  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  if (orderStatus !== undefined) {
    order.orderStatus = normalizeOrderStatus(orderStatus);
  }

  if (paymentStatus !== undefined) {
    order.paymentStatus = normalizePaymentStatus(paymentStatus);
  }

  if (adminMessage !== undefined) {
    order.adminMessage = String(adminMessage || "").trim();
  }

  if (trackingNumber !== undefined) {
    order.trackingNumber = String(trackingNumber || "").trim();
  }

  if (courierName !== undefined) {
    order.courierName = String(courierName || "").trim();
  }

  await user.save();

  res.json({
    message: "Order updated successfully",
    order: summarizeOrder(order),
  });
});
