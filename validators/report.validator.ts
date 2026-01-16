
import { ETHICAL_POLICIES } from '../policies/ethical.policies';
import { ExtractedResult } from '../entities/types';

/**
 * Validates that extracted evaluation data meets minimum professional requirements.
 */
export const validateExtractedData = (
  data: ReadonlyArray<ExtractedResult>
): boolean => {
  if (!data || data.length === 0) return false;

  return data.every(item =>
    typeof item.instrument === 'string' &&
    item.instrument.trim().length > 0 &&
    Array.isArray(item.scores) &&
    item.scores.length > 0 &&
    item.scores.every(s =>
      typeof s.label === 'string' &&
      s.label.trim().length > 0 &&
      (typeof s.value === 'string' || typeof s.value === 'number')
    )
  );
};

/**
 * Checks generated text against ethical guidelines to prevent definitive diagnostics.
 */
export const validateCanonicalReportText = (
  text: string
): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  const lower = text.toLowerCase();

  ETHICAL_POLICIES.forbiddenTerms.forEach(term => {
    if (lower.includes(term.toLowerCase())) {
      issues.push(`Termo proibido detectado: ${term}`);
    }
  });

  const diagnosticPatterns = [
    /diagn[oó]stico/i,
    /conclui-se que/i,
    /o paciente tem/i,
    /portador de/i,
    /sofre de/i
  ];

  diagnosticPatterns.forEach(p => {
    if (p.test(lower)) {
      issues.push('Linguagem diagnóstica detectada.');
    }
  });

  return {
    isValid: issues.length === 0,
    issues
  };
};
