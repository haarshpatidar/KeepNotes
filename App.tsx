
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Note, Category } from './types';
import { STORAGE_KEY, CATEGORY_COLORS, CATEGORY_DOTS, STICKY_COLORS } from './constants';
import { getSmartSuggestion } from './services/geminiService';

// --- Haptic Feedback ---
const haptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  if (!navigator.vibrate) return;
  switch(type) {
    case 'light': navigator.vibrate(10); break;
    case 'medium': navigator.vibrate(30); break;
    case 'heavy': navigator.vibrate(60); break;
    case 'success': navigator.vibrate([10, 30, 10]); break;
    case 'error': navigator.vibrate([50, 50, 50]); break;
  }
};

// --- Mobile Icons ---
const IconHome = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);
const IconCalendar = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
const IconVault = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);
const IconPin = ({ active }: { active: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 4.93 4.24 4.24"/><path d="M2 12h8"/><path d="m4.93 19.07 4.24-4.24"/><path d="M12 22v-8"/><path d="m19.07 19.07-4.24-4.24"/><path d="M22 12h-8"/><path d="m19.07 4.93-4.24 4.24"/></svg>
);
const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
const IconSparkles = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>
);

export default function App() {
  const [isSplash, setIsSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'Home' | 'Calendar' | 'Vault'>('Home');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<Note | null>(null);
  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [search, setSearch] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [currentNote, setCurrentNote] = useState<Partial<Note>>({
    title: '', content: '', category: 'General', reminderAt: '', dueAt: '', isPrivate: false, isPinned: false, color: 'Yellow'
  });

  const notificationQueue = useRef<Set<string>>(new Set());
  const alarmQueue = useRef<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setNotes(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
    setTimeout(() => setIsSplash(false), 2200);
    if ("Notification" in window) Notification.requestPermission();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      notes.forEach(note => {
        if (note.isCompleted) return;
        if (note.reminderAt && now >= new Date(note.reminderAt) && !notificationQueue.current.has(note.id)) {
          notificationQueue.current.add(note.id);
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("MindKeep", { body: note.title });
          }
          haptic('medium');
        }
        if (note.dueAt && now >= new Date(note.dueAt) && !alarmQueue.current.has(note.id)) {
          alarmQueue.current.add(note.id);
          setActiveAlarm(note);
          haptic('error');
          new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3').play().catch(() => {});
        }
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [notes]);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    haptic('light');
  };

  const openNote = (note?: Note) => {
    const isNewFromVault = !note && activeTab === 'Vault';
    setCurrentNote(note || { 
      title: '', 
      content: '', 
      category: isNewFromVault ? 'Private' : 'General', 
      isPrivate: isNewFromVault,
      isPinned: false,
      color: 'Yellow'
    });
    setIsModalOpen(true);
    haptic('light');
  };

  const saveNote = () => {
    if (!currentNote.content && !currentNote.title) return;
    const newNote: Note = {
      id: currentNote.id || Math.random().toString(36).substr(2, 9),
      title: currentNote.title || 'Untitled',
      content: currentNote.content || '',
      category: (currentNote.isPrivate ? 'Private' : (currentNote.category || 'General')) as Category,
      reminderAt: currentNote.reminderAt,
      dueAt: currentNote.dueAt,
      timestamp: Date.now(),
      isCompleted: currentNote.isCompleted || false,
      isPrivate: currentNote.isPrivate || false,
      isPinned: currentNote.isPinned || false,
      color: currentNote.color || 'Yellow',
    };
    if (currentNote.id) setNotes(notes.map(n => n.id === currentNote.id ? newNote : n));
    else setNotes([newNote, ...notes]);
    setIsModalOpen(false);
    haptic('success');
  };

  const handleSmartName = async () => {
    if (!currentNote.content) return;
    setIsAiLoading(true);
    try {
      const suggestion = await getSmartSuggestion(currentNote.content);
      setCurrentNote(prev => ({ 
        ...prev, 
        title: suggestion.title, 
        category: suggestion.category,
        color: suggestion.colorSuggestion
      }));
      haptic('success');
    } catch(e) {} finally { setIsAiLoading(false); }
  };

  const verifyPin = (digit: string) => {
    const newPin = pinInput + digit;
    if (newPin.length <= 4) {
      setPinInput(newPin);
      haptic('medium');
      if (newPin.length === 4) {
        if (newPin === '1234') {
          setTimeout(() => { setIsVaultLocked(false); setPinInput(''); haptic('success'); }, 200);
        } else {
          setTimeout(() => { setPinInput(''); haptic('error'); }, 300);
        }
      }
    }
  };

  const getNoteColorStyles = (colorName: string = 'Yellow') => {
    return STICKY_COLORS.find(c => c.name === colorName) || STICKY_COLORS[0];
  };

  const filteredNotes = notes.filter(n => {
    const searchMatch = n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'Vault') return n.isPrivate && searchMatch;
    if (activeTab === 'Calendar') return n.dueAt && !n.isCompleted && searchMatch;
    return !n.isPrivate && searchMatch;
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned);

  const NoteCard = ({ note }: { note: Note }) => {
    const colors = getNoteColorStyles(note.color);
    return (
      <div 
        onClick={() => openNote(note)}
        className={`${colors.bg} ${colors.border} border-b-4 border-r-4 p-5 rounded-sm relative tap-scale transition-all shadow-md overflow-hidden rotate-[0.5deg] odd:-rotate-[0.5deg]`}
        style={{ minHeight: '140px' }}
      >
        <button 
          onClick={(e) => togglePin(note.id, e)}
          className={`absolute top-3 right-3 p-1 rounded-full ${note.isPinned ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <IconPin active={note.isPinned} />
        </button>
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${CATEGORY_DOTS[note.category]}`} />
          <span className="text-[9px] font-black uppercase tracking-tighter text-slate-500 opacity-60">{note.category}</span>
        </div>
        <h3 className={`font-bold text-slate-800 text-base mb-1 leading-tight ${note.isCompleted ? 'line-through opacity-50' : ''}`}>{note.title}</h3>
        <p className={`text-xs text-slate-600 line-clamp-4 leading-relaxed ${note.isCompleted ? 'opacity-40' : ''}`}>{note.content}</p>
        {(note.dueAt || note.reminderAt) && (
          <div className="mt-3 flex flex-wrap gap-1">
            {note.dueAt && <div className="text-[8px] font-bold bg-white/50 px-1.5 py-0.5 rounded border border-black/10">⏰ {new Date(note.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
          </div>
        )}
      </div>
    );
  };

  if (isSplash) {
    return (
      <div className="fixed inset-0 z-[1000] bg-indigo-600 flex flex-col items-center justify-center text-white">
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl floating">
          <IconPin active={true} />
        </div>
        <h1 className="text-4xl font-black tracking-tighter">MindKeep</h1>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Dynamic Mobile Header */}
      <header className="safe-top bg-white/40 backdrop-blur-2xl border-b border-white/20 px-6 py-4 z-40">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter">
            {activeTab === 'Home' && 'Stickies'}
            {activeTab === 'Calendar' && 'Schedule'}
            {activeTab === 'Vault' && 'Vault'}
          </h1>
          <button onClick={() => openNote()} className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 tap-scale">
            <IconSparkles />
          </button>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search thoughts..." 
            className="w-full bg-white/60 border border-slate-200 rounded-xl py-3 pl-4 pr-10 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {/* Main List Area */}
      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-32 no-scrollbar scroll-smooth">
        {activeTab === 'Vault' && isVaultLocked ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6"><IconVault active={true} /></div>
            <h2 className="text-xl font-black mb-8">Vault Protected</h2>
            <div className="flex gap-4 mb-10">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 border-slate-300 ${pinInput.length > i ? 'bg-indigo-600 border-indigo-600 scale-125 shadow-lg' : ''}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, '✕', 0, '←'].map((d, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    if (d === '✕') setPinInput('');
                    else if (d === '←') setPinInput(pinInput.slice(0, -1));
                    else verifyPin(d.toString());
                  }}
                  className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-xl font-black active:bg-indigo-600 active:text-white transition-colors"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pinned Section */}
            {pinnedNotes.length > 0 && activeTab === 'Home' && (
              <section>
                <div className="flex items-center gap-2 mb-4 px-2">
                  <IconPin active={true} />
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Pinned Notes</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {pinnedNotes.map(note => <NoteCard key={note.id} note={note} />)}
                </div>
              </section>
            )}

            {/* Main Section */}
            <section>
              {pinnedNotes.length > 0 && activeTab === 'Home' && (
                <div className="flex items-center gap-2 mb-4 px-2 mt-8">
                  <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">All Thoughts</h2>
                </div>
              )}
              {filteredNotes.length === 0 ? (
                <div className="py-20 flex flex-col items-center text-slate-300 opacity-50">
                   <div className="w-24 h-24 border-4 border-dashed border-slate-200 rounded-full flex items-center justify-center mb-4"><IconPlus /></div>
                   <p className="font-bold">Write something down...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {unpinnedNotes.map(note => <NoteCard key={note.id} note={note} />)}
                  {(activeTab !== 'Home') && pinnedNotes.map(note => <NoteCard key={note.id} note={note} />)}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Alarm Fullscreen */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[5000] bg-yellow-400 flex flex-col items-center justify-center p-10 text-slate-900">
           <div className="animate-bounce mb-12">
             <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center shadow-2xl border-8 border-black">
                <IconCalendar active={true} />
             </div>
           </div>
           <h2 className="text-6xl font-black mb-4 tracking-tighter italic">ALERT!</h2>
           <div className="bg-white p-8 rounded-[2rem] border-4 border-black w-full max-w-sm mb-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-2xl font-black mb-2">{activeAlarm.title}</h3>
              <p className="font-bold opacity-70">{activeAlarm.content}</p>
           </div>
           <button onClick={() => { setNotes(notes.map(n => n.id === activeAlarm.id ? { ...n, isCompleted: true } : n)); setActiveAlarm(null); haptic('success'); }} className="bg-black text-white w-full py-6 rounded-3xl font-black text-xl shadow-2xl tap-scale uppercase tracking-tighter">Dismiss</button>
        </div>
      )}

      {/* Editor Modal Sheet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-t-[3rem] shadow-2xl flex flex-col max-h-[96vh] animate-slide-up overflow-hidden">
            <div className="w-16 h-1 bg-slate-200 rounded-full mx-auto my-4" />
            
            <div className="flex items-center justify-between px-8 py-2">
              <h2 className="text-xl font-black">Edit Note</h2>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center tap-scale">✕</button>
            </div>
            
            <div className="px-8 py-6 overflow-y-auto space-y-6 flex-1 no-scrollbar">
              <input 
                type="text" 
                placeholder="Subject..." 
                className="text-3xl font-black bg-transparent border-none focus:ring-0 outline-none w-full placeholder-slate-200" 
                value={currentNote.title} 
                onChange={(e) => setCurrentNote({ ...currentNote, title: e.target.value })} 
              />
              <textarea 
                placeholder="Pour your mind out..." 
                className="w-full h-48 bg-transparent border-none focus:ring-0 outline-none text-slate-700 font-bold text-lg leading-tight resize-none placeholder-slate-100" 
                value={currentNote.content} 
                onChange={(e) => setCurrentNote({ ...currentNote, content: e.target.value })} 
              />

              <div className="flex flex-wrap gap-2">
                {STICKY_COLORS.map(c => (
                  <button 
                    key={c.name}
                    onClick={() => setCurrentNote({ ...currentNote, color: c.name })}
                    className={`w-10 h-10 rounded-full ${c.bg} border-2 ${currentNote.color === c.name ? 'border-black scale-125' : 'border-transparent'} transition-all`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Alarm</label>
                   <input type="datetime-local" className="w-full bg-slate-50 border-none rounded-xl text-xs font-black p-4 text-red-600" value={currentNote.dueAt || ''} onChange={(e) => setCurrentNote({ ...currentNote, dueAt: e.target.value })} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-slate-400">Remind</label>
                   <input type="datetime-local" className="w-full bg-slate-50 border-none rounded-xl text-xs font-black p-4 text-indigo-600" value={currentNote.reminderAt || ''} onChange={(e) => setCurrentNote({ ...currentNote, reminderAt: e.target.value })} />
                 </div>
              </div>

              <div className="flex items-center justify-between p-5 bg-slate-900 rounded-3xl">
                <div className="flex items-center gap-3">
                  <IconVault active={true} />
                  <span className="text-sm font-black text-white">Private Vault</span>
                </div>
                <button 
                  onClick={() => { setCurrentNote({ ...currentNote, isPrivate: !currentNote.isPrivate }); haptic('light'); }}
                  className={`w-14 h-8 rounded-full relative transition-all ${currentNote.isPrivate ? 'bg-indigo-500' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${currentNote.isPrivate ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-5 bg-indigo-50 rounded-3xl">
                <div className="flex items-center gap-3">
                  <IconPin active={true} />
                  <span className="text-sm font-black text-indigo-600">Pin to Top</span>
                </div>
                <button 
                  onClick={() => { setCurrentNote({ ...currentNote, isPinned: !currentNote.isPinned }); haptic('light'); }}
                  className={`w-14 h-8 rounded-full relative transition-all ${currentNote.isPinned ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${currentNote.isPinned ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4 safe-bottom">
              <button onClick={handleSmartName} disabled={!currentNote.content || isAiLoading} className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-600 tap-scale disabled:opacity-50">
                {isAiLoading ? <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent animate-spin rounded-full"></div> : <IconSparkles />}
              </button>
              <button onClick={saveNote} className="flex-1 bg-indigo-600 text-white font-black rounded-3xl text-xl shadow-2xl active:scale-95 transition-all py-5 uppercase tracking-tighter btn-liquid">Keep Thought</button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-safe">
        <div className="bg-white/70 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] shadow-2xl flex items-center justify-between px-2 py-2 mb-4 relative">
            <button onClick={() => { setActiveTab('Home'); haptic('light'); }} className={`flex-1 flex flex-col items-center py-4 rounded-3xl transition-all ${activeTab === 'Home' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>
                <IconHome active={activeTab === 'Home'} />
            </button>
            
            <div className="absolute left-1/2 -translate-x-1/2 -top-10">
                <button 
                    onClick={() => openNote()}
                    className="w-20 h-20 bg-indigo-600 rounded-full shadow-2xl flex items-center justify-center text-white border-[8px] border-slate-50 tap-scale transition-transform active:scale-90"
                >
                    <IconPlus />
                </button>
            </div>
            
            <div className="w-20" /> 

            <button onClick={() => { setActiveTab('Calendar'); haptic('light'); }} className={`flex-1 flex flex-col items-center py-4 rounded-3xl transition-all ${activeTab === 'Calendar' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>
                <IconCalendar active={activeTab === 'Calendar'} />
            </button>
            <button onClick={() => { setActiveTab('Vault'); haptic('light'); }} className={`flex-1 flex flex-col items-center py-4 rounded-3xl transition-all ${activeTab === 'Vault' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>
                <IconVault active={activeTab === 'Vault'} />
            </button>
        </div>
      </nav>
      
      <style>{`
        .pb-safe { padding-bottom: calc(env(safe-area-inset-bottom) + 0.5rem); }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        @keyframes slide-up {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
      `}</style>
    </div>
  );
}
