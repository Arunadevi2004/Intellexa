# Deployment Guide - Hosting for Free

To host this project for free, we will use **MongoDB Atlas** for the database and **Render** for the application server.

---

### Step 1: Set up MongoDB Atlas (Database)
1.  **Sign up:** Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2.  **Create a Cluster:** Choose the **"M0" (FREE)** tier. Select a provider (e.g., AWS) and a region near you.
3.  **Create a Database User:** Go to "Database Access" and create a user with a username and password. **Remember these!**
4.  **IP Access List:** Go to "Network Access" and click **"Add IP Address"**. Choose **"Allow Access from Anywhere"** (0.0.0.0/0) so that Render can connect to your DB.
5.  **Get Connection String:** Go to "Database" → "Connect" → "Drivers". Copy the connection string. It looks like this:
    `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    *Replace `<username>` and `<password>` with your database user credentials.*

---

### Step 2: Prepare your Code for GitHub
1.  Initialize a Git repository in your project folder:
    ```bash
    git init
    git add .
    git commit -m "Prepare for deployment"
    ```
2.  Create a new repository on [GitHub](https://github.com/) and push your code.

---

### Step 3: Deploy to Render (Frontend + Backend)
1.  **Sign up:** Go to [render.com](https://render.com/) and connect your GitHub account.
2.  **Create a New Web Service:** Click **"New +"** → **"Web Service"** and select your GitHub repository.
3.  **Settings:**
    *   **Runtime:** Node
    *   **Build Command:** `npm install`
    *   **Start Command:** `node server.js`
4.  **Environment Variables:** Click on the "Environment" tab and add:
    *   `MONGODB_URI`: (Paste your MongoDB Atlas connection string here)
    *   `PORT`: 10000 (Render uses this by default)
    *   `ADMIN_USER`: admin
    *   `ADMIN_PASS`: (Your chosen admin password)
5.  **Deploy:** Click **"Create Web Service"**.

---

### How to Access
*   **Registration Page:** `https://your-app-name.onrender.com/`
*   **Admin Panel:** `https://your-app-name.onrender.com/admin`

> [!WARNING]
> On Render's free tier, the server "goes to sleep" after 15 minutes of inactivity. The first person to visit the site after it sleeps may experience a 30-60 second delay while it wakes up.

> [!IMPORTANT]
> Since Render's free tier doesn't have persistent disk storage, uploaded screenshots will be deleted every time the server restarts. For a production event, I recommend using a service like **Cloudinary** for image storage (I can help you set this up if needed later).
