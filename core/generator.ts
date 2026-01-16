// core/generator.ts

import { ExtractedResult, ReportContext } from './types';
import { ETHICAL_POLICIES } from '../policies/ethical.policies';

function sanitizeText(text: string): string {
  let sanitized = text;

  for (const term of ETHICAL_POLICIES.forbiddenTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    sanitized = sanitized.replace(regex, '[termo removido]');
  }

  return sanitized;
}

export function generateCanonicalText(
  context: ReportContext,
  extracted: ReadonlyArray<ExtractedResult>
): string {
  const lines: string[] = [];

  lines.push('1. Identificação do Instrumento');
  extracted.forEach(e => {
    lines.push(`- ${e.instrument}`);
  });

  lines.push('\n2. Metodologia');
  lines.push(
    'Os dados apresentados foram extraídos de registros fornecidos, sem qualquer recalculo automatizado.'
  );

  lines.push('\n3. Análise Descritiva dos Resultados');
  extracted.forEach(e => {
    e.scores.forEach(s => {
      lines.push(`- ${s.label}: ${s.value}`);
    });
    if (e.classification) {
      lines.push(`Observação qualitativa: ${e.classification}`);
    }
  });

  lines.push('\n4. Considerações Técnicas');
  lines.push(
    'Os dados acima devem ser interpretados exclusivamente pelo profissional responsável.'
  );

  return sanitizeText(lines.join('\n'));
}
