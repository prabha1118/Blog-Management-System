const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  blogId: { type: Number },
  title: { type: String, required: true },
  content: { type: String, required: true },
  assignedEditorId: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
