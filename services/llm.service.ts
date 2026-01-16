
import { GoogleGenAI, GenerateContentParameters, GenerateContentResponse } from "@google/genai";

/**
 * Interface de baixo nível para comunicação com o motor GenAI.
 * Garante que a instância do SDK seja criada no momento da chamada para capturar o contexto de ambiente atual.
 */
export async function callGemini(params: GenerateContentParameters): Promise<GenerateContentResponse> {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY não configurada no ambiente.");
  }

  // Instanciação 'on-the-fly' para garantir o uso da chave atualizada do contexto
  const ai = new GoogleGenAI({ apiKey });

  try {
    // Definimos o modelo padrão caso não seja enviado nos params
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      ...params
    });
    
    if (!response) {
      throw new Error("O motor de IA retornou uma resposta nula.");
    }

    return response;
  } catch (error: any) {
    // Log detalhado para depuração no console do desenvolvedor
    console.error("DEBUG [GenAI Error]:", error);
    
    // Tratamento específico de erros comuns
    if (error.message?.includes("404") || error.message?.includes("not found")) {
      throw new Error("Modelo de IA não disponível ou caminho da API incorreto.");
    }
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
    }
    
    throw new Error(`Falha técnica no motor de inteligência: ${error.message || 'Erro desconhecido'}`);
  }
}
