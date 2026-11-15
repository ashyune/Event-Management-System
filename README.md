# Event Management System

A web-based Event Management System developed as part of the Software Engineering project at PES University.

The application provides user registration and authentication as the foundation for managing event-related functionality. The system is being developed with separate frontend and backend components.

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, React Router, Axios |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Sequelize |
| Authentication | JSON Web Tokens (JWT), bcryptjs |

## Project Structure

```text
Event-Management-System/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── index.html
│
├── Event_Management_System_SAD.pdf
├── Event_Management_System_SRS.pdf
├── Event_Management_System_TEST_PLAN.pdf
└── README.md
```

## Prerequisites

Make sure the following are installed:

- Node.js (20.19+ or a compatible newer version)
- npm
- PostgreSQL

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ashyune/Event-Management-System.git
cd Event-Management-System
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file using the example:

```bash
cp .env.example .env
```

Update the environment variables according to your PostgreSQL configuration:

```env
PORT=5000

DB_NAME=event_management
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
```
**Note:** The values in `.env.example` are provided as defaults and may not match your local PostgreSQL configuration. For example, the template uses `postgres` as the database user, while other setups may use a custom user such as `ems_user`.

Update `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, and `DB_PORT` in your `.env` file to match your local PostgreSQL setup. Make sure the database exists and the configured user has the necessary permissions.

Never commit your `.env` file or share your database credentials.

Create the PostgreSQL database and ensure the configured database user has the required permissions.

Start the backend development server:

```bash
npm run dev
```

The API will be available at:

`http://localhost:5000`

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

Start the Vite development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal (usually `http://localhost:5173`).

## Available API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API health check |
| POST | `/api/auth/register` | Register a new participant |
| POST | `/api/auth/login` | Authenticate an existing user |
| GET | `/api/auth/me` | Retrieve authenticated user information |

Protected endpoints require a JWT supplied through the `Authorization` header:

```text
Authorization: Bearer <token>
```

## Development Commands

### Backend

```bash
npm run dev
npm start
```

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

## Project Documentation

The following documents provide the project requirements, design, and testing specifications:

- **Software Architecture Document (SAD):** `Event_Management_System_SAD.pdf`
- **Software Requirements Specification (SRS):** `Event_Management_System_SRS.pdf`
- **Test Plan:** `Event_Management_System_TEST_PLAN.pdf`

## Security Notes

- Passwords are hashed using bcryptjs before being stored.
- JWTs are used for authentication.
- User roles include participant, organizer, and administrator.
- Public registration assigns the participant role by default.
- Protected routes use authentication and role-based authorization middleware.

## Contributors

Developed by Team 7 as part of the Software Engineering course at PES University.

## Security Measures

The backend implements the following security measures:

- **Helmet:** Adds HTTP security headers to API responses.
- **CORS restrictions:** Browser requests are restricted to the configured frontend origin.
- **Login rate limiting:** Limits login attempts to 5 per IP address within 15 minutes. Successful login requests are not counted.
- **Password protection:** Passwords are hashed using bcrypt before storage.
- **JWT authentication:** Authenticated requests use signed JWTs with a configurable expiration.
- **Role-based authorization:** Protected routes enforce the required user roles.
- **Input validation:** Request inputs are validated and normalized before processing.
- **Centralized error handling:** Internal error details are not exposed in server responses.

### Environment Configuration

Configure the following variables in the backend `.env` file:

- `JWT_SECRET`: A long, randomly generated secret used to sign JWTs.
- `JWT_EXPIRES_IN`: Token expiration duration (defaults to `1d`).
- `CLIENT_URL`: Allowed frontend origin. Multiple origins can be comma-separated.

Never commit `.env` or expose production secrets in source control.

### HTTPS Deployment

HTTPS must be enabled in production using the deployment platform or a TLS-enabled reverse proxy.

- Use HTTPS for all production frontend-to-backend communication.
- Configure `CLIENT_URL` with the deployed frontend's HTTPS origin.
- Set `NODE_ENV=production`.
- Use a strong, unique production JWT secret.
- Do not transmit authentication credentials or JWTs over plain HTTP in production.

Local development can continue using HTTP on localhost.