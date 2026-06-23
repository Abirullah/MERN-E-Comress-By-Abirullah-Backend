import mongoose from "mongoose";

import asyncHandler from "../middlewares/asyncHandler.js";
import Notification from "../models/NotificationModel.js";
import User from "../models/userModel.js";

const DEFAULT_NOTIFICATION_TITLE = "New notification";
const DEFAULT_NOTIFICATION_LIMIT = 20;
const DEFAULT_NOTIFICATION_PREVIEW_LIMIT = 5;
const MAX_NOTIFICATION_LIMIT = 50;

const createNotificationError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const parseRecipientInput = (value) => {
  if (value === undefined || value === null || value === "") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => parseRecipientInput(entry));
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(trimmedValue);

      if (Array.isArray(parsedValue)) {
        return parsedValue.flatMap((entry) => parseRecipientInput(entry));
      }
    } catch {
      if (trimmedValue.includes(",")) {
        return trimmedValue
          .split(",")
          .map((entry) => entry.trim())
          .filter(Boolean);
      }
    }

    return [trimmedValue];
  }

  return [String(value).trim()].filter(Boolean);
};

const normalizeTextInput = (
  value,
  fieldName,
  { required = false, defaultValue = "", maxLength = null } = {}
) => {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw createNotificationError(`${fieldName} is required`);
    }

    return defaultValue;
  }

  const normalizedValue = String(value).trim();

  if (!normalizedValue) {
    if (required) {
      throw createNotificationError(`${fieldName} is required`);
    }

    return defaultValue;
  }

  if (maxLength && normalizedValue.length > maxLength) {
    throw createNotificationError(
      `${fieldName} must be at most ${maxLength} characters long`
    );
  }

  return normalizedValue;
};

const normalizeNotificationPayload = (body = {}) => {
  const recipientIds = parseRecipientInput(
    body.recipientIds ?? body.recipientId ?? body.userIds ?? body.userId
  );

  const normalizedRecipientIds = [
    ...new Set(recipientIds.map((id) => String(id).trim()).filter(Boolean)),
  ];

  return {
    recipientIds: normalizedRecipientIds,
    title: normalizeTextInput(body.title || body.subject, "title", {
      defaultValue: DEFAULT_NOTIFICATION_TITLE,
      maxLength: 120,
    }),
    message: normalizeTextInput(body.message, "message", {
      required: true,
      maxLength: 2000,
    }),
    link: normalizeTextInput(body.link, "link", {
      defaultValue: "",
      maxLength: 500,
    }),
  };
};

const serializeSender = (sender) => {
  if (!sender) {
    return null;
  }

  const senderId = sender._id ?? sender;

  return {
    _id: senderId?.toString ? senderId.toString() : String(senderId),
    name: sender.name || "",
  };
};

const serializeNotification = (notification) => ({
  _id: notification._id?.toString ? notification._id.toString() : String(notification._id),
  recipient: notification.recipient?._id?.toString
    ? notification.recipient._id.toString()
    : notification.recipient?.toString?.() || String(notification.recipient || ""),
  sender: serializeSender(notification.sender),
  title: notification.title,
  message: notification.message,
  link: notification.link || "",
  isRead: Boolean(notification.isRead),
  readAt: notification.readAt || null,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
});

const getRecipientNotifications = async (userId, { page, limit }) => {
  const filter = { recipient: userId };
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "name"),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  return {
    notifications: notifications.map(serializeNotification),
    unreadCount,
    total,
  };
};

export const getUserNotificationSummary = async (userId) => {
  const { notifications, unreadCount } = await getRecipientNotifications(userId, {
    page: 1,
    limit: DEFAULT_NOTIFICATION_PREVIEW_LIMIT,
  });

  return {
    unreadCount,
    recentNotifications: notifications,
  };
};

export const sendNotifications = asyncHandler(async (req, res) => {
  const { recipientIds, title, message, link } = normalizeNotificationPayload(req.body);

  if (!recipientIds.length) {
    throw createNotificationError("Provide at least one recipient");
  }

  const invalidRecipientIds = recipientIds.filter(
    (recipientId) => !mongoose.Types.ObjectId.isValid(recipientId)
  );

  if (invalidRecipientIds.length > 0) {
    throw createNotificationError(
      `Invalid recipient id(s): ${invalidRecipientIds.join(", ")}`
    );
  }

  const users = await User.find({ _id: { $in: recipientIds } }).select("_id");
  const foundRecipientIds = new Set(users.map((user) => user._id.toString()));
  const missingRecipientIds = recipientIds.filter(
    (recipientId) => !foundRecipientIds.has(recipientId)
  );

  if (missingRecipientIds.length > 0) {
    throw createNotificationError(
      `Recipient not found: ${missingRecipientIds.join(", ")}`,
      404
    );
  }

  const senderId = req.admin?._id || req.user?._id;

  const notificationsToCreate = recipientIds.map((recipientId) => ({
    recipient: recipientId,
    sender: senderId,
    title,
    message,
    link,
  }));

  const createdNotifications = await Notification.insertMany(notificationsToCreate);
  const populatedNotifications = await Notification.populate(createdNotifications, {
    path: "sender",
    select: "name",
  });

  res.status(201).json({
    message: "Notifications sent successfully",
    count: createdNotifications.length,
    notifications: populatedNotifications.map(serializeNotification),
  });
});

export const getMyNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const requestedLimit = Number(req.query.limit) || DEFAULT_NOTIFICATION_LIMIT;
  const limit = Math.min(Math.max(requestedLimit, 1), MAX_NOTIFICATION_LIMIT);

  const { notifications, unreadCount, total } = await getRecipientNotifications(
    req.user._id,
    { page, limit }
  );

  res.json({
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      pages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  });
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    recipient: req.user._id,
  });

  if (!notification) {
    throw createNotificationError("Notification not found", 404);
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  await notification.populate("sender", "name");

  res.json({
    message: "Notification marked as read",
    notification: serializeNotification(notification),
  });
});

export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const updateResult = await Notification.updateMany(
    {
      recipient: req.user._id,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: new Date(),
      },
    }
  );

  res.json({
    message: "All notifications marked as read",
    modifiedCount: updateResult.modifiedCount ?? updateResult.nModified ?? 0,
  });
});
