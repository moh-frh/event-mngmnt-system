import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCalendar, FiClock, FiDollarSign, FiUser, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const BookingDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await fetch(`/api/bookings/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch booking');
        }
        const data = await response.json();
        setBooking(data.booking);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error loading booking:', e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchBooking();
  }, [id]);

  const formatTime = (time) => {
    if (!time) return '';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return <LoadingSpinner />;
  if (!booking) return <div className="p-6">Booking not found</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link to="/bookings" className="text-gray-600 hover:text-gray-900 transition-colors">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Booking Details</h1>
            <p className="text-gray-600">View booking information</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">{booking.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Event</h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4" />
                <span>{booking.event_title || 'Event'}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar className="w-4 h-4" />
                <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
              </div>
              {(booking.start_time || booking.end_time) && (
                <div className="flex items-center gap-2">
                  <FiClock className="w-4 h-4" />
                  <span>
                    {booking.start_time && formatTime(booking.start_time)}
                    {booking.start_time && booking.end_time && ' - '}
                    {booking.end_time && formatTime(booking.end_time)}
                  </span>
                </div>
              )}
              {booking.event_location && (
                <div className="flex items-center gap-2">
                  <FiMapPin className="w-4 h-4" />
                  <span>{booking.event_location}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendor & Service</h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center gap-2">
                <FiUser className="w-4 h-4" />
                <span>{booking.vendor_name} ({booking.vendor_type})</span>
              </div>
              <div className="flex items-center gap-2">
                <FiUser className="w-4 h-4" />
                <span>{booking.service_name}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center gap-2">
                <FiDollarSign className="w-4 h-4" />
                <span>Unit Price: ${parseFloat(booking.unit_price).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <FiUser className="w-4 h-4" />
                <span>Quantity: {booking.quantity}</span>
              </div>
              <div className="flex items-center gap-2 font-semibold">
                <FiDollarSign className="w-4 h-4" />
                <span>Total: ${parseFloat(booking.total_cost).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer</h2>
            <div className="space-y-2 text-gray-700">
              <div className="flex items-center gap-2">
                <FiUser className="w-4 h-4" />
                <span>{booking.customer_first_name} {booking.customer_last_name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;

