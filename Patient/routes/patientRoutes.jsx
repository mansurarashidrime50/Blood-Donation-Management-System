import React from 'react';
import BloodRequestList from '../pages/BloodRequestList';
import CreateRequest from '../pages/CreateRequest';
import EditRequest from '../pages/EditRequest';
import RequestDetails from '../pages/RequestDetails';

export const patientRoutes = [
  {
    path: '/patient/requests',
    element: <BloodRequestList />,
    protected: true,
  },
  {
    path: '/patient/requests/create',
    element: <CreateRequest />,
    protected: true,
  },
  {
    path: '/patient/requests/:id',
    element: <RequestDetails />,
    protected: true,
  },
  {
    path: '/patient/requests/:id/edit',
    element: <EditRequest />,
    protected: true,
  },
];
