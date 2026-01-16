
import React, { useState, useRef, useEffect } from 'react';
import { Profession, ReportObjective, FlowStep, RawInput, ExtractedResult, ReportContext, CanonicalReport, PatientInfo } from './core/types';
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
      
      if (!data || data.length === 0) throw new Error("Não detectamos dados legíveis na imagem.");
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
    <div className="min-h-screen bg-[#F1F4F9] text-slate-900 font-sans selection:bg-indigo-100 print:bg-white">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-50 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <h1 className="font-black text-slate-800 leading-none tracking-tight">PsicoAssistente</h1>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inteligência Profissional</span>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i <= (Object.keys(FlowStep).indexOf(step) + 1) ? 'w-6 bg-indigo-600' : 'w-4 bg-slate-200'}`}></div>
            ))}
          </div>
          <button onClick={() => window.location.reload()} className="text-xs font-black text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest">Cancelar</button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 print:p-0 print:max-w-none">
        {error && (
          <div className="mb-8 p-5 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-900 font-medium text-sm animate-in shake print:hidden">
            ⚠️ {error}
          </div>
        )}

        <div className="min-h-[600px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-48">
              <div className="w-16 h-16 border-[5px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Processando Inteligência</h2>
              <p className="text-slate-400 mt-2 font-medium">Extraindo dados clínicos sênior...</p>
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
      </div>
    </div>
  );
};

const TriageStep: React.FC<{ onNext: (p: Profession, o: ReportObjective) => void }> = ({ onNext }) => {
  const [p, setP] = useState(Profession.PSICOLOGO);
  const [o, setO] = useState(ReportObjective.PAIS_FAMILIA);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-12 md:p-16 space-y-12 animate-in fade-in zoom-in-95 duration-500">
      <div className="space-y-2">
        <h2 className="text-4xl font-black text-slate-950 tracking-tight">Configuração Inicial</h2>
        <p className="text-slate-400 text-lg font-medium">Personalize a persona emissora e o destino do documento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sua Profissão</label>
          <select 
            className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all appearance-none"
            value={p} onChange={e => setP(e.target.value as Profession)}
          >
            {Object.values(Profession).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Público do Relatório</label>
          <select 
            className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all appearance-none"
            value={o} onChange={e => setO(e.target.value as ReportObjective)}
          >
            {Object.values(ReportObjective).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      <button onClick={() => onNext(p, o)} className="w-full h-20 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]">
        Continuar
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
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-12 md:p-16 space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-slate-950 tracking-tight">Captura de Dados</h2>
          <p className="text-slate-400 text-lg font-medium">Extraímos automaticamente as tabelas para você.</p>
        </div>
        <button onClick={onBack} className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-600 pb-1">Voltar</button>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit border border-slate-200">
        <button onClick={() => setMode('text')} className={`px-10 py-3 rounded-xl font-black text-sm transition-all ${mode === 'text' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>TEXTO</button>
        <button onClick={() => setMode('image')} className={`px-10 py-3 rounded-xl font-black text-sm transition-all ${mode === 'image' ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}>IMAGEM / TABELA</button>
      </div>

      {mode === 'text' ? (
        <textarea 
          placeholder="Cole aqui os resultados das suas planilhas..."
          className="w-full h-80 p-8 rounded-[2rem] bg-slate-50 border-2 border-slate-100 focus:border-indigo-200 transition-all outline-none font-mono text-sm text-slate-600 shadow-inner"
          value={text} onChange={e => setText(e.target.value)}
        />
      ) : (
        <div className="group relative h-80 border-4 border-dashed border-slate-200 rounded-[2.5rem] hover:bg-indigo-50/50 hover:border-indigo-200 transition-all flex flex-col items-center justify-center cursor-pointer">
          <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFile} />
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <p className="font-black text-xl text-slate-900">Enviar Foto da Planilha</p>
          <p className="text-sm text-slate-400 font-bold uppercase mt-2 tracking-widest">Processamento IA Habilitado</p>
        </div>
      )}

      {mode === 'text' && (
        <button disabled={!text.trim()} onClick={() => onNext({ source: 'text', content: text })} className="w-full h-20 bg-indigo-600 disabled:bg-slate-200 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-indigo-100 active:scale-[0.98]">
          Iniciar Extração
        </button>
      )}
    </div>
  );
};

const ConfirmStep: React.FC<{ data: ExtractedResult[], onBack: () => void, onNext: (c: boolean) => void }> = ({ data, onBack, onNext }) => {
  const [checked, setChecked] = useState(false);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-12 md:p-16 space-y-12 animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-slate-950 tracking-tight">Audit de Dados</h2>
          <p className="text-slate-400 text-lg font-medium">Verifique as pontuações extraídas.</p>
        </div>
        <button onClick={onBack} className="text-xs font-black text-indigo-600 uppercase tracking-widest border-b-2 border-indigo-600 pb-1">Corrigir</button>
      </div>

      <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
        {data.map((item, idx) => (
          <div key={idx} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100">
            <h4 className="text-2xl font-black text-indigo-900 mb-6">{item.instrument}</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {item.scores.map((s, si) => (
                <div key={si} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <span className="block text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{s.label}</span>
                  <span className="text-indigo-700 font-black text-xl">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div onClick={() => setChecked(!checked)} className="flex items-center gap-6 p-8 rounded-[2.5rem] bg-amber-50 border-2 border-amber-100 cursor-pointer transition-all hover:bg-amber-100/50">
        <div className={`w-10 h-10 rounded-2xl border-4 flex items-center justify-center ${checked ? 'bg-amber-500 border-amber-500 shadow-lg' : 'bg-white border-amber-200'}`}>
          {checked && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
        </div>
        <p className="text-lg font-black text-amber-950 leading-tight">Confirmo os dados extraídos.</p>
      </div>

      <button disabled={!checked} onClick={() => onNext(true)} className="w-full h-20 bg-slate-950 disabled:bg-slate-100 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl active:scale-[0.98]">
        Gerar Relatório Final
      </button>
    </div>
  );
};

const ReportDashboard: React.FC<{ report: CanonicalReport, onReset: () => void }> = ({ report, onReset }) => {
  const [activeTab, setActiveTab] = useState<'professional' | 'simple' | 'technical'>('professional');
  const [patient, setPatient] = useState<PatientInfo>({ name: '', age: '', date: new Date().toLocaleDateString('pt-BR') });
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inicializa o conteúdo ao trocar de aba ou no load
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = processInitialContent(report.versions[activeTab]);
    }
  }, [activeTab, report.versions]);

  const processInitialContent = (content: string) => {
    if (content.includes('<p>') || content.includes('<h2')) return content;
    return content.split('\n').map(line => {
      const trimmed = line.trim();
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 4 && !trimmed.match(/[0-9]/)) {
        return `<h2 class="section-header">${trimmed}</h2>`;
      }
      return trimmed ? `<p>${trimmed}</p>` : '';
    }).join('');
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedRange(selection.getRangeAt(0).cloneRange());
    }
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editorRef.current) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const id = `img-${Date.now()}`;
        const imgHtml = `
          <div contenteditable="false" id="${id}" class="image-wrapper group relative my-12 animate-in fade-in zoom-in-95 duration-700 select-none">
            <img src="${ev.target?.result}" class="w-full rounded-[2.5rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/30" />
            <div class="text-[10px] text-center text-slate-300 font-black uppercase mt-5 tracking-[0.4em]">Registro de Performance</div>
            <button 
              onclick="document.getElementById('${id}').remove();"
              class="absolute -top-5 -right-5 w-14 h-14 bg-red-500 text-white rounded-[1.25rem] flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
              title="Excluir Gráfico"
            >
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
          <p><br></p>
        `;
        
        const selection = window.getSelection();
        const range = savedRange || (selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null);
        
        if (range && editorRef.current.contains(range.commonAncestorContainer)) {
          const fragment = range.createContextualFragment(imgHtml);
          range.insertNode(fragment);
        } else {
          editorRef.current.innerHTML += imgHtml;
        }
        setSavedRange(null);
      };
      reader.readAsDataURL(file);
    }
    // Limpa o input para permitir selecionar a mesma imagem se deletar
    e.target.value = '';
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    setHoverY(relativeY);
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Menu Superior do Editor */}
      <div className="bg-white rounded-[2rem] shadow-lg shadow-slate-200/40 p-8 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 print:hidden border border-slate-100">
        <div className="flex items-center gap-5">
           <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse shadow-lg shadow-indigo-100"></div>
           <div>
              <h3 className="font-black text-slate-800 uppercase tracking-[0.2em] text-sm">Relatório Editorial</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Modo de Edição Livre</p>
           </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200 flex-1 md:flex-none">
            {(['professional', 'simple', 'technical'] as const).map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab === 'professional' ? 'Oficial' : tab === 'simple' ? 'Pais' : 'Técnica'}
              </button>
            ))}
          </div>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-black active:scale-[0.98] shadow-xl shadow-slate-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Imprimir / PDF
          </button>
        </div>
      </div>

      <div ref={containerRef} onMouseMove={onMouseMove} onMouseLeave={() => setHoverY(null)} className="relative bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/50 p-12 md:p-28 min-h-[1400px] border border-slate-50 print:shadow-none print:border-none print:p-0">
        
        {/* Identificação Elegante */}
        <div className="mb-24 pb-20 border-b-2 border-slate-50 grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Nome Completo</label>
            <input 
              type="text" 
              placeholder="Inserir Nome"
              className="w-full bg-transparent border-none p-0 text-3xl font-black text-slate-900 placeholder:text-slate-100 focus:ring-0 tracking-tight"
              value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})}
            />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Idade</label>
            <input 
              type="text" 
              placeholder="Inserir Idade"
              className="w-full bg-transparent border-none p-0 text-3xl font-black text-slate-900 placeholder:text-slate-100 focus:ring-0 tracking-tight"
              value={patient.age} onChange={e => setPatient({...patient, age: e.target.value})}
            />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Data</label>
            <input 
              type="text" 
              className="w-full bg-transparent border-none p-0 text-3xl font-black text-slate-900 focus:ring-0 tracking-tight"
              value={patient.date} onChange={e => setPatient({...patient, date: e.target.value})}
            />
          </div>
        </div>

        {/* Editor Principal */}
        <div 
          ref={editorRef}
          contentEditable
          onFocus={saveSelection}
          onBlur={saveSelection}
          onKeyUp={saveSelection}
          onClick={saveSelection}
          suppressContentEditableWarning
          className="editor-paper outline-none font-serif text-xl md:text-2xl leading-[2.6] text-slate-800 text-justify selection:bg-indigo-100 p-16 -m-16 rounded-[4rem] transition-all focus:bg-slate-50/5"
        />

        {/* Botão Dinâmico de Inserção */}
        {hoverY !== null && hoverY > 450 && (
          <div 
            className="absolute left-0 right-0 flex items-center justify-center group pointer-events-none print:hidden transition-all duration-700"
            style={{ top: hoverY, transform: 'translateY(-50%)' }}
          >
             <div className="w-full h-px bg-indigo-50/30 mx-24 group-hover:bg-indigo-100/50 transition-colors"></div>
             <button 
              onClick={() => { saveSelection(); fileInputRef.current?.click(); }}
              className="pointer-events-auto flex items-center gap-4 px-10 py-4 bg-white border-2 border-indigo-50 rounded-full shadow-2xl shadow-indigo-100/20 text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 whitespace-nowrap animate-in fade-in zoom-in-95"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                Inserir Gráfico Aqui
             </button>
             <div className="w-full h-px bg-indigo-50/30 mx-24 group-hover:bg-indigo-100/50 transition-colors"></div>
          </div>
        )}
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAddImage} />

        {/* Rodapé Print */}
        <div className="hidden print:block mt-48 border-t pt-20 text-center">
            <div className="w-80 h-px bg-slate-300 mx-auto mb-8"></div>
            <p className="font-black text-slate-900 uppercase tracking-[0.4em] text-sm">Assinatura Profissional</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-3">{report.context.profession}</p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;700;900&family=Inter:wght@400;900&display=swap');
        
        .editor-paper { font-family: 'Crimson Pro', serif; }
        .editor-paper p { margin-bottom: 2.8rem; color: #1e293b; }

        .section-header {
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          gap: 2rem;
          font-size: 1.1rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.4em;
          margin-top: 6rem;
          margin-bottom: 3.5rem;
          text-transform: uppercase;
        }

        .section-header::before {
          content: "";
          display: block;
          width: 5px;
          height: 1.8rem;
          background: #4f46e5;
          border-radius: 99px;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
        }

        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .editor-paper { padding: 0 !important; margin: 0 !important; font-size: 13pt !important; line-height: 1.8 !important; color: black !important; }
          .section-header { margin-top: 4rem; margin-bottom: 2rem; color: black !important; }
          .section-header::before { background: black !important; box-shadow: none !important; }
          input { border: none !important; padding: 0 !important; font-size: 18pt !important; color: black !important; }
          .image-wrapper button { display: none !important; }
        }

        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;
