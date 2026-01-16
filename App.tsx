
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
  const [report, setReport] = useState<CanonicalReport | null>(null);

  const handleTriage = (p: Profession, o: ReportObjective) => {
    setContext({ profession: p, objective: o });
    setStep(FlowStep.INPUT);
  };

  const handleMultipleInputs = async (inputs: RawInput[]) => {
    setLoading(true);
    setError(null);
    try {
      let allResults: ExtractedResult[] = [];
      for (const input of inputs) {
        const data = input.source === 'text' 
          ? await extractFromText(input.content)
          : await extractFromImage(input.content);
        if (data && data.length > 0) allResults = [...allResults, ...data];
      }
      if (allResults.length === 0) throw new Error("Dados não detectados.");
      setExtractedData(allResults);
      setStep(FlowStep.CONFIRM);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneration = async (confirmed: boolean) => {
    setLoading(true);
    try {
      const result = await CanonicalEngine.execute(context, extractedData, confirmed, 'image');
      setReport(result);
      setStep(FlowStep.DONE);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-100">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-[100] print:hidden shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h1 className="font-black text-slate-800 leading-none">PsicoAssistente PRO</h1>
        </div>
        <button onClick={() => window.location.reload()} className="text-xs font-black text-slate-400 hover:text-red-500 uppercase tracking-widest">Reiniciar</button>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 print:p-0">
        {step === FlowStep.TRIAGE && <TriageStep onNext={handleTriage} />}
        {step === FlowStep.INPUT && <InputStep onNext={handleMultipleInputs} onBack={() => setStep(FlowStep.TRIAGE)} />}
        {step === FlowStep.CONFIRM && <ConfirmStep data={extractedData} onNext={handleGeneration} onBack={() => setStep(FlowStep.INPUT)} />}
        {step === FlowStep.DONE && report && <ReportDashboard report={report} />}
        
        {loading && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
            <p className="font-black text-slate-800 animate-pulse tracking-widest uppercase">Processando Relatório Canônico...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- COMPONENTES AUXILIARES ---

const TriageStep: React.FC<{ onNext: (p: Profession, o: ReportObjective) => void }> = ({ onNext }) => {
  const [p, setP] = useState(Profession.PSICOLOGO);
  const [o, setO] = useState(ReportObjective.PAIS_FAMILIA);
  return (
    <div className="bg-white rounded-[2rem] shadow-xl p-12 space-y-10 animate-in fade-in slide-in-from-bottom-4">
      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Configuração de Perfil</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Profissão</label>
          <select className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold" value={p} onChange={e => setP(e.target.value as Profession)}>
            {Object.values(Profession).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Objetivo do Documento</label>
          <select className="w-full h-16 px-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-bold" value={o} onChange={e => setO(e.target.value as ReportObjective)}>
            {Object.values(ReportObjective).map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>
      <button onClick={() => onNext(p, o)} className="w-full h-16 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100">Continuar</button>
    </div>
  );
};

const InputStep: React.FC<{ onBack: () => void, onNext: (i: RawInput[]) => void }> = ({ onBack, onNext }) => {
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl p-12 space-y-8 animate-in fade-in slide-in-from-right-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">Captura de Planilhas</h2>
        <button onClick={onBack} className="font-bold text-indigo-600 underline">Voltar</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {images.map((img, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-slate-100 group">
            <img src={img} className="w-full h-full object-cover" />
            <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
        <button onClick={() => fileRef.current?.click()} className="aspect-square border-4 border-dashed rounded-xl flex flex-col items-center justify-center text-slate-300 hover:text-indigo-400 hover:border-indigo-200 hover:bg-indigo-50 transition-all">
          <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          <span className="text-[10px] font-black uppercase tracking-widest">Adicionar Print</span>
        </button>
      </div>
      <input type="file" ref={fileRef} className="hidden" accept="image/*" multiple onChange={handleFile} />
      <button disabled={images.length === 0} onClick={() => onNext(images.map(img => ({ source: 'image', content: img })))} className="w-full h-16 bg-indigo-600 disabled:bg-slate-200 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100">Processar Todas as Imagens</button>
    </div>
  );
};

const ConfirmStep: React.FC<{ data: ExtractedResult[], onBack: () => void, onNext: (c: boolean) => void }> = ({ data, onBack, onNext }) => {
  const [checked, setChecked] = useState(false);
  return (
    <div className="bg-white rounded-[2rem] shadow-xl p-12 space-y-8 animate-in fade-in slide-in-from-right-4">
      <h2 className="text-3xl font-black text-slate-900">Conferência de Dados</h2>
      <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {data.map((item, i) => (
          <div key={i} className="p-6 bg-slate-50 rounded-2xl border-2 border-slate-100">
            <h4 className="font-black text-indigo-900 mb-3 uppercase tracking-wide flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              {item.instrument}
            </h4>
            <div className="flex flex-wrap gap-2">
              {item.scores.map((s, si) => (
                <div key={si} className="bg-white px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 shadow-sm">
                  <span className="text-slate-400 uppercase mr-1">{s.label}:</span>
                  <span className="text-indigo-600">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div onClick={() => setChecked(!checked)} className="flex items-center gap-4 p-8 bg-amber-50 rounded-[2rem] cursor-pointer border-2 border-amber-100 transition-all hover:bg-amber-100/50">
        <div className={`w-10 h-10 rounded-xl border-4 flex items-center justify-center transition-all ${checked ? 'bg-amber-500 border-amber-500 shadow-lg shadow-amber-200' : 'bg-white border-amber-200'}`}>
          {checked && <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>}
        </div>
        <p className="font-black text-amber-900 text-lg leading-tight select-none">Confirmo a fidedignidade absoluta dos dados extraídos.</p>
      </div>
      <button disabled={!checked} onClick={() => onNext(true)} className="w-full h-20 bg-slate-950 disabled:bg-slate-200 text-white rounded-3xl font-black text-xl transition-all shadow-xl active:scale-95">Gerar Relatório Canônico</button>
    </div>
  );
};

const ReportDashboard: React.FC<{ report: CanonicalReport }> = ({ report }) => {
  const [activeTab, setActiveTab] = useState<'professional' | 'simple' | 'technical'>('professional');
  const [patient, setPatient] = useState<PatientInfo>({ name: '', age: '', date: new Date().toLocaleDateString('pt-BR') });
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [hoverY, setHoverY] = useState<number | null>(null);
  const [insertionTarget, setInsertionTarget] = useState<HTMLElement | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isPsychology = report.context.profession === Profession.PSICOLOGO || report.context.profession === Profession.NEUROPSICOLOGO;
  const documentTerm = isPsychology ? "LAUDO" : "RELATÓRIO";

  // Inicialização e troca de abas
  useEffect(() => {
    if (editorRef.current) {
      const content = report.versions[activeTab];
      editorRef.current.innerHTML = content.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed === trimmed.toUpperCase() && trimmed.length > 5 && !trimmed.match(/[0-9]/)) {
          return `<h2 class="section-header">${trimmed}</h2>`;
        }
        return trimmed ? `<p>${trimmed}</p>` : '';
      }).join('');
    }
  }, [activeTab, report.versions]);

  // Captura agressiva da posição do cursor antes de perder o foco
  const captureInsertionPoint = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        setSavedRange(range.cloneRange());
        // Também salvamos o elemento pai para redundância caso o range se perca
        const node = range.commonAncestorContainer;
        const target = node.nodeType === 1 ? (node as HTMLElement) : node.parentElement;
        if (target && editorRef.current.contains(target)) {
            setInsertionTarget(target.closest('p, h2') as HTMLElement || target);
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || !editorRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const relativeY = e.clientY - rect.top;
    setHoverY(relativeY);

    // Identifica o parágrafo ou título mais próximo da posição do mouse
    const element = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    if (element && editorRef.current.contains(element) && (element.tagName === 'P' || element.tagName === 'H2')) {
      setInsertionTarget(element);
    }
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editorRef.current) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const id = `img-${Date.now()}`;
        const imgHtml = `
          <div contenteditable="false" id="${id}" class="image-wrapper group relative my-16 select-none print:my-10 animate-in fade-in zoom-in-95 duration-700">
            <div class="image-box overflow-hidden rounded-[3rem] border-4 border-slate-50 shadow-2xl transition-all duration-700 hover:scale-[1.03] hover:shadow-indigo-200/50 cursor-zoom-in">
              <img src="${ev.target?.result}" class="w-full h-auto block pointer-events-none" />
            </div>
            <div class="caption-editorial">ANEXO TÉCNICO DE RESULTADOS</div>
            <button 
              onclick="this.parentElement.remove()"
              class="absolute -top-6 -right-6 w-14 h-14 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90 z-50 print:hidden"
            >
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </button>
          </div>
          <p><br></p>
        `;
        
        // ESTRATÉGIA DE INSERÇÃO INFALÍVEL:
        // Prioridade 1: Elemento alvo (hover ou clique direto no parágrafo)
        // Prioridade 2: Range salvo do cursor (seleção de texto)
        // Prioridade 3: Fallback para o INÍCIO do documento (jamais o final se o usuário marcou o início)

        const sel = window.getSelection();
        
        if (insertionTarget && editorRef.current.contains(insertionTarget)) {
          // Insere EXATAMENTE após o elemento onde o mouse estava ou o usuário clicou
          insertionTarget.insertAdjacentHTML('afterend', imgHtml);
        } else if (savedRange && editorRef.current.contains(savedRange.commonAncestorContainer)) {
          // Insere na posição exata do cursor
          const frag = savedRange.createContextualFragment(imgHtml);
          savedRange.insertNode(frag);
          savedRange.collapse(false);
        } else {
          // Se tudo falhar, coloca no TOPO (após o header) para ser visível
          editorRef.current.insertAdjacentHTML('afterbegin', imgHtml);
        }
        
        // Limpeza de estados de contexto para a próxima inserção
        setSavedRange(null);
        setInsertionTarget(null);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = ''; 
  };

  return (
    <div className="flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700">
      
      {/* Controles do Editor */}
      <div className="bg-white rounded-[2rem] shadow-lg p-6 mb-8 flex flex-col md:flex-row justify-between items-center gap-6 print:hidden border border-slate-100 sticky top-24 z-50">
        <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200 w-full md:w-auto">
          {(['professional', 'simple', 'technical'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab === 'professional' ? 'Profissional' : tab === 'simple' ? 'Pais' : 'Técnica'}
            </button>
          ))}
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <button 
            onClick={() => { captureInsertionPoint(); fileInputRef.current?.click(); }} 
            className="flex-1 bg-white border-2 border-indigo-100 text-indigo-600 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-indigo-50 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Inserir Gráfico
          </button>
          <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black active:scale-95 transition-all">Imprimir / PDF</button>
        </div>
      </div>

      {/* Papel do Relatório Editorial */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHoverY(null); }}
        className="relative bg-white rounded-[4rem] shadow-[0_50px_100px_rgba(15,23,42,0.08)] p-12 md:p-32 min-h-[1600px] border border-slate-50 print:p-0 print:shadow-none print:border-none print:rounded-none"
      >
        
        {/* Bloco de Identificação */}
        <div className="mb-24 pb-20 border-b-2 border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-16">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Avaliado</label>
            <input type="text" className="w-full bg-transparent border-none p-0 text-3xl font-black text-slate-900 focus:ring-0 tracking-tight" value={patient.name} onChange={e => setPatient({...patient, name: e.target.value})} placeholder="Nome" />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Idade / Fase</label>
            <input type="text" className="w-full bg-transparent border-none p-0 text-3xl font-black text-slate-900 focus:ring-0 tracking-tight" value={patient.age} onChange={e => setPatient({...patient, age: e.target.value})} placeholder="Idade" />
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.6em]">Emissão</label>
            <input type="text" className="w-full bg-transparent border-none p-0 text-3xl font-black text-slate-900 focus:ring-0 tracking-tight" value={patient.date} onChange={e => setPatient({...patient, date: e.target.value})} />
          </div>
        </div>

        {/* Corpo do Texto */}
        <div 
          ref={editorRef}
          contentEditable
          onBlur={captureInsertionPoint}
          onMouseUp={captureInsertionPoint}
          onKeyUp={captureInsertionPoint}
          suppressContentEditableWarning
          className="editor-canvas outline-none font-serif text-2xl md:text-3xl leading-[2.6] text-slate-800 text-justify selection:bg-indigo-100"
        />

        {/* Botão de Inserção Contextual (Floating UX) */}
        {hoverY !== null && hoverY > 400 && (
          <div 
            className="absolute left-0 right-0 flex items-center justify-center group pointer-events-none print:hidden transition-all duration-300"
            style={{ top: hoverY, transform: 'translateY(-50%)' }}
          >
             <div className="w-full h-[2px] bg-indigo-100/40 mx-32 group-hover:bg-indigo-300 transition-colors"></div>
             <button 
              onClick={() => { captureInsertionPoint(); fileInputRef.current?.click(); }}
              className="pointer-events-auto flex items-center gap-4 px-12 py-5 bg-white border-2 border-indigo-200 rounded-full shadow-[0_30px_70px_rgba(79,70,229,0.2)] text-indigo-600 font-black text-[10px] uppercase tracking-[0.4em] transition-all hover:scale-105 active:scale-95 whitespace-nowrap animate-in fade-in zoom-in-95"
             >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                Anexar Gráfico Exatamente Aqui
             </button>
             <div className="w-full h-[2px] bg-indigo-100/40 mx-32 group-hover:bg-indigo-300 transition-colors"></div>
          </div>
        )}

        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAddImage} />

        {/* Rodapé de Assinatura */}
        <div className="hidden print:block mt-60 border-t-2 border-slate-900 pt-20 text-center">
          <p className="font-black text-slate-950 uppercase tracking-[0.5em] text-sm">Assinatura do Profissional Responsável</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-3">{report.context.profession}</p>
          <p className="text-[8px] text-slate-300 mt-20 uppercase tracking-widest italic">{documentTerm} CANÔNICO GERADO VIA SISTEMA PSICOASSISTENTE PRO</p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;700;900&family=Inter:wght@400;900&display=swap');
        
        .editor-canvas { font-family: 'Crimson Pro', serif; }
        .editor-canvas p { margin-bottom: 3.5rem; clear: both; }

        .section-header {
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          gap: 2rem;
          font-size: 1.35rem;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 0.5em;
          margin-top: 8rem;
          margin-bottom: 4rem;
          text-transform: uppercase;
          clear: both;
          width: 100%;
        }

        .section-header::before {
          content: "";
          display: block;
          width: 10px;
          height: 2.5rem;
          background: #4f46e5;
          border-radius: 99px;
          box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4);
        }

        .image-wrapper { 
          display: block; 
          width: 100%; 
          margin: 6rem 0;
          clear: both;
          page-break-inside: avoid;
        }
        
        .caption-editorial {
          text-align: center;
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 900;
          color: #94a3b8;
          letter-spacing: 0.7em;
          margin-top: 2.5rem;
          text-transform: uppercase;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }

        @media print {
          body { background: white !important; }
          .editor-canvas { font-size: 13pt !important; line-height: 1.8 !important; }
          .section-header { margin-top: 4rem; margin-bottom: 2rem; font-size: 12pt !important; color: black !important; }
          .section-header::before { background: black !important; box-shadow: none !important; width: 4pt !important; height: 18pt !important; }
          .image-wrapper { margin: 4rem 0 !important; }
          .image-box { border: 1pt solid #eee !important; box-shadow: none !important; border-radius: 1.5rem !important; }
          .caption-editorial { color: #555 !important; font-size: 9pt !important; margin-top: 1rem !important; }
        }
      `}</style>
    </div>
  );
};

export default App;
