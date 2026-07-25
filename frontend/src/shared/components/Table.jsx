import React from 'react';
import Loader from './Loader';
import EmptyState from './EmptyState';

export default function Table({
  headers = [],
  data = [],
  isLoading = false,
  emptyMessage = "No records found.",
  renderRow,
}) {
  return (
    <div className="w-full overflow-hidden border border-slate-100 rounded-2xl bg-white shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse text-slate-650 text-sm">
          <thead className="bg-slate-50 border-b border-slate-100 text-xs font-bold uppercase tracking-wider text-slate-400">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-6 py-4 font-bold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={headers.length} className="py-12">
                  <Loader text="Loading records..." />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="py-16">
                  <EmptyState message={emptyMessage} />
                </td>
              </tr>
            ) : (
              data.map((row, index) => renderRow(row, index))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
