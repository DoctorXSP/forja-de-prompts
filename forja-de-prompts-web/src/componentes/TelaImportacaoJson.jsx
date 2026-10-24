// Importa o React e o hook useState para gerir os dados inseridos e o estado da interface
import React, { useState } from 'react';

// Importa os ícones da biblioteca lucide-react para ilustrar os botões e títulos
import { Upload, HelpCircle, ArrowLeft } from 'lucide-react';

// Importa a folha de estilos dedicada a este ecrã
import '../estilos/ModalImportacaoJson.css'; 

// =====================================================================================
// IMPORTAÇÃO DA VARIÁVEL GLOBAL DE CONFIGURAÇÃO DE REDE
// =====================================================================================
// Centraliza a URL da API (ex: http://localhost:3527).
import { CONFIG_REDE } from './config';

/**
 * COMPONENTE: TelaImportacaoJson
 * -------------------------------------------------------------------------------------
 * Permite importar lotes de memórias e prompts gerados por IAs externas através 
 * de um objeto JSON.
 */
export default function TelaImportacaoJson({ projeto, aoVoltar, aoImportarSucesso }) {
  
  const [conteudoJson, definirConteudoJson] = useState('');
  const [importando, definirImportando] = useState(false);
  const [mostrarExemplo, definirMostrarExemplo] = useState(false);

  const promptInstrucaoIA = `Por favor, analise as nossas últimas interações e prompts desta conversa.
Resuma os pontos principais e extraia os contextos, regras ou soluções que criamos.
Em seguida, formate essas informações ESTRITAMENTE em um objeto JSON válido, utilizando a estrutura exata abaixo.

REGRAS CRÍTICAS DE FORMATAÇÃO:
1. O MODO DE RESPOSTA DEVE SER EXCLUSIVAMENTE JSON. 
2. NÃO INCLUA NENHUM TEXTO ANTES OU DEPOIS DAS CHAVES { E }.
3. NÃO ENVOLVA O RESULTADO EM BLOCOS DE CÓDIGO MARKDOWN (proibido usar \`\`\`json).
4. Todas as chaves e valores de texto devem usar aspas duplas (""). Esculpa aspas duplas internas com barra invertida (\\").
5. Não utilize quebras de linha reais dentro das strings de valor.

Estrutura exigida:
{
  "iaUtilizada": "Nome da IA (ex: ChatGPT, Claude, Gemini)",
  "modeloLlm": "Modelo utilizado (ex: gpt-4, gemini-1.5-pro)",
  "listaMemorias": [
    {
      "titulo": "Título curto e descritivo da memória",
      "categoriaMemoria": "CONTEXTO", 
      "promptUsado": "O prompt exato ou principal que eu te enviei...",
      "resultadoGerado": "A resposta principal ou código que você gerou...",
      "conteudo": "Resumo do contexto geral da conversa...",
      "etiquetas": "tags, separadas, por, virgula"
    }
  ]
}`;

  async function lidarComSubmissao(e) {
    e.preventDefault(); 
    
    if (!conteudoJson.trim()) return; 
    
    definirImportando(true); 
    let objetoJson = null;

    // =========================================================================
    // PASSO 1: LIMPEZA E CONVERSÃO DO JSON (FRONTEND)
    // =========================================================================
    try {
      let jsonLimpo = conteudoJson;

      // DEFESA 1: Remove "Espaços Invisíveis" (NBSP) e caracteres Zero-Width que 
      // vêm nas cópias de navegadores e IAs e fazem o JSON.parse quebrar.
      jsonLimpo = jsonLimpo.replace(/[\u00A0\u200B\u200C\u200D\uFEFF]/g, ' ');

      // DEFESA 2: Isola estritamente o conteúdo que está entre as chaves principais,
      // ignorando markdowns ou textos como "Aqui está o seu JSON:"
      const primeiroIndice = jsonLimpo.indexOf('{');
      const ultimoIndice = jsonLimpo.lastIndexOf('}');
      
      if (primeiroIndice !== -1 && ultimoIndice !== -1 && ultimoIndice > primeiroIndice) {
        jsonLimpo = jsonLimpo.substring(primeiroIndice, ultimoIndice + 1);
      }

      objetoJson = JSON.parse(jsonLimpo);
    } catch (errParse) {
      definirImportando(false);
      console.error('Erro detalhado no Parse do JSON:', errParse);
      return alert('ERRO NO TEXTO (FRONTEND): O texto contém erros estruturais reais (ex: aspas faltando, vírgulas sobrando). Veja o console (F12) para detalhes.');
    }

    // =========================================================================
    // PASSO 2: ENVIO PARA A API E TRATAMENTO DA RESPOSTA (BACKEND)
    // =========================================================================
    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${projeto.id}/importar-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objetoJson)
      });
      
      // Verifica se o backend travou e devolveu uma tela de erro HTML em vez de JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const erroTexto = await res.text();
        console.error('O servidor retornou erro fatal (HTML/Texto):', erroTexto);
        definirImportando(false);
        return alert('ERRO NO SERVIDOR: O backend falhou ao processar a importação. Verifique os logs do servidor Node.');
      }

      const resultado = await res.json();

      if (res.ok) {
        alert(resultado.mensagem || 'Prompts importados com sucesso!');
        definirConteudoJson(''); 
        if (aoImportarSucesso) aoImportarSucesso(); 
        aoVoltar(); 
      } else {
        alert(resultado.mensagem || 'Erro ao importar JSON no servidor.');
      }
      
    } catch (errFetch) {
      console.error('Erro de requisição:', errFetch);
      alert('Erro de conexão com a API do servidor.');
    } finally {
      definirImportando(false);
    }
  }

  return (
    <div className="painel-workspace">
      
      <header className="barra-topo-workspace">
        <div className="linha-navegacao-topo">
          <button className="botao-voltar-projetos" onClick={aoVoltar}>
            <ArrowLeft size={18} />
            <span>Voltar ao Painel Principal</span>
          </button>
        </div>
      </header>

      <main className="corpo-workspace-container" style={{ maxWidth: '900px' }}>
        <div className="painel-coluna-card p-4">
          
          <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-4">
            <h4 className="fw-bold text-info d-flex align-items-center gap-2 mb-0">
              <Upload size={22} /> Importar Prompts e Memórias via JSON
            </h4>
            
            <button 
              type="button" 
              className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1" 
              onClick={() => definirMostrarExemplo(!mostrarExemplo)}
            >
              <HelpCircle size={16} /> {mostrarExemplo ? 'Ocultar Prompt da IA' : 'Ver Prompt para IA'}
            </button>
          </div>

          {mostrarExemplo && (
            <div className="mb-4 p-3 rounded bg-black border border-secondary">
              <h6 className="fw-bold text-warning mb-2">Prompt de Extração para IA:</h6>
              <p className="small text-muted mb-2">
                Copie o prompt abaixo e cole na sua IA externa (ChatGPT, Claude, etc). Ele instrui a IA a ler a conversa atual e gerar o JSON pronto para importação aqui.
              </p>
              
              <pre className="p-3 bg-dark rounded text-info small font-monospace mb-2" style={{ maxHeight: '250px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                {promptInstrucaoIA}
              </pre>
              
              <button 
                type="button" 
                className="btn btn-sm btn-outline-info" 
                onClick={() => navigator.clipboard.writeText(promptInstrucaoIA)}
              >
                Copiar Prompt para IA
              </button>
            </div>
          )}

          <form onSubmit={lidarComSubmissao}>
            
            <div className="grupo-campo-workspace mb-4">
              <label className="form-label">Cole abaixo o objeto JSON gerado por outra IA</label>
              
              <textarea 
                className="form-control formulario-input-json" 
                rows="12"
                placeholder="Cole o JSON aqui..."
                value={conteudoJson}
                onChange={(e) => definirConteudoJson(e.target.value)}
                required
              />
            </div>

            <div className="d-flex justify-content-end gap-3">
              <button type="button" className="btn btn-secondary btn-sm px-4" onClick={aoVoltar}>
                Cancelar
              </button>
              
              <button type="submit" className="btn botao-forja-laranja btn-sm fw-bold px-4" disabled={importando}>
                {importando ? 'A processar...' : 'Processar e Importar JSON'}
              </button>
            </div>
          </form>
          
        </div>
      </main>
    </div>
  );
}