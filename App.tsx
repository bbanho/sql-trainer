import React, { useEffect, useState, useCallback } from 'react';
import { SCENARIOS } from './constants';
import { initDb, runQuery, resetDb } from './services/db';
import { getAiHelp } from './services/ai';
import MissionSidebar from './components/MissionSidebar';
import SqlEditor from './components/SqlEditor';
import ResultTable from './components/ResultTable';
import SchemaViewer from './components/SchemaViewer';
import ErdViewer from './components/ErdViewer';
import { Mission, QueryResult, Scenario, FontSize } from './types';

function App() {
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [isDbReady, setIsDbReady] = useState(false);
  const [currentMission, setCurrentMission] = useState<Mission>(activeScenario.missions[0]);
  const [userSql, setUserSql] = useState<string>('');
  const [userResult, setUserResult] = useState<QueryResult | null>(null);
  const [expectedResult, setExpectedResult] = useState<QueryResult | null>(null);
  const [userError, setUserError] = useState<boolean>(false);
  const [dbErrorMessage, setDbErrorMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' | 'loading' }>({ text: '', type: 'info' });
  const [isExecuting, setIsExecuting] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState<FontSize>('text-sm');
  const [isErdOpen, setIsErdOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    initDb(activeScenario.seedSql)
      .then(() => setIsDbReady(true))
      .catch((err) => console.error(err));
  }, []);

  const handleSwitchScenario = async (scenarioId: string) => {
    const newScenario = SCENARIOS.find(s => s.id === scenarioId);
    if (!newScenario || newScenario.id === activeScenario.id) return;
    setIsDbReady(false);
    setActiveScenario(newScenario);
    setCurrentMission(newScenario.missions[0]);
    setUserSql('');
    setUserResult(null);
    setExpectedResult(null);
    await resetDb(newScenario.seedSql);
    setIsDbReady(true);
  };

  const handleExecute = useCallback(async () => {
    if (!isDbReady || !userSql.trim()) return;
    setIsExecuting(true);
    setStatusMessage({ text: 'PROCESSANDO', type: 'loading' });
    setDbErrorMessage('');

    try {
      const uRes = await runQuery(userSql);
      if ('error' in (uRes as any)) {
        setUserResult([uRes as any]);
        setUserError(true);
        setDbErrorMessage((uRes as any).error);
        setStatusMessage({ text: 'ERRO DE SINTAXE', type: 'error' });
        setIsExecuting(false);
        return;
      }
      setUserResult(uRes as QueryResult);
      setUserError(false);

      const eRes = await runQuery(currentMission.expected);
      setExpectedResult(eRes as QueryResult);

      if (JSON.stringify(uRes) === JSON.stringify(eRes)) {
        setStatusMessage({ text: currentMission.successMessage.toUpperCase(), type: 'success' });
      } else {
        setStatusMessage({ text: 'RESULTADO INCORRETO', type: 'error' });
      }
    } catch (e) {
      setStatusMessage({ text: 'ERRO DO SISTEMA', type: 'error' });
    } finally {
      setIsExecuting(false);
    }
  }, [isDbReady, userSql, currentMission]);

  const handleAskAi = async () => {
    setIsAiLoading(true);
    const hint = await getAiHelp(currentMission.desc, userSql, dbErrorMessage);
    alert(`TUTOR:\n\n${hint}`);
    setIsAiLoading(false);
  };

  if (!isDbReady) return <div className="h-screen w-full bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-xs">INICIALIZANDO SISTEMA...</div>;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white h-12 flex items-center justify-between px-4 border-b border-slate-700 flex-shrink-0 z-50">
        <div className="flex items-center gap-6">
          <div className="font-bold tracking-widest text-sm flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-600"></div> SQL TRAINER
          </div>
          <div className="flex bg-slate-800 p-0.5 rounded-sm">
            {SCENARIOS.map(sc => (
              <button
                key={sc.id}
                onClick={() => handleSwitchScenario(sc.id)}
                className={`px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  activeScenario.id === sc.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {sc.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex gap-1 bg-slate-800 p-0.5 rounded-sm">
             {(['text-xs', 'text-sm', 'text-base'] as FontSize[]).map(s => (
               <button key={s} onClick={() => setFontSize(s)} className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold ${fontSize === s ? 'bg-slate-600 text-white' : 'text-slate-500'}`}>A</button>
             ))}
           </div>
           <button onClick={() => setDarkMode(!darkMode)} className="text-[10px] font-bold uppercase text-slate-400 hover:text-white border border-slate-700 px-2 py-0.5">
             {darkMode ? 'DARK' : 'LIGHT'}
           </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        <aside className="w-64 flex-shrink-0 z-30">
          <MissionSidebar missions={activeScenario.missions} currentId={currentMission.id} onSelect={(id) => setCurrentMission(activeScenario.missions.find(m => m.id === id)!)} fontSize={fontSize} />
        </aside>

        <main className="flex-1 flex flex-col min-w-0 relative bg-slate-100 dark:bg-slate-950">
          
          {/* DRAWER */}
          <div className="relative z-0 flex flex-col bg-slate-200 dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 shadow-inner">
             <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isErdOpen ? 'h-[400px]' : 'h-0'}`}>
               <ErdViewer nodes={activeScenario.erdNodes} edges={activeScenario.erdEdges} />
             </div>
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full z-20">
               <button onClick={() => setIsErdOpen(!isErdOpen)} className="flex items-center gap-2 px-6 py-1 bg-slate-200 dark:bg-slate-800 border-x border-b border-slate-300 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 uppercase tracking-widest shadow-sm">
                 {isErdOpen ? 'FECHAR DIAGRAMA' : 'ABRIR DIAGRAMA'}
               </button>
             </div>
          </div>

          {/* WORKSPACE */}
          <div className="flex-1 flex flex-col min-h-0 z-10 relative">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-start">
              <div className="max-w-4xl">
                <h2 className={`font-bold text-slate-800 dark:text-white mb-1 uppercase tracking-tight ${fontSize === 'text-base' ? 'text-xl' : 'text-lg'}`}>
                  <span className="text-blue-600 dark:text-blue-500 mr-2">#{currentMission.id.toString().padStart(2,'0')}</span>
                  {currentMission.title}
                </h2>
                <p className={`text-slate-600 dark:text-slate-400 font-mono ${fontSize}`}>{currentMission.desc}</p>
              </div>
              <button onClick={handleAskAi} disabled={isAiLoading} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2 uppercase tracking-wider">
                {isAiLoading ? '...' : 'IA HELP'}
              </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
                <div className="flex-none h-48 flex flex-col gap-2">
                  <SqlEditor value={userSql} onChange={setUserSql} disabled={isExecuting} fontSize={fontSize} />
                  <div className="flex items-center gap-0 border border-slate-300 dark:border-slate-700 rounded-sm overflow-hidden">
                     <button onClick={handleExecute} disabled={isExecuting || !userSql.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white px-6 py-2 font-bold text-xs uppercase tracking-wider transition-colors">
                        {isExecuting ? '...' : 'EXECUTAR (CTRL+ENTER)'}
                      </button>
                      <div className={`flex-1 px-4 py-2 text-xs font-mono uppercase font-bold flex items-center ${
                          statusMessage.type === 'success' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' :
                          statusMessage.type === 'error' ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300' :
                          'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                         {statusMessage.text}
                      </div>
                  </div>
                </div>

                <div className="flex-1 min-h-0 flex gap-4">
                  <div className="flex-1 flex flex-col min-w-0"><ResultTable title="SEU RESULTADO" data={userResult} isError={userError} fontSize={fontSize} /></div>
                  <div className="flex-1 flex flex-col min-w-0"><ResultTable title="ESPERADO" data={expectedResult} emptyMessage="..." fontSize={fontSize} /></div>
                </div>
              </div>

              <div className="flex-none w-64 z-20">
                <SchemaViewer schemas={activeScenario.schema} fontSize={fontSize} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;