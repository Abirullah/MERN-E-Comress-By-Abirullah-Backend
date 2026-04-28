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

const ProductOrderdSchema = new mongoose.Schema(
  {
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    orderDate: {
      type: Date,
      default: Date.now,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    IsRecieved : {
      type: Boolean,
      default: false,
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
    WishingList: UserWishingListSchema,
    OrderedProducts: ProductOrderdSchema,

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
