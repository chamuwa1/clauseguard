"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Jurisdiction, JURISDICTION_LABELS } from "@/types";

interface UploadZoneProps {
  onUpload: (file: File, jurisdiction: Jurisdiction) => void;
  isAnalyzing: boolean;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function UploadZone({ onUpload, isAnalyzing }: UploadZoneProps) {
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("generic");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSizeError, setFileSizeError] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFileSizeError("");
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileSizeError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum allowed: ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }
      setSelectedFile(file);
    }
  }, []);

  const handleAnalyze = () => {
    if (selectedFile) {
      onUpload(selectedFile, jurisdiction);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: isAnalyzing,
    maxSize: MAX_FILE_SIZE_BYTES,
  });

  return (
    <div className="w-full flex flex-col items-center gap-6 relative z-10">
      <div 
        {...getRootProps()} 
        className={`warm-card p-10 sm:p-14 w-full max-w-2xl text-center cursor-pointer border-2 border-dashed
          ${isDragActive ? "border-stone-400 bg-stone-50 scale-[1.02]" : "border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50/50"}
          ${isAnalyzing ? "opacity-50 pointer-events-none" : ""}
          ${selectedFile ? "border-emerald-500 bg-emerald-50" : ""}
        `}
      >
        <input {...getInputProps()} />
        
        {/* Icon */}
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 transition-all duration-300
          ${isDragActive ? "bg-stone-900 text-white" : selectedFile ? "bg-emerald-600 text-white" : "bg-stone-100 text-stone-500"}
        `}>
          {selectedFile ? (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
        </div>

        {/* Text content */}
        <div className="space-y-3">
          <h3 className="text-xl sm:text-2xl font-black text-stone-900">
            {selectedFile 
              ? selectedFile.name 
              : isDragActive ? "Drop to analyze" : "Upload your contract"}
          </h3>
          <p className="text-sm font-medium text-stone-500">
            {selectedFile 
              ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to choose a different file`
              : <>Drag & drop your PDF or DOCX here, or <span className="text-stone-900 font-bold underline decoration-stone-300 underline-offset-4">browse files</span></>
            }
          </p>
          {!selectedFile && (
            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider pt-2">Max {MAX_FILE_SIZE_MB}MB</p>
          )}
          {fileSizeError && (
            <p className="text-xs font-bold text-red-600 pt-2">{fileSizeError}</p>
          )}
        </div>
      </div>

      <div className="w-full max-w-2xl px-4">
        <div className="warm-card p-6 flex flex-col items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <label className="text-xs font-bold text-stone-500 uppercase tracking-wider block">
              Select Jurisdiction Context
            </label>
            <div className="flex flex-wrap justify-center gap-3">
              {(Object.keys(JURISDICTION_LABELS) as Jurisdiction[]).map((j) => (
                <button
                  key={j}
                  onClick={(e) => {
                    e.stopPropagation();
                    setJurisdiction(j);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm transition-all
                    ${jurisdiction === j 
                      ? "btn-primary" 
                      : "btn-secondary"}
                  `}
                >
                  {JURISDICTION_LABELS[j]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={!selectedFile || isAnalyzing}
            className={`w-full py-4 rounded-xl font-bold uppercase tracking-wide transition-all shadow-sm
              ${!selectedFile || isAnalyzing
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:shadow-emerald-600/30"}
            `}
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Contract"}
          </button>
        </div>
      </div>
    </div>
  );
}
