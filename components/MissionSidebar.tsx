import React from 'react';
import { Mission, FontSize } from '../types';

interface MissionSidebarProps {
  missions: Mission[];
  currentId: number | undefined;
  onSelect: (id: number) => void;
  fontSize: FontSize;
}

const MissionSidebar: React.FC<MissionSidebarProps> = ({ missions, currentId, onSelect, fontSize }) => {
  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-colors duration-200">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
        <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          Missões
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        <div className="flex flex-col">
          {missions.map((m, index) => {
            const isActive = m.id === currentId;
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className={`group w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 transition-colors ${fontSize} ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`font-mono text-[10px] py-0.5 px-1.5 rounded-sm border ${
                    isActive 
                      ? 'bg-blue-500 border-blue-400 text-white' 
                      : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-500'
                  }`}>
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <span className={`font-semibold block truncate ${isActive ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                      {m.title}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">
          <span>PROGRESSO</span>
          <span>{Math.round(((missions.findIndex(m => m.id === currentId) + 1) / missions.length) * 100)}%</span>
        </div>
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-none overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300" 
            style={{ width: `${(missions.findIndex(m => m.id === currentId) + 1) / missions.length * 100}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default MissionSidebar;