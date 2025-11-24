import express from "express";
import mongoose from "mongoose";
// import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import router from "./routes/userRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URL = process.env.MONGODB_URL;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://rent-hub-frontend-five.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// app.use(bodyParser.json());
app.use(express.json());


app.get("/", (req, res) => {
  res.send("Welcome to Panda's Server!");
});

app.use("/api/user", router);

mongoose
  .connect(MONGODB_URL)
  .then(() => {
    console.log("DB is Connected!");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
