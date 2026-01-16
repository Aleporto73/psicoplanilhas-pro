
import { ETHICAL_POLICIES } from './policies';
import { ExtractedResult } from './types';

export class CoreValidator {
  static validateExtraction(data: ReadonlyArray<ExtractedResult>): boolean {
    if (!data || data.length === 0) return false;
    return data.every(item => 
      item.instrument.length > 0 && 
      item.scores.length > 0 &&
      item.scores.every(s => s.label.length > 0)
    );
  }

  static checkEthics(text: string): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];
    const lower = text.toLowerCase();

    ETHICAL_POLICIES.forbiddenTerms.forEach(term => {
      if (lower.includes(term.toLowerCase())) {
        issues.push(`Uso indevido do termo: ${term}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}
