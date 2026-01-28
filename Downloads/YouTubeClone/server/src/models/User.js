import mongoose from "mongoose";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    logo: { type: String, default: "" },
    notifications: [
      {
        message: String,
        date: { type: Date, default: Date.now },
        read: { type: Boolean, default: false }
      }
    ]
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
