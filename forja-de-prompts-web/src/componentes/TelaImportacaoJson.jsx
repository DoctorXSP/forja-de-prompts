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
 * 
 * Props recebidas:
 * @param {Object} projeto - Dados do projeto atual (usado para obter o ID do projeto).
 * @param {Function} aoVoltar - Callback para cancelar a ação e regressar ao painel.
 * @param {Function} aoImportarSucesso - Callback para avisar o componente pai que deve recarregar a lista.
 */
export default function TelaImportacaoJson({ projeto, aoVoltar, aoImportarSucesso }) {
  
  // =====================================================================================
  // ESTADOS DO COMPONENTE
  // =====================================================================================
  // Armazena a string bruta colada pelo utilizador na área de texto
  const [conteudoJson, definirConteudoJson] = useState('');
  
  // Bloqueia o botão de envio para evitar submissões duplas enquanto a API responde
  const [importando, definirImportando] = useState(false);
  
  // Alterna a visibilidade do bloco de ajuda que contém o modelo JSON
  const [mostrarExemplo, definirMostrarExemplo] = useState(false);

  // =====================================================================================
  // PROMPT DE INSTRUÇÃO PARA A IA (BLINDADO E MAIS ESPECÍFICO)
  // =====================================================================================
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

  /**
   * FUNÇÃO: lidarComSubmissao (Anteriormente handleSubmit)
   * -------------------------------------------------------------------------------------
   * Interceta a submissão do formulário, valida a sintaxe do JSON e faz a chamada à API
   * utilizando a rota global CONFIG_REDE.
   */
  async function lidarComSubmissao(e) {
    e.preventDefault(); 
    
    if (!conteudoJson.trim()) return; 
    
    definirImportando(true); 

    try {
      // DEFESA DE CÓDIGO BLINDADA (NOVA ABORDAGEM):
      // Localiza exatamente onde começa e onde termina o bloco JSON.
      // Se o usuário ou a IA copiar lixo antes ou depois (ex: "Aqui está o JSON", ou blocos markdown), 
      // o código vai simplesmente ignorar tudo e pegar apenas o miolo útil.
      let jsonLimpo = conteudoJson;
      const primeiroIndice = jsonLimpo.indexOf('{');
      const ultimoIndice = jsonLimpo.lastIndexOf('}');

      if (primeiroIndice !== -1 && ultimoIndice !== -1 && ultimoIndice > primeiroIndice) {
        // Corta e extrai estritamente o bloco entre a primeira e a última chave
        jsonLimpo = jsonLimpo.substring(primeiroIndice, ultimoIndice + 1);
      }

      // 1. Converte a string num Objeto JavaScript nativo
      const objetoJson = JSON.parse(jsonLimpo);
      
      // 2. Chamada à API utilizando a configuração global de rede
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${projeto.id}/importar-json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(objetoJson)
      });
      
      const resultado = await res.json();

      // 3. Processamento da resposta do servidor
      if (res.ok) {
        alert(resultado.mensagem || 'Prompts importados com sucesso!');
        definirConteudoJson(''); 
        
        // Avisa o Painel Principal para recarregar as memórias
        if (aoImportarSucesso) aoImportarSucesso(); 
        
        aoVoltar(); 
      } else {
        alert(resultado.mensagem || 'Erro ao importar JSON no servidor.');
      }
      
    } catch (err) {
      if (err instanceof SyntaxError) {
        alert('Erro: O texto inserido não pôde ser lido pelo sistema. A IA provavelmente gerou aspas duplas sem escapar dentro do texto ou quebras de linha inválidas.');
        console.error('Detalhes do erro JSON:', err);
      } else {
        alert('Erro de ligação ao tentar conectar com a API.');
      }
    } finally {
      definirImportando(false);
    }
  }

  // =====================================================================================
  // RENDERIZAÇÃO DA INTERFACE (JSX)
  // =====================================================================================
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