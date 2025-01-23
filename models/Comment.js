const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  commentId: { type: Number, required: true },
  blogId: { type: Number, required: true },
  userId: { type: Number, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Comment = mongoose.model("Comment", commentSchema);

module.exports = Comment;
