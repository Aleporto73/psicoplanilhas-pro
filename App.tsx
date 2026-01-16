
import React, { useState } from 'react';
import { Profession, ReportObjective, FlowStep, RawInput, ExtractedResult, ReportContext, CanonicalReport } from './core/types';
import { extractFromText } from './adapters/text.adapter';
import { extractFromImage } from './adapters/image.adapter';
import { CanonicalEngine } from './core/engine';

const App: React.FC = () => {
  const [step, setStep] = useState<FlowStep>(FlowStep.TRIAGE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [context, setContext] = useState<ReportContext>({
    profession: Profession.PSICOLOGO,
    objective: ReportObjective.PAIS_FAMILIA
  });
  const [extractedData, setExtractedData] = useState<ExtractedResult[]>([]);
  const [sourceType, setSourceType] = useState<'image' | 'text'>('text');
  const [report, setReport] = useState<CanonicalReport | null>(null);

  const handleTriage = (p: Profession, o: ReportObjective) => {
    setContext({ profession: p, objective: o });
    setStep(FlowStep.INPUT);
  };

  const handleInput = async (input: RawInput) => {
    setLoading(true);
    setError(null);
    setSourceType(input.source);
    try {
      const data = input.source === 'text' 
        ? await extractFromText(input.content)
        : await extractFromImage(input.content);
      
      if (data.length === 0) throw new Error("Não detectamos dados legíveis. Verifique a fonte.");
      setExtractedData(data);
      setStep(FlowStep.CONFIRM);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneration = async (confirmed: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const result = await CanonicalEngine.execute(context, extractedData, confirmed, sourceType);
      setReport(result);
      setStep(FlowStep.DONE);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans selection:bg-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        
        <header className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-block px-4 py-1 rounded-full bg-white border border-slate-200 shadow-sm mb-6">
            <span className="text-[10px] font-black tracking-[0.2em] text-indigo-600 uppercase">PsicoPlanilhas • Sênior Engine V3.5</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-slate-950 mb-4">
            Relatório <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-400">Clínico Inteligente</span>
          </h1>
          <p className="text-slate-500 font-medium max-w-lg mx-auto leading-relaxed">
            Resultados técnicos convertidos em texto humano, fluido e personalizável.
          </p>
        </header>

        {error && (
          <div className="mb-10 p-5 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-900 font-medium text-sm animate-in shake duration-300">
            ⚠️ {error}
          </div>
        )}

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-20 h-20 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
              <h2 className="text-2xl font-black text-slate-800">Motor de Redação</h2>
              <p className="text-slate-400 mt-2 font-medium">Refinando texto clínico sênior...</p>
            </div>
          ) : (
            <>
              {step === FlowStep.TRIAGE && <TriageStep onNext={handleTriage} />}
              {step === FlowStep.INPUT && <InputStep onNext={handleInput} onBack={() => setStep(FlowStep.TRIAGE)} />}
              {step === FlowStep.CONFIRM && <ConfirmStep data={extractedData} onNext={handleGeneration} onBack={() => setStep(FlowStep.INPUT)} />}
              {step === FlowStep.DONE && report && <ReportDashboard report={report} onReset={() => setStep(FlowStep.TRIAGE)} />}
            </>
          )}
        </div>

        <footer className="mt-20 text-center space-y-4">
          <div className="h-px w-24 bg-slate-200 mx-auto"></div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
            Rigor Técnico • Ética • Elegância Editorial
          </p>
        </footer>
      </div>
    </div>
  );
};

const TriageStep: React.FC<{ onNext: (p: Profession, o: ReportObjective) => void }> = ({ onNext }) => {
  const [p, setP] = useState(Profession.PSICOLOGO);
  const [o, setO] = useState(ReportObjective.PAIS_FAMILIA);

  return (
    <div className="p-12 md:p-16 space-y-12">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-950 tracking-tight">Configuração Inicial</h2>
        <p className="text-slate-400 font-medium">Defina a persona emissora e o público-alvo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Profissão</label>
          <select 
            className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none"
            value={p} onChange={e => setP(e.target.value as Profession)}
          >
            {Object.values(Profession).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Objetivo</label>
          <select 
            className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-700 focus:border-indigo-500 outline-none transition-all appearance-none"
            value={o} onChange={e => setO(e.target.value as ReportObjective)}
          >
            {Object.values(ReportObjective).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <button onClick={() => onNext(p, o)} className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-indigo-100">
        Próximo Passo
      </button>
    </div>
  );
};

const InputStep: React.FC<{ onBack: () => void, onNext: (i: RawInput) => void }> = ({ onBack, onNext }) => {
  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onNext({ source: 'image', content: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-12 md:p-16 space-y-12">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-950 tracking-tight">Captura de Dados</h2>
          <p className="text-slate-400 font-medium">Cole o texto ou envie um print da planilha preenchida.</p>
        </div>
        <button onClick={onBack} className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-600 pb-1">Voltar</button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button onClick={() => setMode('text')} className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${mode === 'text' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>TEXTO</button>
        <button onClick={() => setMode('image')} className={`px-8 py-3 rounded-xl font-black text-sm transition-all ${mode === 'image' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>IMAGEM</button>
      </div>

      {mode === 'text' ? (
        <textarea 
          placeholder="Dados da planilha..."
          className="w-full h-64 p-8 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-indigo-200 transition-all outline-none font-mono text-sm text-slate-600 shadow-inner"
          value={text} onChange={e => setText(e.target.value)}
        />
      ) : (
        <div className="group relative h-64 border-4 border-dashed border-slate-200 rounded-[2.5rem] hover:bg-indigo-50/50 hover:border-indigo-200 transition-all flex flex-col items-center justify-center cursor-pointer">
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFile} />
          <svg className="w-12 h-12 text-indigo-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p className="font-black text-slate-900">Clique para enviar imagem</p>
        </div>
      )}

      {mode === 'text' && (
        <button disabled={!text.trim()} onClick={() => onNext({ source: 'text', content: text })} className="w-full h-20 bg-indigo-600 disabled:bg-slate-200 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-indigo-100">
          Processar Dados
        </button>
      )}
    </div>
  );
};

const ConfirmStep: React.FC<{ data: ExtractedResult[], onBack: () => void, onNext: (c: boolean) => void }> = ({ data, onBack, onNext }) => {
  const [checked, setChecked] = useState(false);

  return (
    <div className="p-12 md:p-16 space-y-12">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-950 tracking-tight">Audit de Dados</h2>
          <p className="text-slate-400 font-medium">Verifique a extração antes de iniciar a redação final.</p>
        </div>
        <button onClick={onBack} className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-600 pb-1">Corrigir</button>
      </div>

      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {data.map((item, idx) => (
          <div key={idx} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-200">
            <h4 className="text-xl font-black text-indigo-900 mb-6">{item.instrument}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {item.scores.map((s, si) => (
                <div key={si} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{s.label}</span>
                  <span className="text-indigo-700 font-black text-lg">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div onClick={() => setChecked(!checked)} className="flex items-center gap-5 p-8 rounded-[2.5rem] bg-amber-50 border-2 border-amber-100 cursor-pointer select-none transition-all hover:bg-amber-100/50">
        <div className={`w-8 h-8 rounded-xl border-4 transition-all flex items-center justify-center ${checked ? 'bg-amber-500 border-amber-500' : 'bg-white border-amber-200'}`}>
          {checked && <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
        </div>
        <p className="text-sm font-black text-amber-950 leading-tight flex-1">
          Confirmo a fidedignidade dos dados técnicos.
        </p>
      </div>

      <button disabled={!checked} onClick={() => onNext(true)} className="w-full h-20 bg-slate-950 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl">
        Gerar Relatório Canônico
      </button>
    </div>
  );
};

const ReportDashboard: React.FC<{ report: CanonicalReport, onReset: () => void }> = ({ report, onReset }) => {
  const [activeTab, setActiveTab] = useState<'professional' | 'simple' | 'technical'>('professional');
  const [copying, setCopying] = useState(false);

  const activeContent = report.versions[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeContent);
    setCopying(true);
    setTimeout(() => setCopying(false), 2000);
  };

  return (
    <div className="p-10 md:p-16 space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h2 className="text-3xl font-black text-slate-950 tracking-tight">Relatório Finalizado</h2>
        <button onClick={onReset} className="px-8 py-3 rounded-2xl bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest">Novo Relatório</button>
      </div>

      <div className="bg-slate-100/50 p-2 rounded-3xl flex border border-slate-200">
        {(['professional', 'simple', 'technical'] as const).map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tab === 'professional' ? 'Oficial' : tab === 'simple' ? 'Pais' : 'Técnica'}
          </button>
        ))}
      </div>

      <div className="bg-white p-12 md:p-20 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 min-h-[700px] whitespace-pre-wrap font-serif text-lg md:text-xl leading-[2.2] text-slate-800 overflow-y-auto max-h-[80vh] custom-scrollbar selection:bg-indigo-100 text-justify">
        {activeContent}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        <button onClick={handleCopy} className="h-20 bg-indigo-600 text-white rounded-[2rem] font-black text-lg transition-all shadow-xl hover:bg-indigo-700">
          {copying ? 'TEXTO COPIADO!' : 'COPIAR TEXTO'}
        </button>
        <button onClick={() => window.print()} className="h-20 bg-slate-950 text-white rounded-[2rem] font-black text-lg transition-all shadow-xl hover:bg-black">
          IMPRIMIR PDF
        </button>
      </div>
    </div>
  );
};

export default App;
