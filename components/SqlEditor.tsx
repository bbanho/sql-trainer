import React from 'react';
import { FontSize } from '../types';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  fontSize: FontSize;
}

const SqlEditor: React.FC<SqlEditorProps> = ({ value, onChange, disabled, fontSize }) => {
  return (
    <div className="w-full h-full flex flex-col border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-sm transition-colors">
      {/* Editor Toolbar - Utilitarian */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-700">
        <div className="flex items-center gap-2">
           <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase">Editor SQL</span>
        </div>
        <div className="text-[10px] font-mono text-slate-500">
          SQLite Mode
        </div>
      </div>

      {/* Text Area - The Void */}
      <div className="relative flex-1 bg-slate-50 dark:bg-slate-950">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="-- Digite sua query SQL aqui..."
          className={`w-full h-full p-4 font-mono leading-relaxed bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 resize-none outline-none border-none placeholder-slate-400 dark:placeholder-slate-600 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 ${fontSize}`}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>
      
      {/* Status Bar */}
      <div className="px-3 py-1 bg-slate-100 dark:bg-slate-900 border-t border-slate-300 dark:border-slate-700 flex justify-between items-center text-[10px] text-slate-500 font-mono">
        <span>Ln {value.split('\n').length}, Col {value.length}</span>
        <span className={disabled ? 'text-amber-600 dark:text-amber-500' : 'text-blue-600 dark:text-blue-500'}>
          {disabled ? 'EXECUTANDO...' : 'PRONTO'}
        </span>
      </div>
    </div>
  );
};

export default SqlEditor;