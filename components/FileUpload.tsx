import React, { useRef, useState } from 'react';

interface ImportSectionProps {
  onImageSelected: (base64: string) => void;
  onTextSelected: (text: string) => void;
  isAnalyzing: boolean;
}

export const FileUpload: React.FC<ImportSectionProps> = ({ onImageSelected, onTextSelected, isAnalyzing }) => {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [pasteContent, setPasteContent] = useState('');
  
  // Image logic
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

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
          onClick={() => setMode('paste')}
          disabled={isAnalyzing}
          className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
            mode === 'paste' 
              ? 'text-red-600 border-b-2 border-red-600 bg-red-50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          📋 Paste from Excel
        </button>
      </div>

      <div className="p-8">
        {mode === 'upload' ? (
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
                <h3 className="text-lg font-medium text-gray-900">Click to Upload</h3>
                <p className="text-sm text-gray-500">Upload a photo of your Canton Fair list</p>
              </div>
            )}
          </div>
        ) : (
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
                {isAnalyzing ? 'Processing...' : 'Process Data'}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Tip: Copy the rows directly from Excel (including headers if possible) and paste them here. The AI will detect the columns.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};