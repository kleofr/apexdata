import React, { useState } from 'react';
import { X, Copy, Check, Download, Code2, Database, Layers, Search, Server } from 'lucide-react';
import { ComparisonData, Driver } from '../types/telemetry';
import { getLastRawBackendPayload } from '../services/api';

interface JsonInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparisonData: ComparisonData | null;
  driversData: Driver[];
  activeEndpointParams: {
    year: number | string;
    gp: string;
    session: string;
    driver1: string;
    driver2: string;
  };
}

export const JsonInspectorModal: React.FC<JsonInspectorModalProps> = ({
  isOpen,
  onClose,
  comparisonData,
  driversData,
  activeEndpointParams,
}) => {
  const [activeTab, setActiveTab] = useState<'raw_backend' | 'comparison' | 'results'>('raw_backend');
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const rawBackend = getLastRawBackendPayload();

  let activePayload: any = null;
  let endpointName = '';
  let endpointUrl = '';

  if (activeTab === 'raw_backend') {
    endpointName = 'Flask FastF1 Backend (/api/grand-prix)';
    endpointUrl = `/api/grand-prix?year=${activeEndpointParams.year}&gp=${encodeURIComponent(activeEndpointParams.gp)}&session=${encodeURIComponent(activeEndpointParams.session)}&telemetry=true`;
    activePayload = rawBackend || {
      status: 'notice',
      message: 'No /api/grand-prix response recorded yet. Click "LOAD SESSION" to query the backend.',
      params: activeEndpointParams,
    };
  } else if (activeTab === 'comparison') {
    endpointName = 'Normalized Distance Comparison Telemetry (7 Traces)';
    endpointUrl = `Derived from FastF1 Session (${activeEndpointParams.driver1} vs ${activeEndpointParams.driver2})`;
    activePayload = comparisonData || {
      status: 'empty',
      message: 'No comparison generated yet. Click "COMPARE FASTEST LAPS".',
    };
  } else {
    endpointName = 'Session Drivers & Classification Results';
    endpointUrl = `Loaded Drivers (${driversData.length} drivers parsed from session results)`;
    activePayload = {
      count: driversData.length,
      sessionResults: rawBackend?.data?.results || [],
      drivers: driversData,
    };
  }

  const jsonString = JSON.stringify(activePayload, null, 2);
  const payloadSizeBytes = new Blob([jsonString]).size;
  const payloadSizeKb = (payloadSizeBytes / 1024).toFixed(1);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = jsonString;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Download JSON file
  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ApexData_${activeTab.toUpperCase()}_${activeEndpointParams.year}_${activeEndpointParams.gp.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Search filter
  const lines = jsonString.split('\n');
  const filteredLines = searchTerm.trim()
    ? lines.filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase()))
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="hud-panel w-full max-w-5xl max-h-[90vh] flex flex-col rounded-lg border border-[#FF6A00]/50 bg-[#0D0E14] shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#141722]">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded bg-[#FF6A00]/10 border border-[#FF6A00]/40 text-[#FF6A00]">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-orbitron font-extrabold text-sm sm:text-base text-white tracking-wider uppercase">
                  RAW JSON INSPECTOR
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FF6A00]/20 text-[#FF6A00] font-bold">
                  FLASK REST BACKEND
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                Inspect backend response payloads returned by backend/app.py
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Endpoint Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 border-b border-white/10 bg-[#10131B]">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('raw_backend')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-orbitron font-semibold tracking-wider transition-colors cursor-pointer ${
                activeTab === 'raw_backend'
                  ? 'bg-[#FF6A00] text-black shadow-neon-orange font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span>/api/grand-prix (Raw Backend)</span>
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-orbitron font-semibold tracking-wider transition-colors cursor-pointer ${
                activeTab === 'comparison'
                  ? 'bg-[#FF6A00] text-black shadow-neon-orange font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Parsed Comparison Telemetry</span>
            </button>

            <button
              onClick={() => setActiveTab('results')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-orbitron font-semibold tracking-wider transition-colors cursor-pointer ${
                activeTab === 'results'
                  ? 'bg-[#FF6A00] text-black shadow-neon-orange font-bold'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Session Results & Drivers</span>
            </button>
          </div>

          {/* Action buttons: Copy & Download */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition-colors border border-white/10 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00E676]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED' : 'COPY JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#FF6A00]/20 hover:bg-[#FF6A00]/30 text-[#FF6A00] font-mono text-xs transition-colors border border-[#FF6A00]/40 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>DOWNLOAD .JSON</span>
            </button>
          </div>
        </div>

        {/* Endpoint metadata sub-bar */}
        <div className="px-4 sm:px-6 py-2 bg-black/40 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 truncate max-w-full">
            <span className="text-[#00E676] font-bold">ENDPOINT:</span>
            <code className="text-slate-300 bg-white/5 px-2 py-0.5 rounded truncate">
              {endpointUrl}
            </code>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Payload Size: <strong className="text-white">{payloadSizeKb} KB</strong></span>
            {activeTab === 'comparison' && comparisonData && (
              <span>Telemetry Samples: <strong className="text-[#FF6A00]">{comparisonData.telemetry.length}</strong></span>
            )}
            <span>Lines: <strong className="text-white">{lines.length}</strong></span>
          </div>
        </div>

        {/* Search / Filter Bar */}
        <div className="px-4 sm:px-6 py-2 bg-[#0A0B10] border-b border-white/5 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search key or value in JSON (e.g. speed, full_name, team, results)..."
            className="w-full bg-transparent text-xs font-mono text-slate-200 focus:outline-none placeholder:text-slate-600"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[10px] text-slate-400 hover:text-white font-mono px-1.5 py-0.5 rounded bg-white/10 cursor-pointer"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* JSON Code Viewer Area */}
        <div className="flex-1 overflow-auto p-4 bg-[#090B10] font-mono text-xs text-slate-200 selection:bg-[#FF6A00] selection:text-black">
          {filteredLines ? (
            <div>
              <div className="text-[11px] text-amber-400 pb-2 mb-2 border-b border-white/10">
                Showing {filteredLines.length} matching lines for "{searchTerm}":
              </div>
              <pre className="whitespace-pre-wrap leading-5">
                {filteredLines.join('\n')}
              </pre>
            </div>
          ) : (
            <pre className="whitespace-pre leading-5">
              {jsonString}
            </pre>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#141722] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>{endpointName}</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
