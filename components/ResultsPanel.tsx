
import React from 'react';
import { AnalysisResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ResultsPanelProps {
  result: AnalysisResult;
  userFeedback?: 'correct' | 'incorrect';
  onFeedback: (feedback: 'correct' | 'incorrect') => void;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, userFeedback, onFeedback }) => {
  const chartData = [
    { name: 'Integrity', value: result.integrityScore },
    { name: 'Artifact Risk', value: 100 - result.integrityScore },
  ];

  const COLORS = ['#3b82f6', '#ef4444'];

  const downloadReport = () => {
    const report = {
      ...result,
      generatedAt: new Date().toISOString(),
      application: "VeriMedia AI"
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verimedia-report-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      {/* Integrity Summary */}
      <div className="bg-gray-900/60 border border-blue-500/20 rounded-2xl p-6 backdrop-blur-md flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <i className="fas fa-shield-virus text-blue-400"></i>
            Integrity Score
          </h3>
          <button 
            onClick={downloadReport}
            className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded flex items-center gap-1 transition-colors"
            title="Download JSON Report"
          >
            <i className="fas fa-download"></i> Save
          </button>
        </div>
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
        <div className={`mt-4 p-3 rounded-lg text-center font-bold text-sm border flex flex-col gap-1 ${
          result.classification === 'ai-generated' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
          result.classification === 'ai-edited' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
          'bg-green-500/20 text-green-400 border-green-500/30'
        }`}>
          <span className="uppercase tracking-wider text-xs opacity-80">Classification</span>
          <span className="text-lg">
            {result.classification === 'ai-generated' ? 'AI GENERATED' :
             result.classification === 'ai-edited' ? 'AI EDITED' :
             'NATURAL / AUTHENTIC'}
          </span>
        </div>

        {/* Anomaly Score (Unsupervised) */}
        {result.anomalyScore !== undefined && (
          <div className="mt-4 bg-gray-800/50 border border-gray-700 rounded-lg p-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Anomaly Score</span>
              <span className={`text-xs font-bold ${
                result.anomalyScore > 50 ? 'text-red-400' : 'text-blue-400'
              }`}>
                {result.anomalyScore.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  result.anomalyScore > 50 ? 'bg-red-500' : 'bg-blue-500'
                }`}
                style={{ width: `${result.anomalyScore}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 leading-tight">
              {result.anomalyScore > 50 
                ? "This analysis deviates significantly from your typical 'natural' uploads."
                : "This analysis is consistent with your typical 'natural' uploads."}
            </p>
          </div>
        )}

        {/* Feedback Section */}
        <div className="mt-auto pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 font-medium mb-3 text-center uppercase tracking-wide">Was this accurate?</p>
          {userFeedback ? (
            <div className={`text-center p-3 rounded-lg text-sm font-bold animate-fadeIn transition-all ${userFeedback === 'correct' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              <i className={`fas ${userFeedback === 'correct' ? 'fa-check-circle' : 'fa-times-circle'} mr-2`}></i>
              {userFeedback === 'correct' ? 'Confirmed Accurate' : 'Marked Inaccurate'}
            </div>
          ) : (
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => onFeedback('correct')}
                className="flex-1 py-2 px-3 bg-gray-800 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/50 border border-gray-700 rounded-lg transition-all text-xs font-bold text-gray-400 flex items-center justify-center gap-2 group"
              >
                <i className="fas fa-thumbs-up group-hover:scale-110 transition-transform"></i>
                Yes
              </button>
              <button 
                onClick={() => onFeedback('incorrect')}
                className="flex-1 py-2 px-3 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50 border border-gray-700 rounded-lg transition-all text-xs font-bold text-gray-400 flex items-center justify-center gap-2 group"
              >
                <i className="fas fa-thumbs-down group-hover:scale-110 transition-transform"></i>
                No
              </button>
            </div>
          )}
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
