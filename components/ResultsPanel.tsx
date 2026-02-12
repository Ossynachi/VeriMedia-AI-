
import React from 'react';
import { AnalysisResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ResultsPanelProps {
  result: AnalysisResult;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ result }) => {
  const chartData = [
    { name: 'Integrity', value: result.integrityScore },
    { name: 'Artifact Risk', value: 100 - result.integrityScore },
  ];

  const COLORS = ['#3b82f6', '#ef4444'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      {/* Integrity Summary */}
      <div className="bg-gray-900/60 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <i className="fas fa-shield-virus text-blue-400"></i>
          Integrity Score
        </h3>
        <div className="h-48 w-full flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-white">{result.integrityScore}%</span>
            <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Safe</span>
          </div>
        </div>
        <div className={`mt-4 p-3 rounded-lg text-center font-bold text-sm ${result.isDeepfake ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
          {result.isDeepfake ? 'POTENTIAL DEEPFAKE DETECTED' : 'MEDIA APPEARS AUTHENTIC'}
        </div>
      </div>

      {/* Artifacts List */}
      <div className="lg:col-span-2 bg-gray-900/60 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <i className="fas fa-microscope text-blue-400"></i>
          Detected Artifacts
        </h3>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {result.artifacts.length > 0 ? (
            result.artifacts.map((art, idx) => (
              <div key={idx} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 flex items-start gap-4">
                <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${
                  art.severity === 'High' ? 'bg-red-500' : art.severity === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white">{art.type}</span>
                    <span className="text-[10px] bg-gray-700 px-2 py-0.5 rounded uppercase font-bold text-gray-300">
                      {art.severity}
                    </span>
                    <span className="text-xs text-gray-500 ml-auto">
                      {(art.confidence * 100).toFixed(0)}% Conf.
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{art.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-500 italic">No significant artifacts detected.</div>
          )}
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="lg:col-span-3 bg-gray-900/60 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <i className="fas fa-file-alt text-blue-400"></i>
          AI Expert Analysis
        </h3>
        <div className="text-gray-300 leading-relaxed text-sm whitespace-pre-wrap font-mono bg-black/30 p-4 rounded-xl border border-gray-800">
          {result.detailedAnalysis}
        </div>
      </div>
    </div>
  );
};

export default ResultsPanel;
