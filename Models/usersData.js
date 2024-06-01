const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, unique: true },
    password: { type: String, required: true },
    gender: { type: String, enum: ["male", "female", "other"] },
    age: { type: Number, min: 0 }, 
});

module.exports = mongoose.model("User", userSchema);