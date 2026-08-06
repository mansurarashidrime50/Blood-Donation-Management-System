import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProfileCard from '../components/ProfileCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react';

const DIVISION_DISTRICTS = {
  'Dhaka': ['Dhaka', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur'],
  'Chattogram': ['Chattogram', 'Cox\'s Bazar', 'Feni', 'Cumilla', 'Noakhali'],
  'Sylhet': ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  'Rajshahi': ['Rajshahi', 'Bogra', 'Pabna', 'Naogaon'],
  'Khulna': ['Khulna', 'Jashore', 'Kushtia', 'Satkhira'],
  'Barishal': ['Barishal', 'Bhola', 'Patuakhali'],
  'Rangpur': ['Rangpur', 'Dinajpur', 'Gaibandha'],
  'Mymensingh': ['Mymensingh', 'Netrokona', 'Sherpur']
};

const LIMIT = 5;

export default function DonorList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load initial filter states from URL search params (e.g. from Home page quick search)
  const [bloodGroup, setBloodGroup] = useState(searchParams.get('blood_group') || '');
  const [division, setDivision] = useState(searchParams.get('division') || '');
  const [district, setDistrict] = useState(searchParams.get('district') || '');
  const [availability, setAvailability] = useState(searchParams.get('availability') || '');
  
  const [donors, setDonors] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync state filters to search URL parameters
  const updateUrlParams = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    
    Object.keys(newFilters).forEach(key => {
      const val = newFilters[key];
      if (val !== undefined && val !== '') {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    });
    
    setSearchParams(params);
  };

  const fetchDonors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * LIMIT;
      
      const queryParams = {
        skip,
        limit: LIMIT,
      };

      if (bloodGroup) queryParams.blood_group = bloodGroup;
      if (division) queryParams.division = division;
      if (district) queryParams.district = district;
      if (availability !== '') queryParams.availability = availability === 'true';

      const response = await api.get('/search', { params: queryParams });
      setDonors(response.data.donors);
      setTotalCount(response.data.total);
    } catch (err) {
      console.error(err);
      setError('Could not retrieve donor records. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search on changes to filters or page
  useEffect(() => {
    fetchDonors();
  }, [bloodGroup, division, district, availability, currentPage]);

  const handleClearFilters = () => {
    setBloodGroup('');
    setDivision('');
    setDistrict('');
    setAvailability('');
    setCurrentPage(1);
    setSearchParams({});
  };

  const totalPages = Math.ceil(totalCount / LIMIT) || 1;

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Search Blood Registry</h1>
          <p className="text-sm text-slate-500 font-medium">Filter available donors across regions and blood groups instantly</p>
        </div>

        {/* Filter Widget Bar */}
        <div className="glass-card p-5 bg-white shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-bold border-b border-slate-50 pb-2 text-sm">
            <SlidersHorizontal className="w-4 h-4 text-blood-500" />
            Registry Filters
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Blood Group filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => {
                  setBloodGroup(e.target.value);
                  setCurrentPage(1);
                  updateUrlParams({ blood_group: e.target.value });
                }}
                className="input-field py-2 text-sm"
              >
                <option value="">All Blood Groups</option>
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            {/* Division filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Division</label>
              <select
                value={division}
                onChange={(e) => {
                  const div = e.target.value;
                  setDivision(div);
                  setDistrict(''); // Reset district on division change
                  setCurrentPage(1);
                  updateUrlParams({ division: div, district: '' });
                }}
                className="input-field py-2 text-sm"
              >
                <option value="">All Divisions</option>
                {Object.keys(DIVISION_DISTRICTS).map(div => (
                  <option key={div} value={div}>{div}</option>
                ))}
              </select>
            </div>

            {/* District filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">District</label>
              <select
                value={district}
                disabled={!division}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setCurrentPage(1);
                  updateUrlParams({ district: e.target.value });
                }}
                className="input-field py-2 text-sm"
              >
                <option value="">All Districts</option>
                {division &&
                  DIVISION_DISTRICTS[division].map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
              </select>
            </div>

            {/* Availability filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Availability Status</label>
              <select
                value={availability}
                onChange={(e) => {
                  setAvailability(e.target.value);
                  setCurrentPage(1);
                  updateUrlParams({ availability: e.target.value });
                }}
                className="input-field py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="true">Available Now</option>
                <option value="false">Currently Unavailable</option>
              </select>
            </div>
          </div>

          {/* Clear filters trigger */}
          {(bloodGroup || division || district || availability) && (
            <div className="flex justify-end pt-2 border-t border-slate-50">
              <button
                onClick={handleClearFilters}
                className="text-xs text-slate-500 hover:text-blood-500 flex items-center gap-1 font-bold cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {isLoading ? (
            <LoadingSpinner />
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center justify-center gap-2">
              <span>{error}</span>
            </div>
          ) : donors.length === 0 ? (
            <EmptyState
              title="No donors match your search"
              message="Please adjust your blood group, division, or district filter parameters and try again."
              actionButton={
                <button onClick={handleClearFilters} className="btn-primary py-2 text-sm">
                  Show All Donors
                </button>
              }
            />
          ) : (
            <>
              {/* Donor Cards list */}
              <div className="flex flex-col gap-4">
                {donors.map(donor => (
                  <ProfileCard key={donor.id} donor={donor} />
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-6">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary py-2 px-3 text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-xs text-slate-500 font-bold">
                  Page {currentPage} of {totalPages} ({totalCount} total donors)
                </span>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary py-2 px-3 text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
