const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const dietRoutes = require("./routes/dietRoutes");

const app = express();

app.use(
  cors({
    origin: "process.env.CLIENT_URL",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/diet", dietRoutes);

app.get("/", (req, res) => res.send("EatFitGo Backend Running"));

module.exports = app;
