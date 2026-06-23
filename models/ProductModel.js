import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: String,
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: String,
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String, 
      required: true,
    },

    category: {
      type: String,
      default: "Shoes",
    },

    description: {
      type: String,
      required: true,
    },

    images: [
      {
        type: String,
      },
    ],

    variants: [
      {
        size: {
          type: Number,
          required: true,
        },
        color: {
          type: String,
          required: true,
        },
        stock: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],

    price: {
      type: Number,
      required: true,
    },

    pricePKR: {
      type: Number,
      default: 0,
    },

    discountPrice: {
      type: Number,
      default: 0,
    },

    countInStock: {
      type: Number,
      required: true,
      default: 0,
    },

    rating: {
      type: Number,
      default: 0,
    },

    numReviews: {
      type: Number,
      default: 0,
    },

    reviews: [reviewSchema],

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    tags: [
      {
        type : String,
        enum : ["running", "casual", "formal", "sports", "outdoor", "indoor"],
        default : "casual"
      }

    ], 

    gender: {
      type: String,
      enum: ["men", "women", "unisex"],
      default: "unisex",
    },
    status: {
      type: String,
      enum: ["new Arrival", "best seller", "limited edition" , "normal" , "sale"],
      default: "new Arrival",
    },

    off : {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre("save", function (next) {
  const rate = Number(process.env.USD_TO_PKR) || 280;

  if (this.isModified("price")) {
    const price = Number(this.price || 0);
    this.pricePKR = Math.round(price * rate * 100) / 100;
  }

  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;