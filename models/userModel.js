import mongoose from "mongoose";

const UserProfileSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },  

    lastName: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: String,
      required: true,
    },
    accountDetails: {
      type: String,
      required: false,
    },
    profilePicture: {
      type: String,
      required: false,
    },
   preferences: {
      type: String,
      required: false,
    },
  },
  { _id: false }
);

const UserWishingListSchema = new mongoose.Schema(
  {
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },

    ],
  },
  { _id: false }
);

const ProductOrderedSchema = new mongoose.Schema(
  {
    stripeSessionId: {
      type: String,
      default: null,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      default: 1,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    orderDate: {
      type: Date,
      default: Date.now,
    },

    isReceived: {
      type: Boolean,
      default: false,
    },

    orderStatus: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
  },
  { _id: false }
);


const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },

    Profile : UserProfileSchema,
    Wishlist: UserWishingListSchema,
    OrderedProducts: {
      type: [ProductOrderedSchema],
      default: [],
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    isAdmin: {
      type: Boolean, 
      default: false,
    }, 
  }, 
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
