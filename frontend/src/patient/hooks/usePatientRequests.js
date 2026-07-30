import { useState, useCallback } from 'react';
import patientApi from '../services/patientApi';

export default function usePatientRequests() {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async (skip = 0, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientApi.getRequests(skip, limit);
      setRequests(response.data.items || []);
      setTotal(response.data.total || 0);
      return response.data;
    } catch (err) {
      console.error('Error fetching blood requests:', err);
      const errMsg = err.response?.data?.detail || 'Failed to fetch blood requests.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequest = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientApi.getRequest(id);
      setCurrentRequest(response.data);
      return response.data;
    } catch (err) {
      console.error(`Error fetching blood request ${id}:`, err);
      const errMsg = err.response?.data?.detail || 'Failed to fetch blood request details.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createRequest = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientApi.createRequest(data);
      return response.data;
    } catch (err) {
      console.error('Error creating blood request:', err);
      const errMsg = err.response?.data?.detail || 'Failed to create blood request.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRequest = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientApi.updateRequest(id, data);
      setCurrentRequest(response.data);
      return response.data;
    } catch (err) {
      console.error(`Error updating blood request ${id}:`, err);
      const errMsg = err.response?.data?.detail || 'Failed to update blood request.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteRequest = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await patientApi.deleteRequest(id);
      setRequests((prev) => prev.filter((req) => req.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(`Error deleting blood request ${id}:`, err);
      const errMsg = err.response?.data?.detail || 'Failed to delete blood request.';
      setError(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    requests,
    total,
    currentRequest,
    loading,
    error,
    fetchRequests,
    fetchRequest,
    createRequest,
    updateRequest,
    deleteRequest,
    setCurrentRequest,
  };
}
