// Importa o React e o hook useState para gerir o estado local dos campos do formulário e da interface
import React, { useState } from 'react';
// Importa os ícones vetoriais da biblioteca 'lucide-react' utilizados nos botões, títulos e moldura de foto
import { ArrowLeft, UserPlus, Save, Image as ImageIcon } from 'lucide-react';
// Importa a configuração centralizada de rede para obter o endereço do backend (URL_BACKEND)
import { CONFIG_REDE } from './config';
// Importa a folha de estilos CSS específica para o ecrã de registo de utilizador
import '../estilos/TelaCadastroUsuario.css';

/**
 * FUNÇÃO / COMPONENTE PRINCIPAL: TelaCadastroUsuario
 * -------------------------------------------------------------------------------------
 * O QUE FAZ:
 * Renderiza a interface de formulário para cadastrar um novo usuário na aplicação.
 * Gere os estados de todos os campos (dados pessoais, credenciais, nível de permissão
 * e foto de perfil), valida a confirmação de senha e comunica com a API através de
 * FormData para suportar o envio simultâneo de texto e arquivo de imagem.
 * Recebe a prop `aoVoltar` para permitir fechar esta tela e retornar à tela anterior.
 */
export default function TelaCadastroUsuario({ aoVoltar }) {
  // Estados locais em português para armazenar os valores digitados nos campos do formulário
  const [nome, definirNome] = useState('');
  const [login, definirLogin] = useState('');
  const [email, definirEmail] = useState('');
  const [senha, definirSenha] = useState('');
  const [confirmarSenha, definirConfirmarSenha] = useState('');
  const [perfil, definirPerfil] = useState('operador'); // Perfil padrão definido como 'operador'

  // Estados para gerir o arquivo físico da foto selecionada e a URL temporária de pré-visualização
  const [fotoPerfil, definirFotoPerfil] = useState(null);
  const [previewFoto, definirPreviewFoto] = useState(null);

  // Estado booleano que controla o bloqueio do botão de envio enquanto a requisição está em andamento
  const [carregando, definirCarregando] = useState(false);

  /**
   * FUNÇÃO: aoAlterarFoto (antiga handleFotoChange)
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * É acionada quando o usuário seleciona um arquivo de imagem no campo de upload.
   * Captura o primeiro arquivo selecionado (`e.target.files[0]`), guarda-o no estado
   * `fotoPerfil` para envio ao backend e gera uma URL temporária em memória com
   * `URL.createObjectURL(arquivo)` para exibir imediatamente a prévia da foto na tela.
   */
  const aoAlterarFoto = (e) => {
    const arquivo = e.target.files[0];
    if (arquivo) {
      definirFotoPerfil(arquivo);
      definirPreviewFoto(URL.createObjectURL(arquivo));
    }
  };

  /**
   * FUNÇÃO: aoSubmeterFormulario (antiga handleSubmit)
   * -----------------------------------------------------------------------------------
   * O QUE FAZ:
   * Processa o envio do formulário de cadastro de usuário:
   * 1. Impede o recarregamento padrão da página (`e.preventDefault()`).
   * 2. Verifica se os estados `senha` e `confirmarSenha` são iguais, exibindo um alerta
   *    e interrompendo o envio caso sejam diferentes.
   * 3. Ativa o estado `carregando` para desativar temporariamente o botão de salvar.
   * 4. Monta um objeto `FormData` com todos os dados textuais e, se existir, o arquivo
   *    de imagem `foto_perfil`.
   * 5. Envia uma requisição HTTP `POST` para `${CONFIG_REDE.URL_BACKEND}/usuarios`.
   * 6. Caso a resposta seja positiva (`resposta.ok`), exibe mensagem de sucesso e chama
   *    `aoVoltar()`; caso contrário, exibe a mensagem de erro retornada pelo servidor.
   * 7. No bloco `finally`, redefine `carregando` como `false`.
   */
  const aoSubmeterFormulario = async (e) => {
    e.preventDefault();

    // Validação de segurança: garante que a senha e a confirmação de senha conferem
    if (senha !== confirmarSenha) {
      alert('As senhas não conferem. Por favor, redigite.');
      return;
    }

    definirCarregando(true);

    try {
      // Utiliza FormData para permitir o envio multipart/form-data (texto + imagem)
      const dadosFormulario = new FormData();
      dadosFormulario.append('nome', nome);
      dadosFormulario.append('login', login);
      dadosFormulario.append('email', email);
      // Mantém a chave 'password' exigida pelo req.body do Server.js no backend
      dadosFormulario.append('password', senha);
      dadosFormulario.append('perfil', perfil);
      
      // Anexa a foto ao FormData apenas se o usuário tiver selecionado um arquivo
      if (fotoPerfil) {
        dadosFormulario.append('foto_perfil', fotoPerfil);
      }

      // Envia os dados para a rota de criação de usuários no backend
      const resposta = await fetch(`${CONFIG_REDE.URL_BACKEND}/usuarios`, {
        method: 'POST',
        body: dadosFormulario
      });

      const dados = await resposta.json();

      if (resposta.ok) {
        alert('Usuário cadastrado com sucesso!');
        aoVoltar(); // Retorna para a tela anterior após concluir o cadastro
      } else {
        alert(dados.mensagem || 'Erro ao cadastrar usuário.');
      }
    } catch (erro) {
      console.error('Erro:', erro);
      alert('Erro de conexão ao tentar cadastrar o usuário.');
    } finally {
      // Garante que o botão volta ao estado normal mesmo que ocorra uma falha
      definirCarregando(false);
    }
  };

  // ===================================================================================
  // RENDERIZAÇÃO DO COMPONENTE (INTERFACE JSX)
  // ===================================================================================
  return (
    <div className="tela-cadastro-usuario-container">
      <div className="container w-100" style={{ maxWidth: '600px' }}>
        
        {/* Cabeçalho da tela com botão Voltar e título */}
        <div className="cabecalho-cadastro-forja">
          <button 
            className="btn btn-sm btn-outline-secondary text-light d-flex align-items-center gap-1" 
            onClick={aoVoltar}
          >
            <ArrowLeft size={16} /> Voltar
          </button>
          
          <h4 className="fw-bold text-info mb-0 d-flex align-items-center gap-2">
            <UserPlus size={22} /> Cadastrar Novo Usuário
          </h4>
        </div>

        {/* Cartão principal contendo o formulário de cadastro */}
        <div className="card-edicao-forja">
          <form onSubmit={aoSubmeterFormulario}>
            
            {/* Prévia e Upload de Foto */}
            <div className="grupo-campo-forja text-center">
              <div className="moldura-logo-cartao mb-3">
                {previewFoto ? (
                  <img src={previewFoto} alt="Prévia da Foto" className="imagem-logo-cartao" />
                ) : (
                  <div className="text-muted d-flex flex-column align-items-center">
                    <ImageIcon size={32} className="mb-1" />
                    <span className="small">Sem Foto</span>
                  </div>
                )}
              </div>
              <label className="form-label">Foto de Perfil (Opcional)</label>
              <input 
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

            {/* Linha com Senha Temporária e Repetir Senha lado a lado */}
            <div className="row">
              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Senha Temporária</label>
                  <input 
                    type="password" 
                    className="form-control formulario-input-dark" 
                    required 
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => definirSenha(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="col-12 col-md-6">
                <div className="grupo-campo-forja">
                  <label className="form-label">Repetir Senha</label>
                  <input 
                    type="password" 
                    className="form-control formulario-input-dark" 
                    required 
                    placeholder="••••••••"
                    value={confirmarSenha}
                    onChange={(e) => definirConfirmarSenha(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Seleção do Perfil de Acesso / Nível de Permissão */}
            <div className="grupo-campo-forja">
              <label className="form-label">Perfil de Acesso</label>
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
            </div>

            {/* Rodapé do formulário com botões de ação (Cancelar e Finalizar Cadastro) */}
            <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary">
              <button type="button" className="btn botao-forja-vermelho" onClick={aoVoltar}>Cancelar</button>
              <button type="submit" className="btn botao-forja-laranja d-flex align-items-center gap-2" disabled={carregando}>
                <Save size={16} /> {carregando ? 'Cadastrando...' : 'Finalizar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};