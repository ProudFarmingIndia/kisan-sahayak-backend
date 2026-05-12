// src/models/User.js

// Import mongoose for creating schema and model
const mongoose = require("mongoose");

// Import bcryptjs for password hashing
const bcrypt = require("bcryptjs");

/*
|--------------------------------------------------------------------------
| User Schema
|--------------------------------------------------------------------------
| This schema defines how user data will be stored in MongoDB.
*/
const userSchema = new mongoose.Schema(
  {
    // Full name of the user
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    // Email address (must be unique)
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // Mobile number (must be unique)
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
    },

    // Password (will be hashed before saving)
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Hide password by default in queries
    },

    // Verification flags
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isMobileVerified: {
      type: Boolean,
      default: false,
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Optional user role
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    // Password reset OTP
    passwordResetOtp: {
      type: String,
      default: null,
      select: false,
    },

    // OTP expiry time
    passwordResetOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // Whether OTP has been verified
    isPasswordResetOtpVerified: {
      type: Boolean,
      default: false,
    },

    // Store the latest refresh token (optional for single-device login)
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  },
);

/*
|--------------------------------------------------------------------------
| Pre-save Middleware
|--------------------------------------------------------------------------
| Before saving the user, hash the password if it was modified.
*/
userSchema.pre("save", async function () {
  // If password is unchanged, do nothing
  if (!this.isModified("password")) {
    return;
  }

  // Generate salt with 10 rounds
  const salt = await bcrypt.genSalt(10);

  // Hash the password
  this.password = await bcrypt.hash(this.password, salt);
});

/*
|--------------------------------------------------------------------------
| Instance Method: comparePassword
|--------------------------------------------------------------------------
| Used during login to compare entered password with hashed password.
*/
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

/*
|--------------------------------------------------------------------------
| Export Model
|--------------------------------------------------------------------------
| Reuse existing model if already compiled (helps during development).
*/
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
