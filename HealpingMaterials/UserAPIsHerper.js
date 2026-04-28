const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 50;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 128;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._' -]+$/;

export const createUserApiError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const getUserApiErrorStatus = (error) => {
  if (error.statusCode) {
    return error.statusCode;
  }

  if (
    error.name === "ValidationError" ||
    error.name === "CastError" ||
    error.code === 11000
  ) {
    return 400;
  }

  return 500;
};

export const handleUserApiError = (res, error) => {
  res.status(getUserApiErrorStatus(error)).json({
    message: error.message || "An error occurred",
  });
};

const ensurePlainObject = (value, fieldName = "data") => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw createUserApiError(`${fieldName} must be a valid object`);
  }

  return value;
};

const normalizeTrimmedString = (
  value,
  fieldName,
  { required = false, minLength, maxLength } = {}
) => {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw createUserApiError(`${fieldName} is required`);
    }

    return undefined;
  }

  const normalizedValue = String(value).trim();

  if (!normalizedValue) {
    if (required) {
      throw createUserApiError(`${fieldName} is required`);
    }

    return undefined;
  }

  if (minLength && normalizedValue.length < minLength) {
    throw createUserApiError(
      `${fieldName} must be at least ${minLength} characters long`
    );
  }

  if (maxLength && normalizedValue.length > maxLength) {
    throw createUserApiError(
      `${fieldName} must be at most ${maxLength} characters long`
    );
  }

  return normalizedValue;
};

const normalizeUsername = (value, { required = false } = {}) => {
  const username = normalizeTrimmedString(value, "username", {
    required,
    minLength: USERNAME_MIN_LENGTH,
    maxLength: USERNAME_MAX_LENGTH,
  });

  if (username === undefined) {
    return undefined;
  }

  if (!USERNAME_REGEX.test(username)) {
    throw createUserApiError(
      "username may only contain letters, numbers, spaces, dots, apostrophes, hyphens, and underscores"
    );
  }

  return username;
};

const normalizeEmail = (value, { required = false } = {}) => {
  const email = normalizeTrimmedString(value, "email", {
    required,
    maxLength: 255,
  });

  if (email === undefined) {
    return undefined;
  }

  const normalizedEmail = email.toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw createUserApiError("email must be a valid email address");
  }

  return normalizedEmail;
};

const normalizePassword = (value, { required = false } = {}) => {
  if (value === undefined || value === null || value === "") {
    if (required) {
      throw createUserApiError("password is required");
    }

    return undefined;
  }

  const password = String(value);

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw createUserApiError(
      `password must be at least ${PASSWORD_MIN_LENGTH} characters long`
    );
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    throw createUserApiError(
      `password must be at most ${PASSWORD_MAX_LENGTH} characters long`
    );
  }

  return password;
};

const normalizeOptionalProfile = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  const profile = ensurePlainObject(value, "Profile");
  const normalizedProfile = {};

  const fieldMap = [
    ["firstName", "firstName"],
    ["lastName", "lastName"],
    ["address", "address"],
    ["phoneNumber", "phoneNumber"],
    ["accountDetails", "accountDetails"],
    ["profilePicture", "profilePicture"],
    ["preferences", "preferences"],
  ];

  for (const [sourceKey, targetKey] of fieldMap) {
    const normalizedValue = normalizeTrimmedString(profile[sourceKey], sourceKey);

    if (normalizedValue !== undefined) {
      normalizedProfile[targetKey] = normalizedValue;
    }
  }

  if (Object.keys(normalizedProfile).length === 0) {
    throw createUserApiError(
      "Profile must include at least one valid field when provided"
    );
  }

  return normalizedProfile;
};

const getProfileInput = (body) => body.Profile ?? body.profile;



export const normalizeRegisterPayload = (body) => {
  const data = ensurePlainObject(body);
  
  return {
    username: normalizeUsername(data.username, { required: true }),
    email: normalizeEmail(data.email, { required: true }),
    password: normalizePassword(data.password, { required: true }),
    Profile: normalizeOptionalProfile(getProfileInput(data)),
  };
};

export const normalizeLoginPayload = (body) => {
  const data = ensurePlainObject(body);

  return {
    email: normalizeEmail(data.email, { required: true }),
    password: normalizePassword(data.password, { required: true }),
  };
};

export const normalizeProfileUpdatePayload = (body) => {
  const data = ensurePlainObject(body);

  const normalizedData = {
    username: normalizeUsername(data.username),
    email: normalizeEmail(data.email),
    password: normalizePassword(data.password),
    Profile: normalizeOptionalProfile(getProfileInput(data)),
  };

  const hasChanges = Object.values(normalizedData).some(
    (value) => value !== undefined
  );

  if (!hasChanges) {
    throw createUserApiError("Provide at least one field to update");
  }

  return normalizedData;
};

export const buildPublicUserResponse = (user) => {
  const profile = user?.Profile || null;
  const fallbackUsername = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    _id: user._id,
    username: user.username || fallbackUsername || user.email,
    email: user.email,
    isAdmin: Boolean(user.isAdmin),
    Profile: profile,
  };
};
