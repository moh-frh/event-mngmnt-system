# Event Manager - Professional Event Management Application

A comprehensive event management application built with Node.js backend and React frontend, designed to handle weddings, birthdays, corporate events, and more. The application features role-based access control, vendor management, calendar integration, and booking systems.

## 🚀 Features

### Core Functionality
- **Event Management**: Create, edit, and manage events with detailed information
- **User Roles**: Multiple user types (Customer, Manager, Vendor, Admin)
- **Vendor Management**: Browse and book vendors for various services
- **Calendar Integration**: Visual calendar with event scheduling
- **Booking System**: Manage vendor bookings and appointments
- **Guest Management**: Track guest lists and RSVPs
- **Task Management**: Organize event-related tasks and deadlines

### User Profiles

#### Customer
- Create and manage personal events
- Browse and book vendors
- Track event progress and budgets
- Manage guest lists

#### Event Manager
- Manage multiple client events
- Coordinate with vendors
- Track project timelines
- Generate reports

#### Vendor
- Create service profiles
- Manage availability and bookings
- Track earnings and performance
- Portfolio management

#### Admin
- User management and oversight
- System analytics and reporting
- Content moderation
- Platform configuration

## 🛠️ Technology Stack

### Backend
- **Node.js 18.19.0** - Runtime environment (LTS)
- **Express.js 4.18.2** - Web framework
- **SQLite 5.1.6** - Database (with Firebase migration path)
- **JWT 9.0.2** - Authentication
- **bcryptjs 2.4.3** - Password hashing
- **Express Validator 7.0.1** - Input validation

### Frontend
- **React 18.2.0** - UI library
- **React Router 6.8.1** - Navigation
- **Tailwind CSS 3.2.7** - Styling
- **React Hook Form 7.43.9** - Form management
- **Axios 1.3.4** - HTTP client
- **React Hot Toast 2.4.0** - Notifications
- **React Icons 4.7.1** - Icon library

## 🐳 Docker Setup (Recommended)

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose

### Quick Start with Docker

1. **Clone and run with Docker Compose**
   ```bash
   git clone <repository-url>
   cd event-manager-app
   
   # Start production environment
   docker-compose up -d
   
   # Or start development environment with hot reload
   docker-compose --profile development up -d
   ```

2. **Access the application**
   - Backend API: http://localhost:5000
   - Frontend: http://localhost:3000 (development) or http://localhost:5000 (production)
   - Health check: http://localhost:5000/health

### Docker Commands

```bash
# Production
npm run docker:compose:up      # Start production
npm run docker:compose:down    # Stop services

# Development
npm run docker:compose:dev     # Start development with hot reload
npm run docker:logs           # View logs
npm run docker:restart        # Restart services
npm run docker:rebuild        # Rebuild and restart

# Individual Docker commands
npm run docker:build          # Build image
npm run docker:run            # Run container
npm run docker:clean          # Clean up Docker resources
```

### Docker Benefits
- ✅ **Version Consistency**: Exact Node.js 18.19.0 and dependency versions
- ✅ **Cross-Platform**: Works identically on Windows, Mac, and Linux
- ✅ **No Local Dependencies**: No need to install Node.js, npm, or other tools
- ✅ **Isolated Environment**: Prevents conflicts with other projects
- ✅ **Easy Deployment**: Same container runs in development and production
- ✅ **Persistent Data**: SQLite database and uploads persist across restarts

## 📁 Project Structure

```
event-manager-app/
├── server/                 # Backend server
│   ├── config/            # Database configuration
│   ├── middleware/        # Authentication middleware
│   ├── routes/            # API routes
│   ├── uploads/           # File uploads
│   └── index.js           # Server entry point
├── client/                # React frontend
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   └── App.js         # Main app component
│   └── package.json       # Frontend dependencies
├── Dockerfile             # Production Docker build
├── Dockerfile.dev         # Development Docker build
├── docker-compose.yml     # Production services
├── docker-compose.override.yml # Development overrides
├── package.json           # Root package.json with exact versions
└── README.md              # This file
```

## 🚀 Getting Started

### Option 1: Docker (Recommended)
```bash
# Clone repository
git clone <repository-url>
cd event-manager-app

# Start with Docker
docker-compose up -d

# View logs
docker-compose logs -f
```

### Option 2: Local Development
```bash
# Prerequisites
- Node.js 18.19.0 (exact version)
- npm 9.8.1 (exact version)

# Clone repository
git clone <repository-url>
cd event-manager-app

# Install dependencies
npm run install-all

# Start development
npm run dev-full
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Events
- `GET /api/events` - List events
- `POST /api/events` - Create event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Vendors
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor profile
- `GET /api/vendors/:id` - Get vendor details
- `PUT /api/vendors/:id` - Update vendor profile

### Bookings
- `GET /api/bookings` - List bookings
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id/status` - Update booking status

### Calendar
- `GET /api/calendar` - Get calendar events
- `POST /api/calendar` - Create calendar event
- `PUT /api/calendar/:id` - Update calendar event

## 🔐 Authentication & Authorization

The application uses JWT tokens for authentication with role-based access control:

- **Customer**: Can manage their own events and book vendors
- **Manager**: Can manage multiple client events
- **Vendor**: Can manage their service profile and bookings
- **Admin**: Full system access and user management

## 🗄️ Database Schema

### Core Tables
- **users** - User accounts and profiles
- **events** - Event information and details
- **vendors** - Vendor profiles and services
- **bookings** - Vendor bookings and appointments
- **calendar** - Calendar events and scheduling
- **event_tasks** - Task management for events
- **guest_list** - Guest management and RSVPs

## 🔄 Future Enhancements

### Phase 2: Firebase Integration
- Migrate from SQLite to Firebase Firestore
- Real-time updates and notifications
- Cloud storage for files and images
- Advanced analytics and reporting

### Phase 3: Advanced Features
- Payment processing integration
- Email notifications and reminders
- Mobile app development
- Advanced reporting and analytics
- Multi-language support

## 🧪 Testing

```bash
# With Docker
docker-compose exec event-manager npm test

# Local development
npm test
cd client && npm test
```

## 📦 Deployment

### Docker Deployment
```bash
# Build and deploy
docker-compose up -d

# Update deployment
git pull
docker-compose down
docker-compose up -d --build
```

### Traditional Deployment
```bash
# Build frontend
cd client && npm run build

# Start backend
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Express.js community for the robust backend framework
- All contributors and users of this application

---

**Built with ❤️ for event professionals and organizers**

## 🔧 Troubleshooting

### Common Docker Issues

**Port already in use:**
```bash
# Check what's using the port
netstat -ano | findstr :5000  # Windows
lsof -i :5000                 # Mac/Linux

# Stop conflicting services or change ports in docker-compose.yml
```

**Permission denied:**
```bash
# On Linux/Mac, ensure proper file permissions
chmod -R 755 .
```

**Database connection issues:**
```bash
# Check container logs
docker-compose logs event-manager

# Verify database volume
docker volume ls
docker volume inspect event-manager-app_event_data
```

### Version Compatibility

This project uses exact version pinning to ensure consistency:
- **Node.js**: 18.19.0 (LTS)
- **npm**: 9.8.1
- All dependencies have exact versions (no ^ or ~)

If you need to update versions:
1. Update the version in `package.json`
2. Update the Node.js version in `Dockerfile` and `Dockerfile.dev`
3. Test thoroughly before committing
4. Update this README with new version information

