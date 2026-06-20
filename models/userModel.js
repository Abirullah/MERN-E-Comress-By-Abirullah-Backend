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

    productName: {
      type: String,
      default: "",
    },

    productBrand: {
      type: String,
      default: "",
    },

    brand: {
      type: String,
      default: "",
    },

    productImage: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
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

    paymentMethod: {
      type: String,
      enum: ["bankTransfer", "cod", "creditCard"],
      default: "bankTransfer",
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Submitted", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },

    shippingAddress: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    paymentDetails: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    paymentSlipData: {
      type: String,
      default: null,
    },

    paymentSlipName: {
      type: String,
      default: null,
    },

    paymentSlipMimeType: {
      type: String,
      default: null,
    },

    selectedVariant: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
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

    adminMessage: {
      type: String,
      default: "",
    },

    trackingNumber: {
      type: String,
      default: "",
    },

    courierName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const userCreditCardSchema = new mongoose.Schema(
  {
    nameOnCard: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
    },

    cardNumber: {
      type: String,
      required: true,
    },

    expirationDate: {
      type: String,
      required: true,
    },

    cvv: {
      type: String,
      required: true,
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
    CreditCardInfo: {
      type: userCreditCardSchema,
      default: null,

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

    accountStatus: {
      type: Boolean,
      default: true,
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
