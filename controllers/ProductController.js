import Product from "../models/ProductModel.js"
import asyncHandler from 'express-async-handler';
import User from "../models/userModel.js";
import { response } from "express";
import ExtractProductDetailsFromRequest from "../HealpingMaterials/AdminHelper.js";



//admin action related to products


export const createProduct = asyncHandler(async (req, res) => {
  const productData = ExtractProductDetailsFromRequest(req);

  const product = await Product.create(productData);

  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (product) {
    const productData = ExtractProductDetailsFromRequest(req);

    product.name =
      productData.name !== undefined ? productData.name : product.name;
    product.description =
      productData.description !== undefined
        ? productData.description
        : product.description;
    product.price =
      productData.price !== undefined ? productData.price : product.price;
    product.discountPrice =
      productData.discountPrice !== undefined
        ? productData.discountPrice
        : product.discountPrice;
    product.category =
      productData.category !== undefined ? productData.category : product.category;
    product.brand =
      productData.brand !== undefined ? productData.brand : product.brand;
    product.countInStock =
      productData.countInStock !== undefined
        ? productData.countInStock
        : product.countInStock;
    product.images =
      productData.images?.length ? productData.images : product.images;
    product.variants =
      productData.variants?.length ? productData.variants : product.variants;
    product.tags = productData.tags?.length ? productData.tags : product.tags;
    product.gender =
      productData.gender !== undefined ? productData.gender : product.gender;
    product.isFeatured =
      productData.isFeatured !== undefined ? productData.isFeatured : product.isFeatured;
    product.isActive =
      productData.isActive !== undefined ? productData.isActive : product.isActive;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (product) {
    await product.deleteOne();
    res.json({ message: "Product removed successfully" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});




// user action related to products

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({});
  res.json(products);
});
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

const ToggleToWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const productId = req.params.id;

  
  if (!user.Wishlist) {
    user.Wishlist = { items: [] };
  }

  if (user.Wishlist.items.includes(productId)) {
    user.Wishlist.items.pull(productId);
    await user.save();
    res.json({ message: "Product removed from wishlist" });
  } else {
    user.Wishlist.items.push(productId );
    await user.save();
    res.json({ message: "Product added to wishlist" });
  }
});

const ProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  const product = await Product.findById(productId);

  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product already reviewed");
    }

    const review = {
      user: req.user._id,
      name: req.user.username,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    await product.save();
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

const getwishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("Wishlist.items");

  if (user && user.Wishlist) {
    const wishlistProducts = user.Wishlist.items;
    const AllProducts = await Promise.all(
      wishlistProducts.map((product) => Product.findById(product._id))
    );
    res.json(AllProducts);
  } else {
    res.status(404);
    throw new Error("Wishlist not found");
  }
});

const UserOrders = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("orders.product");

  if (user && user.orders) {
    res.json(user.orders);
  } else {
    res.status(404);
    throw new Error("Orders not found");
  }

  const orders = Array.isArray(user.OrderedProducts) ? [...user.OrderedProducts] : [];
  orders.sort((left, right) => {
    const leftDate = new Date(left.orderDate || left.createdAt || 0).getTime();
    const rightDate = new Date(right.orderDate || right.createdAt || 0).getTime();

    return rightDate - leftDate;
  });

  res.json(orders);
});

const getOrderById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("orders.product");

  if (user && user.orders) {
    const order = user.orders.find(
      (o) => o._id.toString() === req.params.id.toString()
    );

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});

const OrderRecieved = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const orderId = req.params.id;

  if (user && user.orders) {
    const order = user.orders.find(
      (o) => o._id.toString() === orderId.toString()
    );

  if (order) {
    order.isReceived = true;
    order.orderStatus = "Delivered";
    order.paymentStatus = "Paid";
    await user.save();
    res.json({ message: "Order marked as received" });
  } else {
    res.status(404);
    throw new Error("Order not found");
  }
});





export {  getProducts, 
          getProductById, 
          ToggleToWishlist, 
          ProductReview, 
          getwishlist,  
          UserOrders, 
          getOrderById, 
          OrderRecieved
};
