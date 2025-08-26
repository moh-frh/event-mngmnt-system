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
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (with Firebase migration path)
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **React Hook Form** - Form management
- **Axios** - HTTP client
- **React Hot Toast** - Notifications
- **React Icons** - Icon library

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
├── package.json           # Root package.json
└── README.md              # This file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-manager-app
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install frontend dependencies
   cd client && npm install
   cd ..
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env file with your configuration
   nano .env
   ```

4. **Database Setup**
   ```bash
   # The SQLite database will be created automatically
   # No additional setup required
   ```

5. **Start the application**
   ```bash
   # Development mode (both backend and frontend)
   npm run dev-full
   
   # Or start separately:
   npm run dev          # Backend only
   npm run client       # Frontend only
   ```

### Development Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run client` - Start React development server
- `npm run dev-full` - Start both backend and frontend
- `npm run build` - Build React app for production
- `npm run install-all` - Install all dependencies

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
# Run backend tests
npm test

# Run frontend tests
cd client && npm test
```

## 📦 Deployment

### Backend Deployment
```bash
# Build and start production server
npm run build
npm start
```

### Frontend Deployment
```bash
# Build for production
cd client && npm run build

# Deploy build folder to your hosting service
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

