import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ["info", "success", "warning", "alert"],
    default: "info",
  },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const bookingSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  price: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  src: { type: String, required: true },
  price: { type: Number, required: true },
  location: { type: String, required: true },
  availability: { type: Boolean, required: true },
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  products: [productSchema],
  bookings: [bookingSchema],
  notifications: [notificationSchema]
});

export default mongoose.model("User", userSchema);
