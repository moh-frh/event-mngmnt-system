import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEvent } from '../contexts/EventContext';
import { 
  FiCalendar, 
  FiUsers, 
  FiDollarSign, 
  FiTrendingUp,
  FiPlus,
  FiClock,
  FiMapPin
} from 'react-icons/fi';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const { events, fetchEvents } = useEvent();
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (events.length > 0) {
      const now = new Date();
      const upcoming = events.filter(event => new Date(event.start_date) > now);
      const completed = events.filter(event => new Date(event.end_date) < now);
      
      setStats({
        totalEvents: events.length,
        upcomingEvents: upcoming.length,
        completedEvents: completed.length,
        totalRevenue: events.reduce((sum, event) => sum + (event.budget || 0), 0)
      });
    }
  }, [events]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getRecentEvents = () => {
    return events
      .sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
      .slice(0, 5);
  };

  const getEventStatusColor = (status) => {
    switch (status) {
      case 'planning':
        return 'badge-warning';
      case 'confirmed':
        return 'badge-primary';
      case 'in_progress':
        return 'badge-secondary';
      case 'completed':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      default:
        return 'badge-gray';
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'wedding':
        return '💒';
      case 'birthday':
        return '🎂';
      case 'corporate':
        return '🏢';
      default:
        return '🎉';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.first_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back to your event management dashboard
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/events/create"
            className="btn-primary flex items-center space-x-2"
          >
            <FiPlus className="h-5 w-5" />
            <span>Create Event</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FiCalendar className="h-5 w-5 text-primary-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Events</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalEvents}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-success-100 rounded-lg flex items-center justify-center">
                  <FiClock className="h-5 w-5 text-success-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming Events</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.upcomingEvents}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-secondary-100 rounded-lg flex items-center justify-center">
                  <FiTrendingUp className="h-5 w-5 text-secondary-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Events</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedEvents}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="h-5 w-5 text-warning-600" />
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Budget</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${stats.totalRevenue.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Recent Events</h2>
          <Link
            to="/events"
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            View all events
          </Link>
        </div>
        <div className="card-body">
          {events.length === 0 ? (
            <div className="text-center py-8">
              <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No events yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first event.
              </p>
              <div className="mt-6">
                <Link
                  to="/events/create"
                  className="btn-primary"
                >
                  <FiPlus className="h-4 w-4 mr-2" />
                  Create Event
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {getRecentEvents().map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {getEventTypeIcon(event.event_type)}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        <Link
                          to={`/events/${event.id}`}
                          className="hover:text-primary-600"
                        >
                          {event.title}
                        </Link>
                      </h3>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center">
                          <FiClock className="h-4 w-4 mr-1" />
                          {format(new Date(event.start_date), 'MMM dd, yyyy')}
                        </span>
                        {event.location && (
                          <span className="flex items-center">
                            <FiMapPin className="h-4 w-4 mr-1" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`badge ${getEventStatusColor(event.status)}`}>
                      {event.status.replace('_', ' ')}
                    </span>
                    {event.budget && (
                      <span className="text-sm font-medium text-gray-900">
                        ${event.budget.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FiPlus className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Create New Event</h3>
            <p className="text-sm text-gray-500 mb-4">
              Plan and organize your next event with our comprehensive tools
            </p>
            <Link to="/events/create" className="btn-primary w-full">
              Get Started
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FiUsers className="h-6 w-6 text-secondary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Find Vendors</h3>
            <p className="text-sm text-gray-500 mb-4">
              Discover talented vendors for catering, photography, and more
            </p>
            <Link to="/vendors" className="btn-secondary w-full">
              Browse Vendors
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FiCalendar className="h-6 w-6 text-success-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">View Calendar</h3>
            <p className="text-sm text-gray-500 mb-4">
              See all your events in one organized calendar view
            </p>
            <Link to="/calendar" className="btn-success w-full">
              Open Calendar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
