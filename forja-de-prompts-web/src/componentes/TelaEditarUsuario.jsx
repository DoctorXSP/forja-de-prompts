// Importa o React e os hooks essenciais:
// - useState: para gerir os estados do formulário, busca e controle de interface.
// - useEffect: para carregar os usuários ao abrir a tela e detectar cliques fora do menu.
// - useRef: para referenciar diretamente o container de busca e o input de arquivo no DOM.
// - useMemo: para otimizar a filtragem de usuários e o cálculo de autocompletar sem lentidão.
import React, { useState, useEffect, useRef, useMemo } from 'react';

// Importa os ícones vetoriais da biblioteca 'lucide-react' usados nos botões, busca e navegação
import {
  ArrowLeft,
  UserCog,
  Save,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  X
} from 'lucide-react';

// Importa a configuração centralizada de rede para comunicação com o backend
import { CONFIG_REDE } from './config';

// Importa a folha de estilos compartilhada com a tela de cadastro/edição de usuários
import '../estilos/TelaCadastroUsuario.css';

/**
 * FUNÇÃO / COMPONENTE PRINCIPAL: TelaEditarUsuario
 * -------------------------------------------------------------------------------------
 * O QUE FAZ:
 * Renderiza a interface de edição de dados cadastrais e foto de perfil.
 * - Se o usuário logado tiver perfil 'admin', exibe um painel superior de gerenciamento
 *   que permite pesquisar (com autocompletar estilo texto fantasma), filtrar em menu
 *   suspenso e navegar pelas setas entre todos os usuários cadastrados no banco.
 * - Se não for 'admin', carrega exclusivamente os dados do próprio usuário logado e
 *   bloqueia a alteração do nível de perfil de acesso.
 */
export default function TelaEditarUsuario({
  usuarioLogado,
  aoVoltar,
  aoAtualizarUsuarioLogado
}) {
  // Verifica se o usuário logado possui privilégios de Administrador
  const ehAdmin = usuarioLogado?.perfil === 'admin';

  // Estados para armazenar a lista de usuários carregados e a posição atual na navegação
  const [listaUsuarios, definirListaUsuarios] = useState([]);
  const [indiceAtual, definirIndiceAtual] = useState(0);

  // Estados e referências para o controle da barra de pesquisa e do menu suspenso (dropdown)
  const [termoBusca, definirTermoBusca] = useState('');
  const [menuAberto, definirMenuAberto] = useState(false);
  const refContainerBusca = useRef(null);
  const refInputArquivo = useRef(null);

  // Estados dos campos do formulário do usuário selecionado para edição
  const [idSelecionado, definirIdSelecionado] = useState('');
  const [nome, definirNome] = useState('');
  const [login, definirLogin] = useState('');
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [confirmarSenha, definirConfirmarSenha] = useState('');
  const [perfil, definirPerfil] = useState('operador');

  // Estados para o arquivo físico da nova foto de perfil e sua pré-visualização na tela
  const [fotoPerfil, definirFotoPerfil] = useState(null);
  const [previewFoto, definirPreviewFoto] = useState(null);

  // Estados de controle de carregamento inicial, salvamento e feedback visual
  const [carregandoDados, definirCarregandoDados] = useState(true);
  const [salvando, definirSalvando] = useState(false);
  const [mensagemSucesso, definirMensagemSucesso] = useState('');

  /**
   * FUNÇÃO: montarUrlFotoBanco
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Recebe o caminho relativo da foto salvo no banco de dados (ex: "/uploads/foto.jpg")
   * e constrói a URL completa apontando para o backend (`CONFIG_REDE.URL_BACKEND`).
   * Adiciona o parâmetro `?t=${Date.now()}` ao final da URL (cache-busting) para forçar
   * o navegador a recarregar a imagem atualizada imediatamente após uma edição.
   */
  const montarUrlFotoBanco = (caminhoRelativo) => {
    if (!caminhoRelativo) return null;
    if (caminhoRelativo.startsWith('http://') || caminhoRelativo.startsWith('https://')) {
      return `${caminhoRelativo}?t=${Date.now()}`;
    }
    const caminhoFormatado = caminhoRelativo.startsWith('/') ? caminhoRelativo : `/${caminhoRelativo}`;
    return `${CONFIG_REDE.URL_BACKEND}${caminhoFormatado}?t=${Date.now()}`;
  };

  /**
   * FUNÇÃO: preencherFormularioComUsuario
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Recebe um objeto `usuario` e preenche todos os campos do formulário com seus dados.
   * Também limpa os campos de nova senha, reseta o input de arquivo físico (`refInputArquivo`),
   * gera a URL de pré-visualização da foto atual do banco e, opcionalmente, atualiza o
   * texto exibido na barra de busca superior com o nome desse usuário.
   */
  const preencherFormularioComUsuario = (usuario, atualizarTextoBusca = true) => {
    if (!usuario) return;

    definirIdSelecionado(usuario.id);
    definirNome(usuario.nome || '');
    definirLogin(usuario.login || '');
    definirEmail(usuario.email || '');
    definirPerfil(usuario.perfil || 'operador');
    definirSenha('');
    definirConfirmarSenha('');
    definirFotoPerfil(null);

    if (refInputArquivo.current) {
      refInputArquivo.current.value = '';
    }

    definirPreviewFoto(montarUrlFotoBanco(usuario.foto_perfil));

    if (atualizarTextoBusca) {
      definirTermoBusca(usuario.nome || '');
    }
  };

  // ===================================================================================
  // EFEITO 1: Carregamento inicial dos dados de usuários ao montar o componente
  // ===================================================================================
  useEffect(() => {
    /**
     * FUNÇÃO INTERNA: carregarUsuarios
     * O QUE FAZ:
     * Busca os dados no backend de acordo com o nível de permissão:
     * - Se for Admin (`ehAdmin`), requisita `GET /usuarios` para trazer todos os registros
     *   e posiciona inicialmente no registro do próprio administrador logado.
     * - Se não for Admin, requisita `GET /usuarios/:id` para carregar apenas os dados do
     *   próprio usuário logado. Em caso de falha de rede, utiliza os dados em memória de
     *   `usuarioLogado` como contingência (fallback).
     */
    const carregarUsuarios = async () => {
      definirCarregandoDados(true);
      try {
        if (ehAdmin) {
          const resposta = await fetch(`${CONFIG_REDE.URL_BACKEND}/usuarios`);
          if (resposta.ok) {
            const dados = await resposta.json();
            definirListaUsuarios(dados);

            const indiceInicial = dados.findIndex((u) => Number(u.id) === Number(usuarioLogado?.id));
            const idx = indiceInicial >= 0 ? indiceInicial : 0;
            definirIndiceAtual(idx);
            if (dados[idx]) {
              preencherFormularioComUsuario(dados[idx], true);
            }
          }
        } else if (usuarioLogado?.id) {
          const resposta = await fetch(`${CONFIG_REDE.URL_BACKEND}/usuarios/${usuarioLogado.id}`);
          if (resposta.ok) {
            const meuUsuario = await resposta.json();
            definirListaUsuarios([meuUsuario]);
            definirIndiceAtual(0);
            preencherFormularioComUsuario(meuUsuario, true);
          } else {
            definirListaUsuarios([usuarioLogado]);
            definirIndiceAtual(0);
            preencherFormularioComUsuario(usuarioLogado, true);
          }
        }
      } catch (erro) {
        console.error('Erro ao carregar dados de usuários:', erro);
        if (usuarioLogado) {
          definirListaUsuarios([usuarioLogado]);
          preencherFormularioComUsuario(usuarioLogado, true);
        }
      } finally {
        definirCarregandoDados(false);
      }
    };

    carregarUsuarios();
  }, [ehAdmin, usuarioLogado?.id]);

  // ===================================================================================
  // EFEITO 2: Fechamento automático do menu suspenso ao clicar fora da área de busca
  // ===================================================================================
  useEffect(() => {
    /**
     * FUNÇÃO INTERNA: aoClicarFora
     * O QUE FAZ:
     * Verifica se o clique do mouse ocorreu fora do elemento `refContainerBusca`.
     * Se sim, fecha o menu suspenso (`definirMenuAberto(false)`) e restaura o texto do
     * input de busca para o nome do usuário que está selecionado no momento.
     */
    const aoClicarFora = (e) => {
      if (refContainerBusca.current && !refContainerBusca.current.contains(e.target)) {
        definirMenuAberto(false);
        const usuarioAtual = listaUsuarios[indiceAtual];
        if (usuarioAtual) {
          definirTermoBusca(usuarioAtual.nome);
        }
      }
    };
    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [listaUsuarios, indiceAtual]);

  /**
   * MEMOIZAÇÃO: usuariosFiltrados
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Filtra a `listaUsuarios` em tempo real com base no `termoBusca` digitado pelo admin,
   * verificando coincidências parciais (case-insensitive) no nome, login ou e-mail.
   */
  const usuariosFiltrados = useMemo(() => {
    const buscaLimpa = termoBusca.trim().toLowerCase();
    if (!buscaLimpa) return listaUsuarios;

    return listaUsuarios.filter(
      (u) =>
        (u.nome && u.nome.toLowerCase().includes(buscaLimpa)) ||
        (u.login && u.login.toLowerCase().includes(buscaLimpa)) ||
        (u.email && u.email.toLowerCase().includes(buscaLimpa))
    );
  }, [listaUsuarios, termoBusca]);

  /**
   * MEMOIZAÇÃO: sugestaoAdivinhada
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Procura na `listaUsuarios` o primeiro usuário cujo nome comece exatamente com o texto
   * digitado em `termoBusca`. Retorna o nome completo formatado mantendo as letras já
   * digitadas para renderizar a sugestão de autocompletar ("texto fantasma") no fundo do input.
   */
  const sugestaoAdivinhada = useMemo(() => {
    if (!termoBusca || !menuAberto) return '';
    const buscaMinuscula = termoBusca.toLowerCase();

    const candidato = listaUsuarios.find(
      (u) => u.nome && u.nome.toLowerCase().startsWith(buscaMinuscula)
    );

    if (candidato && candidato.nome.toLowerCase() !== buscaMinuscula) {
      return termoBusca + candidato.nome.slice(termoBusca.length);
    }
    return '';
  }, [listaUsuarios, termoBusca, menuAberto]);

  /**
   * FUNÇÃO: selecionarUsuario
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * É acionada ao escolher um usuário na lista suspensa ou via autocompletar.
   * Localiza o índice desse usuário na `listaUsuarios`, atualiza `indiceAtual`, carrega
   * seus dados no formulário, fecha o menu suspenso e limpa mensagens de sucesso anteriores.
   */
  const selecionarUsuario = (usuario) => {
    const novoIndice = listaUsuarios.findIndex((u) => Number(u.id) === Number(usuario.id));
    if (novoIndice >= 0) {
      definirIndiceAtual(novoIndice);
    }
    preencherFormularioComUsuario(usuario, true);
    definirMenuAberto(false);
    definirMensagemSucesso('');
  };

  /**
   * FUNÇÃO: aoPressionarTeclaBusca (antiga handleTeclaBusca)
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Intercepta teclas especiais pressionadas no campo de pesquisa de usuários:
   * - `Tab` ou `ArrowRight` (Seta Direita): Aceita a `sugestaoAdivinhada` e seleciona o usuário.
   * - `Enter`: Seleciona automaticamente o primeiro usuário da lista filtrada (`usuariosFiltrados[0]`).
   * - `Escape`: Fecha o menu suspenso de pesquisa.
   */
  const aoPressionarTeclaBusca = (e) => {
    if ((e.key === 'Tab' || e.key === 'ArrowRight') && sugestaoAdivinhada) {
      const candidato = listaUsuarios.find(
        (u) => u.nome && u.nome.toLowerCase() === sugestaoAdivinhada.toLowerCase()
      );
      if (candidato) {
        e.preventDefault();
        selecionarUsuario(candidato);
      }
    } else if (e.key === 'Enter' && menuAberto && usuariosFiltrados.length > 0) {
      e.preventDefault();
      selecionarUsuario(usuariosFiltrados[0]);
    } else if (e.key === 'Escape') {
      definirMenuAberto(false);
    }
  };

  /**
   * FUNÇÃO: navegarRegistro
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Permite ao administrador avançar (`direcao = 1`) ou retroceder (`direcao = -1`)
   * sequencialmente entre os usuários da `listaUsuarios` usando os botões de seta,
   * atualizando os campos do formulário a cada troca.
   */
  const navegarRegistro = (direcao) => {
    if (!ehAdmin || listaUsuarios.length === 0) return;
    const novoIndice = indiceAtual + direcao;
    if (novoIndice >= 0 && novoIndice < listaUsuarios.length) {
      definirIndiceAtual(novoIndice);
      preencherFormularioComUsuario(listaUsuarios[novoIndice], true);
      definirMenuAberto(false);
      definirMensagemSucesso('');
    }
  };

  /**
   * FUNÇÃO: aoAlterarFoto (antiga handleFotoChange)
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Captura o arquivo de imagem selecionado pelo usuário no input `type="file"`,
   * armazena o arquivo em `fotoPerfil` para envio no PUT e cria uma URL local temporária
   * (`URL.createObjectURL`) em `previewFoto` para exibir a nova imagem imediatamente.
   */
  const aoAlterarFoto = (e) => {
    const arquivo = e.target.files[0];
    if (arquivo) {
      definirFotoPerfil(arquivo);
      const urlLocal = URL.createObjectURL(arquivo);
      definirPreviewFoto(urlLocal);
    }
  };

  /**
   * FUNÇÃO: aoSubmeterFormulario (antiga handleSubmit)
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Processa o salvamento das alterações do usuário selecionado:
   * 1. Previne o recarregamento da página e valida se há um `idSelecionado`.
   * 2. Se o campo `senha` foi preenchido, valida se coincide com `confirmarSenha`.
   * 3. Monta um objeto `FormData` com nome, login, e-mail, perfil do solicitante e,
   *    condicionalmente, o novo perfil (se admin), a nova senha e a nova foto.
   * 4. Envia uma requisição `PUT` para `${CONFIG_REDE.URL_BACKEND}/usuarios/${idSelecionado}`.
   * 5. Em caso de sucesso, atualiza o usuário dentro do estado `listaUsuarios`, atualiza
   *    o preview da foto com a URL definitiva do servidor, limpa os campos de senha/arquivo
   *    e, caso o usuário editado seja o próprio usuário logado, invoca `aoAtualizarUsuarioLogado`
   *    para refletir o novo nome/foto no restante do sistema.
   */
  const aoSubmeterFormulario = async (e) => {
    e.preventDefault();
    if (!idSelecionado) return;

    // Se o usuário digitou uma nova senha, verifica se a confirmação é idêntica
    if (senha && senha.trim() !== '' && senha !== confirmarSenha) {
      alert('A nova senha e a confirmação de senha não conferem. Por favor, verifique.');
      return;
    }

    definirSalvando(true);
    definirMensagemSucesso('');

    try {
      const dadosFormulario = new FormData();
      dadosFormulario.append('nome', nome);
      dadosFormulario.append('login', login);
      dadosFormulario.append('email', email);
      dadosFormulario.append('perfil_solicitante', usuarioLogado?.perfil || 'operador');

      if (ehAdmin) {
        dadosFormulario.append('perfil', perfil);
      }

      // Mantém a chave 'password' esperada pelo backend no Server.js
      if (senha && senha.trim() !== '') {
        dadosFormulario.append('password', senha);
      }

      if (fotoPerfil) {
        dadosFormulario.append('foto_perfil', fotoPerfil);
      }

      const resposta = await fetch(`${CONFIG_REDE.URL_BACKEND}/usuarios/${idSelecionado}`, {
        method: 'PUT',
        body: dadosFormulario
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        const usuarioAtualizado = dados.usuario || {
          id: idSelecionado,
          nome,
          login,
          email,
          perfil: ehAdmin ? perfil : usuarioLogado?.perfil,
          foto_perfil: dados.foto_perfil || listaUsuarios[indiceAtual]?.foto_perfil || null
        };

        // Atualiza os dados do usuário na lista em memória sem precisar recarregar do banco
        definirListaUsuarios((listaAnterior) =>
          listaAnterior.map((u) =>
            Number(u.id) === Number(idSelecionado) ? { ...u, ...usuarioAtualizado } : u
          )
        );

        definirPreviewFoto(montarUrlFotoBanco(usuarioAtualizado.foto_perfil));
        definirFotoPerfil(null);
        definirSenha('');
        definirConfirmarSenha('');
        definirTermoBusca(usuarioAtualizado.nome);

        if (refInputArquivo.current) {
          refInputArquivo.current.value = '';
        }

        // Se o usuário editou o próprio perfil, atualiza o estado global do usuário logado
        if (
          aoAtualizarUsuarioLogado &&
          Number(idSelecionado) === Number(usuarioLogado?.id)
        ) {
          aoAtualizarUsuarioLogado(usuarioAtualizado);
        }

        definirMensagemSucesso('Dados do usuário atualizados com sucesso!');
        alert('Usuário atualizado com sucesso!');
      } else {
        alert(dados.mensagem || 'Erro ao atualizar os dados do usuário.');
      }
    } catch (erro) {
      console.error('Erro ao atualizar usuário:', erro);
      alert('Erro de conexão ao tentar atualizar o usuário.');
    } finally {
      definirSalvando(false);
    }
  };

  // ===================================================================================
  // RENDERIZAÇÃO DO COMPONENTE (INTERFACE JSX)
  // ===================================================================================
  return (
    <div className="tela-cadastro-usuario-container">
      <div className="container w-100" style={{ maxWidth: '600px' }}>
        
        {/* Cabeçalho com botão Voltar e título dinâmico conforme o perfil */}
        <div className="cabecalho-cadastro-forja">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary text-light d-flex align-items-center gap-1"
            onClick={aoVoltar}
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          <h4 className="fw-bold text-info mb-0 d-flex align-items-center gap-2">
            <UserCog size={22} /> {ehAdmin ? 'Gerenciar e Editar Usuários' : 'Editar Meu Perfil'}
          </h4>
        </div>

        <div className="card-edicao-forja">
          {/* Painel exclusivo para Administradores: Navegação e Busca Inteligente de Usuários */}
          {ehAdmin && (
            <div className="painel-navegacao-admin-forja mb-4 pb-3 border-bottom border-secondary">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="form-label text-info fw-semibold mb-0 small">
                  Selecionar Usuário para Edição
                </label>
                <span className="badge bg-dark border border-info text-info">
                  {listaUsuarios.length > 0
                    ? `Registro ${indiceAtual + 1} de ${listaUsuarios.length}`
                    : 'Nenhum registro'}
                </span>
              </div>

              <div className="d-flex align-items-center gap-2">
                {/* Botão: Usuário Anterior */}
                <button
                  type="button"
                  className="btn botao-seta-navegacao-forja"
                  onClick={() => navegarRegistro(-1)}
                  disabled={indiceAtual <= 0 || carregandoDados}
                  title="Usuário Anterior"
                >
                  <ChevronLeft size={18} />
                </button>

                {/* Caixa de Busca com Autocompletar (Texto Fantasma) e Menu Suspenso */}
                <div className="flex-grow-1 position-relative" ref={refContainerBusca}>
                  <div className="wrapper-input-adivinhacao-forja">
                    <Search size={16} className="icone-busca-forja" />

                    {sugestaoAdivinhada && (
                      <div className="texto-fantasma-adivinhacao" aria-hidden="true">
                        <span className="parte-invisivel">{termoBusca}</span>
                        <span className="parte-sugerida">
                          {sugestaoAdivinhada.slice(termoBusca.length)}
                        </span>
                      </div>
                    )}

                    <input
                      type="text"
                      className="form-control formulario-input-dark input-busca-transparente"
                      placeholder="Digite o nome, login ou e-mail do usuário..."
                      value={termoBusca}
                      onFocus={() => definirMenuAberto(true)}
                      onChange={(e) => {
                        definirTermoBusca(e.target.value);
                        definirMenuAberto(true);
                      }}
                      onKeyDown={aoPressionarTeclaBusca}
                    />

                    <div className="acoes-input-busca-forja">
                      {termoBusca && (
                        <button
                          type="button"
                          className="btn-icone-limpar-forja"
                          onClick={() => {
                            definirTermoBusca('');
                            definirMenuAberto(true);
                          }}
                          title="Limpar pesquisa"
                        >
                          <X size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn-icone-limpar-forja"
                        onClick={() => definirMenuAberto((estadoAnterior) => !estadoAnterior)}
                        title="Abrir lista de usuários"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Lista Suspensa (Dropdown) de Usuários Filtrados */}
                  {menuAberto && (
                    <ul className="menu-suspenso-clean-forja">
                      {usuariosFiltrados.length > 0 ? (
                        usuariosFiltrados.map((u) => {
                          const estaSelecionado = Number(u.id) === Number(idSelecionado);
                          return (
                            <li
                              key={u.id}
                              className={`item-menu-suspenso-forja ${estaSelecionado ? 'ativo' : ''}`}
                              onClick={() => selecionarUsuario(u)}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-semibold text-light">{u.nome}</span>
                                <span className="badge bg-secondary small text-uppercase">
                                  {u.perfil}
                                </span>
                              </div>
                              <div className="small text-muted">
                                @{u.login} • {u.email}
                              </div>
                            </li>
                          );
                        })
                      ) : (
                        <li className="item-menu-suspenso-vazio">
                          Nenhum usuário encontrado para "{termoBusca}"
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Botão: Próximo Usuário */}
                <button
                  type="button"
                  className="btn botao-seta-navegacao-forja"
                  onClick={() => navegarRegistro(1)}
                  disabled={indiceAtual >= listaUsuarios.length - 1 || carregandoDados}
                  title="Próximo Usuário"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Dica visual de atalho de teclado quando há sugestão de autocompletar */}
              {sugestaoAdivinhada && (
                <div className="small text-info mt-1" style={{ fontSize: '0.75rem' }}>
                  Pressione <kbd className="bg-dark border border-info text-info px-1">Tab</kbd> ou{' '}
                  <kbd className="bg-dark border border-info text-info px-1">→</kbd> para autocompletar{' '}
                  <strong>{sugestaoAdivinhada}</strong>
                </div>
              )}
            </div>
          )}

          {/* Alerta de confirmação visual quando os dados são salvos */}
          {mensagemSucesso && (
            <div className="alert alert-info py-2 small text-center mb-3">
              {mensagemSucesso}
            </div>
          )}

          {/* Formulário Principal de Edição */}
          <form onSubmit={aoSubmeterFormulario}>
            {/* Moldura de Prévia e Upload de Foto de Perfil */}
            <div className="grupo-campo-forja text-center">
              <div className="moldura-logo-cartao mb-3">
                {previewFoto ? (
                  <img
                    src={previewFoto}
                    alt="Prévia da Foto de Perfil"
                    className="imagem-logo-cartao"
                  />
                ) : (
                  <div className="text-muted d-flex flex-column align-items-center">
                    <ImageIcon size={32} className="mb-1" />
                    <span className="small">Sem Foto</span>
                  </div>
                )}
              </div>

              <label className="form-label">
                Foto de Perfil {fotoPerfil ? '(Nova foto selecionada - clique em Salvar)' : '(Atual)'}
              </label>
              <input
                ref={refInputArquivo}
                type="file"
                className="form-control formulario-input-dark"
                accept="image/*"
                onChange={aoAlterarFoto}
              />
            </div>

            {/* Campo: Nome Completo */}
            <div className="grupo-campo-forja">
              <label className="form-label">Nome Completo</label>
              <input
                type="text"
                className="form-control formulario-input-dark"
                required
                placeholder="Ex: Carlos Silva"
                value={nome}
                onChange={(e) => definirNome(e.target.value)}
              />
            </div>

            {/* Campo: E-mail */}
            <div className="grupo-campo-forja">
              <label className="form-label">E-mail</label>
              <input
                type="email"
                className="form-control formulario-input-dark"
                required
                placeholder="carlos@exemplo.com"
                value={email}
                onChange={(e) => definirEmail(e.target.value)}
              />
            </div>

            {/* Campo: Login de Acesso */}
            <div className="grupo-campo-forja">
              <label className="form-label">Login de Acesso</label>
              <input
                type="text"
                className="form-control formulario-input-dark"
                required
                placeholder="carlos.silva"
                value={login}
                onChange={(e) => definirLogin(e.target.value)}
              />
            </div>

            {/* Campos de Alteração de Senha (Opcionais) */}
            <div className="row">
              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Nova Senha (Opcional)</label>
                  <input
                    type="password"
                    className="form-control formulario-input-dark"
                    placeholder="Deixe em branco para manter"
                    value={senha}
                    onChange={(e) => definirSenha(e.target.value)}
                  />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Repetir Nova Senha</label>
                  <input
                    type="password"
                    className="form-control formulario-input-dark"
                    placeholder="Repita a nova senha"
                    value={confirmarSenha}
                    onChange={(e) => definirConfirmarSenha(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Seleção de Perfil de Acesso (Editável apenas para Admin) */}
            <div className="grupo-campo-forja">
              <label className="form-label">Perfil de Acesso</label>
              {ehAdmin ? (
                <select
                  className="form-select formulario-input-dark"
                  value={perfil}
                  onChange={(e) => definirPerfil(e.target.value)}
                >
                  <option value="admin">Administrador (Acesso Total)</option>
                  <option value="editor">Editor (Pode criar projetos e times)</option>
                  <option value="operador">Operador (Uso padrão)</option>
                  <option value="visualizador">Visualizador (Apenas leitura)</option>
                </select>
              ) : (
                <select
                  className="form-select formulario-input-dark"
                  value={perfil}
                  disabled
                >
                  {perfil === 'editor' && (
                    <option value="editor">Editor (Pode criar projetos e times)</option>
                  )}
                  {perfil === 'operador' && (
                    <option value="operador">Operador (Uso padrão)</option>
                  )}
                  {perfil === 'visualizador' && (
                    <option value="visualizador">Visualizador (Apenas leitura)</option>
                  )}
                </select>
              )}
            </div>

            {/* Botões de Ação do Rodapé */}
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary">
              <button
                type="button"
                className="btn botao-forja-vermelho"
                onClick={aoVoltar}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn botao-forja-laranja d-flex align-items-center gap-2"
                disabled={salvando || carregandoDados}
              >
                <Save size={16} /> {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};