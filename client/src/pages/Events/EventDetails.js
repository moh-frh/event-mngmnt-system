import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2, FiCalendar, FiMapPin, FiUsers, FiDollarSign, FiUser, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useEvent } from '../../contexts/EventContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentEvent, loading, fetchEventById, deleteEvent } = useEvent();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchEventById(id);
    }
  }, [id, fetchEventById]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      setIsDeleting(true);
      try {
        await deleteEvent(id);
        navigate('/events');
      } catch (error) {
        console.error('Error deleting event:', error);
        setIsDeleting(false);
      }
    }
  };

  const handleApprove = async () => {
    if (!id || !user) return;
    setIsApproving(true);
    try {
      const response = await fetch(`/api/events/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'confirmed', manager_id: user.id })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to approve event');
      }
      await fetchEventById(id);
    } catch (error) {
      console.error('Error approving event:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const getEventTypeColor = (type) => {
    const colors = {
      wedding: 'bg-pink-100 text-pink-800',
      birthday: 'bg-blue-100 text-blue-800',
      corporate: 'bg-gray-100 text-gray-800',
      other: 'bg-purple-100 text-purple-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <LoadingSpinner />;
  if (!currentEvent) return <div className="p-6">Event not found</div>;

  const canEdit = user && (user.id === currentEvent.manager_id || user.id === currentEvent.customer_id || user.profile_type === 'admin');

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            to="/events"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{currentEvent.title}</h1>
            <p className="text-gray-600">Event Details</p>
          </div>
        </div>
        
        {canEdit && (
          <div className="flex gap-3">
            {user.profile_type === 'manager' && currentEvent.status === 'planning' && (
              <button
                onClick={handleApprove}
                disabled={isApproving}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <FiCheckCircle className="w-4 h-4" />
                {isApproving ? 'Approving...' : 'Approve & Assign'}
              </button>
            )}
            <Link
              to={`/events/${id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FiEdit className="w-4 h-4" />
              Edit Event
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <FiTrash2 className="w-4 h-4" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Info Card */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEventTypeColor(currentEvent.event_type)}`}>
                {currentEvent.event_type}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentEvent.status)}`}>
                {currentEvent.status.replace('_', ' ')}
              </span>
            </div>
            
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">{currentEvent.title}</h2>
            
            {currentEvent.description && (
              <p className="text-gray-700 mb-6 leading-relaxed">{currentEvent.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center text-gray-600">
                <FiCalendar className="w-5 h-5 mr-3 text-blue-500" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-sm">
                    {new Date(currentEvent.start_date).toLocaleDateString()} - {new Date(currentEvent.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {currentEvent.location && (
                <div className="flex items-center text-gray-600">
                  <FiMapPin className="w-5 h-5 mr-3 text-red-500" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm">{currentEvent.location}</p>
                  </div>
                </div>
              )}
              
              {currentEvent.max_guests && (
                <div className="flex items-center text-gray-600">
                  <FiUsers className="w-5 h-5 mr-3 text-green-500" />
                  <div>
                    <p className="font-medium">Max Guests</p>
                    <p className="text-sm">{currentEvent.max_guests}</p>
                  </div>
                </div>
              )}
              
              {currentEvent.budget && (
                <div className="flex items-center text-gray-600">
                  <FiDollarSign className="w-5 h-5 mr-3 text-yellow-500" />
                  <div>
                    <p className="font-medium">Budget</p>
                    <p className="text-sm">${currentEvent.budget}</p>
                  </div>
                </div>
              )}
            </div>

            {currentEvent.address && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Address</h4>
                <p className="text-gray-700">{currentEvent.address}</p>
              </div>
            )}

            {currentEvent.theme && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Theme</h4>
                <p className="text-gray-700">{currentEvent.theme}</p>
              </div>
            )}

            {currentEvent.notes && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{currentEvent.notes}</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link
                to={`/calendar?event=${id}`}
                className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiCalendar className="w-5 h-5 text-blue-500" />
                View in Calendar
              </Link>
              <Link
                to={`/bookings?event=${id}`}
                className="flex items-center justify-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FiUsers className="w-5 h-5 text-green-500" />
                Manage Bookings
              </Link>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Days Remaining</span>
                <span className="font-medium">
                  {Math.ceil((new Date(currentEvent.start_date) - new Date()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentEvent.status)}`}>
                  {currentEvent.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEventTypeColor(currentEvent.event_type)}`}>
                  {currentEvent.event_type}
                </span>
              </div>
            </div>
          </div>

          {/* Event Team */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Team</h3>
            <div className="space-y-3">
              {currentEvent.manager_id && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Event Manager</p>
                    <p className="text-xs text-gray-600">ID: {currentEvent.manager_id}</p>
                  </div>
                </div>
              )}
              
              {currentEvent.customer_id && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <FiUser className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Customer</p>
                    <p className="text-xs text-gray-600">ID: {currentEvent.customer_id}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
