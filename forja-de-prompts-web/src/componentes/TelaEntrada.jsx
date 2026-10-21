import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, Flame, ArrowRight, Code, Megaphone, 
  Users, GraduationCap, Folder, LogOut, Trash2, Edit2, Image as ImageIcon 
} from 'lucide-react';
import logoHorizontal from '../assets/logo916color.png';
import TelaEdicaoProjeto from './TelaEdicaoProjeto';
import TelaCadastroProjeto from './TelaCadastroProjeto';
import '../estilos/TelaEntrada.css';

// =====================================================================================
// IMPORTAÇÃO DA VARIÁVEL GLOBAL DE CONFIGURAÇÃO DE REDE
// =====================================================================================
// Importa o objeto centralizado de rede. Modificando o arquivo config.js, 
// a URL/IP do backend mudará automaticamente em todo o projeto.
import { CONFIG_REDE } from './config'; 

/**
 * Componente Principal de Entrada (Dashboard)
 * Responsável por listar os projetos do usuário, gerenciar a navegação 
 * entre as telas de Criação e Edição, e realizar chamadas à API para buscar/excluir dados.
 * 
 * @param {Object} usuarioLogado - Objeto contendo os dados do usuário autenticado.
 * @param {Function} aoSelecionarProjeto - Callback para quando o usuário acessa um projeto.
 * @param {Function} aoFazerLogout - Callback para encerrar a sessão do usuário.
 */
export default function TelaEntrada({ usuarioLogado, aoSelecionarProjeto, aoFazerLogout }) {
  const [listaProjetos, definirListaProjetos] = useState([]);
  const [telaAtiva, definirTelaAtiva] = useState('LISTA'); // 'LISTA', 'CRIAR' ou 'EDITAR'
  const [projetoSelecionadoEdicao, definirProjetoSelecionadoEdicao] = useState(null);

  useEffect(() => {
    carregarProjetos();
  }, []);

  /**
   * Busca os projetos associados ao usuário no backend.
   * Utiliza a CONFIG_REDE para apontar dinamicamente para a API correta.
   */
  async function carregarProjetos() {
    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos?usuario_logado_id=${usuarioLogado.id}&perfil_logado=${usuarioLogado.perfil}`);
      const dados = await res.json();
      if (Array.isArray(dados)) {
        definirListaProjetos(dados);
      }
    } catch (err) {
      console.error('Erro ao carregar projetos da API:', err);
    }
  }

  /**
   * Exclui um projeto específico do banco de dados após confirmação.
   */
  async function excluirProjeto(e, idProjeto) {
    e.stopPropagation(); 
    if (!window.confirm('Tem certeza que deseja excluir este projeto permanentemente?')) return;

    try {
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${idProjeto}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        carregarProjetos();
      } else {
        alert('Erro ao excluir projeto no backend.');
      }
    } catch (err) {
      alert('Erro de conexão com a API ao tentar excluir.');
    }
  }

  function obterIconeTipo(tipo) {
    switch (tipo) {
      case 'DESENVOLVIMENTO': return <Code size={22} style={{ color: '#06b6d4' }} />;
      case 'CAMPANHA': return <Megaphone size={22} style={{ color: '#f97316' }} />;
      case 'COORDENACAO': return <Users size={22} style={{ color: '#10b981' }} />;
      case 'SALA_DE_AULA': return <GraduationCap size={22} style={{ color: '#8b5cf6' }} />;
      default: return <Folder size={22} style={{ color: '#9ca3af' }} />;
    }
  }

  // ROTEAMENTO INTERNO
  if (telaAtiva === 'CRIAR') {
    return (
      <TelaCadastroProjeto 
        usuarioLogado={usuarioLogado}
        aoSalvar={() => {
          definirTelaAtiva('LISTA');
          carregarProjetos();        
        }}
        aoVoltar={() => definirTelaAtiva('LISTA')}
      />
    );
  }

  if (telaAtiva === 'EDITAR') {
    return (
      <TelaEdicaoProjeto 
        usuarioLogado={usuarioLogado}
        projeto={projetoSelecionadoEdicao}
        aoSalvar={() => {
          definirTelaAtiva('LISTA');
          carregarProjetos();
        }}
        aoVoltar={() => definirTelaAtiva('LISTA')}
      />
    );
  }

  return (
    <div className="entrada-container d-flex flex-column">
      
      {/* NAVBAR SUPERIOR */}
      <div className="d-flex justify-content-between align-items-center mb-4 container" style={{ maxWidth: '1350px' }}>
        <div className="d-flex align-items-center">
          <img src={logoHorizontal} alt="Forja de Prompts" style={{ maxWidth: '280px' }} />
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted small">Olá, <strong className="text-light">{usuarioLogado?.nome}</strong></span>
          <button className="btn btn-sm botao-forja-vermelho d-flex align-items-center gap-1 ms-2" style={{marginLeft: '15px'}} onClick={aoFazerLogout}>
            <LogOut size={14} /> Sair
          </button>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <div className="container flex-grow-1" style={{ maxWidth: '1350px' }}>
        <div className="d-flex flex-column mb-4 cabecalho-secao-projetos">
          <h3 className="fw-bold mb-1">Seus Projetos na Forja</h3>
          
          <div className="d-flex align-items-center flex-row">
            <p className="text-muted small mb-0" style={{ display: 'inline-block' }}>
              Selecione um projeto existente ou crie um novo para gerenciar contextos e prompts clicando no botão ao lado.
            </p>
            
            <button 
              className="btn botao-forja-laranja fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
              onClick={() => { definirProjetoSelecionadoEdicao(null); definirTelaAtiva('CRIAR'); }}
              title="Criar Novo Projeto"
              style={{ width: '38px', height: '38px', minWidth: '38px', borderRadius: '50%', marginLeft: '15px', padding: '0' }}
            >
              <FolderPlus size={18} style={{ display: 'block', margin: 'auto' }} />
            </button>
          </div>
        </div>

        {/* GRADE DE PROJETOS */}
        <div className="row grade-projetos">
          {listaProjetos.map((proj) => (
            <div key={proj.id} className="col-12 mb-4" style={{marginBotton: '15px'}}>
              <div className="cartao-projeto-forja">
                
                <div className="conteudo-principal-cartao" onClick={() => aoSelecionarProjeto(proj)}>
                  <div className="moldura-logo-cartao">
                    {/* Imagem carregada via variável global de rede */}
                    {proj.logo_url ? (
                      <img src={`${CONFIG_REDE.URL_BACKEND}${proj.logo_url}`} alt="Logo" className="imagem-logo-cartao" />
                    ) : (
                      <ImageIcon size={48} className="text-secondary" />
                    )}
                  </div>

                  <div className="info-cabecalho-cartao">
                    <div className="linha-titulo-cartao">
                      <Flame size={30} strokeWidth={3} className="icone-flame-vermelho" />
                      <h2 className="titulo-principal-cartao">{proj.titulo}</h2>
                      <div className="bloco-tipo-cartao">
                        {obterIconeTipo(proj.tipo_projeto)}
                        <span className="texto-tipo-cartao">{proj.tipo_projeto}</span>
                      </div>
                    </div>
                    <p className="descricao-objetivo-cartao">
                      {proj.objetivo || 'Nenhum objetivo geral definido para este projeto.'}
                    </p>
                  </div>
                </div>

                <div className="rodape-cartao-projeto">
                  <button 
                    className="btn btn-sm botao-acao-acessar d-flex align-items-center gap-1"
                    onClick={() => aoSelecionarProjeto(proj)}
                  >
                    <span>Acessar Projeto</span> <ArrowRight size={14} />
                  </button>

                  <div className="d-flex align-items-center">
                    <button 
                      className="btn btn-sm botao-acao-editar d-flex align-items-center gap-1" 
                      onClick={(e) => {
                        e.stopPropagation(); 
                        definirProjetoSelecionadoEdicao(proj);
                        definirTelaAtiva('EDITAR');
                      }}
                      title="Editar Projeto"
                    >
                      <Edit2 size={14} /> <span>Editar</span>
                    </button>
                    <button 
                      className="btn btn-sm botao-acao-excluir d-flex align-items-center gap-1" 
                      onClick={(e) => excluirProjeto(e, proj.id)}
                      title="Excluir Projeto"
                    >
                      <Trash2 size={14} /> <span>Excluir</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}

          {listaProjetos.length === 0 && (
            <div className="col-12 text-center py-5">
              <p className="text-muted">Nenhum projeto cadastrado ainda. Clique no ícone de mais (+) ao lado para criar um novo projeto!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}