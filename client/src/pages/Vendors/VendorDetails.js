import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiStar, FiMapPin, FiPhone, FiMail, FiDollarSign, FiCalendar, FiUsers, FiPackage, FiArrowLeft } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const VendorDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [vendor, setVendor] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorDetails();
  }, [id]);

  const fetchVendorDetails = async () => {
    try {
      const response = await fetch(`/api/vendors/${id}`);
      if (response.ok) {
        const data = await response.json();
        setVendor(data.vendor);
        setServices(data.services || []);
      } else {
        toast.error('Failed to fetch vendor details');
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
      toast.error('Failed to fetch vendor details');
    } finally {
      setLoading(false);
    }
  };

  const getVendorTypeColor = (type) => {
    const colors = {
      caterer: 'bg-orange-100 text-orange-800',
      photographer: 'bg-purple-100 text-purple-800',
      decorator: 'bg-pink-100 text-pink-800',
      musician: 'bg-blue-100 text-blue-800',
      transport: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getPriceTypeLabel = (type) => {
    const labels = {
      per_person: 'per person',
      per_hour: 'per hour',
      per_event: 'per event',
      per_meal: 'per meal'
    };
    return labels[type] || type;
  };

  const formatPrice = (price, priceType) => {
    return `$${parseFloat(price).toFixed(2)} ${getPriceTypeLabel(priceType)}`;
  };

  if (loading) return <LoadingSpinner />;

  if (!vendor) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Vendor not found</h3>
          <p className="text-gray-600 mb-4">The vendor you're looking for doesn't exist or is no longer available.</p>
          <Link
            to="/vendors"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Vendors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/vendors"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4 mr-2" />
            Back to Vendors
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{vendor.business_name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getVendorTypeColor(vendor.vendor_type)}`}>
                  {vendor.vendor_type}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  vendor.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {vendor.is_available ? 'Available' : 'Unavailable'}
                </span>
                {vendor.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <FiStar className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{vendor.rating.toFixed(1)}</span>
                    <span className="text-sm text-gray-600">({vendor.total_reviews} reviews)</span>
                  </div>
                )}
              </div>
            </div>
            
            {user && vendor.is_available && (
              <Link
                to={`/bookings/create?vendor=${vendor.id}`}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors mt-4 md:mt-0"
              >
                Book Now
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vendor Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {vendor.description && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">{vendor.description}</p>
              </div>
            )}

            {/* Services */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Services</h2>
              {services.length === 0 ? (
                <p className="text-gray-600">No services available at the moment.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-900">{service.service_name}</h3>
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(service.base_price, service.price_type)}
                        </span>
                      </div>
                      
                      {service.description && (
                        <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {service.capacity && (
                          <div className="flex items-center gap-1">
                            <FiUsers className="w-4 h-4" />
                            <span>Up to {service.capacity} {service.unit || 'people'}</span>
                          </div>
                        )}
                        {service.unit && !service.capacity && (
                          <div className="flex items-center gap-1">
                            <FiPackage className="w-4 h-4" />
                            <span>{service.unit}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                {vendor.contact_person && (
                  <div className="flex items-center gap-3">
                    <FiStar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{vendor.contact_person}</p>
                      <p className="text-sm text-gray-600">Contact Person</p>
                    </div>
                  </div>
                )}
                
                {vendor.phone && (
                  <div className="flex items-center gap-3">
                    <FiPhone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">{vendor.phone}</p>
                      <p className="text-sm text-gray-600">Phone</p>
                    </div>
                  </div>
                )}
                
                {vendor.email && (
                  <div className="flex items-center gap-3">
                    <FiMail className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">{vendor.email}</p>
                      <p className="text-sm text-gray-600">Email</p>
                    </div>
                  </div>
                )}
                
                {vendor.address && (
                  <div className="flex items-center gap-3">
                    <FiMapPin className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-gray-900">{vendor.address}</p>
                      <p className="text-sm text-gray-600">Address</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Business Hours (if available) */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <FiCalendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Member since</p>
                    <p className="text-sm text-gray-600">
                      {new Date(vendor.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                {vendor.rating > 0 && (
                  <div className="flex items-center gap-3">
                    <FiStar className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium text-gray-900">Rating</p>
                      <p className="text-sm text-gray-600">
                        {vendor.rating.toFixed(1)} out of 5 ({vendor.total_reviews} reviews)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDetails;
