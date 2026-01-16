
import { extractFromText } from '../adapters/text.adapter';
import { extractFromImage } from '../adapters/image.adapter';
import { RawInput, ExtractedResult } from '../entities/types';

export class ExtractionService {
  static async process(input: RawInput): Promise<ExtractedResult[]> {
    const results = input.source === 'text' 
      ? await extractFromText(input.content)
      : await extractFromImage(input.content);
    
    // Ensure the results returned from adapters are treated as immutable arrays
    return Object.freeze(results.map(r => Object.freeze({
      ...r,
      scores: Object.freeze(r.scores.map(s => Object.freeze({...s})))
    }))) as unknown as ExtractedResult[];
  }
}
