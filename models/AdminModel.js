import mongoose from "mongoose";

const { Schema, model } = mongoose;



const roleSchema = new Schema({
  name: {
    type: String,
    enum: [
      "product-editor",
      "user-manager",
      "delivery-manager",
      "super-admin",
    ],
    required: true,
  },
  permissions: [
    {
      type: String, 
      enum: [ 
        "manage-products",
        "manage-users",
        "manage-delivery",
        "All",
      ],
      required: true,
    },

  ],
});


const adminSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role : {
      type: roleSchema,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


export const Admin = model("Admin", adminSchema);

