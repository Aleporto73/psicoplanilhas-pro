
export const ETHICAL_POLICIES = {
  noDiagnosis: true,
  noRecalculation: true,
  mandatoryHumanReview: true,
  engineVersion: "PSICO-CORE-3.5",
  ethicalStandard: "CANONICAL-V3.5-ELEGANCE",
  
  allowedTerms: [
    "Indicadores compatíveis com",
    "Perfil sugestivo de",
    "Sinais que merecem acompanhamento",
    "Desempenho observado",
    "Recursos preservados"
  ],
  
  forbiddenTerms: [
    "diagnóstico", "doença", "patologia", "CID", "DSM", "confirmado",
    "fechado", "conclusão clínica", "diagnosticar", "transtorno de",
    "sofre de", "portador de", "paciente tem", "cura", "curar"
  ],
  
  mandatoryClosing: "Este documento é baseado exclusivamente nos dados fornecidos pelo instrumento e não substitui avaliação clínica ou diagnóstica realizada por profissional habilitado."
} as const;
