
export enum Profession {
  PSICOLOGO = 'Psicólogo',
  PSICOPEDAGOGO = 'Psicopedagogo',
  FONOAUDIOLOGO = 'Fonoaudiólogo',
  TO = 'Terapeuta Ocupacional',
  PEDAGOGO = 'Pedagogo',
  NEUROPSICOLOGO = 'Neuropsicólogo',
  OUTRO = 'Outro'
}

export enum ReportObjective {
  PAIS_FAMILIA = 'Pais / Família',
  ESCOLA = 'Escola',
  EQUIPE_MULTI = 'Equipe Multiprofissional',
  USO_INTERNO = 'Uso Clínico Interno',
  JURIDICO = 'Jurídico'
}

export enum FlowStep {
  TRIAGE = 'TRIAGE',
  INPUT = 'INPUT',
  CONFIRM = 'CONFIRM',
  DONE = 'DONE'
}

export interface RawInput {
  readonly source: 'image' | 'text';
  readonly content: string;
}

export interface ExtractedScore {
  readonly label: string;
  readonly value: string | number;
}

export interface ExtractedResult {
  readonly instrument: string;
  readonly category: 'Cognitivo' | 'TDAH' | 'TEA' | 'Aprendizagem' | 'Linguagem' | 'Emocional' | 'Outro';
  readonly scores: ReadonlyArray<ExtractedScore>;
  readonly classification?: string;
  readonly notes?: string;
}

export interface ReportContext {
  readonly profession: Profession;
  readonly objective: ReportObjective;
}

export interface ReportVersions {
  readonly simple: string;
  readonly professional: string;
  readonly technical: string;
}

export interface CanonicalReport {
  readonly id: string;
  readonly context: ReportContext;
  readonly extracted: ReadonlyArray<ExtractedResult>;
  readonly versions: ReportVersions;
  readonly createdAt: string;
  readonly engineVersion: string;
}
