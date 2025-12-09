import React, { useRef, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Customer } from '../types';

interface ImportSectionProps {
  onImageSelected: (base64: string) => void;
  onTextSelected: (text: string) => void;
  onCustomersLoaded: (customers: Customer[]) => void;
  isAnalyzing: boolean;
}

type ColumnMapping = {
  company: string;
  representative: string;
  phone: string;
  email: string;
  country: string;
  website: string;
  notes: string;
};

export const FileUpload: React.FC<ImportSectionProps> = ({ 
  onImageSelected, 
  onTextSelected, 
  onCustomersLoaded,
  isAnalyzing 
}) => {
  const [mode, setMode] = useState<'upload' | 'paste' | 'excel'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  
  // Image logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Excel Logic
  const excelInputRef = useRef<HTMLInputElement>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    company: '',
    representative: '',
    phone: '',
    email: '',
    country: '',
    website: '',
    notes: ''
  });
  const [showMapping, setShowMapping] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        onImageSelected(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasteSubmit = () => {
    if (pasteContent.trim()) {
      onTextSelected(pasteContent);
    }
  };

  // Excel Handlers
  const handleExcelChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setExcelFile(file);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length > 0) {
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        setExcelHeaders(headers);
        setExcelData(rows);
        setShowMapping(true);
        autoMapColumns(headers);
      }
    }
  };

  const autoMapColumns = (headers: string[]) => {
    const newMapping = { ...mapping };
    const lowerHeaders = headers.map(h => h.toString().toLowerCase());

    const findMatch = (keywords: string[]) => {
      const index = lowerHeaders.findIndex(h => keywords.some(k => h.includes(k)));
      return index !== -1 ? headers[index] : '';
    };

    newMapping.company = findMatch(['firm', 'company', 'name', 'business']);
    newMapping.representative = findMatch(['rep', 'contact', 'person', 'mr', 'mrs', 'name']);
    newMapping.phone = findMatch(['tel', 'phone', 'mobile', 'cel']);
    newMapping.email = findMatch(['mail', 'e-mail']);
    newMapping.country = findMatch(['country', 'address', 'city', 'location']);
    newMapping.website = findMatch(['web', 'site', 'url']);
    newMapping.notes = findMatch(['note', 'desc', 'comment', 'product', 'interest', 'açıklama']);

    setMapping(newMapping);
  };

  const processExcelData = () => {
    const customers: Customer[] = excelData.map((row, index) => {
      // Helper to get value safely based on mapped header index
      const getVal = (headerName: string) => {
        if (!headerName) return "";
        const colIndex = excelHeaders.indexOf(headerName);
        if (colIndex === -1) return "";
        return (row[colIndex] || "").toString().trim();
      };

      return {
        id: `cust-xls-${Date.now()}-${index}`,
        company: getVal(mapping.company),
        representative: getVal(mapping.representative),
        phone: getVal(mapping.phone),
        email: getVal(mapping.email),
        country: getVal(mapping.country),
        website: getVal(mapping.website),
        notes: getVal(mapping.notes)
      };
    });

    // Filter out completely empty rows
    const validCustomers = customers.filter(c => c.company || c.phone || c.email);
    onCustomersLoaded(validCustomers);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setMode('upload')}
          disabled={isAnalyzing}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
            mode === 'upload' 
              ? 'text-red-600 border-b-2 border-red-600 bg-red-50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          📷 Upload Image
        </button>
        <button
          onClick={() => setMode('excel')}
          disabled={isAnalyzing}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
            mode === 'excel' 
              ? 'text-red-600 border-b-2 border-red-600 bg-red-50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          📊 Upload Excel
        </button>
        <button
          onClick={() => setMode('paste')}
          disabled={isAnalyzing}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
            mode === 'paste' 
              ? 'text-red-600 border-b-2 border-red-600 bg-red-50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          📋 Paste Text
        </button>
      </div>

      <div className="p-8">
        {mode === 'upload' && (
          // Upload Area
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              preview ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isAnalyzing}
            />
            
            {preview ? (
              <div className="space-y-4">
                <img src={preview} alt="List Preview" className="max-h-64 mx-auto rounded shadow-sm" />
                <button
                  onClick={() => {
                    setPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                  disabled={isAnalyzing}
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div 
                className="cursor-pointer space-y-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Click to Upload Image</h3>
                <p className="text-sm text-gray-500">Upload a photo of your Canton Fair list</p>
              </div>
            )}
          </div>
        )}

        {mode === 'excel' && (
           <div className="space-y-6">
             {!showMapping ? (
               <div 
                 className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-green-500 hover:bg-green-50 transition-colors cursor-pointer"
                 onClick={() => excelInputRef.current?.click()}
               >
                 <input
                   type="file"
                   accept=".xlsx, .xls, .csv"
                   className="hidden"
                   ref={excelInputRef}
                   onChange={handleExcelChange}
                 />
                 <div className="mx-auto h-12 w-12 text-green-600 mb-3">
                   <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                   </svg>
                 </div>
                 <h3 className="text-lg font-medium text-gray-900">Upload Excel File</h3>
                 <p className="text-sm text-gray-500">.xlsx, .xls, or .csv</p>
               </div>
             ) : (
               <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900">Map Columns</h3>
                    <button 
                      onClick={() => {
                        setShowMapping(false);
                        setExcelFile(null);
                        setExcelData([]);
                        if (excelInputRef.current) excelInputRef.current.value = '';
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove File
                    </button>
                 </div>
                 <p className="text-sm text-gray-600 mb-6">Match your Excel headers to the application fields.</p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {Object.keys(mapping).map((field) => (
                      <div key={field}>
                        <label className="block text-xs font-medium text-gray-700 uppercase mb-1">{field}</label>
                        <select
                          value={mapping[field as keyof ColumnMapping]}
                          onChange={(e) => setMapping({...mapping, [field]: e.target.value})}
                          className="w-full text-sm border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                        >
                          <option value="">-- Ignore --</option>
                          {excelHeaders.map((h, i) => (
                            <option key={i} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                 </div>
                 
                 <div className="flex justify-end">
                    <button 
                      onClick={processExcelData}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium shadow-sm"
                    >
                      Process {excelData.length} Rows
                    </button>
                 </div>
               </div>
             )}
           </div>
        )}

        {mode === 'paste' && (
          // Paste Area
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Paste your Excel / Spreadsheet data here
            </label>
            <textarea
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
              disabled={isAnalyzing}
              placeholder={`Firma\tTemsilci\tTel\tAdres\nCompanyA\tJohn Doe\t+1234\tUSA`}
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 font-mono text-sm"
            />
            <div className="flex justify-end">
              <button
                onClick={handlePasteSubmit}
                disabled={isAnalyzing || !pasteContent.trim()}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {isAnalyzing ? 'Processing...' : 'Process with AI'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};