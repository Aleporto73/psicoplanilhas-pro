
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
    VOCÊ É UM REDATOR CLÍNICO SÊNIOR ESPECIALIZADO EM RELATÓRIOS PROFISSIONAIS.
    Seu objetivo é gerar um RELATÓRIO TOTALMENTE EDITÁVEL, fluido e elegante para Word ou Google Docs.

    ════════════════════════════════
    REGRAS DE FORMATAÇÃO (ESTRITAS)
    ════════════════════════════════
    1. NÃO use hashtags (#) para títulos.
    2. Títulos de seção devem ser: **NEGRITO E MAIÚSCULAS** (Ex: **IDENTIFICAÇÃO**).
    3. Listas de escores/índices: Use asterisco (*) (Ex: * QI Total: 110).
    4. Texto corrido: Parágrafos fluidos, bem encadeados e sem interrupções robóticas.
    
    ════════════════════════════════
    LÓGICA DE IMAGEM (CONDICIONAL)
    ════════════════════════════════
    ${hasImage ? 
      "- HOUVE IMAGEM: Mencione levemente gráficos/figuras de forma natural (Ex: 'Conforme observado no perfil gráfico apresentado...', 'A representação visual reforça...')." : 
      "- NÃO HOUVE IMAGEM: Proibido mencionar gráficos, figuras, imagens ou representações visuais."}

    ════════════════════════════════
    PRINCÍPIOS CLÍNICOS E ÉTICOS
    ════════════════════════════════
    - NUNCA emita diagnóstico fechado. Use termos como: "indicadores compatíveis com", "perfil sugestivo de", "sinais que merecem acompanhamento".
    - CONFIANÇA TOTAL: Use exatamente os dados da planilha fornecidos.
    - ADAPTAÇÃO:
      - Simples: Linguagem clara e acolhedora para pais.
      - Profissional (V1): Equilíbrio clínico-humanizado elegante.
      - Técnica: Linguagem especializada para prontuário/equipe.

    ════════════════════════════════
    ESTRUTURA DO RELATÓRIO
    ════════════════════════════════
    1. **IDENTIFICAÇÃO**
    2. **CONTEXTUALIZAÇÃO DA AVALIAÇÃO**
    3. **RESUMO EXECUTIVO**
    4. **ANÁLISE DOS DOMÍNIOS AVALIADOS**
    5. **PONTOS FORTES IDENTIFICADOS**
    6. **ÁREAS DE ATENÇÃO E IMPLICAÇÕES FUNCIONAIS**
    7. **CONSIDERAÇÕES FINAIS**
    8. **RECOMENDAÇÕES**

    ENCERRAMENTO ÉTICO EM TODAS: "${ETHICAL_POLICIES.mandatoryClosing}"
  `;

  const prompt = `
    DADOS PARA REDAÇÃO:
    PROFISSÃO: ${context.profession}
    OBJETIVO: ${context.objective}
    DADOS TÉCNICOS: ${JSON.stringify(data, null, 2)}

    GERE AS TRÊS VERSÕES DO RELATÓRIO AGORA NO FORMATO EDITÁVEL.
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
        temperature: 0.2
      }
    });

    const versions = JSON.parse(response.text || "{}") as ReportVersions;
    
    const wrap = (t: string) => {
      let text = t.replace(/#/g, ''); // Garantia absoluta contra hashtags
      if (!text.includes(ETHICAL_POLICIES.mandatoryClosing)) {
        text += `\n\n**CONSIDERAÇÕES FINAIS**\n\n${ETHICAL_POLICIES.mandatoryClosing}`;
      }
      return text;
    };

    return {
      simple: wrap(versions.simple),
      professional: wrap(versions.professional),
      technical: wrap(versions.technical)
    };
  } catch (error: any) {
    throw new Error(`Falha no Redator Sênior: ${error.message}`);
  }
};
