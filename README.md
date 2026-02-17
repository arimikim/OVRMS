# 🚗 OVRMS - Online Vehicle Rental and Management System

> A comprehensive web-based vehicle rental platform for Konza Technopolis Development Authority (KoTDA)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)
![React](https://img.shields.io/badge/React-18-61dafb.svg)

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 About

The Online Vehicle Rental and Management System (OVRMS) is a smart city solution developed for Konza Technopolis to digitize and streamline the internal vehicle rental process. The system manages a fleet of bicycles and electric cars across multiple mobility hubs within the Technopolis.

### Key Objectives

- **Digitize Rental Process**: Replace manual, paper-based booking with a modern web application
- **Mandatory Authorization**: Implement digital approval workflow for all rental requests
- **Real-time Inventory**: Provide accurate, live vehicle availability across all hubs
- **Automated Fee Calculation**: Track rentals and calculate overdue charges automatically
- **Audit Trail**: Maintain complete digital records of all transactions

## ✨ Features

### User Portal
- 🔍 **Real-time Vehicle Browsing**: View available vehicles across all mobility hubs
- 📅 **Digital Booking**: Submit rental requests with pickup/dropoff locations and dates
- 📊 **Booking Status Tracking**: Monitor request status (Pending, Approved, Active, Completed)
- 📱 **Responsive Design**: Access from desktop, tablet, or mobile devices
- 🔔 **Notifications**: Get updates on booking approvals and rejections

### Admin Dashboard
- ✅ **Approval Queue**: Review and approve/reject pending rental requests
- 🚙 **Fleet Management**: Add, edit, and manage vehicles and their status
- 📈 **Analytics Dashboard**: View fleet utilization, booking trends, and revenue
- ⚠️ **Overdue Tracking**: Identify and manage overdue rentals with automated charges
- 📝 **Audit Logs**: Complete history of all system actions
- 🔧 **Maintenance Scheduling**: Track vehicle service and maintenance

### Security Features
- 🔐 JWT-based authentication
- 🛡️ Role-based access control (RBAC)
- 🔒 Password hashing with bcrypt
- 🚦 Rate limiting to prevent abuse
- 📋 Comprehensive audit logging
- 🔑 Row-level security in database

## 🏗️ System Architecture

```
┌─────────────┐
│   Browser   │
│  (React UI) │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│  Express API    │
│  (Node.js)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │
│  Database       │
└─────────────────┘
```

### Component Diagram

```
User Portal                Admin Dashboard
├── Login/Register         ├── Approval Queue
├── Browse Vehicles        ├── Fleet Management
├── Book Vehicle          ├── User Management
├── My Bookings           ├── Analytics
└── Profile               └── Reports

           ↓                       ↓
        
                REST API
        ┌─────────────────────┐
        │  Authentication     │
        │  Vehicles           │
        │  Bookings           │
        │  Analytics          │
        │  Audit Logs         │
        └─────────────────────┘
                   ↓
        ┌─────────────────────┐
        │  PostgreSQL DB      │
        │  - Users            │
        │  - Vehicles         │
        │  - Bookings         │
        │  - Mobility Hubs    │
        │  - Audit Logs       │
        └─────────────────────┘
```

## 🛠️ Tech Stack

### Frontend
- **React 18**: Modern UI framework
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Fast build tool

### Backend
- **Node.js 18+**: JavaScript runtime
- **Express.js**: Web framework
- **PostgreSQL 13+**: Relational database
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing

### DevOps
- **Git**: Version control
- **Docker** (optional): Containerization
- **PM2** (optional): Process management
- **Nginx** (optional): Reverse proxy

## 📦 Installation

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 13
- npm >= 9.0.0
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/ovrms.git
cd ovrms
```

### Step 2: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies (if separate)
cd frontend
npm install
cd ..
```

### Step 3: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit with your configuration
nano .env
```

## ⚙️ Configuration

### Environment Variables

Update the `.env` file with your configuration:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ovrms
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_here

# Server
PORT=3000
NODE_ENV=development
```

### Database Configuration

The system uses PostgreSQL with the following key settings:

- Connection pooling (max 20 connections)
- Row-level security enabled
- Automated triggers for audit logging
- Optimized indexes for performance

## 🗄️ Database Setup

### Step 1: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ovrms;

# Connect to the database
\c ovrms
```

### Step 2: Run Schema

```bash
# Execute the schema file
psql -U postgres -d ovrms -f database-schema.sql
```

### Step 3: Verify Setup

```sql
-- Check tables
\dt

-- Verify sample data
SELECT * FROM mobility_hubs;
SELECT * FROM system_settings;
```

## 🚀 Running the Application

### Development Mode

```bash
# Start backend server
npm run dev

# In another terminal, start frontend (if separate)
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api-docs

### Production Mode

```bash
# Build frontend
npm run build

# Start production server
npm start
```

### Using Docker (Optional)

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "jdoe",
  "email": "jdoe@konza.go.ke",
  "password": "SecurePass123!",
  "fullName": "John Doe",
  "phoneNumber": "+254712345678",
  "organization": "KoTDA",
  "employeeId": "EMP001"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "jdoe",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "jdoe",
    "email": "jdoe@konza.go.ke",
    "fullName": "John Doe",
    "role": "user"
  }
}
```

### Vehicle Endpoints

#### Get Available Vehicles
```http
GET /api/vehicles/available
Authorization: Bearer {token}
```

#### Get All Vehicles (Admin)
```http
GET /api/vehicles
Authorization: Bearer {token}
```

#### Create Vehicle (Admin)
```http
POST /api/vehicles
Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleType": "car",
  "vehicleName": "Toyota Corolla",
  "plateNumber": "KCA 123A",
  "currentHubId": "hub-uuid",
  "dailyRate": 500,
  "vehicleMake": "Toyota",
  "vehicleModel": "Corolla",
  "yearOfManufacture": 2023,
  "color": "Silver",
  "seatingCapacity": 5,
  "fuelType": "electric"
}
```

### Booking Endpoints

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "vehicleId": "vehicle-uuid",
  "pickupHubId": "hub-uuid",
  "dropoffHubId": "hub-uuid",
  "requestedStartDate": "2026-03-01",
  "requestedEndDate": "2026-03-03",
  "purposeOfRental": "Official business trip"
}
```

#### Get My Bookings
```http
GET /api/bookings/my-bookings
Authorization: Bearer {token}
```

#### Approve Booking (Admin)
```http
POST /api/bookings/{booking-id}/approve
Authorization: Bearer {token}
```

#### Reject Booking (Admin)
```http
POST /api/bookings/{booking-id}/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Vehicle scheduled for maintenance"
}
```

## 👥 User Roles

### Community Member (User)
- Browse available vehicles
- Submit booking requests
- View own booking history
- Update profile

### Admin (KoTDA Operations)
- All user permissions
- Approve/reject booking requests
- Manage fleet inventory
- View all bookings
- Access analytics and reports
- Manage maintenance schedules

## 📁 Project Structure

```
ovrms/
├── backend/
│   ├── backend-api.js          # Main Express server
│   ├── database-schema.sql     # PostgreSQL schema
│   ├── package.json            # Dependencies
│   ├── .env.example            # Environment template
│   └── README.md               # This file
├── frontend/
│   ├── ovrms-app.jsx          # React application
│   ├── public/                # Static assets
│   └── package.json           # Frontend dependencies
├── docs/
│   ├── API.md                 # API documentation
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── USER_GUIDE.md          # User manual
└── docker-compose.yml         # Docker configuration
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- bookings.test.js
```

### Test Categories

- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user flow testing

## 🌐 Deployment

### Ubuntu Server Deployment

1. **Install Node.js and PostgreSQL**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql
```

2. **Clone and Setup**
```bash
git clone https://github.com/yourusername/ovrms.git
cd ovrms
npm install
```

3. **Configure Database**
```bash
sudo -u postgres psql
CREATE DATABASE ovrms;
\q
psql -U postgres -d ovrms -f database-schema.sql
```

4. **Setup PM2**
```bash
sudo npm install -g pm2
pm2 start backend-api.js --name ovrms
pm2 save
pm2 startup
```

5. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name ovrms.konza.go.ke;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL Certificate

```bash
sudo certbot --nginx -d ovrms.konza.go.ke
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mercy Wanjiku Minjire**
- Registration: 22/05175
- Course: BAC 3500 (Final Project)
- Institution: KCA University
- Supervisor: Fred Omondi

## 🙏 Acknowledgments

- KCA University for academic support
- Konza Technopolis Development Authority for project inspiration
- Fred Omondi for supervision and guidance
- Open source community for tools and libraries

## 📞 Support

For support, email support@ovrms.konza.go.ke or create an issue in the repository.

## 📊 Project Status

- ✅ Requirements Analysis - Complete
- ✅ Database Design - Complete
- ✅ Backend API - Complete
- ✅ Frontend UI - Complete
- 🔄 Testing - In Progress
- ⏳ Deployment - Pending

---

**Built with ❤️ for Konza Technopolis Smart City Initiative**
#   O V R M S  
 #   O V R M S  
 