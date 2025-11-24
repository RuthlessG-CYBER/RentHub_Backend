import express from "express";
import {
  signup,
  login,
  products,
  getProducts,
  getAllUsersProducts,
  deleteProduct,
  updateProduct,
  bookingsData,
  getBookings,
  getNotifications,
  acceptBooking,
  rejectBooking,
  markAsRead,
  createOrder,
  verifyPayment,
} from "../controllers/userController.js";

const router = express.Router();

/* Auth */
router.post("/signup", signup);
router.post("/login", login);

/* Products */
router.post("/:id/details", products);
router.get("/:id/products", getProducts);
router.get("/products", getAllUsersProducts);
router.delete("/:userId/products/:productId", deleteProduct);
router.put("/:userId/products/:productId", updateProduct);

/* Bookings */
router.post("/bookings/:id", bookingsData);
router.get("/bookings/:id", getBookings);
router.post("/bookings/:userId/:bookingId/accept", acceptBooking);
router.post("/bookings/:userId/:bookingId/reject", rejectBooking);

/* Notifications */
router.get("/:id/notifications", getNotifications);
router.put("/:userId/notifications/:notificationId/read", markAsRead);

/* Payments (Razorpay) */
router.post("/payments/create-order", createOrder);
router.post("/payments/verify", verifyPayment);

export default router;
