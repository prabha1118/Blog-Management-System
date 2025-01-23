# Blog Management System API
This is a simple blog management system that allows users to create, view, and comment on blog posts. The application is built using Node.js and includes models for users, blogs, and comments.

## Features
- **User Management**: Users can sign up, log in, and manage their profiles.
- **Role-Based Access Control**: Different roles for users (Admin, Editor, User) with varying permissions.
- **Blog Management**: Admin can create, assign, edit, and delete blogs. Editors can edit only assigned blogs.
- **Comment Management**: Users can comment on blogs, and delete their own comments.

## Installation

1. Clone the repository:
   
   ```bash
   git clone https://github.com/yourusername/prabha1118-blog-management-system.git
   cd prabha1118-blog-management-system
2. Install the dependencies:

   ```bash
   npm install
3. Create a .env File: In the root directory of the project, create a .env file and set the following environment variables:

    ```env
    DB_CONNECTION_STRING="mongodb+srv://dearcomrade1118:iFJfXPYGFmWN2Nhp@cluster0.paici.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
4. Start the server:

    ```bash
    npm start
5. Visit the app in your browser:

    ```arduino
    http://localhost:3000
## Authorization and Roles

- **Admin**: Can create blogs, assign editors, edit/delete blogs, and manage users.
- **Editor**: Can edit blogs assigned to them.
- **User**: Can only comment on blogs and delete their own comments.

## User Management APIs

### `POST /signup`
- Registers a new user.
- Role is determined automatically (first user gets `Admin`, others get `Editor` or `User` based on their role).

#### Admin:
    {
    "username": "John Wick",
    "password": "johnwick@123",
    "email": "johnwick@gmail.com"
    }
  
### API Endpoints Summary

| **Method** | **Endpoint**                            | **Description**                                                                                                                                       |
|------------|-----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------|
| `POST`     | `/signup`                               | Registers a new user. **Required Fields**: `username`, `password`, `email`.                                                                           |
| `POST`     | `/login`                                | Logs in a user with `email` and `password`. Returns a JWT token if credentials are valid.                                                            |
| `POST`     | `/blog/create`                          | Admin can create a new blog. **Required Fields**: `title`, `content`, `assignedEditorId`.                                                            |
| `PUT`      | `/blog/assign-editor/:blogId`           | Admin assigns an editor to a specific blog. **Required Fields**: `assignedEditorId`.                                                                 |
| `PUT`      | `/blog/edit/:blogId`                    | Admin or Editor can edit a blog. **Required Fields**: `title` or `content`.                                                                          |
| `DELETE`   | `/blog/delete/:blogId`                  | Admin can delete a specific blog.                                                                                                                     |
| `GET`      | `/blog`                                 | Anyone can fetch all blogs.                                                                                                                           |
| `GET`      | `/blog/:blogId`                         | Anyone can fetch a specific blog by its `blogId`.                                                                                                    |
| `GET`      | `/blog/:blogId/comment`                 | Anyone can view all comments on a specific blog.                                                                                                     |
| `POST`     | `/blog/:blogId/comment`                 | Any authenticated user (Admin, Editor, User) can post a comment on a blog. **Required Fields**: `comment` content and `userId`.                       |
| `DELETE`   | `/blog/:blogId/comment/:commentId`      | Any authenticated user can delete their own comment on a specific blog. Only the user who posted the comment or an Admin can delete it.              |

---



