import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  products: user.products,
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });

    res.status(201).json({
      message: "User created successfully!",
      user: buildUserPayload(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({
      message: "Login successful",
      token,
      user: buildUserPayload(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const products = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, price, availability, src } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newProduct = {
      name,
      location,
      price: Number(price),
      availability,
      src,
      ownerId: id,
    };

    user.products.push(newProduct);
    await user.save();

    const addedProduct = user.products[user.products.length - 1];

    res.json({
      message: "Product added",
      product: addedProduct,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { name, src, price, location, availability } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const product = user.products.id(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.name = name ?? product.name;
    product.src = src ?? product.src;
    product.price = price ?? product.price;
    product.location = location ?? product.location;
    product.availability = availability ?? product.availability;

    await user.save();

    res.status(200).json({
      message: "Product updated successfully",
      user: buildUserPayload(user),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.products = user.products.filter(
      (p) => p._id.toString() !== productId
    );

    await user.save();

    res.json({
      message: "Product deleted successfully",
      products: user.products,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "Products fetched",
      products: user.products,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllUsersProducts = async (req, res) => {
  try {
    const users = await User.find();

    const allProducts = users.flatMap((u) =>
      u.products.map((p) => ({
        ...p.toObject(),
        ownerId: u._id.toString(),
      }))
    );

    res.json({
      message: "All products fetched",
      products: allProducts,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const bookingsData = async (req, res) => {
  try {
    const { id } = req.params;
    const { from, to, date, time, price } = req.body;

    const owner = await User.findById(id);
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    if (to !== owner._id.toString()) {
      return res.status(400).json({ message: "Owner mismatch for booking" });
    }

    const newBooking = {
      from,
      to,
      date,
      time,
      price,
      status: "pending",
      paymentStatus: "pending",
    };

    owner.bookings.push(newBooking);
    await owner.save();

    owner.notifications.push({
      title: "New Booking Request",
      message: `You have a new booking request.`,
      type: "info",
    });
    await owner.save();

    const tenant = await User.findById(from);
    if (tenant) {
      tenant.notifications.push({
        title: "Booking Request Sent",
        message: "Your booking request has been sent to the owner.",
        type: "info",
      });
      await tenant.save();
    }

    res.status(201).json({
      message: "Booking added and owner notified",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const acceptBooking = async (req, res) => {
  try {
    const { userId, bookingId } = req.params;

    const owner = await User.findById(userId);
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    const booking = owner.bookings.id(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "accepted";
    booking.paymentStatus = "pending";

    await owner.save();

    const tenant = await User.findById(booking.from);
    if (tenant) {
      tenant.notifications.push({
        title: "Booking Accepted",
        message:
          "Your booking request was accepted. Please complete the payment to confirm.",
        type: "success",
      });
      await tenant.save();
    }

    res.json({ message: "Booking accepted", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rejectBooking = async (req, res) => {
  try {
    const { userId, bookingId } = req.params;

    const owner = await User.findById(userId);
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    const booking = owner.bookings.id(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = "rejected";
    booking.paymentStatus = "failed";

    await owner.save();

    const tenant = await User.findById(booking.from);
    if (tenant) {
      tenant.notifications.push({
        title: "Booking Rejected",
        message: "The owner rejected your booking request.",
        type: "alert",
      });
      await tenant.save();
    }

    res.json({ message: "Booking rejected", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getBookings = async (req, res) => {
  try {
    const { id } = req.params;

    const usersWithBookings = await User.find({ "bookings.0": { $exists: true } });

    const bookings = [];

    usersWithBookings.forEach((u) => {
      u.bookings.forEach((b) => {
        if (b.from === id || b.to === id) {
          bookings.push({
            ...b.toObject(),
          });
        }
      });
    });

    res
      .status(200)
      .json({ message: "Bookings fetched", bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ notifications: user.notifications || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { userId, notificationId } = req.params;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const notification = user.notifications.id(notificationId);
    if (!notification)
      return res.status(404).json({ message: "Notification not found" });

    notification.isRead = true;
    await user.save();

    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    const owner = await User.findOne({ "bookings._id": bookingId });
    if (!owner)
      return res.status(404).json({ message: "Booking not found for any owner" });

    const booking = owner.bookings.id(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "accepted") {
      return res
        .status(400)
        .json({ message: "Booking must be accepted before payment" });
    }

    const amountInPaise = booking.price * 100;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: `renthub_rcpt_${bookingId}`,
    };

    const order = await razorpay.orders.create(options);

    booking.razorpayOrderId = order.id;
    await owner.save();

    res.json({
      message: "Order created",
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const owner = await User.findOne({ "bookings._id": bookingId });
    if (!owner)
      return res.status(404).json({ message: "Booking not found for any owner" });

    const booking = owner.bookings.id(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.paymentStatus = "success";
    booking.razorpayPaymentId = razorpay_payment_id;

    await owner.save();

    const tenant = await User.findById(booking.from);

    owner.notifications.push({
      title: "Payment Received",
      message: tenant
        ? `Payment received for a booking from ${tenant.name}.`
        : "Payment received for a booking.",
      type: "success",
    });
    await owner.save();

    if (tenant) {
      tenant.notifications.push({
        title: "Payment Successful",
        message: "Your payment was successful. Booking is confirmed.",
        type: "success",
      });
      await tenant.save();
    }

    res.json({ message: "Payment verified and booking updated", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
