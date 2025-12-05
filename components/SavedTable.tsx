import React from 'react';
import { Customer, GeneratedMessage } from '../types';

interface SavedItem {
  customer: Customer;
  message: GeneratedMessage;
}

interface SavedTableProps {
  items: SavedItem[];
  onDelete: (id: string) => void;
}

export const SavedTable: React.FC<SavedTableProps> = ({ items, onDelete }) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-12 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-900">Completed Interactions ({items.length})</h2>
        <button 
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," 
                    + ["Company,Representative,Phone,Email,Notes,Status"]
                    .concat(items.map(i => `"${i.customer.company}","${i.customer.representative}","${i.customer.phone}","${i.customer.email}","${i.customer.notes}","Processed"`))
                    .join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "processed_customers.csv");
                document.body.appendChild(link);
                link.click();
            }}
        >
            Export CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Representative</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map(({ customer, message }) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.company}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.representative}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-col">
                    <span>{customer.phone}</span>
                    <span className="text-xs text-gray-400">{customer.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={customer.notes}>{customer.notes}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    message.type === 'email' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    Processed
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => onDelete(customer.id)} className="text-red-600 hover:text-red-900">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};