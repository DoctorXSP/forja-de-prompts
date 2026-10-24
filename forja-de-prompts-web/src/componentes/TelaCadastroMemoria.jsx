// Importa o React e o hook useState, essencial para gerenciar dados que mudam e atualizam a interface
import React, { useState } from 'react';

// Importação de ícones da biblioteca lucide-react para enriquecer visualmente os botões
import { ArrowLeft, Save, PlusCircle } from 'lucide-react';

// Importa a folha de estilos CSS para garantir que a interface siga a identidade do sistema
import '../estilos/TelaCadastroMemoria.css';

import { CONFIG_REDE } from './config';

/**
 * COMPONENTE: TelaCadastroMemoria
 * -------------------------------------------------------------------------------------
 * Responsável por exibir um formulário limpo para a criação manual de uma nova memória.
 */
export default function TelaCadastroMemoria({ projeto, aoVoltar, aoSalvarSucesso }) {
  
  // =====================================================================================
  // ESTADOS DO FORMULÁRIO (INICIAM VAZIOS)
  // =====================================================================================
  const [titulo, definirTitulo] = useState('');
  const [categoriaMemoria, definirCategoriaMemoria] = useState('CONTEXTO');
  const [promptUsado, definirPromptUsado] = useState('');
  const [conteudo, definirConteudo] = useState('');
  const [resultadoGerado, definirResultadoGerado] = useState('');
  const [etiquetas, definirEtiquetas] = useState('');
  
  const [salvando, definirSalvando] = useState(false);

  /**
   * FUNÇÃO: handleSubmit (Criação / POST)
   */
  async function handleSubmit(e) {
    e.preventDefault(); 
    definirSalvando(true); 

    try {
      // Fazemos uma requisição POST passando os dados novos, incluindo o ID do projeto atrelado
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/memorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projetoId: projeto.id,
          titulo,
          categoriaMemoria,
          promptUsado,
          conteudo,
          resultadoGerado,
          etiquetas
        })
      });

      const dados = await res.json();
      
      if (res.ok) { 
        alert(dados.mensagem || 'Memória cadastrada com sucesso!');
        if (aoSalvarSucesso) aoSalvarSucesso(); 
        aoVoltar(); 
      } else {
        alert(dados.mensagem || 'Erro ao cadastrar memória.');
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
      alert('Erro de conexão ao salvar memória. Verifique se o servidor está online.');
    } finally {
      definirSalvando(false); 
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
              <PlusCircle size={22} /> Cadastrar Nova Memória Manualmente
            </h4>
          </div>

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
                    onChange={(e) => definirTitulo(e.target.value)} 
                    placeholder="Ex: Estrutura do Banco de Dados..."
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

            <div className="grupo-campo-workspace mb-3">
              <label className="form-label">Prompt Usado (Opcional)</label>
              <textarea 
                className="form-control formulario-input-workspace font-monospace" 
                rows="3"
                placeholder="Ex: Crie um componente de login..."
                value={promptUsado}
                onChange={(e) => definirPromptUsado(e.target.value)}
              />
            </div>

            <div className="grupo-campo-workspace mb-3">
              <label className="form-label">Conteúdo / Contexto Detalhado</label>
              <textarea 
                className="form-control formulario-input-workspace" 
                rows="5"
                placeholder="Insira o texto de contexto bruto..."
                value={conteudo}
                onChange={(e) => definirConteudo(e.target.value)}
              />
            </div>

            <div className="grupo-campo-workspace mb-3">
              <label className="form-label">Solução / Resposta Gerada</label>
              <textarea 
                className="form-control formulario-input-workspace" 
                rows="5"
                placeholder="Insira a resposta retornada pela IA..."
                value={resultadoGerado}
                onChange={(e) => definirResultadoGerado(e.target.value)}
              />
            </div>

            <div className="grupo-campo-workspace mb-4">
              <label className="form-label">Etiquetas</label>
              <input 
                type="text" 
                className="form-control formulario-input-workspace"
                placeholder="Ex: auth, frontend, banco"
                value={etiquetas}
                onChange={(e) => definirEtiquetas(e.target.value)}
              />
            </div>

            {/* PAINEL DE BOTÕES INFERIOR */}
            <div className="rodape-botoes-edicao">
              <button 
                type="button" 
                className="btn-forja-padrao btn-forja-cinza" 
                onClick={aoVoltar}
              >
                Cancelar
              </button>

              <button 
                type="submit" 
                className="btn-forja-padrao btn-forja-laranja-custom" 
                disabled={salvando}
              >
                <Save size={16} />
                {salvando ? 'Salvando...' : 'Cadastrar Memória'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}