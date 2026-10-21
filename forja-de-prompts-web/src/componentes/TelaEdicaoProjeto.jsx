// Importação da biblioteca central do React e do hook useState para gerir os dados na interface
import React, { useState } from 'react';

// Importação de ícones vetorizados para melhorar a experiência visual do utilizador
import { ArrowLeft, Save, Upload, Image as ImageIcon, Flame } from 'lucide-react';

// Importação da folha de estilos partilhada para manter a coerência visual
import '../estilos/TelaEdicaoProjeto.css';

// =====================================================================================
// IMPORTAÇÃO DA VARIÁVEL GLOBAL DE CONFIGURAÇÃO DE REDE
// =====================================================================================
// Importa o endereço centralizado do backend. Se a API mudar de servidor, 
// basta alterar o ficheiro config.js e esta página herdará automaticamente a nova URL.
import { CONFIG_REDE } from './config';

/**
 * COMPONENTE: TelaEdicaoProjeto
 * -------------------------------------------------------------------------------------
 * Responsável por exibir o formulário preenchido com os dados de um projeto existente
 * e processar a sua atualização através do método HTTP PUT.
 * Suporta atualização mista de dados de texto e ficheiros binários (imagens) via FormData.
 * 
 * Props recebidas:
 * @param {Object} projeto - Dados do projeto a ser editado (injetados a partir da listagem).
 * @param {Function} aoSalvar - Callback para atualizar a lista na interface principal após sucesso.
 * @param {Function} aoVoltar - Callback para regressar ao painel anterior sem guardar.
 */
export default function TelaEdicaoProjeto({ projeto, aoSalvar, aoVoltar }) {
  
  // =====================================================================================
  // ESTADOS DO FORMULÁRIO (PREENCHIMENTO INICIAL COM DADOS EXISTENTES)
  // =====================================================================================
  // Como estamos no modo de edição, os inputs utilizam os dados do objeto 'projeto'.
  // O fallback '||' garante que não ocorrem erros no React caso algum campo venha a null da base de dados.
  const [titulo, definirTitulo] = useState(projeto.titulo || '');
  const [tipoProjeto, definirTipoProjeto] = useState(projeto.tipo_projeto || 'DESENVOLVIMENTO');
  const [objetivo, definirObjetivo] = useState(projeto.objetivo || '');
  const [publicoAlvo, definirPublicoAlvo] = useState(projeto.publico_alvo || '');
  const [persona, definirPersona] = useState(projeto.persona || '');
  const [resultadoEsperado, definirResultadoEsperado] = useState(projeto.resultado_esperado || '');
  const [urlRepositorio, definirUrlRepositorio] = useState(projeto.url_repositorio || '');
  const [caminhoPastaLocal, definirCaminhoPastaLocal] = useState(projeto.caminho_pasta_local || '');
  
  // O operador '??' (Nullish Coalescing) é usado aqui em vez de '||' porque 0 (inativo) é um valor válido.
  const [diasParaArquivar, definirDiasParaArquivar] = useState(projeto.dias_para_arquivar ?? 30);
  const [projetoAtivo, definirProjetoAtivo] = useState(projeto.projeto_ativo ?? 1);
  
  // =====================================================================================
  // ESTADOS PARA MANIPULAÇÃO DO FICHEIRO DE IMAGEM (LOGÓTIPO)
  // =====================================================================================
  // Guarda um novo ficheiro caso o utilizador decida substituir o logótipo atual
  const [arquivoLogo, definirArquivoLogo] = useState(null);
  
  // Define a pré-visualização. Se o projeto já tiver imagem, constrói a URL completa usando a variável global.
  // Caso contrário, inicia como null para exibir o ícone padrão (placeholder).
  const [previaLogo, definirPreviaLogo] = useState(
    projeto.logo_url ? `${CONFIG_REDE.URL_BACKEND}${projeto.logo_url}` : null
  );
  
  // Controla o estado de submissão para bloquear duplo clique
  const [carregando, definirCarregando] = useState(false);

  /**
   * FUNÇÃO: lidarComSelecaoArquivo
   * -------------------------------------------------------------------------------------
   * Intercepta a seleção de uma nova imagem, armazena-a no estado para envio posterior
   * e gera uma URL local temporária para exibir o preview visual instantâneo ao utilizador.
   */
  function lidarComSelecaoArquivo(e) {
    const arquivo = e.target.files[0];
    if (arquivo) {
      definirArquivoLogo(arquivo);
      definirPreviaLogo(URL.createObjectURL(arquivo));
    }
  }

  /**
   * FUNÇÃO: handleSubmit (Atualização / PUT)
   * -------------------------------------------------------------------------------------
   * Recolhe os dados do formulário e cria um FormData. É o formato necessário para
   * enviar texto e ficheiros (multipart/form-data) na mesma requisição.
   */
  async function handleSubmit(e) {
    e.preventDefault(); // Impede que o browser recarregue a página
    definirCarregando(true);

    const formData = new FormData();
    // Adiciona os campos de texto à estrutura FormData
    formData.append('usuarioId', projeto.usuario_id);
    formData.append('titulo', titulo);
    formData.append('tipoProjeto', tipoProjeto);
    formData.append('objetivo', objetivo);
    formData.append('publicoAlvo', publicoAlvo);
    formData.append('persona', persona);
    formData.append('resultadoEsperado', resultadoEsperado);
    formData.append('urlRepositorio', urlRepositorio);
    formData.append('caminhoPastaLocal', caminhoPastaLocal);
    formData.append('diasParaArquivar', diasParaArquivar);
    formData.append('projetoAtivo', projetoAtivo);
    
    // Mantém a referência da imagem antiga na base de dados caso não seja alterada
    formData.append('logoUrl', projeto.logo_url || '');

    // Se o utilizador selecionou um NOVO ficheiro, anexa o ficheiro binário
    // O backend deverá estar preparado (ex: usando Multer no Node.js) para processar isto e atualizar a logoUrl.
    if (arquivoLogo) {
      formData.append('logo', arquivoLogo);
    }

    try {
      // Faz a requisição PUT (alteração) injetando o ID do projeto na rota, através da URL centralizada
      const res = await fetch(`${CONFIG_REDE.URL_BACKEND}/projetos/${projeto.id}`, {
        method: 'PUT',
        body: formData // O header 'Content-Type' não é definido manualmente aqui, o browser encarrega-se disso com o FormData
      });

      if (res.ok) {
        alert('Projeto atualizado com sucesso!');
        aoSalvar(); // Executa o callback para notificar o componente pai (TelaEntrada) da alteração
      } else {
        alert('Erro ao atualizar projeto na base de dados.');
      }
    } catch (err) {
      console.error('Erro de requisição PUT:', err);
      alert('Erro de ligação ao tentar guardar as alterações.');
    } finally {
      definirCarregando(false); // Restabelece o botão
    }
  }

  // =====================================================================================
  // RENDERIZAÇÃO DO COMPONENTE (JSX)
  // =====================================================================================
  return (
    <div className="tela-edicao-container">
      <div className="container py-4" style={{ maxWidth: '800px' }}>
        
        {/* BARRA SUPERIOR DE NAVEGAÇÃO DA TELA DE EDIÇÃO */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <button className="btn btn-sm btn-outline-secondary text-light d-flex align-items-center gap-1" onClick={aoVoltar}>
            <ArrowLeft size={16} /> Voltar aos Projetos
          </button>
          <h4 className="fw-bold text-warning mb-0 d-flex align-items-center gap-2">
            <Flame size={22} /> Editando Projeto: {projeto.titulo}
          </h4>
        </div>

        {/* RECIPIENTE PRINCIPAL DO FORMULÁRIO */}
        <div className="card-edicao-forja p-4">
          <form onSubmit={handleSubmit}>
            
            {/* SECÇÃO DE LOGÓTIPO COM PRÉ-VISUALIZAÇÃO */}
            <div className="mb-5 text-center">
              <label className="form-label d-block text-secondary fw-bold mb-2">Logótipo do Projeto</label>
              <div className="container-previa-logo mx-auto mb-3">
                {/* Mostra a imagem atual (ou a nova acabada de carregar) ou um ícone caso não exista */}
                {previaLogo ? (
                  <img src={previaLogo} alt="Prévia do Logo" className="imagem-previa-logo" />
                ) : (
                  <ImageIcon size={32} className="text-secondary" />
                )}
              </div>
              
              {/* O input nativo está oculto (d-none). O utilizador clica na label estilizada. */}
              <label className="btn btn-sm btn-warning cursor-pointer">
                <Upload size={14} className="me-1" /> <span style={{ margin: "0 10px" }}>Substituir Logótipo</span>
                <input type="file" accept="image/*" className="d-none mx-3" onChange={lidarComSelecaoArquivo} />
              </label> 
            </div>

            {/* GRELHA DO FORMULÁRIO */}
            <div className="row">
              <div className="col-12">
                <div className="grupo-campo-forja">
                  <label className="form-label">Título do Projeto</label>
                  <input 
                    type="text" 
                    className="form-control formulario-input-dark" 
                    value={titulo}
                    onChange={(e) => definirTitulo(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="grupo-campo-forja">
                  <label className="form-label">Tipo de Projeto</label>
                  <select 
                    className="form-select formulario-input-dark"
                    value={tipoProjeto}
                    onChange={(e) => definirTipoProjeto(e.target.value)}
                  >
                    <option value="DESENVOLVIMENTO">Desenvolvimento</option>
                    <option value="CAMPANHA">Campanha Publicitária</option>
                    <option value="COORDENACAO">Coordenação de Curso</option>
                    <option value="SALA_DE_AULA">Sala de Aula</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>
              </div>

              <div className="col-12">
                <div className="grupo-campo-forja">
                  <label className="form-label">Objetivo Geral</label>
                  <textarea 
                    className="form-control formulario-input-dark" 
                    rows="5"
                    value={objetivo}
                    onChange={(e) => definirObjetivo(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Público-Alvo</label>
                  <textarea 
                    className="form-control formulario-input-dark" 
                    rows="5"
                    value={publicoAlvo}
                    onChange={(e) => definirPublicoAlvo(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Persona da IA</label>
                  <textarea 
                    className="form-control formulario-input-dark" 
                    rows="5" 
                    value={persona}
                    onChange={(e) => definirPersona(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12">
                <div className="grupo-campo-forja">
                  <label className="form-label">Resultado Esperado</label>
                  <textarea 
                    className="form-control formulario-input-dark" 
                    rows="5"
                    value={resultadoEsperado}
                    onChange={(e) => definirResultadoEsperado(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">URL do Repositório (GitHub)</label>
                  <input 
                    type="text" 
                    className="form-control formulario-input-dark" 
                    value={urlRepositorio}
                    onChange={(e) => definirUrlRepositorio(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Caminho da Pasta Local</label>
                  <input 
                    type="text" 
                    className="form-control formulario-input-dark" 
                    value={caminhoPastaLocal}
                    onChange={(e) => definirCaminhoPastaLocal(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Dias para Arquivar</label>
                  <input 
                    type="number" 
                    className="form-control formulario-input-dark" 
                    value={diasParaArquivar}
                    onChange={(e) => definirDiasParaArquivar(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Projeto Ativo</label>
                  <select 
                    className="form-select formulario-input-dark"
                    value={projetoAtivo}
                    onChange={(e) => definirProjetoAtivo(Number(e.target.value))}
                  >
                    <option value={1}>Sim</option>
                    <option value={0}>Não</option>
                  </select>
                </div>
              </div>
            </div>

            {/* PAINEL INFERIOR DE BOTÕES */}
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary">
              <button type="button" className="btn botao-forja-vermelho" onClick={aoVoltar}>Cancelar</button>
              
              {/* O botão desativa enquanto a promessa do fetch() estiver em execução, garantindo integridade dos dados */}
              <button type="submit" className="btn botao-forja-laranja d-flex align-items-center gap-2" style={{marginLeft: '15px'}} disabled={carregando}>
                <Save size={16} /> {carregando ? 'A Guardar...' : 'Guardar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}