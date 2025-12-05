import React, { useState } from 'react';
import { Customer, GeneratedMessage } from '../types';

interface CustomerCardProps {
  customer: Customer;
  onGenerate: (customer: Customer, lang: 'en' | 'ar') => void;
  onDelete: (id: string) => void;
  onSave: (id: string) => void;
  generatedMessage?: GeneratedMessage;
  isGenerating: boolean;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, 
  onGenerate,
  onDelete,
  onSave,
  generatedMessage,
  isGenerating 
}) => {
  const [activeTab, setActiveTab] = useState<'email' | 'whatsapp'>('email');
  const [selectedLang, setSelectedLang] = useState<'en' | 'ar'>('en');

  // Helper to construct mailto link
  const getMailtoLink = () => {
    if (!generatedMessage) return '#';
    const subject = encodeURIComponent(generatedMessage.subject);
    const body = encodeURIComponent(generatedMessage.body);
    return `mailto:${customer.email}?subject=${subject}&body=${body}`;
  };

  // Helper for WhatsApp link
  const getWhatsappLink = (isMobileApp: boolean = false) => {
    if (!generatedMessage) return '#';
    const cleanPhone = customer.phone.replace(/[^0-9]/g, '');
    // Use the specific whatsapp body if available, otherwise fallback to generic body
    const bodyToUse = generatedMessage.whatsappBody || generatedMessage.body;
    const text = encodeURIComponent(bodyToUse);
    
    if (isMobileApp) {
        // Direct app scheme, works better on mobile for opening the app directly
        return `whatsapp://send?phone=${cleanPhone}&text=${text}`;
    }
    // Standard web link
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow relative group">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg">{customer.company || "Unknown Company"}</h3>
          <p className="text-sm text-gray-600 flex items-center gap-2">
            <span className="font-medium">{customer.representative || "No Rep Name"}</span>
            {customer.country && <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{customer.country}</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
            {!generatedMessage && (
                <>
                {/* Language Toggle */}
                <div className="flex bg-white rounded-md border border-gray-300 overflow-hidden">
                    <button 
                        onClick={() => setSelectedLang('en')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${selectedLang === 'en' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        🇺🇸 EN
                    </button>
                    <div className="w-px bg-gray-300"></div>
                    <button 
                        onClick={() => setSelectedLang('ar')}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${selectedLang === 'ar' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        🇪🇬 AR
                    </button>
                </div>
                
                <button
                    onClick={() => onGenerate(customer, selectedLang)}
                    disabled={isGenerating}
                    className="text-xs bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                >
                    {isGenerating ? 'Drafting...' : 'Generate Draft'}
                </button>
                </>
            )}

            {/* Delete Button */}
            <button 
                onClick={() => onDelete(customer.id)}
                className="ml-2 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Delete Customer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
            </button>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Details */}
        <div className="text-sm space-y-2">
          {customer.phone && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-4">📞</span>
              <span className="text-gray-700 font-mono">{customer.phone}</span>
            </div>
          )}
          {customer.email && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-4">✉️</span>
              <span className="text-gray-700 truncate">{customer.email}</span>
            </div>
          )}
           {customer.website && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-4">🌐</span>
              <a href={`https://${customer.website.replace('http://', '').replace('https://', '')}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">
                {customer.website}
              </a>
            </div>
          )}
          <div className="mt-3 bg-yellow-50 p-2 rounded border border-yellow-100">
            <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide">Notes (Açıklama)</p>
            <p className="text-sm text-gray-800 mt-1 italic">"{customer.notes || "No specific notes"}"</p>
          </div>
        </div>

        {/* Generated Message Area */}
        <div className="border-t md:border-t-0 md:border-l border-gray-100 md:pl-4 pt-4 md:pt-0">
          {generatedMessage ? (
            <div className="h-full flex flex-col">
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => setActiveTab('email')}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${activeTab === 'email' ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                >
                  ✉️ Email
                </button>
                 <button 
                  onClick={() => setActiveTab('whatsapp')}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${activeTab === 'whatsapp' ? 'bg-green-50 border-green-200 text-green-700 font-medium' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}
                >
                  💬 WhatsApp
                </button>
              </div>

              <div 
                className={`flex-1 rounded p-3 text-sm text-gray-700 overflow-y-auto max-h-48 border mb-3 ${
                  activeTab === 'whatsapp' ? 'bg-[#e5ddd5] border-green-200' : 'bg-gray-50 border-gray-200 font-mono'
                }`}
                dir={generatedMessage.body.match(/[\u0600-\u06FF]/) ? 'rtl' : 'ltr'}
              >
                {activeTab === 'email' ? (
                    <>
                    <strong className="block text-gray-900 mb-2 border-b pb-1">Subject: {generatedMessage.subject}</strong>
                    <div className="whitespace-pre-wrap">{generatedMessage.body}</div>
                    </>
                ) : (
                    <div className="space-y-2">
                      {/* Split by newline to simulate chat bubbles */}
                      {(generatedMessage.whatsappBody || generatedMessage.body).split('\n').filter(line => line.trim()).map((line, idx) => (
                        <div key={idx} className="bg-white p-2 rounded-lg shadow-sm w-fit max-w-[90%] text-sm rounded-tl-none">
                          {line}
                        </div>
                      ))}
                    </div>
                )}
              </div>

              <div className="flex gap-2 mt-auto">
                {activeTab === 'email' ? (
                   <a 
                    href={getMailtoLink()}
                    className="flex-1 bg-blue-600 text-white text-center py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Open Mail
                  </a>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <a 
                        href={getWhatsappLink(false)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-green-600 text-white text-center py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                        title="Open in WhatsApp Web"
                    >
                        Web
                    </a>
                    <a 
                        href={getWhatsappLink(true)}
                        className="flex-1 bg-green-800 text-white text-center py-2 rounded-md text-sm font-medium hover:bg-green-900 transition-colors"
                        title="Open in WhatsApp Mobile App"
                    >
                        App
                    </a>
                  </div>
                )}
                
                <button
                  onClick={() => onGenerate(customer, selectedLang)}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                  title="Regenerate"
                >
                  ↻
                </button>

                <button
                  onClick={() => onSave(customer.id)}
                  className="px-3 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 flex items-center gap-1"
                  title="Save & Archive to Table"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm italic bg-gray-50 rounded border border-dashed border-gray-200">
              Select "Generate Draft" to create content
            </div>
          )}
        </div>
      </div>
    </div>
  );
};