import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiSearch, FiStar, FiMapPin, FiPhone, FiMail, FiDollarSign } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const Vendors = () => {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterAvailability, setFilterAvailability] = useState('all');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const response = await fetch('/api/vendors');
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.vendor_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || vendor.vendor_type === filterType;
    const matchesAvailability = filterAvailability === 'all' || 
                              (filterAvailability === 'available' && vendor.is_available) ||
                              (filterAvailability === 'unavailable' && !vendor.is_available);
    
    return matchesSearch && matchesType && matchesAvailability;
  });

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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendors</h1>
          <p className="text-gray-600">Find and connect with event service providers</p>
        </div>
        {user?.profile_type === 'vendor' && (
          <Link
            to="/vendors/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            Add Vendor Profile
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="caterer">Caterer</option>
              <option value="photographer">Photographer</option>
              <option value="decorator">Decorator</option>
              <option value="musician">Musician</option>
              <option value="transport">Transport</option>
              <option value="other">Other</option>
            </select>
            
            <select
              value={filterAvailability}
              onChange={(e) => setFilterAvailability(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      {filteredVendors.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <FiStar className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== 'all' || filterAvailability !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'No vendors are currently available'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVendorTypeColor(vendor.vendor_type)}`}>
                    {vendor.vendor_type}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    vendor.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {vendor.is_available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{vendor.business_name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {vendor.description || 'No description available'}
                </p>
                
                <div className="space-y-2 mb-4">
                  {vendor.contact_person && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FiStar className="w-4 h-4 mr-2" />
                      {vendor.contact_person}
                    </div>
                  )}
                  
                  {vendor.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FiPhone className="w-4 h-4 mr-2" />
                      {vendor.phone}
                    </div>
                  )}
                  
                  {vendor.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FiMail className="w-4 h-4 mr-2" />
                      {vendor.email}
                    </div>
                  )}
                  
                  {vendor.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FiMapPin className="w-4 h-4 mr-2" />
                      {vendor.address}
                    </div>
                  )}
                  

                  
                  {vendor.rating > 0 && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FiStar className="w-4 h-4 mr-2 text-yellow-500" />
                      {vendor.rating.toFixed(1)} rating
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Link
                    to={`/vendors/${vendor.id}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    View Details
                  </Link>
                  {user && (
                    <Link
                      to={`/bookings/create?vendor=${vendor.id}`}
                      className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                    >
                      Book Now
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Vendors;
