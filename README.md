# 🏠 ZUCT Hostel Management System

**Full-Stack Web Development — Final Course Project**
Zambia University College of Technology (ZUCT)

**Technologies:** React.js · Express.js · PostgreSQL

---

## 📋 Project Overview

A full-stack web application for managing student hostel operations at ZUCT.
It covers room management, booking approvals, maintenance reporting, and student administration — all behind a role-based authentication system.

### Features Demonstrated

| Requirement             | Implementation                                      |
|-------------------------|-----------------------------------------------------|
| User Authentication     | JWT-based login/register with bcrypt password hashing |
| CRUD Operations         | Full CRUD on Rooms, Bookings, and Maintenance Requests |
| Database Integration    | PostgreSQL with relational tables and transactions   |
| API Development         | RESTful Express.js API with 20+ endpoints           |
| File Upload             | Multer for profile photos and maintenance images    |
| Responsive Frontend     | React.js with React Router, mobile-responsive layout |

---

## 🗂️ Project Structure

```
hostel-management/
├── schema.sql               ← Database schema + seed data
├── backend/
│   ├── server.js            ← Express app entry point
│   ├── package.json
│   ├── .env.example         ← Copy to .env and fill in values
│   ├── db/
│   │   └── db.js            ← PostgreSQL pool connection
│   ├── middleware/
│   │   └── auth.js          ← JWT verifyToken + adminOnly middleware
│   ├── routes/
│   │   ├── auth.js          ← Register, Login, Profile, Students
│   │   ├── rooms.js         ← Room CRUD
│   │   ├── bookings.js      ← Booking CRUD + status management
│   │   └── maintenance.js   ← Maintenance requests + image upload
│   └── uploads/             ← Uploaded files (auto-created by Multer)
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx           ← Routes setup
        ├── index.css         ← Global styles
        ├── api/
        │   └── axios.js      ← Axios instance with JWT interceptor
        ├── context/
        │   └── AuthContext.jsx ← Global auth state
        ├── components/
        │   ├── Sidebar.jsx
        │   └── ProtectedRoute.jsx
        └── pages/
            ├── Login.jsx
            ├── Register.jsx
            ├── Dashboard.jsx
            ├── Rooms.jsx
            ├── Bookings.jsx
            ├── Maintenance.jsx
            ├── Students.jsx
            └── Profile.jsx
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL 14+
- npm

---

### Step 1 — Set up PostgreSQL Database

Open **pgAdmin** or **psql** and run the following:

```sql
CREATE DATABASE hostel_db;
```

Then connect to `hostel_db` and run `schema.sql` to create the tables and seed data:

```bash
psql -U postgres -d hostel_db -f schema.sql
```

Or paste the contents of `schema.sql` into the pgAdmin query tool and execute it.

---

### Step 2 — Configure Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` and fill in your PostgreSQL password:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostel_db
DB_USER=postgres
DB_PASSWORD=your_actual_password_here
JWT_SECRET=zuct_hostel_super_secret_key_2026
FRONTEND_URL=http://localhost:5173
```

Install dependencies and start the server:

```bash
npm install
npm run dev
```

The API will be running at: **http://localhost:5000**

---

### Step 3 — Start Frontend

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

The app will be running at: **http://localhost:5173**

---

## 🔑 Demo Login Credentials

| Role    | Email                  | Password    |
|---------|------------------------|-------------|
| Admin   | admin@zuct.ac.zm       | admin123    |
| Student | moses@zuct.ac.zm       | student123  |

> These accounts are created automatically by the seed data in `schema.sql`.

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint             | Description              | Auth     |
|--------|----------------------|--------------------------|----------|
| POST   | /api/auth/register   | Register new student     | Public   |
| POST   | /api/auth/login      | Login                    | Public   |
| GET    | /api/auth/me         | Get current user         | Required |
| PUT    | /api/auth/profile    | Update profile + photo   | Required |
| GET    | /api/auth/students   | List all students        | Admin    |

### Rooms
| Method | Endpoint        | Description         | Auth     |
|--------|-----------------|---------------------|----------|
| GET    | /api/rooms      | List rooms (filter) | Required |
| GET    | /api/rooms/:id  | Get single room     | Required |
| POST   | /api/rooms      | Create room         | Admin    |
| PUT    | /api/rooms/:id  | Update room         | Admin    |
| DELETE | /api/rooms/:id  | Delete room         | Admin    |

### Bookings
| Method | Endpoint                   | Description             | Auth     |
|--------|----------------------------|-------------------------|----------|
| GET    | /api/bookings              | List bookings           | Required |
| POST   | /api/bookings              | Create booking          | Student  |
| PUT    | /api/bookings/:id/status   | Approve/Reject/Checkout | Admin    |
| DELETE | /api/bookings/:id          | Cancel booking          | Required |

### Maintenance
| Method | Endpoint                       | Description           | Auth     |
|--------|--------------------------------|-----------------------|----------|
| GET    | /api/maintenance               | List requests         | Required |
| POST   | /api/maintenance               | Submit request + image| Required |
| PUT    | /api/maintenance/:id/status    | Update status         | Admin    |
| DELETE | /api/maintenance/:id           | Delete request        | Required |

### Dashboard
| Method | Endpoint               | Description        | Auth     |
|--------|------------------------|--------------------|----------|
| GET    | /api/dashboard/stats   | Get stats summary  | Required |

---

## 👥 User Roles

### Student
- Register/Login
- Browse and filter available rooms
- Submit room booking requests
- View and cancel their own bookings
- Submit maintenance requests with photo uploads
- Update profile and photo

### Admin
- All student capabilities
- Add, edit, delete rooms
- Approve or reject booking requests
- Mark bookings as paid / checked-out
- Update maintenance request status (Open → In Progress → Resolved)
- View all registered students

---

## 🗄️ Database Schema

```
users              → id, name, email, password_hash, role, student_number, phone, profile_photo
rooms              → id, room_number, block, type, capacity, occupied, price_per_month, amenities, status
bookings           → id, user_id, room_id, check_in_date, check_out_date, status, payment_status
maintenance_requests → id, user_id, room_id, title, description, status, image_path
```

---

*ZUCT Full-Stack Web Development — Final Project 2026*
