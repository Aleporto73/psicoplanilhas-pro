
import { callGemini } from './llm.service';
import { ExtractedResult, ReportContext, ReportVersions } from '../core/types';
import { ETHICAL_POLICIES } from '../core/policies';
import { Type } from "@google/genai";

export const generateCanonicalText = async (
  context: ReportContext,
  data: ReadonlyArray<ExtractedResult>,
  hasImage: boolean
): Promise<ReportVersions> => {
  const systemInstruction = `
    VOCÊ É UM REDATOR CLÍNICO E EDITORIAL SÊNIOR.
    Seu objetivo é gerar um documento de ALTA ELEGÂNCIA, pronto para impressão, sem usar símbolos de programação ou markdown (como * ou #).

    ════════════════════════════════
    DIRETRIZES DE FORMATAÇÃO (ESTRITAS)
    ════════════════════════════════
    1. PROIBIDO o uso de asteriscos (*), hashtags (#), underscores (_) ou qualquer símbolo de marcação.
    2. TÍTULOS DE SEÇÃO: Devem vir apenas em MAIÚSCULAS em uma linha isolada.
    3. LISTAS: Não use marcadores. Use frases conectivas fluidas (ex: "No que tange à memória...", "Em relação à atenção...") ou parágrafos distintos.
    4. ESPAÇAMENTO: Garanta que cada seção tenha parágrafos bem definidos.
    
    ════════════════════════════════
    ESTILO EDITORIAL
    ════════════════════════════════
    - Use uma linguagem fluida, elegante e humana.
    - Evite frases curtas e robóticas.
    - Conecte os resultados técnicos de forma narrativa.

    ════════════════════════════════
    LÓGICA DE IMAGEM
    ════════════════════════════════
    ${hasImage ? 
      "Mencione levemente o perfil gráfico de forma integrada ao texto." : 
      "Não faça qualquer menção a gráficos ou elementos visuais."}

    ════════════════════════════════
    ESTRUTURA DO RELATÓRIO
    ════════════════════════════════
    1. IDENTIFICAÇÃO (Não repita os campos do formulário, apenas o título)
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

    GERE AS TRÊS VERSÕES DO RELATÓRIO SEM QUALQUER MARCAÇÃO DE ASTERISCOS OU HASHTAGS.
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
      // Remove resquícios de markdown caso o modelo alucine
      let cleanText = t.replace(/[*#_~]/g, '').trim();
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
