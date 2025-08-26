import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiCalendar, FiClock, FiDollarSign, FiUsers, FiPackage, FiPlus, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CreateBooking = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [formData, setFormData] = useState({
    event_id: searchParams.get('event') || '',
    vendor_id: searchParams.get('vendor') || '',
    booking_date: '',
    start_time: '',
    end_time: '',
    special_requirements: ''
  });

  useEffect(() => {
    fetchEvents();
    fetchVendors();
  }, []);

  useEffect(() => {
    if (formData.vendor_id) {
      fetchVendorServices(formData.vendor_id);
    }
  }, [formData.vendor_id]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const fetchVendorServices = async (vendorId) => {
    try {
      console.log('Fetching services for vendor:', vendorId);
      const response = await fetch(`/api/vendors/${vendorId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Vendor services data:', data);
        setServices(data.services || []);
        setSelectedVendor(data.vendor);
        setSelectedServices([]); // Reset selected services when vendor changes
      } else {
        console.error('Failed to fetch vendor services:', response.status);
      }
    } catch (error) {
      console.error('Error fetching vendor services:', error);
    }
  };

  const addServiceToCart = (service) => {
    console.log('Adding service to cart:', service);
    const existingService = selectedServices.find(s => s.service_id === service.id);
    
    if (existingService) {
      // Update quantity if service already exists
      setSelectedServices(selectedServices.map(s => 
        s.service_id === service.id 
          ? { ...s, quantity: s.quantity + 1 }
          : s
      ));
      console.log('Updated existing service quantity');
    } else {
      // Add new service with default quantity
      const defaultQuantity = service.price_type === 'per_event' ? 1 : 1;
      const newService = {
        service_id: service.id,
        service_name: service.service_name,
        base_price: service.base_price,
        price_type: service.price_type,
        quantity: defaultQuantity,
        unit_price: service.base_price,
        total_cost: service.base_price * defaultQuantity
      };
      setSelectedServices([...selectedServices, newService]);
      console.log('Added new service to cart:', newService);
    }
  };

  const removeServiceFromCart = (serviceId) => {
    setSelectedServices(selectedServices.filter(s => s.service_id !== serviceId));
  };

  const updateServiceQuantity = (serviceId, quantity) => {
    setSelectedServices(selectedServices.map(s => {
      if (s.service_id === serviceId) {
        const newQuantity = Math.max(1, quantity);
        const newTotalCost = s.base_price * newQuantity;
        return {
          ...s,
          quantity: newQuantity,
          total_cost: newTotalCost
        };
      }
      return s;
    }));
  };

  const calculateServiceCost = (service) => {
    switch (service.price_type) {
      case 'per_person':
      case 'per_meal':
        return service.base_price * service.quantity;
      case 'per_hour':
        const hours = formData.start_time && formData.end_time ? 
          (new Date(`2000-01-01T${formData.end_time}`) - new Date(`2000-01-01T${formData.start_time}`)) / (1000 * 60 * 60) : 1;
        return service.base_price * hours;
      case 'per_event':
        return service.base_price;
      default:
        return service.base_price;
    }
  };

  const calculateTotalCost = () => {
    return selectedServices.reduce((total, service) => {
      return total + calculateServiceCost(service);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.event_id || !formData.vendor_id || selectedServices.length === 0) {
      toast.error('Please select an event, vendor, and at least one service');
      return;
    }

    setLoading(true);
    
    try {
      // Create multiple bookings for each selected service
      const bookingPromises = selectedServices.map(service => {
        const bookingData = {
          event_id: formData.event_id,
          vendor_id: formData.vendor_id,
          service_id: service.service_id,
          quantity: service.quantity,
          unit_price: service.base_price,
          total_cost: calculateServiceCost(service),
          booking_date: formData.booking_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          special_requirements: formData.special_requirements
        };

        return fetch('/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(bookingData)
        });
      });

      const responses = await Promise.all(bookingPromises);
      const failedBookings = responses.filter(response => !response.ok);

      if (failedBookings.length === 0) {
        toast.success(`Successfully created ${selectedServices.length} booking(s)!`);
        navigate('/bookings');
      } else {
        toast.error(`Failed to create ${failedBookings.length} booking(s)`);
      }
    } catch (error) {
      console.error('Error creating bookings:', error);
      toast.error('Failed to create bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorChange = (vendorId) => {
    setFormData({
      ...formData,
      vendor_id: vendorId
    });
    setSelectedVendor(null);
    setServices([]);
    setSelectedServices([]);
  };

  const getPriceTypeLabel = (type) => {
    const labels = {
      per_person: 'Per Person',
      per_hour: 'Per Hour',
      per_event: 'Per Event',
      per_meal: 'Per Meal'
    };
    return labels[type] || type;
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Book Vendor Services</h1>
          <p className="text-gray-600">Select a vendor and services for your event</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Selection Forms */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Selection */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Event *
                  </label>
                  <select
                    value={formData.event_id}
                    onChange={(e) => setFormData({...formData, event_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose an event</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} - {new Date(event.start_date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Vendor Selection */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Vendor Selection</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Vendor *
                  </label>
                  <select
                    value={formData.vendor_id}
                    onChange={(e) => handleVendorChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose a vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.business_name} - {vendor.vendor_type}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedVendor && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">{selectedVendor.business_name}</h3>
                    <p className="text-sm text-gray-600">{selectedVendor.description}</p>
                    {selectedVendor.rating > 0 && (
                      <div className="mt-2 flex items-center text-sm text-gray-600">
                        <span className="text-yellow-500 mr-1">★</span>
                        {selectedVendor.rating.toFixed(1)} ({selectedVendor.total_reviews} reviews)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Service Selection */}
              {formData.vendor_id && services.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Services</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {services.map((service) => (
                      <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{service.service_name}</h3>
                          <span className="text-lg font-bold text-green-600">
                            {formatPrice(service.base_price)} {getPriceTypeLabel(service.price_type).toLowerCase()}
                          </span>
                        </div>
                        
                        {service.description && (
                          <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            {service.capacity && (
                              <div className="flex items-center gap-1">
                                <FiUsers className="w-4 h-4" />
                                <span>Up to {service.capacity} {service.unit || 'people'}</span>
                              </div>
                            )}
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => addServiceToCart(service)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors"
                          >
                            <FiPlus className="w-3 h-3" />
                            Add
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Booking Details */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Booking Date *
                    </label>
                    <input
                      type="date"
                      value={formData.booking_date}
                      onChange={(e) => setFormData({...formData, booking_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Requirements
                    </label>
                    <textarea
                      value={formData.special_requirements}
                      onChange={(e) => setFormData({...formData, special_requirements: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Any special requirements or notes..."
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/bookings')}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.event_id || !formData.vendor_id || selectedServices.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : `Create ${selectedServices.length} Booking(s)`}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Shopping Cart */}
          <div className="space-y-6">
            {/* Shopping Cart */}
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <FiShoppingCart className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Your Selection</h2>
              </div>

              {selectedServices.length === 0 ? (
                <div className="text-center py-8">
                  <FiShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No services selected</p>
                  <p className="text-sm text-gray-400">Choose services from the vendor to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedServices.map((service) => (
                    <div key={service.service_id} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 text-sm">{service.service_name}</h3>
                        <button
                          type="button"
                          onClick={() => removeServiceFromCart(service.service_id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Quantity:</span>
                          <input
                            type="number"
                            value={service.quantity}
                            onChange={(e) => updateServiceQuantity(service.service_id, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                            min="1"
                            disabled={service.price_type === 'per_event'}
                          />
                        </div>
                        <span className="font-medium text-gray-900">
                          {formatPrice(calculateServiceCost(service))}
                        </span>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-1">
                        {formatPrice(service.base_price)} {getPriceTypeLabel(service.price_type).toLowerCase()}
                      </div>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total Cost:</span>
                      <span className="text-xl font-bold text-green-600">{formatPrice(calculateTotalCost())}</span>
                    </div>
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

export default CreateBooking;

