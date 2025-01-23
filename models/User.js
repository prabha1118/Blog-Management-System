const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {type: Number},
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    isEmailVerified: {type: Boolean, default: false},
    role: {type: String, enum: ['Admin', 'Editor', 'User'], default: 'User'},
})

const User = mongoose.model("User", userSchema);

module.exports = User;
