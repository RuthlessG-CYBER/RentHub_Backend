import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const buildUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  products: user.products,
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
    const { name, src, price, location, availability } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newProduct = {
      name,
      src,
      price,
      location,
      availability,
      ownerId: user._id,
    };

    user.products.push(newProduct);
    await user.save();

    res.status(201).json({
      message: "Product added",
      user: buildUserPayload(user),
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
      user,
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

    user.products = user.products.filter((p) => p._id.toString() !== productId);

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

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.bookings.push({ from, to, date, time, price, status: "pending" });

    await user.save();

    res.status(201).json({
      message: "Booking added",
      user: buildUserPayload(user),
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

    const sender = await User.findById(booking.from);

    sender.notifications.push({
      title: "Booking Accepted",
      message: "Your booking request was accepted.",
      type: "success",
    });

    await sender.save();
    await owner.save();

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

    const sender = await User.findById(booking.from);

    sender.notifications.push({
      title: "Booking Rejected",
      message: "The owner rejected your booking request.",
      type: "alert",
    });

    await sender.save();
    await owner.save();

    res.json({ message: "Booking rejected", booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ notifications: user.notifications });
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
export const getBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res
      .status(200)
      .json({ message: "Bookings fetched", bookings: user.bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
