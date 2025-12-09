import React, { useState, useMemo } from 'react';
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
  const [copied, setCopied] = useState(false);

  // Extract multiple phone numbers from the string
  const phoneNumbers = useMemo(() => {
    const raw = customer.phone || '';
    if (!raw) return [];
    // Split by comma, slash, ampersand, newline, or pipe
    const splits = raw.split(/[,/&\n|]+/).map(s => s.trim()).filter(s => s.length > 3);
    return splits;
  }, [customer.phone]);

  // Helper to construct mailto link
  const getMailtoLink = () => {
    if (!generatedMessage) return '#';
    const subject = encodeURIComponent(generatedMessage.subject);
    const body = encodeURIComponent(generatedMessage.body);
    return `mailto:${customer.email}?subject=${subject}&body=${body}`;
  };

  // Helper for WhatsApp link - Now accepts specific phone number string
  const getWhatsappLink = (phone: string, type: 'web' | 'app' | 'business') => {
    if (!generatedMessage || !phone) return '#';
    
    let cleanPhone = phone.replace(/[^0-9+]/g, '');

    // Auto-add + if missing
    if (cleanPhone.startsWith('00')) {
        cleanPhone = '+' + cleanPhone.substring(2);
    } else if (!cleanPhone.startsWith('+')) {
        cleanPhone = '+' + cleanPhone;
    }

    // Final clean for URL injection (strip + for consistency in protocols that dislike it)
    const phoneForUrl = cleanPhone.replace('+', '');

    const bodyToUse = generatedMessage.whatsappBody || generatedMessage.body;
    const text = encodeURIComponent(bodyToUse);
    
    switch (type) {
      case 'business':
        // Android intent to force WhatsApp Business
        return `intent://send?phone=${phoneForUrl}&text=${text}#Intent;package=com.whatsapp.w4b;scheme=whatsapp;end`;
      case 'app':
        // Standard App scheme
        return `whatsapp://send?phone=${phoneForUrl}&text=${text}`;
      case 'web':
      default:
        // Universal link (usually handled by browser/OS preference)
        return `https://wa.me/${phoneForUrl}?text=${text}`;
    }
  };

  const handleCopy = async () => {
    if (!generatedMessage) return;

    let textToCopy = '';
    if (activeTab === 'email') {
        textToCopy = `Subject: ${generatedMessage.subject}\n\n${generatedMessage.body}`;
    } else {
        textToCopy = generatedMessage.whatsappBody || generatedMessage.body;
    }

    try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (err) {
        console.error("Failed to copy text", err);
    }
  };

  const handleLangSwitch = (lang: 'en' | 'ar') => {
    if (isGenerating || lang === selectedLang) return;
    
    setSelectedLang(lang);
    
    // If we already have a message, regenerate immediately in the new language
    if (generatedMessage) {
        onGenerate(customer, lang);
    }
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
            {/* Language Toggle - Always Visible */}
            <div className="flex bg-white rounded-md border border-gray-300 overflow-hidden">
                <button 
                    onClick={() => handleLangSwitch('en')}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${selectedLang === 'en' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 disabled:opacity-50'}`}
                >
                    🇺🇸 EN
                </button>
                <div className="w-px bg-gray-300"></div>
                <button 
                    onClick={() => handleLangSwitch('ar')}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${selectedLang === 'ar' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-gray-50 disabled:opacity-50'}`}
                >
                    🇪🇬 AR
                </button>
            </div>

            {/* Generate Button - Only if no message exists */}
            {!generatedMessage && (
                <button
                    onClick={() => onGenerate(customer, selectedLang)}
                    disabled={isGenerating}
                    className="text-xs bg-red-600 text-white px-4 py-1.5 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors font-medium"
                >
                    {isGenerating ? 'Drafting...' : 'Generate Draft'}
                </button>
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
        {/* Customer Details (Left Side) */}
        <div className="text-sm space-y-3">
          {customer.phone && (
            <div className="flex items-start gap-2">
              <span className="text-gray-400 w-4 mt-0.5">📞</span>
              <div className="flex flex-col w-full">
                {phoneNumbers.map((p, i) => (
                    <div key={i} className="mb-3 last:mb-0 border-b last:border-0 border-gray-100 pb-2 last:pb-0">
                        <span className="text-gray-900 font-mono font-bold block">{p}</span>
                        {generatedMessage && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                <a 
                                    href={getWhatsappLink(p, 'web')}
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="px-2 py-1 text-[10px] font-bold bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 transition-colors uppercase tracking-wide"
                                    title="Open WhatsApp Web"
                                >
                                    Web
                                </a>
                                <a 
                                    href={getWhatsappLink(p, 'app')}
                                    className="px-2 py-1 text-[10px] font-bold bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 transition-colors uppercase tracking-wide"
                                    title="Open WhatsApp App"
                                >
                                    App
                                </a>
                                <a 
                                    href={getWhatsappLink(p, 'business')}
                                    className="px-2 py-1 text-[10px] font-bold bg-teal-50 text-teal-700 rounded border border-teal-200 hover:bg-teal-100 transition-colors uppercase tracking-wide"
                                    title="Open WhatsApp Business (Android)"
                                >
                                    Biz
                                </a>
                            </div>
                        )}
                    </div>
                ))}
                {phoneNumbers.length === 0 && <span className="text-gray-400 italic">No phone numbers</span>}
              </div>
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
              <a 
                href={`https://${(customer.website || '').toString().replace('http://', '').replace('https://', '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 hover:underline truncate"
              >
                {customer.website}
              </a>
            </div>
          )}
          <div className="mt-3 bg-yellow-50 p-2 rounded border border-yellow-100">
            <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide">Notes (Açıklama)</p>
            <p className="text-sm text-gray-800 mt-1 italic">"{customer.notes || "No specific notes"}"</p>
          </div>
        </div>

        {/* Generated Message Area (Right Side) */}
        <div className="border-t md:border-t-0 md:border-l border-gray-100 md:pl-4 pt-4 md:pt-0">
          {generatedMessage ? (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
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
                <button 
                  onClick={handleCopy}
                  className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-900 transition-colors px-2 py-1 rounded hover:bg-gray-50"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-green-600">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-600 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5" />
                      </svg>
                      <span>Copy</span>
                    </>
                  )}
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
                   <div className="flex-1 flex items-center justify-center text-xs text-gray-500 italic bg-gray-50 rounded border border-gray-200">
                      ← Select phone link on left
                   </div>
                )}
                
                <button
                  onClick={() => onGenerate(customer, selectedLang)}
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                  title={`Regenerate in ${selectedLang === 'en' ? 'English' : 'Arabic'}`}
                  disabled={isGenerating}
                >
                  {isGenerating ? '...' : '↻'}
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