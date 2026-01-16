
export const ETHICAL_POLICIES = {
  noDiagnosis: true,
  noRecalculation: true,
  mandatoryHumanReview: true,
  ethicalStandard: "CANONICAL_V1",
  engineVersion: "CANONICAL_ENGINE_V1",
  allowedTerms: ["indicadores", "sugestivo de", "compatível com", "perfil observado", "desempenho"],
  forbiddenTerms: [
    "diagnóstico", "doença", "patologia", "CID", "DSM", "transtorno de", 
    "curar", "paciente sofre de", "portador de", "confirmado", "fechado",
    "conclusão clínica", "diagnosticar"
  ],
  mandatoryClosing: "Este documento é baseado exclusivamente nos dados fornecidos pelo instrumento e não substitui avaliação clínica ou diagnóstica realizada por profissional habilitado."
} as const;
