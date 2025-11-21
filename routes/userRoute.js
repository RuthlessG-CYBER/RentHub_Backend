import express from "express";
import { signup, login, products } from "../controllers/userController.js";
import { getProducts } from "../controllers/userController.js";
import { getAllUsersProducts } from "../controllers/userController.js";
import { deleteProduct } from "../controllers/userController.js";
import { updateProduct } from "../controllers/userController.js";
import { bookingsData } from "../controllers/userController.js";
import { getBookings } from "../controllers/userController.js";
import { getNotifications } from "../controllers/userController.js";
import { acceptBooking } from "../controllers/userController.js";
import { rejectBooking } from "../controllers/userController.js";
import { markAsRead } from "../controllers/userController.js";



const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);

router.post("/:id/details", products);

router.get("/:id/products", getProducts);
router.get("/products", getAllUsersProducts);

router.delete("/:userId/products/:productId", deleteProduct);
router.put("/:userId/products/:productId", updateProduct);

router.post("/bookings/:id", bookingsData);
router.get("/bookings/:id", getBookings);

router.post("/bookings/:userId/:bookingId/accept", acceptBooking);
router.post("/bookings/:userId/:bookingId/reject", rejectBooking);

router.get("/:id/notifications", getNotifications);
router.put("/:userId/notifications/:notificationId/read", markAsRead);





export default router;
