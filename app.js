const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Blog = require("./models/Blog");
const Comment = require("./models/Comment");
const User = require("./models/User");
require("dotenv").config();

const app = express();
app.use(express.json());

const connectDBAndStartServer = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION_STRING);
    console.log("Successfully connected to MongoDB");
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (error) {
    console.log(`Error: ${error}`);
    process.exit(1);
  }
};

connectDBAndStartServer();

const checkSignupData = (request, response, next) => {
  const { username, password, email } = request.body;

  if (!username || !password || !email) {
    response.status(400);
    response.send("Please provide all required fields");
    return;
  }

  if (password.length < 8) {
    response.status(400);
    response.send("Password must be at least 8 characters long");
    return;
  }

  if (!(email.includes("@") && email.endsWith(".com"))) {
    response.status(400);
    response.send("Please provide a valid email address");
    return;
  }

  next();
};

const checkAuthorizationAndRole = (roles = []) => {
  return async (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
      jwtToken = authHeader.split(" ")[1];
    }

    if (jwtToken === undefined) {
      response.status(401);
      response.send("Invalid Access Token");
      return;
    } else {
      jwt.verify(jwtToken, "MY_TOKEN", async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid Access Token");
          return;
        } else {
          const email = payload.email;
          const userDetails = await User.findOne({ email });

          if (roles.length > 0 && !roles.includes(userDetails.role)) {
            response.status(403);
            response.send("You are not authorized to perform this action");
            return;
          }

          request.body.userId = userDetails.userId;
          request.body.role = userDetails.role;
          next();
        }
      });
    }
  };
};

// User Management APIs

// Signup API

app.post("/signup", checkSignupData, async (request, response) => {
  try {
    const { username, password, email, role } = request.body;

    const isEditor = role === "Editor";

    const isExistingUser = await User.findOne({ email });
    if (isExistingUser) {
      response.status(400);
      response.send("User already exists with given email");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const usersCount = await User.countDocuments();

    const newUser = new User({
      userId: usersCount + 1,
      username,
      password: hashedPassword,
      email,
      isEmailVerified: false,
      role: usersCount === 0 ? "Admin" : isEditor ? "Editor" : "User",
    });

    await newUser.save();
    response.send("User created successfully");
  } catch (error) {
    response.send("Error in signup");
    console.log(`Error: ${error}`);
  }
});

// Login API

app.post("/login", async (request, response) => {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      response.status(400);
      response.send("Please provide email and password");
      return;
    }

    const user = await User.findOne({ email });

    if (!user) {
      response.status(400);
      response.send("User not found");
      return;
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);

    if (isPasswordMatched) {
      const payload = { email };
      const jwtToken = jwt.sign(payload, "MY_TOKEN");
      response.send(jwtToken);
    } else {
      response.status(400);
      response.send("Incorrect password");
    }
  } catch (error) {
    response.send("Error in login");
    console.log(`Error: ${error}`);
  }
});

// Blog Management APIs

// Admin creating a blog API

app.post(
  "/blog/create",
  checkAuthorizationAndRole(["Admin"]),
  async (request, response) => {
    try {
      const { title, content, assignedEditorId } = request.body;

      if (!title || !content) {
        response.status(400);
        response.send("Please provide title and content");
        return;
      }

      const blogCount = await Blog.countDocuments();

      const newBlog = new Blog({
        blogId: blogCount + 1,
        title,
        content,
        assignedEditorId,
      });

      await newBlog.save();
      response.send("Blog created successfully");
    } catch (error) {
      console.log(`Error: ${error}`);
      response.send("Error in creating blog");
    }
  }
);

// Admin assigning an editor to a blog API

app.put(
  "/blog/assign-editor/:blogId",
  checkAuthorizationAndRole(["Admin"]),
  async (request, response) => {
    try {
      const { blogId } = request.params;
      const { assignedEditorId } = request.body;

      if (!assignedEditorId) {
        response.status(400);
        response.send("Please provide assignedEditorId");
        return;
      }

      const editor = await User.findOne({ userId: assignedEditorId });
      if (!editor || editor.role !== "Editor") {
        response.status(400);
        response.send("Invalid assignedEditorId Or User is not an Editor");
        return;
      }

      const blog = await Blog.findOne({ blogId });
      if (!blog) {
        response.status(400);
        response.send("Blog not found");
        return;
      }
      if (blog.assignedEditorId !== undefined) {
        response.status(400);
        response.send("Editor already assigned to this blog");
        return;
      }

      blog.assignedEditorId = assignedEditorId;
      await blog.save();
      response.send("Editor assigned successfully");
    } catch (error) {
      console.log(`Error: ${error}`);
      response.send("Error in assigning editor");
    }
  }
);

// Admin or Editor editing a blog API

app.put(
  "/blog/edit/:blogId",
  checkAuthorizationAndRole(["Admin", "Editor"]),
  async (request, response) => {
    try {
      const { blogId } = request.params;
      let { title, content, userId, role } = request.body;

      const blog = await Blog.findOne({ blogId });
      if (!blog) {
        response.status(400);
        response.send("Blog not found");
        return;
      }

      if (!(role === "Admin")) {
        if (blog.assignedEditorId !== userId) {
          response.status(403);
          response.send("You are not assigned to edit this blog");
          return;
        }
      }

      if (!title && !content) {
        response.status(400);
        response.send("Please provide title or content to update");
        return;
      }

      blog.title = (title && title) || blog.title;
      blog.content = (content && content) || blog.content;
      await blog.save();

      response.send("Blog updated successfully");
    } catch (error) {
      console.log(`Error: ${error}`);
      response.send("Error in editing blog");
    }
  }
);

// Admin deleting a blog API

app.delete(
  "/blog/delete/:blogId",
  checkAuthorizationAndRole(["Admin"]),
  async (request, response) => {
    try {
      const { blogId } = request.params;

      const blog = await Blog.findOne({ blogId });
      if (!blog) {
        response.status(400);
        response.send("Blog not found");
        return;
      }

      await Blog.deleteOne({ blogId });
      response.send("Blog deleted successfully");
    } catch (error) {
      console.log(`Error: ${error}`);
      response.send("Error in deleting blog");
    }
  }
);

// Anyone can view all blogs API

app.get("/blog", async (request, response) => {
  try {
    const blogs = await Blog.find();
    response.send(blogs);
  } catch (error) {
    console.log(`Error: ${error}`);
    response.send("Error in fetching blogs");
  }
});

// Anyone can view a specific blog API

app.get("/blog/:blogId", async (request, response) => {
  try {
    const { blogId } = request.params;
    const blog = await Blog.findOne({ blogId });

    if (!blog) {
      response.status(400);
      response.send("Blog not found");
      return;
    }

    response.send(blog);
  } catch (error) {
    console.log(`Error: ${error}`);
    response.send("Error in fetching blog");
  }
});

// Comment Management APIs

// Anyone can view all comments on a blog API

app.get("/blog/:blogId/comment", async (request, response) => {
  try {
    const { blogId } = request.params;

    const blog = await Blog.findOne({ blogId });
    if (!blog) {
      response.status(400);
      response.send("Blog not found");
      return;
    }

    const comments = await Comment.find({ blogId });
    response.send(comments);
  } catch (error) {
    console.log(`Error: ${error}`);
    response.send("Error in fetching comments");
  }
});

// Anyone can post a comment on a blog API

app.post(
  "/blog/:blogId/comment",
  checkAuthorizationAndRole(["Admin", "Editor", "User"]),
  async (request, response) => {
    try {
      const { blogId } = request.params;
      const { comment, userId } = request.body;

      if (!comment) {
        response.send("Please provide a comment to post");
        return;
      }

      const blog = await Blog.findOne({ blogId });
      if (!blog) {
        response.status(400);
        response.send("Blog not found");
        return;
      }

      const commentCount = await Comment.countDocuments();

      const newComment = new Comment({
        commentId: commentCount + 1,
        blogId,
        userId,
        content: comment,
      });

      await newComment.save();
      response.send("Comment posted succefully");
    } catch (error) {
      console.log(`Error: ${error}`);
      response.send("Error in posting the comment");
    }
  }
);

// Deleting their own comments API

app.delete(
  "/blog/:blogId/comment/:commentId",
  checkAuthorizationAndRole(["Admin", "Editor", "User"]),
  async (request, response) => {
    try {
      const { blogId, commentId } = request.params;

      const blog = await Blog.findOne({ blogId });
      const comment = await Comment.findOne({ commentId });

      if (!blog) {
        response.status(400);
        response.send("Blog not found");
        return;
      }

      if (!comment) {
        response.status(400);
        response.send("Comment not found");
        return;
      }

      if (comment.userId !== request.body.userId) {
        response.status(403);
        response.send("You are not authorized to delete this comment");
        return;
      }

      await Comment.deleteOne({ commentId });
      response.send("Comment deleted successfully");
    } catch (error) {
      console.log(`Error: ${error}`);
      response.send("Error in deleting the comment");
    }
  }
);

module.exports = app;

// johnwick jwt token - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImpvaG53aWNrQGdtYWlsLmNvbSIsImlhdCI6MTczNzYxMDE1Nn0.qRWjeX3wSf_T5qIUVxRO4UWo7g74s2WEbypCX5q0sf8

// jacksparrow jwt token - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImphY2tzcGFycm93QGdtYWlsLmNvbSIsImlhdCI6MTczNzYzODg1NX0.hOGM9lcH7yFTemwkHKA-V5FV_1Hyr3rnaRAIlztLtCk

// tomcruise jwt token - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRvbWNydWlzZUBnbWFpbC5jb20iLCJpYXQiOjE3Mzc2MTM1NTd9.GM64mYb1wf6J4GM8QMtcFRcs5Uuz4xXQI7Y0JsDPU8k

// patcummins jwt token - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhdGN1bW1pbnNAZ21haWwuY29tIiwiaWF0IjoxNzM3NjQyMTkwfQ.b1toMJKj_e_QErvaf8U-wqjuhtBU9-m8Yb6lohH7E50

// msdhoni jwt token - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Im1zZGhvbmlAZ21haWwuY29tIiwiaWF0IjoxNzM3NjQxNTgyfQ.A9vxJX5aL9GAZyDKnF1EHkLht9IM_ztbk6UR9s8iT2M

// josbuttler jwt token - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Impvc2J1dHRsZXJAZ21haWwuY29tIiwiaWF0IjoxNzM3NjQyMjM4fQ.DvSsYFlkZENOvxjO5s7oQIy4pb6w483kPvPom8fo7ag
