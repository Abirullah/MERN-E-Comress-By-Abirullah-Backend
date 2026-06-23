export const ExtractProductDetailsFromRequest = (req) => {
  const allowedTags = ["running", "casual", "formal", "sports", "outdoor", "indoor"];
  const allowedStatuses = ["new Arrival", "best seller", "limited edition", "normal", "sale"];
  const allowedGenders = ["men", "women", "unisex"];

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

  const parseNumber = (value, fieldName, { required = false, defaultValue = 0, min = null } = {}) => {
    if (value === undefined || value === null || value === "") {
      if (required) {
        throw new Error(`${fieldName} is required`);
      }

      return defaultValue;
    }

    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      throw new Error(`${fieldName} must be a valid number`);
    }

    if (min !== null && numericValue < min) {
      throw new Error(`${fieldName} must be at least ${min}`);
    }

    return numericValue;
  };

  const normalizeText = (value, fieldName, { required = false, defaultValue = "", maxLength = null } = {}) => {
    if (value === undefined || value === null || value === "") {
      if (required) {
        throw new Error(`${fieldName} is required`);
      }

      return defaultValue;
    }

    const normalizedValue = String(value).trim();

    if (!normalizedValue) {
      if (required) {
        throw new Error(`${fieldName} is required`);
      }

      return defaultValue;
    }

    if (maxLength && normalizedValue.length > maxLength) {
      throw new Error(`${fieldName} must be at most ${maxLength} characters long`);
    }

    return normalizedValue;
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
    status,
    off,
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
  const productImages = [...bodyImages, ...uploadedImages].filter(Boolean);
  const parsedTags = parseJsonArray(tags, "tags").map((tag) => normalizeText(tag, "tag"));

  if (!name) throw new Error("Product name is required");
  if (!brand) throw new Error("Brand is required");
  if (!description) throw new Error("Description is required");
  if (price === undefined || price === null || price === "") {
    throw new Error("Price is required");
  }

  if (variantsArray.length === 0) {
    throw new Error("At least one variant is required");
  }

  const normalizedName = normalizeText(name, "Product name", { required: true, maxLength: 120 });
  const normalizedBrand = normalizeText(brand, "Brand", { required: true, maxLength: 120 });
  const normalizedDescription = normalizeText(description, "Description", {
    required: true,
    maxLength: 5000,
  });
  const normalizedCategory = normalizeText(category, "Category", {
    defaultValue: "Shoes",
    maxLength: 120,
  });
  const normalizedGender = normalizeText(gender, "Gender", {
    defaultValue: "unisex",
  });
  const normalizedStatus = normalizeText(status, "Status", {
    defaultValue: "new Arrival",
  });

  if (!allowedGenders.includes(normalizedGender)) {
    throw new Error(`Gender must be one of: ${allowedGenders.join(", ")}`);
  }

  if (!allowedStatuses.includes(normalizedStatus)) {
    throw new Error(`Status must be one of: ${allowedStatuses.join(", ")}`);
  }

  const invalidTags = parsedTags.filter((tag) => !allowedTags.includes(tag));
  if (invalidTags.length > 0) {
    throw new Error(`Invalid tag(s): ${invalidTags.join(", ")}`);
  }

  const priceValue = parseNumber(price, "Price", { required: true, min: 0 });
  const discountPriceValue = parseNumber(discountPrice, "Discount price", { defaultValue: 0, min: 0 });
  const explicitOff = off !== undefined && off !== null && off !== "";
  const offValue = explicitOff
    ? parseNumber(off, "Off", { defaultValue: 0, min: 0 })
    : discountPriceValue > 0 && discountPriceValue < priceValue
    ? Math.round((1 - discountPriceValue / priceValue) * 10000) / 100
    : 0;

  const formattedVariants = variantsArray.map((variant, index) => {
    const size = parseNumber(variant?.size, `Variant ${index + 1} size`, {
      required: true,
      min: 0,
    });
    const color = normalizeText(variant?.color, `Variant ${index + 1} color`, {
      required: true,
      maxLength: 80,
    });
    const stock = parseNumber(variant?.stock, `Variant ${index + 1} stock`, {
      required: true,
      min: 0,
    });

    return {
      size,
      color,
      stock,
    };
  });

  if (productImages.length === 0) {
    throw new Error("At least one product image is required");
  }

  if (productImages.length > 10) {
    throw new Error("You can upload up to 10 product images");
  }

  const countInStock = formattedVariants.reduce((total, variant) => total + variant.stock, 0);

  return {
    name: normalizedName,
    brand: normalizedBrand,
    description: normalizedDescription,
    price: priceValue,
    discountPrice: discountPriceValue,
    category: normalizedCategory,
    images: productImages,
    variants: formattedVariants,
    countInStock,
    tags: parsedTags.length > 0 ? parsedTags : ["casual"],
    gender: normalizedGender,
    status: normalizedStatus,
    off: offValue,
    isFeatured: parseBoolean(isFeatured, false),
    isActive: parseBoolean(isActive, true),
    createdBy: req.user?._id,
  };
};

export default ExtractProductDetailsFromRequest;
