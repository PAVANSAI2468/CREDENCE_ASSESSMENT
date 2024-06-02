

const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const User = require("./Models/usersData");
const Item = require("./Models/items");

require("dotenv").config();
app.use(bodyParser.json());
const PORT = process.env.PORT || 3008;
const MONGO_URI = process.env.MONGO_URI;
console.log('MONGO_URI:', process.env.MONGO_URI);

const JWT_SECRET = process.env.JWT_SECRET;

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).send({ message: 'Invalid JSON' });
  }
  next();
});

// Test route
app.get("/date", (req, res) => {
  res.send("JAI HANUMAN JAI SRI RAM");
});

// MongoDB connection
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

// User registration
app.post("/register", async (req, res) => {
  const { username, password, fullName, email, gender, age } = req.body;

  try {
    const databaseUser = await User.findOne({ email });
    if (databaseUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      name: fullName,
      email,
      gender,
      age,
    });
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ message: "Unable to register user", error: error.message });
  }
});

// User login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    const token = jwt.sign({ email: user.email }, JWT_SECRET);
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Middleware to authenticate user
const authenticatedUser = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized Access' });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authorization' });
  }
};

// Get all users
app.get("/users", authenticatedUser, async (req, res) => {
  try {
    const allUsers = await User.find({}, { name: 1, username: 1, gender: 1, age: 1 });
    res.json(allUsers);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Create new item
app.post("/items", authenticatedUser, async (req, res) => {
  const { name, img, summary } = req.body;

  try {
    const newItem = await Item.create({ name, img, summary });
    res.status(201).json({ message: "Item created successfully", item: newItem });
  } catch (error) {
    res.status(400).json({ message: "Unable to create item", error: error.message });
  }
});

// Get all items
app.get("/items", async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get item by ID
app.get("/items/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const item = await Item.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

app.put("/items/:id", authenticatedUser, async (req, res) => {
  const { id } = req.params;
  const { name, img, summary } = req.body;

  try {
    const updatedItem = await Item.findByIdAndUpdate(id, { name, img, summary }, { new: true });
    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item updated successfully", item: updatedItem });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

app.delete("/items/:id", authenticatedUser, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedItem = await Item.findByIdAndDelete(id);
    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json({ message: "Item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});
