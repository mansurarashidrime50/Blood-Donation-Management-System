import React, { useEffect, useState, useCallback } from 'react';
import { Search, MapPin, Check, Heart, ShieldAlert } from 'lucide-react';
import client from '../../shared/api/client';
import ProfileCard from '../../shared/components/ProfileCard';
import Pagination from '../../shared/components/Pagination';
import Loader from '../../shared/components/Loader';
import { useAuth } from '../../shared/context/AuthContext';

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

export default function SearchDonors() {
  const [donors, setDonors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filters State
  const [bloodGroup, setBloodGroup] = useState('');
  const [division, setDivision] = useState('');
  const [district, setDistrict] = useState('');
  const [availability, setAvailability] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const { user } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (user && user.role === 'PATIENT') {
      client.get('/patient/requests').then(res => {
        setRequests(res.data.items || []);
      }).catch(err => console.error("Failed to load requests", err));
    }
  }, [user]);

  const fetchDonors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const params = {
        skip,
        limit: itemsPerPage,
        availability: availability ? true : undefined
      };
      if (bloodGroup) params.blood_group = bloodGroup;
      if (division) params.division = division;
      if (district) params.district = district;

      const response = await client.get('/search/donors', { params });
      setDonors(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve matching donors list.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, bloodGroup, division, district, availability]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  const handleDivisionChange = (e) => {
    setDivision(e.target.value);
    setDistrict('');
    setCurrentPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setCurrentPage(1);
  };

  const handleAvailabilityToggle = () => {
    setAvailability(!availability);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Search Blood Donors</h1>
        <p className="text-sm text-slate-500 font-semibold mt-0.5">Search active blood donors in your area and contact them directly</p>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Blood Group Select */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Required Blood Group</label>
            <select
              value={bloodGroup}
              onChange={handleFilterChange(setBloodGroup)}
              className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-50"
            >
              <option value="">Any Blood Group</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          {/* Division Select */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Division</label>
            <select
              value={division}
              onChange={handleDivisionChange}
              className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
            >
              <option value="">Any Division</option>
              {Object.keys(DIVISION_DISTRICTS).map((div) => (
                <option key={div} value={div}>{div}</option>
              ))}
            </select>
          </div>

          {/* District Select */}
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">District</label>
            <select
              value={district}
              onChange={handleFilterChange(setDistrict)}
              disabled={!division}
              className="w-full text-sm rounded-xl border border-slate-200 bg-white py-2.5 px-4 outline-none focus:border-red-500"
            >
              <option value="">Any District</option>
              {division && DIVISION_DISTRICTS[division].map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="avail-toggle"
            checked={availability}
            onChange={handleAvailabilityToggle}
            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300"
          />
          <label htmlFor="avail-toggle" className="text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer select-none">
            Only show currently available donors
          </label>
        </div>
      </div>

      {/* Donors Lists */}
      <div className="space-y-4">
        {loading ? (
          <Loader text="Searching active donors in database..." />
        ) : error ? (
          <div className="text-red-500 text-sm font-semibold">{error}</div>
        ) : donors.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center text-slate-400 font-semibold">
            No active blood donors match your search parameters. Try widening your filters.
          </div>
        ) : (
          <div className="space-y-4">
            {donors.map((donor) => {
              const isMatchActive = requests.some(r => r.accepted_donor_id === donor.id && ['Accepted', 'Confirmed', 'Donation Completed', 'Waiting Verification'].includes(r.request_status));
              return (
                <ProfileCard key={donor.id} user={donor} isMatchActive={isMatchActive} />
              );
            })}
          </div>
        )}
      </div>

      {/* Paging controls */}
      <Pagination
        currentPage={currentPage}
        totalItems={total}
        itemsPerPage={itemsPerPage}
        onPageChange={(page) => setCurrentPage(page)}
        isLoading={loading}
      />
    </div>
  );
}
