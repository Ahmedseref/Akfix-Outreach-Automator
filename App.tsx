import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { CustomerCard } from './components/CustomerCard';
import { SavedTable } from './components/SavedTable';
import { extractDataFromImage, extractDataFromText, generateDraft } from './services/geminiService';
import { Customer, GeneratedMessage, GenerationContext } from './types';

function App() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [generatedMessages, setGeneratedMessages] = useState<Record<string, GeneratedMessage>>({});
  
  // Settings for the campaign
  const [context, setContext] = useState<GenerationContext>({
    senderCompany: "Akkim Construction Chemicals",
    exhibitionName: "Canton Fair",
    exhibitionLocation: "Guangzhou, China"
  });

  // New state for saved/archived customers
  const [savedItems, setSavedItems] = useState<{customer: Customer, message: GeneratedMessage}[]>([]);

  const [status, setStatus] = useState<{
    stage: 'idle' | 'uploading' | 'extracting' | 'reviewing';
    loading: boolean;
    error: string | null;
  }>({
    stage: 'idle',
    loading: false,
    error: null,
  });

  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());

  const handleImageSelected = async (base64Image: string) => {
    setStatus({ stage: 'extracting', loading: true, error: null });
    try {
      const extractedCustomers = await extractDataFromImage(base64Image);
      if (extractedCustomers.length === 0) {
        throw new Error("No data found in image. Please try a clearer image.");
      }
      setCustomers(extractedCustomers);
      setStatus({ stage: 'reviewing', loading: false, error: null });
    } catch (err: any) {
      setStatus({ stage: 'idle', loading: false, error: err.message || "Failed to parse image." });
    }
  };

  const handleTextSelected = async (textData: string) => {
    setStatus({ stage: 'extracting', loading: true, error: null });
    try {
      const extractedCustomers = await extractDataFromText(textData);
      if (extractedCustomers.length === 0) {
        throw new Error("Could not identify customer data in the pasted text.");
      }
      setCustomers(extractedCustomers);
      setStatus({ stage: 'reviewing', loading: false, error: null });
    } catch (err: any) {
      setStatus({ stage: 'idle', loading: false, error: err.message || "Failed to parse text data." });
    }
  };

  const handleGenerateDraft = useCallback(async (customer: Customer, language: 'en' | 'ar' = 'en') => {
    setAnalyzingIds(prev => new Set(prev).add(customer.id));
    
    try {
      // Pass the current context values to the generator
      const message = await generateDraft(customer, context, language);
      setGeneratedMessages(prev => ({
        ...prev,
        [customer.id]: message
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev);
        next.delete(customer.id);
        return next;
      });
    }
  }, [context]);

  const handleGenerateAll = async () => {
    // Generate for all that don't have one yet, defaulting to English for bulk
    const toProcess = customers.filter(c => !generatedMessages[c.id]);
    
    // Process in small batches to avoid rate limits
    const BATCH_SIZE = 3;
    for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
        const batch = toProcess.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(c => handleGenerateDraft(c, 'en')));
    }
  };

  const handleDelete = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    // Also cleanup message if exists
    if (generatedMessages[id]) {
      const newMessages = { ...generatedMessages };
      delete newMessages[id];
      setGeneratedMessages(newMessages);
    }
  };

  const handleSave = (id: string) => {
    const customer = customers.find(c => c.id === id);
    const message = generatedMessages[id];

    if (customer && message) {
      // Add to saved items
      setSavedItems(prev => [...prev, { customer, message }]);
      
      // Remove from active list
      handleDelete(id);
    }
  };

  const handleDeleteSaved = (id: string) => {
    setSavedItems(prev => prev.filter(item => item.customer.id !== id));
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              {/* Logo Placeholder */}
              <div className="h-8 w-8 bg-red-600 rounded flex items-center justify-center text-white font-bold">A</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Akfix Outreach</h1>
                <p className="text-xs text-gray-500">Canton Fair Follow-up Automation</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">User:</span>
              <span className="text-sm font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full">Ahmed Seref</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Campaign Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
            </svg>
            Campaign Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Company Name</label>
              <input 
                type="text" 
                value={context.senderCompany}
                onChange={(e) => setContext(prev => ({...prev, senderCompany: e.target.value}))}
                className="w-full text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="e.g. Akkim Construction Chemicals"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Exhibition Name</label>
              <input 
                type="text" 
                value={context.exhibitionName}
                onChange={(e) => setContext(prev => ({...prev, exhibitionName: e.target.value}))}
                className="w-full text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="e.g. Canton Fair"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
              <input 
                type="text" 
                value={context.exhibitionLocation}
                onChange={(e) => setContext(prev => ({...prev, exhibitionLocation: e.target.value}))}
                className="w-full text-sm border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="e.g. Guangzhou, China"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">These details will be used to customize the email and WhatsApp drafts.</p>
        </div>

        {/* Error Notification */}
        {status.error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{status.error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        {status.stage === 'idle' || status.stage === 'extracting' ? (
          <div className="text-center py-6">
             <h2 className="text-3xl font-bold text-gray-900 mb-4">Import Your Customer List</h2>
             <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
               Upload a clear photo or paste Excel data from your exhibition spreadsheet.
             </p>
             
             {status.loading ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow border border-gray-100 max-w-xl mx-auto">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                  <p className="text-gray-900 font-medium">Processing Data...</p>
                  <p className="text-gray-500 text-sm mt-2">Analyzing rows, identifying contacts and notes.</p>
                </div>
             ) : (
                <FileUpload 
                  onImageSelected={handleImageSelected} 
                  onTextSelected={handleTextSelected}
                  isAnalyzing={status.loading} 
                />
             )}
          </div>
        ) : null}

        {/* Results Section */}
        {status.stage === 'reviewing' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm sticky top-20 z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Active Contacts ({customers.length})</h2>
                <p className="text-sm text-gray-500">Review the data, generate drafts, and save to archive.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setCustomers([]);
                    setGeneratedMessages({});
                    setStatus({ stage: 'idle', loading: false, error: null });
                  }}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2"
                >
                  Start Over
                </button>
                <button 
                  onClick={handleGenerateAll}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                  </svg>
                  Generate All (English)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {customers.length === 0 && savedItems.length === 0 ? (
                <div className="text-center text-gray-500 py-12">No contacts loaded.</div>
              ) : null}

              {customers.map((customer) => (
                <CustomerCard 
                  key={customer.id} 
                  customer={customer} 
                  onGenerate={handleGenerateDraft}
                  onDelete={handleDelete}
                  onSave={handleSave}
                  generatedMessage={generatedMessages[customer.id]}
                  isGenerating={analyzingIds.has(customer.id)}
                />
              ))}
            </div>

            {/* Saved Items Table */}
            <SavedTable items={savedItems} onDelete={handleDeleteSaved} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;