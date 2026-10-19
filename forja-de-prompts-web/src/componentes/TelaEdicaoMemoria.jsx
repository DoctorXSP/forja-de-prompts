// Importa o React e o hook useState, essencial para gerenciar dados que mudam e atualizam a interface
import React, { useState } from 'react';

// Importação de ícones da biblioteca lucide-react para enriquecer visualmente os botões
import { ArrowLeft, Save, Trash2, AlertTriangle } from 'lucide-react';

// Importa a folha de estilos CSS para garantir que a interface siga a identidade do sistema
import '../estilos/TelaEdicaoMemoria.css';

// =====================================================================================
// IMPORTAÇÃO DA VARIÁVEL GLOBAL DE CONFIGURAÇÃO DE REDE
// =====================================================================================
// Centraliza a URL da API (ex: http://localhost:3527). Se o backend for movido para a nuvem, 
// a alteração ocorre apenas no config.js e esta tela continuará funcionando perfeitamente.
import { CONFIG_REDE } from './config';

/**
 * COMPONENTE: TelaEdicaoMemoria
 * -------------------------------------------------------------------------------------
 * Responsável por exibir e atualizar os dados de uma memória (ou prompt) já existente,
 * além de gerenciar a exclusão segura (com modal de confirmação) deste registro.
 * 
 * Props recebidas:
 * @param {Object} memoria - Objeto contendo os dados atuais da memória a ser editada.
 * @param {Object} projeto - Dados do projeto ao qual esta memória pertence.
 * @param {Function} aoVoltar - Função callback para retornar à tela anterior (listagem).
 * @param {Function} aoSalvarSucesso - Callback executado para recarregar a lista após editar.
 * @param {Function} aoExcluirSucesso - Callback executado para recarregar a lista após deletar.
 */
export default function TelaEdicaoMemoria({ memoria, projeto, aoVoltar, aoSalvarSucesso, aoExcluirSucesso }) {
  
  // =====================================================================================
  // ESTADOS DO FORMULÁRIO (PREENCHIMENTO INICIAL)
  // =====================================================================================
  // Como é uma tela de EDIÇÃO, os inputs não começam vazios. O useState usa os dados
  // do objeto 'memoria' recebido via props. O operador lógico '||' garante que, se o 
  // campo for nulo, ele inicie como uma string vazia (''), evitando erros no React.
  const [titulo, definirTitulo] = useState(memoria.titulo || '');
  const [categoriaMemoria, definirCategoriaMemoria] = useState(memoria.categoria_memoria || 'CONTEXTO');
  const [promptUsado, definirPromptUsado] = useState(memoria.prompt_usado || '');
  const [conteudo, definirConteudo] = useState(memoria.conteudo || '');
  const [resultadoGerado, definirResultadoGerado] = useState(memoria.resultado_gerado || '');
  const [etiquetas, definirEtiquetas] = useState(memoria.etiquetas || '');
  
  // =====================================================================================
  // ESTADOS DE CONTROLE DE INTERFACE
  // =====================================================================================
  // Controla o estado do botão de salvar (desabilita durante requisições para evitar duplo clique)
  const [salvando, definirSalvando] = useState(false);

  // Estados exclusivos para o fluxo de deleção: controla a visibilidade do pop-up (Modal) 
  // e o bloqueio do botão durante a requisição de exclusão
  const [mostrarModalExclusao, definirMostrarModalExclusao] = useState(false);
  const [excluindo, definirExcluindo] = useState(false);

  /**
   * FUNÇÃO: handleSubmit (Atualização / PUT)
   * -------------------------------------------------------------------------------------
   * Diferente da criação (onde enviamos arquivos via FormData), aqui estamos enviando apenas 
   * texto, então podemos usar o padrão JSON (application/json), que é mais leve.
   */
  async function handleSubmit(e) {
    e.preventDefault(); // Impede que o formulário recarregue a página no navegador
    definirSalvando(true); // Ativa o feedback visual de 'Salvando...'

    try {
      // Fazemos uma requisição PUT (padrão REST para atualizações) passando o ID na URL
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/memorias/${memoria.id}`, {
        method: 'PUT',
        headers: { 
          // Obrigatório ao enviar JSON: avisa o backend sobre o formato do corpo da requisição
          'Content-Type': 'application/json' 
        },
        // O corpo da requisição é convertido de Objeto JS para String JSON
        body: JSON.stringify({
          titulo,
          categoriaMemoria,
          promptUsado,
          conteudo,
          resultadoGerado,
          etiquetas
        })
      });

      // Aguarda e converte a resposta do backend
      const dados = await res.json();
      
      if (res.ok) { // Se o status HTTP for 200/201 (Sucesso)
        alert(dados.mensagem || 'Memória atualizada com sucesso!');
        if (aoSalvarSucesso) aoSalvarSucesso(); // Notifica o componente pai que algo mudou
        aoVoltar(); // Fecha a tela de edição
      } else {
        alert(dados.mensagem || 'Erro ao atualizar memória.');
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
      alert('Erro de conexão ao salvar memória. Verifique se o servidor está online.');
    } finally {
      definirSalvando(false); // Libera o botão de salvar independentemente de erro ou sucesso
    }
  }

  /**
   * FUNÇÃO: confirmarExclusao (Deleção / DELETE)
   * -------------------------------------------------------------------------------------
   * Envia a requisição destrutiva para o servidor. Note que métodos DELETE geralmente 
   * não precisam de 'body' ou 'headers' complexos, apenas a URL apontando para o ID.
   */
  async function confirmarExclusao() {
    definirExcluindo(true); // Feedback visual no botão do Modal
    
    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/memorias/${memoria.id}`, {
        method: 'DELETE'
      });

      const dados = await res.json();
      
      if (res.ok) {
        alert(dados.mensagem || 'Memória excluída com sucesso!');
        if (aoExcluirSucesso) aoExcluirSucesso(); // Recarrega a grade de memórias
        aoVoltar(); // Volta para a tela anterior
      } else {
        alert(dados.mensagem || 'Erro ao excluir memória.');
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
      alert('Erro de conexão ao excluir memória.');
    } finally {
      definirExcluindo(false);
      definirMostrarModalExclusao(false); // Fecha o modal após o processo
    }
  }

  // =====================================================================================
  // RENDERIZAÇÃO DO COMPONENTE (JSX)
  // =====================================================================================
  return (
    <div className="painel-workspace">
      
      {/* BARRA DE NAVEGAÇÃO SUPERIOR */}
      <header className="barra-topo-workspace">
        <div className="linha-navegacao-topo" style={{maxHeight: '80px'}}>
          <button className="botao-voltar-projetos" onClick={aoVoltar}>
            <ArrowLeft size={18} />
            <span>Voltar ao Painel</span>
          </button>
        </div>
      </header>

      {/* ÁREA CENTRAL DO FORMULÁRIO */}
      <main className="corpo-workspace-container" style={{ maxWidth: '900px' }}>
        <div className="painel-coluna-card p-4">
          
          {/* CABEÇALHO DO FORMULÁRIO */}
          <div className="border-bottom border-secondary pb-3 mb-4">
            <h4 className="fw-bold text-info d-flex align-items-center gap-2 mb-0">
              <Save size={22} /> Editar Memória / Prompt
            </h4>
          </div>

          {/* O evento onSubmit na tag form permite submeter os dados teclando "Enter" */}
          <form onSubmit={handleSubmit}>
            <div className="row">
              {/* CAMPO OBRIGATÓRIO: Título */}
              <div className="col-md-8 mb-3">
                <div className="grupo-campo-workspace">
                  <label className="form-label">Título</label>
                  <input 
                    type="text" 
                    className="form-control formulario-input-workspace"
                    value={titulo}
                    onChange={(e) => definirTitulo(e.target.value)} // 'Two-way data binding' do React
                    required
                  />
                </div>
              </div>

              {/* CAMPO DE CLASSIFICAÇÃO: Categoria */}
              <div className="col-md-4 mb-3">
                <div className="grupo-campo-workspace">
                  <label className="form-label">Categoria</label>
                  <input 
                    type="text" 
                    className="form-control formulario-input-workspace"
                    value={categoriaMemoria}
                    onChange={(e) => definirCategoriaMemoria(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* CAMPOS DE ÁREA DE TEXTO (TEXTAREA) */}
            <div className="grupo-campo-workspace mb-3">
              <label className="form-label">Prompt Usado (Opcional)</label>
              {/* font-monospace ajuda a diferenciar visualmente que este campo guarda comandos de código/IA */}
              <textarea 
                className="form-control formulario-input-workspace font-monospace" 
                rows="3"
                value={promptUsado}
                onChange={(e) => definirPromptUsado(e.target.value)}
              />
            </div>

            <div className="grupo-campo-workspace mb-3">
              <label className="form-label">Conteúdo / Contexto Detalhado</label>
              <textarea 
                className="form-control formulario-input-workspace" 
                rows="5"
                value={conteudo}
                onChange={(e) => definirConteudo(e.target.value)}
              />
            </div>

            <div className="grupo-campo-workspace mb-3">
              <label className="form-label">Solução / Resposta Gerada</label>
              <textarea 
                className="form-control formulario-input-workspace" 
                rows="5"
                value={resultadoGerado}
                onChange={(e) => definirResultadoGerado(e.target.value)}
              />
            </div>

            {/* CAMPO DE ETIQUETAS: Facilita a futura busca e filtros no sistema */}
            <div className="grupo-campo-workspace mb-4">
              <label className="form-label">Etiquetas</label>
              <input 
                type="text" 
                className="form-control formulario-input-workspace"
                value={etiquetas}
                onChange={(e) => definirEtiquetas(e.target.value)}
              />
            </div>

            {/* PAINEL DE BOTÕES INFERIOR */}
            <div className="rodape-botoes-edicao">
              {/* BOTÃO DE PERIGO: Em vez de excluir direto, abre o Modal de Confirmação definindo o estado como true */}
              <button 
                type="button" 
                className="btn-forja-padrao btn-forja-vermelho"
                onClick={() => definirMostrarModalExclusao(true)}
              >
                <Trash2 size={16} /> Excluir Memória
              </button>

              {/* BOTÃO NEUTRO: Cancela a edição e volta sem salvar */}
              <button 
                type="button" 
                className="btn-forja-padrao btn-forja-cinza" 
                onClick={aoVoltar}
              >
                Cancelar
              </button>

              {/* BOTÃO DE AÇÃO PRINCIPAL: Submete o form. Fica inativo durante o carregamento */}
              <button 
                type="submit" 
                className="btn-forja-padrao btn-forja-laranja-custom" 
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* =====================================================================================
          RENDERIZAÇÃO CONDICIONAL: MODAL DE EXCLUSÃO
          =====================================================================================
          O operador '&&' no React garante que a div do Modal só seja inserida no HTML
          (DOM) se o estado 'mostrarModalExclusao' for verdadeiro. */}
      {mostrarModalExclusao && (
        <div style={{
          /* Estilização inline para o overlay (fundo escuro borrado) cobrir a tela inteira (fixed) */
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(5, 8, 15, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050
        }}>
          {/* Caixa de Diálogo Centralizada */}
          <div className="painel-coluna-card p-4" style={{ maxWidth: '450px', width: '100%', border: '1px solid #ef4444' }}>
            <div className="d-flex align-items-center gap-3 mb-3 text-danger">
              <AlertTriangle size={32} />
              <h5 className="fw-bold mb-0 text-light">Confirmar Exclusão</h5>
            </div>
            <p className="text-muted small mb-4">
              Tem certeza de que deseja excluir permanentemente esta memória? Esta ação não poderá ser desfeita.
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm px-3" 
                onClick={() => definirMostrarModalExclusao(false)} // Fecha o modal sem fazer nada
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger btn-sm px-3 fw-bold" 
                onClick={confirmarExclusao} // Aciona a requisição DELETE mapeada na função acima
                disabled={excluindo}
              >
                {excluindo ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}