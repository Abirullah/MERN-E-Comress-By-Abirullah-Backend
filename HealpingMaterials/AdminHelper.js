export const ExtractProductDetailsFromRequest = (req) => {
  const parseJsonArray = (value, fieldName) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;

    if (typeof value === "string") {
      try {
        const parsedValue = JSON.parse(value);

        if (Array.isArray(parsedValue)) {
          return parsedValue;
        }
      } catch (error) {
        if (fieldName === "images") {
          return value.trim() ? [value.trim()] : [];
        }

        if (fieldName === "tags") {
          return value
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);
        }
      }
    }

    throw new Error(`${fieldName} must be an array`);
  };

  const parseBoolean = (value, defaultValue) => {
    if (value === undefined) return defaultValue;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") return value.toLowerCase() === "true";

    return Boolean(value);
  };

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

  const variantsArray = parseJsonArray(variants, "variants");
  const bodyImages = parseJsonArray(images, "images");
  const uploadedImages = Array.isArray(req.files)
    ? req.files
        .map((file) => file.path || file.secure_url || file.url)
        .filter(Boolean)
    : [];
  const productImages = [...bodyImages, ...uploadedImages];
  const parsedTags = parseJsonArray(tags, "tags");
 
  if (!name) throw new Error("Product name is required");
  if (!brand) throw new Error("Brand is required");
  if (!description) throw new Error("Description is required");
  if (price === undefined || price === null || price === "") {
    throw new Error("Price is required");
  }


  if (variantsArray.length === 0) {
    throw new Error("At least one variant is required");
  }

  const formattedVariants = variantsArray.map((v, index) => {
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


  if (productImages.length === 0) {
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
    images: productImages,
    variants: formattedVariants,
    countInStock,
    tags: parsedTags.length > 0 ? parsedTags : ["casual"],
    gender: gender || "unisex",
    isFeatured: parseBoolean(isFeatured, false),
    isActive: parseBoolean(isActive, true),
    createdBy: req.user?._id, 
  };
};

export default ExtractProductDetailsFromRequest;
