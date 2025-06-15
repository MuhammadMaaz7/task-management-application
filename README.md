# Task Management Application

This is a full-stack task management application with a React frontend and a Node.js backend. It allows users to manage their tasks, collaborate with others, receive email notifications, and export task data.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Getting Started Locally](#getting-started-locally)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Dockerization](#dockerization)
- [CI/CD with GitHub Actions](#ci/cd-with-github-actions)
- [Deployment on Vercel](#deployment-on-vercel)
- [Contributing](#contributing)
- [License](#license)

## Features

- User authentication (Registration, Login)
- Create, Read, Update, Delete (CRUD) tasks
- Task filtering and search
- Task status toggling (pending/completed)
- Task priority (low, medium, high)
- Due dates for tasks
- Task sharing with other users (view/edit permissions)
- Task activity logging and comments
- Export tasks to CSV and PDF formats
- Email Notifications:
  - Due date reminders
  - Overdue task alerts
  - Daily task digest
- Persistent storage with MongoDB

## Technologies Used

**Frontend (Client):**
- React
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Hot Toast
- React DnD (for reordering)

**Backend (Server):**
- Node.js
- Express.js
- MongoDB (Mongoose ODM)
- bcryptjs (for password hashing)
- jsonwebtoken (for authentication)
- express-validator (for input validation)
- cors
- dotenv
- nodemailer (for email sending)
- node-cron (for scheduling notifications)
- csv-writer
- pdfkit

**Deployment & CI/CD:**
- Docker & Docker Compose
- GitHub Actions
- Vercel
- Docker Hub

## Project Structure

```
TaskManagement/
├── client/               # React frontend application
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── contexts/     # AuthContext, TaskContext
│   │   ├── lib/          # API utility (axios instance)
│   │   ├── pages/
│   │   ├── types/        # TypeScript types/interfaces
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env              # Frontend environment variables
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── ...
├── server/               # Node.js backend API
│   ├── config/           # Database configuration
│   ├── controllers/      # Logic for routes (auth, tasks)
│   ├── middleware/       # Authentication, error handling, validation
│   ├── models/           # Mongoose schemas (User, Task)
│   ├── routes/           # API routes (auth, tasks)
│   ├── services/         # Email and notification services
│   ├── .env              # Backend environment variables
│   ├── index.js          # Main server entry point
│   ├── package.json
│   └── ...
├── .github/              # GitHub Actions workflows
│   └── workflows/
│       └── docker-publish.yml
├── .env                  # Root .env for Docker Compose
├── docker-compose.yml    # Docker Compose setup
├── package.json          # Monorepo/workspace package.json
├── README.md
└── .gitignore
```

## Getting Started Locally

Follow these instructions to set up the project on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/en/download/) (v18 or higher)
- [npm](https://www.npmjs.com/get-npm) (comes with Node.js)
- [MongoDB](https://www.mongodb.com/try/download/community) (Community Server or a cloud service like MongoDB Atlas)
- [Git](https://git-scm.com/downloads)
- [Docker](https://www.docker.com/products/docker-desktop) (Optional, for containerized development)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/MuhammadMaaz7/task-management-application
    cd task-management-application
    ```

2.  **Install Root Dependencies:**
    This installs dependencies for the root workspace setup.
    ```bash
    npm install
    ```

3.  **Install Client and Server Dependencies:**
    The root `package.json` includes a script to install dependencies in both client and server directories.
    ```bash
    npm run install-all
    ```
    _Alternatively, navigate into each directory and run `npm install` manually:_ 
    `cd client && npm install`
    `cd ../server && npm install`

### Environment Variables

Create `.env` files in the following locations:

1.  **`./server/.env`** (for your backend API)

    ```env
    PORT=5000
    MONGODB_URI=mongodb://localhost:27017/task-manager # Or your MongoDB Atlas URI
    JWT_SECRET=your_jwt_secret_key_here
    NODE_ENV=development
    
    # Email Notification Settings (for Nodemailer)
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_SECURE=false # Use true for 465, false for other ports
    SMTP_USER=your_email@gmail.com # Your email address
    SMTP_PASS=your_app_password # Generate an App Password for Gmail
    SMTP_FROM="Task Management System" <your_email@gmail.com>
    ```
    _Remember to replace placeholders with your actual values._
    _For Gmail `SMTP_PASS`, you'll need to generate an [App Password](https://support.google.com/accounts/answer/185833?hl=en)._

2.  **`./client/.env`** (for your frontend)

    ```env
    VITE_API_URL=http://localhost:5000/api # Points to your local backend
    ```

3.  **`./.env`** (for Docker Compose - if using Docker locally)

    ```env
    DOCKERHUB_USERNAME=your_dockerhub_username
    # GITHUB_REPOSITORY=your_github_username/your_repo_name # Only needed for docker-compose if you use it in image names
    ```

### Running the Application

Make sure your MongoDB server is running.

From the project root directory:

```bash
npm run dev
```

This command will concurrently start:
- The backend server on `http://localhost:5000`
- The frontend development server on `http://localhost:5173` (or another available port)

Alternatively, you can run them separately:
- Start Backend: `cd server && npm run dev`
- Start Frontend: `cd client && npm run dev`

## Dockerization

This project includes `Dockerfile` configurations for both the client and server, and a `docker-compose.yml` file to orchestrate them along with a MongoDB instance.

1.  **Build and Run with Docker Compose:**
    Make sure you have Docker installed and running.
    
    From the project root directory:
    ```bash
    docker-compose up --build
    ```
    This will:
    - Build Docker images for both `backend` and `frontend`.
    - Start a `mongodb` service.
    - Run the backend on `http://localhost:5000`.
    - Run the frontend on `http://localhost:3000`.

2.  **Stopping Docker Containers:**
    ```bash
    docker-compose down
    ```
    To stop and remove volumes (this will delete your MongoDB data):
    ```bash
    docker-compose down -v
    ```

## CI/CD with GitHub Actions

This repository is configured with a GitHub Actions workflow (`.github/workflows/docker-publish.yml`) to automatically build Docker images for the backend and frontend, and push them to Docker Hub.

**Setup Steps:**

1.  **Create Docker Hub Account:** If you don't have one, create an account on [Docker Hub](https://hub.docker.com/).

2.  **Generate Docker Hub Access Token:**
    - Go to Docker Hub -> Account Settings -> Security.
    - Click "New Access Token".
    - Give it a description (e.g., `github-actions`) and select "Read & Write" permissions.
    - Copy the generated token immediately (it will only be shown once).

3.  **Add GitHub Repository Secrets:**
    - Go to your GitHub repository -> Settings -> Secrets and variables -> Actions.
    - Add two new repository secrets:
      - `DOCKERHUB_USERNAME`: Your Docker Hub username.
      - `DOCKERHUB_TOKEN`: The access token you just generated.

4.  **Push Changes:**
    Any push to the `main` branch will automatically trigger the GitHub Actions workflow. This will build and push the `latest` tag for both images to your Docker Hub repository:
    - `your_dockerhub_username/task-management-backend:latest`
    - `your_dockerhub_username/task-management-frontend:latest`

## Deployment on Vercel

This application can be deployed to Vercel for both frontend and backend. The backend is deployed as a Serverless Function.

**Important:** Ensure your MongoDB database is accessible from Vercel (e.g., by whitelisting `0.0.0.0/0` in MongoDB Atlas network access).

### Backend Deployment (Node.js API)

1.  **Prepare Backend `vercel.json`:** (Already done by the assistant)
    The `server/vercel.json` file is configured to use `@vercel/node` builder.

2.  **Deploy from Vercel Dashboard:**
    - Go to [Vercel Dashboard](https://vercel.com/dashboard) and click "Add New..." -> "Project".
    - Import your GitHub repository.
    - When configuring the project for the **backend** (select the `server` directory):
      - **Framework Preset**: `Other`
      - **Root Directory**: `server`
      - **Build Command**: Leave empty
      - **Output Directory**: Leave empty
      - **Install Command**: `npm install`
    - **Add Environment Variables** (under Project Settings -> Environment Variables):
      - `MONGODB_URI`: Your MongoDB connection string (e.g., `mongodb+srv://user:password@cluster.mongodb.net/task-manager?retryWrites=true&w=majority`)
      - `JWT_SECRET`: A strong secret key for JWT (e.g., a long random string)
      - `SMTP_HOST`: `smtp.gmail.com`
      - `SMTP_PORT`: `587`
      - `SMTP_SECURE`: `false`
      - `SMTP_USER`: Your Gmail address (or other SMTP username)
      - `SMTP_PASS`: Your Gmail App Password (or other SMTP password)
    - Click "Deploy".

3.  **Get Backend URL:** Once successfully deployed, copy the generated URL (e.g., `https://task-management-application-server.vercel.app`).

### Frontend Deployment (React App)

1.  **Prepare Frontend `vercel.json`:** (Already done by the assistant)
    The `client/vercel.json` file is configured for Vite and rewrites API calls.

2.  **Deploy from Vercel Dashboard:**
    - Go back to [Vercel Dashboard](https://vercel.com/dashboard) and click "Add New..." -> "Project".
    - Import the **same GitHub repository**.
    - When configuring the project for the **frontend** (select the `client` directory):
      - **Framework Preset**: `Vite`
      - **Root Directory**: `client`
      - **Build Command**: `npm run build`
      - **Output Directory**: `dist`
      - **Install Command**: `npm install`
    - **Add Environment Variables** (under Project Settings -> Environment Variables):
      - `VITE_API_URL`: Paste the backend URL you copied in the previous step, appended with `/api` (e.g., `https://task-management-application-server.vercel.app/api`).
    - Click "Deploy".

### Post-Deployment Configuration

1.  **CORS Configuration:** The backend `server/index.js` already includes CORS settings. Ensure `https://task-management-application-frontend.vercel.app` (replace with your actual frontend domain) is allowed in the `origin` array if it's not already covered by `process.env.FRONTEND_URL` and you've set that env var on Vercel.

2.  **Testing:** Access your frontend URL (e.g., `https://task-management-application-frontend.vercel.app`) and test all functionalities.

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.