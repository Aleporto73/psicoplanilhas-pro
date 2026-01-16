
import { callGemini } from './llm.service';
import { ExtractedResult, ReportContext, ReportVersions, Profession } from '../core/types';
import { ETHICAL_POLICIES } from '../core/policies';
import { Type } from "@google/genai";

export const generateCanonicalText = async (
  context: ReportContext,
  data: ReadonlyArray<ExtractedResult>,
  hasImage: boolean
): Promise<ReportVersions> => {
  // Regra de Ouro: Apenas Psicólogos e Neuropsicólogos podem emitir "LAUDO".
  const isPsychology = context.profession === Profession.PSICOLOGO || context.profession === Profession.NEUROPSICOLOGO;
  const documentTerm = isPsychology ? "LAUDO" : "RELATÓRIO DE AVALIAÇÃO";
  const restrictedTermInstruction = !isPsychology 
    ? `PROIBIÇÃO LEGAL: Você NÃO deve usar a palavra "LAUDO" em nenhuma parte do texto. Use exclusivamente "RELATÓRIO" ou "INFORME".` 
    : `O profissional é habilitado a emitir um "LAUDO", portanto você pode usar este termo nos títulos e corpo do texto.`;

  const systemInstruction = `
    VOCÊ É UM REDATOR CLÍNICO E EDITORIAL SÊNIOR ESPECIALIZADO EM DOCUMENTAÇÃO DE SAÚDE.
    Seu objetivo é gerar um documento de ALTA ELEGÂNCIA, pronto para impressão, sem usar símbolos de programação ou markdown.

    ════════════════════════════════
    RESTRIÇÃO LEGAL DE NOMENCLATURA
    ════════════════════════════════
    Termo obrigatório para este documento: ${documentTerm}.
    ${restrictedTermInstruction}

    ════════════════════════════════
    DIRETRIZES DE FORMATAÇÃO (ESTRITAS)
    ════════════════════════════════
    1. PROIBIDO o uso de asteriscos (*), hashtags (#), underscores (_) ou qualquer símbolo de marcação.
    2. TÍTULOS DE SEÇÃO: Devem vir apenas em MAIÚSCULAS em uma linha isolada.
    3. LISTAS: Não use marcadores. Use frases conectivas fluidas ou parágrafos distintos.
    4. ESPAÇAMENTO: Garanta que cada seção tenha parágrafos bem definidos.
    
    ════════════════════════════════
    ESTILO EDITORIAL
    ════════════════════════════════
    - Use uma linguagem fluida, elegante e humana.
    - Evite frases curtas e robóticas.
    - Conecte os resultados técnicos de forma narrativa e ética.

    ════════════════════════════════
    ESTRUTURA DO RELATÓRIO
    ════════════════════════════════
    1. ${documentTerm} - IDENTIFICAÇÃO
    2. CONTEXTUALIZAÇÃO DA AVALIAÇÃO
    3. RESUMO EXECUTIVO
    4. ANÁLISE DOS DOMÍNIOS AVALIADOS
    5. PONTOS FORTES E POTENCIALIDADES
    6. ÁREAS DE ATENÇÃO E IMPLICAÇÕES
    7. RECOMENDAÇÕES E DIRETRIZES
    8. CONSIDERAÇÕES FINAIS

    ENCERRAMENTO ÉTICO: "${ETHICAL_POLICIES.mandatoryClosing}"
  `;

  const prompt = `
    DADOS TÉCNICOS: ${JSON.stringify(data, null, 2)}
    PROFISSÃO: ${context.profession}
    OBJETIVO: ${context.objective}

    GERE AS TRÊS VERSÕES DO ${documentTerm} SEM QUALQUER MARCAÇÃO DE ASTERISCOS OU HASHTAGS.
  `;

  try {
    const response = await callGemini({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            simple: { type: Type.STRING },
            professional: { type: Type.STRING },
            technical: { type: Type.STRING }
          },
          required: ["simple", "professional", "technical"]
        },
        temperature: 0.3
      }
    });

    const versions = JSON.parse(response.text || "{}") as ReportVersions;
    
    const finalize = (t: string) => {
      // Garantia final de limpeza de markdown e aplicação da política ética
      let cleanText = t.replace(/[*#_~]/g, '').trim();
      
      // Validação de segurança redundante para o termo LAUDO
      if (!isPsychology) {
        cleanText = cleanText.replace(/\bLAUDO\b/gi, 'RELATÓRIO');
      }

      if (!cleanText.includes(ETHICAL_POLICIES.mandatoryClosing)) {
        cleanText += `\n\nCONSIDERAÇÕES FINAIS\n\n${ETHICAL_POLICIES.mandatoryClosing}`;
      }
      return cleanText;
    };

    return {
      simple: finalize(versions.simple),
      professional: finalize(versions.professional),
      technical: finalize(versions.technical)
    };
  } catch (error: any) {
    throw new Error(`Falha na geração editorial: ${error.message}`);
  }
};
