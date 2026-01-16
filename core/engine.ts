
import { ExtractedResult, ReportContext, CanonicalReport } from './types';
import { CoreValidator } from './validator';
import { generateCanonicalText } from '../services/report.generator';
import { ETHICAL_POLICIES } from './policies';

export class CanonicalEngine {
  static async execute(
    context: ReportContext,
    data: ReadonlyArray<ExtractedResult>,
    confirmed: boolean,
    sourceType: 'image' | 'text'
  ): Promise<CanonicalReport> {
    if (!confirmed) throw new Error("A confirmação fidedigna é obrigatória.");
    
    if (!CoreValidator.validateExtraction(data)) {
      throw new Error("Dados da planilha incompletos para processamento.");
    }

    const hasImage = sourceType === 'image';
    const versions = await generateCanonicalText(context, data, hasImage);
    
    // Auditoria ética opcional no log
    const audit = CoreValidator.checkEthics(versions.professional);
    if (!audit.isValid) {
      console.warn("Possível violação ética detectada na versão profissional:", audit.issues);
    }

    return {
      id: crypto.randomUUID(),
      context,
      extracted: data,
      versions,
      createdAt: new Date().toISOString(),
      engineVersion: ETHICAL_POLICIES.engineVersion
    };
  }
}
