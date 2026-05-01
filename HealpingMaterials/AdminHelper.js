export const ExtractProductDetailsFromRequest = (req) => {
  const {
    name,
    brand,
    description,
    price,
    variants,
    images,
    category,
    discountPrice,
    tags,
    gender,
    isFeatured,
    isActive,
  } = req.body;

 
  if (!name) throw new Error("Product name is required");
  if (!brand) throw new Error("Brand is required");
  if (!description) throw new Error("Description is required");
  if (!price) throw new Error("Price is required");


  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    throw new Error("At least one variant is required");
  }

  const formattedVariants = variants.map((v, index) => {
    if (!v.size) throw new Error(`Variant ${index + 1}: size is required`);
    if (!v.color) throw new Error(`Variant ${index + 1}: color is required`);
    if (v.stock === undefined)
      throw new Error(`Variant ${index + 1}: stock is required`);

    return {
      size: Number(v.size),
      color: v.color,
      stock: Number(v.stock),
    };
  });


  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new Error("At least one product image is required");
  }


  const countInStock = formattedVariants.reduce(
    (total, v) => total + v.stock,
    0
  );


  return {
    name: name.trim(),
    brand,
    description,
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : 0,
    category: category || "Shoes",
    images,
    variants: formattedVariants,
    countInStock,
    tags: tags || ["casual"],
    gender: gender || "unisex",
    isFeatured: isFeatured || false,
    isActive: isActive !== undefined ? isActive : true,
    createdBy: req.user?._id, 
  };
};

export default ExtractProductDetailsFromRequest;