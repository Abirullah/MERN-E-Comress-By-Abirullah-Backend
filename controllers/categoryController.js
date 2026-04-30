// import Category from "../models/categoryModel.js";
// import asyncHandler from "../middlewares/asyncHandler.js";




// const listCategory = asyncHandler(async (req, res) => {
//   try {
//     const categories = await Category.find({}).sort({ createdAt: -1 });
//     res.json(categories);
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json(error.message);
//   }
// }); 

// const readCategory = asyncHandler(async (req, res) => {
//   try {
//     const { id } = req.params;
//     const category = await Category.findById({ _id: id });
//     if (!category) {
//       return res.status(404).json({ error: "Category not found" });
//     }
//     res.json(category);
//   } catch (error) {
//     console.log(error);
//     return res.status(400).json(error.message);
//   }
// });

// export {
//   listCategory,
//   readCategory,
// };
