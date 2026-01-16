// usecases/GenerateCanonicalReport.usecase.ts

// Fix: Import types from core/types to ensure compatibility with CanonicalEngine and prevent enum/interface mismatches.
import { ExtractedResult, CanonicalReport, ReportContext } from '../core/types';
import { CanonicalEngine } from '../core/engine';

export class GenerateCanonicalReportUseCase {
  static async execute(
    context: ReportContext,
    extracted: ReadonlyArray<ExtractedResult>,
    humanConfirmed: boolean,
    // Fix: Added missing sourceType parameter to satisfy CanonicalEngine.execute signature
    sourceType: 'image' | 'text'
  ): Promise<CanonicalReport> {
    return CanonicalEngine.execute(
      context,
      extracted,
      humanConfirmed,
      // Fix: Passed sourceType as the required fourth argument
      sourceType
    );
  }
}
