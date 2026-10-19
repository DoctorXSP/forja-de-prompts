// Importa o React e o hook useState para gerir os dados inseridos e o estado da interface[cite: 14]
import React, { useState } from 'react';

// Importa os ícones da biblioteca lucide-react para ilustrar os botões e títulos[cite: 14]
import { Upload, HelpCircle, ArrowLeft } from 'lucide-react';

// Importa a folha de estilos dedicada a este ecrã[cite: 14]
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
 * Props recebidas[cite: 14]:
 * @param {Object} projeto - Dados do projeto atual (usado para obter o ID do projeto).
 * @param {Function} aoVoltar - Callback para cancelar a ação e regressar ao painel.
 * @param {Function} aoImportarSucesso - Callback para avisar o componente pai que deve recarregar a lista.
 */
export default function TelaImportacaoJson({ projeto, aoVoltar, aoImportarSucesso }) {
  
  // =====================================================================================
  // ESTADOS DO COMPONENTE
  // =====================================================================================
  // Armazena a string bruta colada pelo utilizador na área de texto[cite: 14]
  const [conteudoJson, definirConteudoJson] = useState('');
  
  // Bloqueia o botão de envio para evitar submissões duplas enquanto a API responde[cite: 14]
  const [importando, definirImportando] = useState(false);
  
  // Alterna a visibilidade do bloco de ajuda que contém o modelo JSON[cite: 14]
  const [mostrarExemplo, definirMostrarExemplo] = useState(false);

  // =====================================================================================
  // TEMPLATE DO ESQUEMA DE DADOS (JSON SCHEMA)
  // =====================================================================================
  const exemploJsonTexto = `{
  "iaUtilizada": "ChatGPT / Claude",
  "modeloLlm": "gpt-4",
  "listaMemorias": [
    {
      "titulo": "Criação de Rota",
      "categoriaMemoria": "ROTEIRO_TEXTO",
      "promptUsado": "Crie a rota POST /login...",
      "resultadoGerado": "app.post('/login', ...)",
      "conteudo": "Resumo...",
      "etiquetas": "auth"
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
    e.preventDefault(); // Evita o recarregamento natural da página[cite: 14]
    
    // Valida se a caixa não está vazia[cite: 14]
    if (!conteudoJson.trim()) return; 
    
    definirImportando(true); // Ativa o estado de carregamento[cite: 14]

    try {
      // 1. Converte a string num Objeto JavaScript nativo[cite: 14]
      const objetoJson = JSON.parse(conteudoJson);
      
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
        definirConteudoJson(''); // Limpa a caixa de texto[cite: 14]
        
        // Avisa o Painel Principal para recarregar as memórias
        if (aoImportarSucesso) aoImportarSucesso(); 
        
        aoVoltar(); // Fecha o ecrã[cite: 14]
      } else {
        alert(resultado.mensagem || 'Erro ao importar JSON no servidor.');
      }
      
    } catch (err) {
      // Se o JSON.parse falhar, dispara o SyntaxError. Se for o fetch, dispara erro genérico.[cite: 14]
      if (err instanceof SyntaxError) {
        alert('Erro: O texto inserido não é um JSON válido. Verifique as aspas e vírgulas.');
      } else {
        alert('Erro de ligação ao tentar conectar com a API.');
      }
    } finally {
      // Liberta o botão independentemente de dar erro ou sucesso[cite: 14]
      definirImportando(false);
    }
  }

  // =====================================================================================
  // RENDERIZAÇÃO DA INTERFACE (JSX)
  // =====================================================================================
  return (
    <div className="painel-workspace">
      
      {/* BARRA SUPERIOR DE NAVEGAÇÃO[cite: 14] */}
      <header className="barra-topo-workspace">
        <div className="linha-navegacao-topo">
          <button className="botao-voltar-projetos" onClick={aoVoltar}>
            <ArrowLeft size={18} />
            <span>Voltar ao Painel Principal</span>
          </button>
        </div>
      </header>

      {/* ÁREA CENTRAL PRINCIPAL[cite: 14] */}
      <main className="corpo-workspace-container" style={{ maxWidth: '900px' }}>
        <div className="painel-coluna-card p-4">
          
          {/* CABEÇALHO DO PAINEL COM TÍTULO E BOTÃO DE AJUDA[cite: 14] */}
          <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-4">
            <h4 className="fw-bold text-info d-flex align-items-center gap-2 mb-0">
              <Upload size={22} /> Importar Prompts e Memórias via JSON
            </h4>
            
            <button 
              type="button" 
              className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1" 
              onClick={() => definirMostrarExemplo(!mostrarExemplo)}
            >
              <HelpCircle size={16} /> {mostrarExemplo ? 'Ocultar Exemplo' : 'Ver Exemplo de JSON'}
            </button>
          </div>

          {/* RENDERIZAÇÃO CONDICIONAL: BLOCO DE EXEMPLO / GABARITO[cite: 14] */}
          {mostrarExemplo && (
            <div className="mb-4 p-3 rounded bg-black border border-secondary">
              <h6 className="fw-bold text-warning mb-2">Estrutura JSON Válida:</h6>
              <p className="small text-muted mb-2">
                Pode copiar este modelo e pedir à IA para formatar o histórico da conversa exatamente assim:
              </p>
              
              <pre className="p-3 bg-dark rounded text-info small font-monospace mb-2" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {exemploJsonTexto}
              </pre>
              
              <button 
                type="button" 
                className="btn btn-sm btn-outline-info" 
                onClick={() => navigator.clipboard.writeText(exemploJsonTexto)}
              >
                Copiar Exemplo
              </button>
            </div>
          )}

          {/* FORMULÁRIO DE IMPORTAÇÃO (Agora ligado ao lidarComSubmissao)[cite: 14] */}
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

            {/* BARRA DE BOTÕES INFERIOR[cite: 14] */}
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