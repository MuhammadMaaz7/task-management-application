# Task Manager - Full Stack Application

A comprehensive task management application built with React frontend and Node.js/Express backend.

## Features

### 🔐 Authentication System
- User registration with email and password
- Secure login/logout functionality
- JWT token-based authentication
- Protected routes and middleware
- Password hashing with bcrypt

### ✅ Task Management
- Create, read, update, and delete tasks
- Task priorities (low, medium, high)
- Due dates with overdue detection
- Task status (pending/completed)
- Task tags and categories
- Search and filter functionality
- Task statistics dashboard

### 🎨 User Interface
- Modern, responsive design
- Clean and intuitive interface
- Loading states and error handling
- Form validation
- Toast notifications
- Mobile-friendly layout

### 🛡️ Security Features
- JWT authentication
- Password hashing
- Input validation and sanitization
- CORS configuration
- Rate limiting
- Helmet security headers

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **React Router** for navigation
- **React Hook Form** for form handling
- **Tailwind CSS** for styling
- **Axios** for API requests
- **React Hot Toast** for notifications
- **Lucide React** for icons
- **Date-fns** for date formatting

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Rate limiting** for API protection

## Project Structure

```
task-manager/
├── client/ (React frontend)
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── lib/
│   │   ├── pages/
│   │   ├── types/
│   │   └── App.tsx
│   └── package.json
├── server/ (Node.js backend)
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication Routes
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `POST /api/auth/logout` - User logout (protected)

### Task Routes
- `GET /api/tasks` - Get all tasks for authenticated user
- `GET /api/tasks/stats` - Get task statistics
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update specific task
- `PATCH /api/tasks/:id/toggle` - Toggle task completion status
- `DELETE /api/tasks/:id` - Delete specific task

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
```

5. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

### Full Stack Development

To run both frontend and backend simultaneously:

```bash
npm run setup  # Install all dependencies
npm run dev    # Start both servers
```

## Database Schema

### User Model
```javascript
{
  email: String (required, unique),
  password: String (required, hashed),
  name: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Task Model
```javascript
{
  title: String (required),
  description: String,
  status: String (pending/completed),
  priority: String (low/medium/high),
  dueDate: Date,
  tags: [String],
  userId: ObjectId (ref: User),
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Features in Detail

### Authentication Flow
1. User registers with email and password
2. Password is hashed using bcrypt
3. JWT token is generated and returned
4. Token is stored in localStorage
5. Token is sent with each API request
6. Server validates token and extracts user info

### Task Management
- **Create**: Add new tasks with title, description, priority, due date, and tags
- **Read**: View all tasks with filtering and search capabilities
- **Update**: Edit task details and toggle completion status
- **Delete**: Remove tasks with confirmation

### Security Measures
- Password hashing with salt rounds
- JWT token expiration
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configuration for secure cross-origin requests
- Helmet for security headers

## Development Guidelines

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Consistent code formatting
- Error handling throughout the application
- Proper separation of concerns

### Best Practices
- RESTful API design
- Proper HTTP status codes
- Comprehensive error messages
- Input validation on both client and server
- Secure authentication implementation
- Responsive design principles

## Deployment

### Backend Deployment
1. Set up MongoDB Atlas or other cloud database
2. Configure production environment variables
3. Deploy to platforms like Heroku, Railway, or DigitalOcean
4. Set up proper CORS origins for production

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to platforms like Vercel, Netlify, or AWS S3
3. Configure environment variables for production API URL

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT Licens