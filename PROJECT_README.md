# 🚗 OVRMS - Complete Project Source Code

**Online Vehicle Rental and Management System**  
*A Smart City Solution for Konza Technopolis*

---

## 📁 Project Structure

```
ovrms-complete/
├── backend/                    # Node.js/Express backend
│   ├── config/                # Configuration files
│   │   ├── config.js         # Application configuration
│   │   └── database.js       # Database connection pool
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # JWT authentication
│   │   ├── validation.js     # Request validation
│   │   └── errorHandler.js   # Error handling
│   ├── routes/                # API route handlers
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── vehicles.js       # Vehicle management
│   │   ├── bookings.js       # Booking management
│   │   └── analytics.js      # Analytics & reports
│   ├── utils/                 # Utility functions
│   │   └── helpers.js        # Helper functions
│   ├── server.js             # Main server file
│   ├── package.json          # Backend dependencies
│   ├── .env.example          # Environment template
│   └── Dockerfile            # Docker configuration
├── frontend/                  # React frontend
│   ├── src/
│   │   ├── App.jsx           # Main React application
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Tailwind CSS
│   ├── index.html            # HTML template
│   ├── package.json          # Frontend dependencies
│   ├── vite.config.js        # Vite configuration
│   └── tailwind.config.js    # Tailwind configuration
├── database/                  # Database files
│   └── database-schema.sql   # PostgreSQL schema
├── docs/                      # Documentation
│   └── DEPLOYMENT.md         # Deployment guide
├── scripts/                   # Utility scripts
├── docker-compose.yml        # Docker Compose config
└── README.md                 # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 13+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ovrms-complete
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Setup Database**
   ```bash
   # Create database
   createdb ovrms
   
   # Load schema
   psql -d ovrms -f ../database/database-schema.sql
   ```

4. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

5. **Run Application**
   ```bash
   # Terminal 1: Start backend
   cd backend
   npm run dev
   
   # Terminal 2: Start frontend
   cd frontend
   npm run dev
   ```

   Access the application at http://localhost:5173

## 🐳 Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Complete deployment instructions
- **[API Documentation](#)** - API endpoints and usage
- **[User Manual](#)** - End-user guide

## 🔑 Default Credentials

For development/testing:
- **Admin**: username: `admin`, password: `admin123` (create via database)
- **User**: username: `user1`, password: `user123` (create via registration)

**⚠️ Change these in production!**

## 🛠️ Technology Stack

### Backend
- Node.js 18+ (JavaScript runtime)
- Express.js (Web framework)
- PostgreSQL (Database)
- JWT (Authentication)
- Bcrypt (Password hashing)

### Frontend
- React 18 (UI library)
- Vite (Build tool)
- Tailwind CSS (Styling)
- Lucide React (Icons)
- Axios (HTTP client)

## 📖 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login

### Vehicles
- `GET /api/vehicles/available` - List available vehicles
- `GET /api/vehicles` - List all vehicles (admin)
- `POST /api/vehicles` - Create vehicle (admin)
- `PUT /api/vehicles/:id` - Update vehicle (admin)
- `DELETE /api/vehicles/:id` - Delete vehicle (admin)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - User's bookings
- `GET /api/bookings` - All bookings (admin)
- `POST /api/bookings/:id/approve` - Approve booking (admin)
- `POST /api/bookings/:id/reject` - Reject booking (admin)

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats (admin)
- `GET /api/analytics/fleet-stats` - Fleet statistics (admin)
- `GET /api/analytics/revenue` - Revenue report (admin)

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- SQL injection prevention
- XSS protection
- CSRF protection
- Row-level security in database

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## 📊 Database Schema

The system uses PostgreSQL with the following main tables:
- `users` - System users
- `vehicles` - Fleet inventory
- `bookings` - Rental bookings
- `mobility_hubs` - Pickup/dropoff locations
- `audit_logs` - Complete audit trail
- `rental_transactions` - Transaction history
- `maintenance_records` - Vehicle maintenance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is developed for KCA University - BAC 3500 Final Project

## 👨‍💻 Author

**Mercy Wanjiku Minjire**
- Registration Number: 22/05175
- Course: BAC 3500 (Final Project)
- Institution: KCA University
- Supervisor: Fred Omondi
- Presentation Date: 13/10/2025

## 🙏 Acknowledgments

- KCA University for academic support
- Konza Technopolis Development Authority
- Supervisor Fred Omondi
- Open source community

## 📞 Support

For questions or issues:
- Email: support@ovrms.konza.go.ke
- GitHub Issues: [Create an issue]

---

**Built with ❤️ for Konza Technopolis Smart City Initiative**

Last Updated: February 14, 2026
