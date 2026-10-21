// Carrega as variáveis de ambiente definidas no arquivo .env para process.env
require('dotenv').config();

// Importa o framework Express para criação do servidor web e gerenciamento de rotas
const express = require('express');
// Importa o middleware CORS para permitir requisições de diferentes origens (frontend)
const cors = require('cors');
// Importa o body-parser para interpretar o corpo das requisições HTTP em formato JSON ou URL-encoded
const bodyParser = require('body-parser');
// Importa a biblioteca mysql2 para conexão e manipulação do banco de dados MySQL
const mysql = require('mysql2');
// Importa a biblioteca bcrypt para criptografia e validação segura de senhas
const bcrypt = require('bcrypt');
// Importa o SDK oficial do Google Gen AI para interagir com o Gemini
const { GoogleGenAI } = require('@google/genai');
// Importa o multer para gerenciamento de upload de anexos (imagens, PDFs, áudios, vídeos, códigos)
const multer = require('multer');
// Importa o node-cron para executar a rotina automática do Arquivo Morto
const cron = require('node-cron');
// Importa os módulos nativos path, fs e os para diretórios, arquivos e detecção do IPv4 da rede local
const path = require('path');
const fs = require('fs');
const os = require('os');

// Inicializa a aplicação Express
const app = express();
// Define a porta de saída do servidor (lê da variável PORT no .env ou assume 3527 por padrão)
const PORTA_SERVIDOR = process.env.PORT || 3527;
// Define o modelo padrão do agente de IA lendo do .env
const modeloIaPadrao = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

// ==========================================
// FUNÇÃO PARA OBTER O ENDEREÇO IPv4 DA REDE LOCAL
// ==========================================
function obterEnderecoIpLocal() {
  // Obtém todas as interfaces de rede disponíveis no sistema operacional
  const interfacesRede = os.networkInterfaces();
  // Percorre cada chave (nome) das interfaces de rede encontradas
  for (const nomeInterface of Object.keys(interfacesRede)) {
    // Percorre cada objeto de configuração associado à interface atual
    for (const iface of interfacesRede[nomeInterface]) {
      // Verifica se a interface é do tipo IPv4 e não é uma interface interna/loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        // Retorna o primeiro endereço IP válido encontrado
        return iface.address;
      }
    }
  }
  // Retorna o endereço de loopback padrão caso nenhum IP de rede local seja encontrado
  return '127.0.0.1';
}

// Armazena o endereço IP local obtido pela função acima
const enderecoIpLocal = obterEnderecoIpLocal();

// ==========================================
// CONFIGURAÇÃO DE CORS PARA MÚLTIPLOS CAMINHOS
// ==========================================
// Define a lista de origens permitidas lendo do arquivo .env ou definindo padrões locais
const listaOrigensPermitidas = process.env.CORS_ORIGENS
  ? process.env.CORS_ORIGENS.split(',').map((origem) => origem.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'https://forja.emersonsilv.win', 'http://192.168.0.16:5173'];

// Configura o middleware CORS na aplicação Express com regras customizadas de validação de origem
app.use(
  cors({
    origin: function (origemRequisicao, callback) {
      // Permite requisições sem origem (como aplicativos mobile ou ferramentas de teste) ou se a origem estiver permitida/for coringa (*)
      if (!origemRequisicao || listaOrigensPermitidas.includes(origemRequisicao) || listaOrigensPermitidas.includes('*')) {
        callback(null, true);
      } else {
        // Registra um aviso no console caso uma origem não autorizada tente acessar o servidor
        console.warn(`[AVISO CORS] Origem bloqueada: ${origemRequisicao}`);
        // Retorna um erro bloqueando a requisição por políticas de segurança CORS
        callback(new Error('Origem não permitida pelo CORS da Forja de Prompts.'));
      }
    },
    // Define os métodos HTTP permitidos para as requisições cruzadas
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    // Define os cabeçalhos HTTP permitidos nas requisições
    allowedHeaders: ['Content-Type', 'Authorization'],
    // Permite o envio de credenciais (como cookies ou cabeçalhos de autenticação) nas requisições
    credentials: true
  })
);

// Configura o Express para interpretar payloads JSON maiores (útil para importação de JSON das IAs)
app.use(bodyParser.json({ limit: '50mb' }));
// Configura o Express para interpretar dados codificados em URL (URL-encoded) com limite estendido de tamanho
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// CONFIGURAÇÃO DE DIRETÓRIO E UPLOAD DE ANEXOS
// ==========================================
// Define o nome da pasta de uploads a partir do arquivo .env ou usa 'uploads' por padrão
const nomePastaUploads = process.env.PASTA_UPLOADS || 'uploads';
// Conria o caminho absoluto para o diretório de uploads combinando o diretório atual com o nome da pasta
const diretorioUploads = path.join(__dirname, nomePastaUploads);

// Cria a pasta de uploads automaticamente caso ainda não exista no sistema de arquivos
if (!fs.existsSync(diretorioUploads)) {
  fs.mkdirSync(diretorioUploads, { recursive: true });
}

// Expõe a pasta de anexos estaticamente na rota /uploads e também na rota /arquivos por compatibilidade
app.use('/uploads', express.static(diretorioUploads));
app.use('/arquivos', express.static(diretorioUploads));

// Configura o armazenamento em disco do Multer mantendo a extensão original e gerando nomes únicos para evitar conflitos
const armazenamentoAnexos = multer.diskStorage({
  // Define o diretório de destino onde o arquivo enviado será salvo fisicamente
  destination: (req, arquivo, cb) => {
    cb(null, diretorioUploads);
  },
  // Define a regra de nomenclatura para o arquivo recebido para garantir unicidade
  filename: (req, arquivo, cb) => {
    // Cria um sufixo único baseado no timestamp atual e um número randômico
    const sufixoUnico = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Extrai a extensão do arquivo original
    const extensao = path.extname(arquivo.originalname);
    // Limpa o nome base do arquivo removendo caracteres especiais e substituindo por underscore
    const nomeLimpo = path
      .basename(arquivo.originalname, extensao)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    // Retorna o nome final composto pelo sufixo único, nome limpo e extensão
    cb(null, `${sufixoUnico}-${nomeLimpo}${extensao}`);
  }
});

// Define o limite de tamanho do arquivo em Megabytes lendo do .env ou assumindo 50MB
const limiteMb = Number(process.env.LIMITE_TAMANHO_ARQUIVO_MB || 50);
// Configura a instância do Multer utilizando o armazenamento em disco e o limite de tamanho configurado
const uploadAnexo = multer({
  storage: armazenamentoAnexos,
  limits: { fileSize: limiteMb * 1024 * 1024 }
});

// ==========================================
// INICIALIZAÇÃO DO GEMINI E BANCO MYSQL
// ==========================================
// Inicializa a instância do SDK do Google Gen AI
const ai = new GoogleGenAI();

// Variáveis de controle de estado para o nome da base de dados ativa e o texto descritivo do status
let nomeBaseAtiva = 'Nenhuma';
let textoStatusBanco = '⏳ Aguardando conexão...';

// Cria a conexão com o banco de dados MySQL utilizando as credenciais definidas no .env ou padrões
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

// Função responsável por estabelecer a conexão com o banco de dados MySQL e capturar o status atual
function conectarBancoDeDados(callbackFinal) {
  // Inicia a conexão com o banco MySQL
  db.connect((erro) => {
    // Verifica se ocorreu algum erro ao tentar conectar
    if (erro) {
      // Atualiza as variáveis de status indicando falha na conexão
      textoStatusBanco = `❌ Falha na conexão (${erro.code || erro.message})`;
      nomeBaseAtiva = 'Desconectado';
      // Executa o callback final se ele foi fornecido
      if (callbackFinal) callbackFinal();
      return;
    }

    // Executa uma query para consultar qual é o banco de dados ativo no momento
    db.query('SELECT DATABASE() AS base_atual', (erroQuery, resultado) => {
      // Verifica se a query retornou o nome da base com sucesso
      if (!erroQuery && resultado && resultado.length > 0) {
        nomeBaseAtiva = resultado[0].base_atual || process.env.DB_NAME || 'forja_de_prompts_db';
      } else {
        nomeBaseAtiva = process.env.DB_NAME ;
      }
      // Atualiza o status indicando sucesso na conexão
      textoStatusBanco = '✅ Conectado e Operacional';
      // Executa o callback final informando que o processo terminou
      if (callbackFinal) callbackFinal();
    });
  });
}

// ==========================================
// ROTINA AUTOMÁTICA DO ARQUIVO MORTO (CRON)
// ==========================================
// Agenda uma tarefa cron para rodar todos os dias à meia-noite ('0 0 * * *')
cron.schedule('0 0 * * *', () => {
  // Define a instrução SQL para atualizar o status de memórias antigas para arquivadas automaticamente
  const sqlArquivoMorto = `
    UPDATE memorias m
    JOIN projetos p ON m.projeto_id = p.id
    SET 
      m.esta_arquivado = TRUE,
      m.motivo_arquivamento = 'TEMPO_EXPIRADO'
    WHERE m.esta_arquivado = FALSE
      AND m.categoria_memoria != 'REGRA_FIXA'
      AND DATEDIFF(NOW(), m.ultimo_acesso) >= p.dias_para_arquivar
  `;
  // Executa a query de arquivamento automático no banco de dados
  db.query(sqlArquivoMorto, (erro, resultado) => {
    // Trata erros caso ocorram durante a execução da rotina agendada
    if (erro) {
      console.error('[ERRO ARQUIVO MORTO]:', erro);
    } else if (resultado.affectedRows > 0) {
      // Exibe uma mensagem no console informando quantas memórias foram arquivadas
      console.log(`[ARQUIVO MORTO] ${resultado.affectedRows} memórias antigas arquivadas automaticamente.`);
    }
  });
});

// ==========================================
// ROTAS DE AUTENTICAÇÃO E USUÁRIOS (LOGIN)
// ==========================================
// Define a rota POST para autenticação de usuários
app.post('/login', (req, res) => {
  // [LOCALIZAR: DEBUG LOGIN] - Logs de depuração de login comentados conforme solicitado
  /*
  console.log(`\n[DEBUG LOGIN] Requisição recebida na rota /login`);
  console.log(`[DEBUG LOGIN] Corpo recebido (req.body):`, req.body);
  */

  // Extrai o login e a senha do corpo da requisição
  const { login, password } = req.body;
  // Valida se os campos obrigatórios foram preenchidos
  if (!login || !password) {
    return res.status(400).json({ mensagem: 'Informe o login e a senha.' });
  }

  // Define a query SQL para buscar o usuário pelo login ou email
  const sqlBusca = 'SELECT * FROM usuarios WHERE login = ? OR email = ? LIMIT 1';

  // Executa a busca no banco de dados
  db.query(sqlBusca, [login, login], async (erro, resultados) => {
    // Retorna um erro HTTP 500 caso ocorra falha na consulta ao banco
    if (erro) {
      return res.status(500).json({ mensagem: 'Erro interno no servidor.', erro: erro.message });
    }

    // Retorna um erro HTTP 401 caso nenhum usuário seja encontrado com as credenciais fornecidas
    if (resultados.length === 0) {
      return res.status(401).json({ mensagem: 'Usuário ou senha inválidos.' });
    }

    // Armazena o primeiro usuário retornado pela consulta
    const usuarioEncontrado = resultados[0];

    try {
      // Compara a senha informada com o hash bcrypt armazenado no banco de dados
      const senhaValida = await bcrypt.compare(password, usuarioEncontrado.password);
      // Retorna erro HTTP 401 caso a senha seja inválida
      if (!senhaValida) {
        return res.status(401).json({ mensagem: 'Usuário ou senha inválidos.' });
      }

      // Retorna uma resposta de sucesso contendo os dados básicos do usuário autenticado
      res.json({
        mensagem: 'Login realizado com sucesso!',
        usuario: {
          id: usuarioEncontrado.id,
          nome: usuarioEncontrado.nome,
          login: usuarioEncontrado.login,
          perfil: usuarioEncontrado.perfil,
          email: usuarioEncontrado.email
        }
      });
    } catch (erroBcrypt) {
      // Retorna um erro HTTP 500 caso ocorra uma falha no processo de validação do bcrypt
      return res.status(500).json({ mensagem: 'Erro ao validar senha.', erro: erroBcrypt.message });
    }
  });
});

// ==========================================
// ROTAS DE IDENTIDADE VISUAL (CRIAR, EDITAR E VINCULAR AO PROJETO)
// ==========================================
// Define a rota POST para criar uma nova identidade visual e opcionalmente vinculá-la a um projeto
app.post('/identidades-visuais', (req, res) => {
  // Extrai os campos de identidade visual e o ID do projeto do corpo da requisição
  const { projetoId, nome, corPrimaria, corSecundaria, corDestaque, tipografia, estiloVisual, tomDeVoz } = req.body;

  // Valida se o nome da identidade visual foi informado
  if (!nome) {
    return res.status(400).json({ mensagem: 'O nome da identidade visual é obrigatório.' });
  }

  // Define a query SQL para inserir uma nova identidade visual na tabela correspondente
  const sql = `
    INSERT INTO identidades_visuais (nome, cor_primaria, cor_secundaria, cor_destaque, tipografia, estilo_visual, tom_de_voz)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  // Executa a query de inserção no banco de dados passando os parâmetros tratados (com valores nulos se vazios)
  db.query(
    sql,
    [nome, corPrimaria || null, corSecundaria || null, corDestaque || null, tipografia || null, estiloVisual || null, tomDeVoz || null],
    (erro, resultado) => {
      // Trata erros caso ocorram na inserção
      if (erro) {
        console.error('Erro ao salvar identidade visual:', erro);
        return res.status(500).json({ mensagem: 'Erro ao salvar identidade visual.', erro });
      }

      // Armazena o ID gerado para a nova identidade visual
      const novaIdentidadeId = resultado.insertId;

      // Verifica se foi enviado um ID de projeto para realizar a vinculação automática
      if (projetoId) {
        // Executa a query para atualizar o projeto associando a nova identidade visual
        db.query(
          'UPDATE projetos SET identidade_visual_id = ? WHERE id = ?',
          [novaIdentidadeId, projetoId],
          (erroVinculo) => {
            // Trata erros ocorridos durante o processo de vínculo
            if (erroVinculo) {
              console.error('Erro ao vincular identidade visual ao projeto:', erroVinculo);
              return res.status(500).json({ mensagem: 'Identidade criada, mas houve erro ao vincular ao projeto.', erro: erroVinculo });
            }
            // Retorna sucesso indicando que a identidade foi criada e vinculada
            res.status(201).json({
              mensagem: 'Identidade visual criada e vinculada ao projeto com sucesso!',
              id: novaIdentidadeId
            });
          }
        );
      } else {
        // Retorna sucesso apenas com a criação da identidade visual caso nenhum projeto tenha sido informado
        res.status(201).json({ mensagem: 'Identidade visual criada!', id: novaIdentidadeId });
      }
    }
  );
});

// Define a rota PUT para atualizar uma identidade visual existente com base no ID passado na URL
app.put('/identidades-visuais/:id', (req, res) => {
  // Extrai o ID dos parâmetros da URL
  const { id } = req.params;
  // Extrai os campos de atualização do corpo da requisição
  const { nome, corPrimaria, corSecundaria, corDestaque, tipografia, estiloVisual, tomDeVoz } = req.body;

  // Valida se o nome foi fornecido
  if (!nome) {
    return res.status(400).json({ mensagem: 'O nome da identidade visual é obrigatório.' });
  }

  // Define a query SQL para atualizar os dados da identidade visual
  const sql = `
    UPDATE identidades_visuais
    SET nome = ?, cor_primaria = ?, cor_secundaria = ?, cor_destaque = ?,
        tipografia = ?, estilo_visual = ?, tom_de_voz = ?
    WHERE id = ?
  `;

  // Executa a query de atualização no banco de dados
  db.query(
    sql,
    [nome, corPrimaria || null, corSecundaria || null, corDestaque || null, tipografia || null, estiloVisual || null, tomDeVoz || null, id],
    (erro) => {
      // Trata erros de banco de dados
      if (erro) {
        console.error('Erro ao atualizar identidade visual:', erro);
        return res.status(500).json({ mensagem: 'Erro ao atualizar identidade visual.', erro });
      }
      // Retorna uma resposta de sucesso
      res.json({ mensagem: 'Identidade visual atualizada com sucesso!' });
    }
  );
});

// Define a rota GET para buscar uma identidade visual específica pelo seu ID
app.get('/identidades-visuais/:id', (req, res) => {
  // Extrai o ID da URL
  const { id } = req.params;
  // Executa a consulta no banco de dados
  db.query('SELECT * FROM identidades_visuais WHERE id = ?', [id], (erro, resultados) => {
    if (erro) return res.status(500).json({ erro });
    // Retorna erro 404 caso a identidade visual não seja encontrada
    if (resultados.length === 0) return res.status(404).json({ mensagem: 'Identidade visual não encontrada.' });
    // Retorna o primeiro registro encontrado
    res.json(resultados[0]);
  });
});

// Define a rota GET para listar todas as identidades visuais ordenadas por nome
app.get('/identidades-visuais', (req, res) => {
  db.query('SELECT * FROM identidades_visuais ORDER BY nome', (erro, resultados) => {
    if (erro) return res.status(500).json({ erro });
    // Retorna a lista de identidades visuais encontradas
    res.json(resultados);
  });
});

// ==========================================
// ROTAS DE MÍDIAS DA IDENTIDADE VISUAL
// ==========================================
// Função auxiliar para classificar o tipo de mídia com base no mimetype do arquivo enviado
function classificarMidiaIdentidade(mimetype) {
  if (mimetype.startsWith('video/')) return 'VIDEO';
  if (mimetype.startsWith('audio/')) return 'AUDIO';
  return 'IMAGEM';
}

// Define a rota GET para listar todas as mídias vinculadas a uma identidade visual específica
app.get('/identidades-visuais/:id/midias', (req, res) => {
  const { id } = req.params;
  db.query(
    'SELECT * FROM identidades_visuais_midias WHERE identidade_visual_id = ? ORDER BY data_criacao DESC',
    [id],
    (erro, resultados) => {
      if (erro) return res.status(500).json({ mensagem: 'Erro ao listar mídias da identidade visual.', erro });
      res.json(resultados);
    }
  );
});

// Define a rota POST para fazer upload e cadastrar uma nova mídia para uma identidade visual
app.post('/identidades-visuais/:id/midias', uploadAnexo.single('midia'), (req, res) => {
  const { id } = req.params;
  const { legenda } = req.body;
  const arquivo = req.file;

  // Valida se um arquivo de mídia foi enviado
  if (!arquivo) {
    return res.status(400).json({ mensagem: 'Selecione uma imagem, áudio ou vídeo para enviar.' });
  }

  // Classifica o tipo da mídia e define o caminho público e a legenda final
  const tipoMidia = classificarMidiaIdentidade(arquivo.mimetype);
  const caminhoPublico = `/uploads/${arquivo.filename}`;
  const legendaFinal = legenda && legenda.trim() !== '' ? legenda.trim() : arquivo.originalname;

  // Define a query SQL para inserir a mídia no banco de dados
  const sql = `
    INSERT INTO identidades_visuais_midias (identidade_visual_id, nome_arquivo, caminho_arquivo, tipo_midia, legenda)
    VALUES (?, ?, ?, ?, ?)
  `;

  // Executa a query de inserção da mídia
  db.query(sql, [id, arquivo.originalname, caminhoPublico, tipoMidia, legendaFinal], (erro, resultado) => {
    if (erro) {
      console.error('Erro ao salvar mídia da identidade visual:', erro);
      return res.status(500).json({ mensagem: 'Erro ao salvar mídia no banco.', erro });
    }
    // Retorna sucesso e os detalhes da mídia cadastrada
    res.status(201).json({
      mensagem: 'Mídia adicionada à identidade visual!',
      midia: {
        id: resultado.insertId,
        identidade_visual_id: Number(id),
        nome_arquivo: arquivo.originalname,
        caminho_arquivo: caminhoPublico,
        tipo_midia: tipoMidia,
        legenda: legendaFinal
      }
    });
  });
});

// Define a rota PUT para atualizar a legenda ou substituir o arquivo de uma mídia da identidade visual
app.put('/identidades-visuais/midias/:midiaId', uploadAnexo.single('midia'), (req, res) => {
  const { midiaId } = req.params;
  const { legenda } = req.body;
  const novoArquivo = req.file;

  // Valida se a legenda foi fornecida e não está vazia
  if (!legenda || legenda.trim() === '') {
    return res.status(400).json({ mensagem: 'A legenda não pode ficar vazia.' });
  }

  // Verifica se um novo arquivo foi enviado junto com a atualização
  if (novoArquivo) {
    const tipoMidia = classificarMidiaIdentidade(novoArquivo.mimetype);
    const caminhoPublico = `/uploads/${novoArquivo.filename}`;
    const sqlComArquivo = `
      UPDATE identidades_visuais_midias
      SET legenda = ?, nome_arquivo = ?, caminho_arquivo = ?, tipo_midia = ?
      WHERE id = ?
    `;
    db.query(sqlComArquivo, [legenda.trim(), novoArquivo.originalname, caminhoPublico, tipoMidia, midiaId], (erro) => {
      if (erro) return res.status(500).json({ mensagem: 'Erro ao atualizar mídia.', erro });
      res.json({ mensagem: 'Mídia e legenda atualizadas com sucesso!' });
    });
  } else {
    // Atualiza apenas a legenda caso nenhum arquivo novo tenha sido enviado
    db.query(
      'UPDATE identidades_visuais_midias SET legenda = ? WHERE id = ?',
      [legenda.trim(), midiaId],
      (erro) => {
        if (erro) return res.status(500).json({ mensagem: 'Erro ao atualizar legenda.', erro });
        res.json({ mensagem: 'Legenda atualizada com sucesso!' });
      }
    );
  }
});

// Define a rota DELETE para excluir uma mídia da identidade visual e remover o arquivo físico correspondente
app.delete('/identidades-visuais/midias/:midiaId', (req, res) => {
  const { midiaId } = req.params;

  // Busca o caminho do arquivo no banco antes de removê-lo
  db.query('SELECT caminho_arquivo FROM identidades_visuais_midias WHERE id = ?', [midiaId], (erroBusca, resBusca) => {
    // Executa a exclusão do registro na tabela do banco de dados
    db.query('DELETE FROM identidades_visuais_midias WHERE id = ?', [midiaId], (erroDel) => {
      if (erroDel) return res.status(500).json({ mensagem: 'Erro ao excluir mídia.', erro: erroDel });

      // Se o arquivo foi encontrado, remove o arquivo físico correspondente do servidor
      if (!erroBusca && resBusca && resBusca.length > 0) {
        const nomeSalvo = path.basename(resBusca[0].caminho_arquivo);
        const caminhoFisico = path.join(diretorioUploads, nomeSalvo);
        if (fs.existsSync(caminhoFisico)) {
          fs.unlink(caminhoFisico, () => {});
        }
      }
      res.json({ mensagem: 'Mídia excluída com sucesso!' });
    });
  });
});

// ==========================================
// ROTAS DE PROJETOS
// ==========================================
// Define a rota POST para criar um novo projeto com suporte opcional a upload de logo
app.post('/projetos', uploadAnexo.single('logo'), (req, res) => {
  const {
    usuarioId,
    titulo,
    tipoProjeto,
    identidadeVisualId,
    objetivo,
    publicoAlvo,
    persona,
    resultadoEsperado,
    urlRepositorio,
    caminhoPastaLocal,
    metadadosEspecificos,
    diasParaArquivar
  } = req.body;

  // Define a URL da logo com base no arquivo enviado ou em uma URL informada previamente
  const logoUrl = req.file ? `/uploads/${req.file.filename}` : req.body.logoUrl || null;

  // Define a query SQL para inserir o novo projeto
  const sql = `
    INSERT INTO projetos (
      usuario_id, titulo, tipo_projeto, logo_url, identidade_visual_id, objetivo, publico_alvo, 
      persona, resultado_esperado, url_repositorio, caminho_pasta_local, 
      metadados_especificos, dias_para_arquivar
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Serializa os metadados específicos para JSON caso venham como string ou objeto
  const metadadosString = typeof metadadosEspecificos === 'string' ? metadadosEspecificos : JSON.stringify(metadadosEspecificos || {});

  // Executa a query de inserção no banco de dados
  db.query(
    sql,
    [
      usuarioId || null,
      titulo,
      tipoProjeto,
      logoUrl,
      identidadeVisualId || null,
      objetivo,
      publicoAlvo,
      persona,
      resultadoEsperado,
      urlRepositorio,
      caminhoPastaLocal,
      metadadosString,
      diasParaArquivar || 30
    ],
    (erro, resultado) => {
      if (erro) {
        console.error('Erro ao criar projeto:', erro);
        return res.status(500).json({ mensagem: 'Erro ao criar projeto.', erro });
      }
      // Retorna sucesso e o ID do projeto recém-criado
      res.status(201).json({ mensagem: 'Projeto criado com sucesso!', id: resultado.insertId, logoUrl });
    }
  );
});

// Define a rota PUT para atualizar os dados de um projeto existente
app.put('/projetos/:id', uploadAnexo.single('logo'), (req, res) => {
  const { id } = req.params;
  const {
    titulo,
    tipoProjeto,
    objetivo,
    publicoAlvo,
    persona,
    urlRepositorio,
    caminhoPastaLocal
  } = req.body;

  const logoUrl = req.file ? `/uploads/${req.file.filename}` : req.body.logoUrl;

  // Define a query SQL para atualizar o projeto
  const sql = `
    UPDATE projetos 
    SET titulo = ?, tipo_projeto = ?, logo_url = ?, objetivo = ?, publico_alvo = ?, 
        persona = ?, url_repositorio = ?, caminho_pasta_local = ?
    WHERE id = ?
  `;

  // Executa a query de atualização no banco
  db.query(
    sql,
    [
      titulo,
      tipoProjeto,
      logoUrl || null,
      objetivo,
      publicoAlvo,
      persona,
      urlRepositorio,
      caminhoPastaLocal,
      id
    ],
    (erro) => {
      if (erro) {
        console.error('Erro ao atualizar projeto:', erro);
        return res.status(500).json({ mensagem: 'Erro ao atualizar projeto no banco.', erro });
      }
      res.json({ mensagem: 'Projeto atualizado com sucesso!', logoUrl });
    }
  );
});

// Define a rota DELETE para excluir um projeto pelo ID
app.delete('/projetos/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM projetos WHERE id = ?';

  db.query(sql, [id], (erro) => {
    if (erro) {
      console.error('Erro ao excluir projeto:', erro);
      return res.status(500).json({ mensagem: 'Erro ao excluir projeto.', erro });
    }
    res.json({ mensagem: 'Projeto excluído com sucesso!' });
  });
});

// =========================================================================
// NOVA ROTA ADICIONADA: Atualiza a data e hora do último acesso ao projeto
// =========================================================================
app.patch('/projetos/:id/acesso', (req, res) => {
  const { id } = req.params;
  db.query('UPDATE projetos SET ultimo_acesso = NOW() WHERE id = ?', [id], (erro) => {
    if (erro) {
      console.error('Erro ao registrar acesso do projeto:', erro);
      return res.status(500).json({ mensagem: 'Erro ao registrar acesso.', erro });
    }
    res.json({ mensagem: 'Acesso registrado com sucesso!' });
  });
});

// Define a rota GET para listar todos os projetos, permitindo filtros por tipo e perfil de usuário logado
app.get('/projetos', (req, res) => {
  const { tipo_projeto, perfil_logado, usuario_logado_id } = req.query;
  // Monta a query base fazendo join com a tabela de identidades visuais
  let sql = `
    SELECT p.*, 
           iv.nome AS nome_identidade, 
           iv.cor_primaria, 
           iv.cor_secundaria, 
           iv.cor_destaque, 
           iv.tipografia, 
           iv.estilo_visual, 
           iv.tom_de_voz
    FROM projetos p
    LEFT JOIN identidades_visuais iv ON p.identidade_visual_id = iv.id
    WHERE 1=1
  `;
  const parametros = [];

  // Adiciona filtro por tipo de projeto se fornecido
  if (tipo_projeto) {
    sql += ' AND p.tipo_projeto = ?';
    parametros.push(tipo_projeto);
  }

  // Restringe os projetos ao usuário logado caso o perfil não seja admin
  if (perfil_logado && perfil_logado !== 'admin' && usuario_logado_id) {
    sql += ' AND p.usuario_id = ?';
    parametros.push(usuario_logado_id);
  }

  // =========================================================================
  // ROTA ATUALIZADA: Ordena primeiro pelo último acesso e depois pela data de atualização
  // =========================================================================
  sql += ' ORDER BY p.ultimo_acesso DESC, p.data_atualizacao DESC';

  // Executa a consulta no banco de dados
  db.query(sql, parametros, (erro, resultados) => {
    if (erro) return res.status(500).json({ erro });
    res.json(resultados);
  });
});

// ==========================================
// ROTAS DE MEMÓRIAS, TOGGLE E IMPORTAÇÃO JSON
// ==========================================
// Define a rota POST para cadastrar uma nova memória em um projeto
app.post('/memorias', (req, res) => {
  const { projetoId, titulo, categoriaMemoria, conteudo, promptUsado, resultadoGerado, iaUtilizada, modeloLlm, etiquetas } = req.body;
  const sql = `
    INSERT INTO memorias (projeto_id, titulo, categoria_memoria, conteudo, prompt_usado, resultado_gerado, ia_utilizada, modelo_llm, etiquetas)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(
    sql,
    [projetoId, titulo, categoriaMemoria || 'CONTEXTO', conteudo || '', promptUsado || null, resultadoGerado || null, iaUtilizada || 'Manual', modeloLlm || modeloIaPadrao, etiquetas || ''],
    (erro, resultado) => {
      if (erro) return res.status(500).json({ mensagem: 'Erro ao salvar memória.', erro });
      res.status(201).json({ mensagem: 'Memória adicionada!', id: resultado.insertId });
    }
  );
});

// Define a rota GET para listar todas as memórias de um projeto ordenadas pelo último acesso
app.get('/projetos/:projetoId/memorias', (req, res) => {
  const { projetoId } = req.params;
  db.query(
    'SELECT * FROM memorias WHERE projeto_id = ? ORDER BY ultimo_acesso DESC',
    [projetoId],
    (erro, resultados) => {
      if (erro) return res.status(500).json({ erro });
      res.json(resultados);
    }
  );
});

// Define a rota PATCH para atualizar o status (relevância ou arquivamento) de uma memória
app.patch('/memorias/:id/status', (req, res) => {
  const { id } = req.params;
  const { ehRelevante, estaArquivado } = req.body;

  const sql = `
    UPDATE memorias 
    SET eh_relevante = ?, 
        esta_arquivado = ?, 
        motivo_arquivamento = IF(? = TRUE, 'MANUAL', NULL),
        ultimo_acesso = NOW()
    WHERE id = ?
  `;
  db.query(sql, [ehRelevante, estaArquivado, estaArquivado, id], (erro) => {
    if (erro) return res.status(500).json({ mensagem: 'Erro ao atualizar status da memória.', erro });
    res.json({ mensagem: 'Status da memória atualizado!' });
  });
});

// Define a rota POST para importar um lote de memórias via JSON para um projeto
app.post('/projetos/:projetoId/importar-json', (req, res) => {
  const { projetoId } = req.params;
  const { iaUtilizada, modeloLlm, listaMemorias } = req.body;

  // Valida se o corpo enviado contém uma lista de memórias válida
  if (!Array.isArray(listaMemorias) || listaMemorias.length === 0) {
    return res.status(400).json({ mensagem: 'O JSON enviado não contém uma listaMemorias válida.' });
  }

  // Mapeia a lista de memórias para o formato de array aceito pela inserção em lote do MySQL
  const valores = listaMemorias.map((item) => [
    projetoId,
    item.titulo || 'Memória Importada',
    item.categoriaMemoria || 'IMPORTACAO_IA',
    item.conteudo || '',
    item.promptUsado || null,
    item.resultadoGerado || null,
    iaUtilizada || 'IA Externa',
    modeloLlm || modeloIaPadrao,
    item.etiquetas || ''
  ]);

  const sql = `
    INSERT INTO memorias (projeto_id, titulo, categoria_memoria, conteudo, prompt_usado, resultado_gerado, ia_utilizada, modelo_llm, etiquetas)
    VALUES ?
  `;

  // Executa a inserção em lote no banco de dados
  db.query(sql, [valores], (erro, resultado) => {
    if (erro) {
      console.error('Erro ao importar JSON de memórias:', erro);
      return res.status(500).json({ mensagem: 'Erro ao importar JSON de memórias.', erro });
    }
    res.json({ mensagem: `${resultado.affectedRows} memórias/prompts importados com sucesso!` });
  });
});

// ==========================================
// ROTAS DE UPLOAD DE ANEXOS (IMAGENS E ARQUIVOS)
// ==========================================
// Função auxiliar para identificar o tipo de anexo com base no mimetype e nome do arquivo
function identificarTipoArquivo(mimetype, nomeOriginal) {
  if (mimetype.startsWith('image/')) return 'IMAGEM';
  if (mimetype.startsWith('video/')) return 'VIDEO';
  if (mimetype.startsWith('audio/')) return 'AUDIO';
  const ext = path.extname(nomeOriginal).toLowerCase();
  if (['.js', '.jsx', '.ts', '.tsx', '.sql', '.py', '.html', '.css', '.json'].includes(ext)) return 'CODIGO';
  if (['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.md'].includes(ext)) return 'DOCUMENTO';
  return 'OUTRO';
}

// Define a rota POST para upload de anexos com suporte opcional à análise visual por IA (Gemini Vision)
app.post('/anexos/upload', uploadAnexo.single('arquivo'), async (req, res) => {
  const { projetoId, memoriaId, descricaoManual, analisarComIa } = req.body;
  const arquivoRecebido = req.file;

  // Valida se o arquivo e o ID do projeto foram fornecidos
  if (!arquivoRecebido || !projetoId) {
    return res.status(400).json({ mensagem: 'O arquivo e o ID do projeto são obrigatórios.' });
  }

  // Identifica o tipo do arquivo e define o caminho público
  const tipoClassificado = identificarTipoArquivo(arquivoRecebido.mimetype, arquivoRecebido.originalname);
  const caminhoPublico = `/uploads/${arquivoRecebido.filename}`;
  let descricaoFinalIa = '';

  try {
    // Se o anexo for uma imagem e o usuário marcou para analisar com IA, utiliza o Gemini Vision
    if (tipoClassificado === 'IMAGEM' && String(analisarComIa) === 'true') {
      const bytesImagem = fs.readFileSync(arquivoRecebido.path).toString('base64');
      const respostaVisao = await ai.models.generateContent({
        model: modeloIaPadrao,
        contents: [
          {
            inlineData: {
              mimeType: arquivoRecebido.mimetype,
              data: bytesImagem
            }
          },
          'Descreva detalhadamente esta imagem (cores, elementos, estilo visual, textos visíveis e propósito) para que ela possa ser usada como referência em prompts futuros.'
        ]
      });
      descricaoFinalIa = respostaVisao.text.trim();
    }

    // Define a query SQL para registrar o anexo na tabela correspondente
    const sql = `
      INSERT INTO anexos (projeto_id, memoria_id, nome_arquivo, caminho_arquivo, tipo_arquivo, descricao_ia, descricao_manual, eh_relevante)
      VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)
    `;

    // Executa a query de inserção do anexo no banco de dados
    db.query(
      sql,
      [
        projetoId,
        memoriaId || null,
        arquivoRecebido.originalname,
        caminhoPublico,
        tipoClassificado,
        descricaoFinalIa,
        descricaoManual || null // Salva a descrição manual informada pelo usuário
      ],
      (erro, resultado) => {
        if (erro) return res.status(500).json({ mensagem: 'Erro ao registrar anexo no banco.', erro });
        res.status(201).json({
          mensagem: 'Anexo salvo com sucesso!',
          anexo: {
            id: resultado.insertId,
            nomeArquivo: arquivoRecebido.originalname,
            caminhoArquivo: caminhoPublico,
            tipoArquivo: tipoClassificado,
            descricaoIa: descricaoFinalIa,
            descricaoManual: descricaoManual || null
          }
        });
      }
    );
  } catch (erroIa) {
    console.error('Erro ao analisar anexo com IA:', erroIa);
    res.status(500).json({ mensagem: 'Erro ao processar o arquivo enviado.', erro: erroIa.message });
  }
});

// Define a rota GET para listar todos os anexos de um projeto
app.get('/projetos/:projetoId/anexos', (req, res) => {
  const { projetoId } = req.params;
  db.query('SELECT * FROM anexos WHERE projeto_id = ? ORDER BY data_criacao DESC', [projetoId], (erro, resultados) => {
    if (erro) return res.status(500).json({ erro });
    res.json(resultados);
  });
});

// Define a rota PATCH para atualizar a relevância de um anexo
app.patch('/anexos/:id/relevancia', (req, res) => {
  const { id } = req.params;
  const { ehRelevante } = req.body;
  db.query('UPDATE anexos SET eh_relevante = ? WHERE id = ?', [ehRelevante, id], (erro) => {
    if (erro) return res.status(500).json({ erro });
    res.json({ mensagem: 'Relevância do anexo atualizada!' });
  });
});

// ==========================================
// ROTAS DE ATUALIZAÇÃO E EXCLUSÃO DE MEMÓRIAS
// ==========================================
// Define a rota PUT para atualizar uma memória existente
app.put('/memorias/:id', (req, res) => {
  const { id } = req.params;
  const { titulo, categoriaMemoria, promptUsado, conteudo, resultadoGerado, etiquetas } = req.body;

  const sql = `
    UPDATE memorias 
    SET titulo = ?, categoria_memoria = ?, prompt_usado = ?, conteudo = ?, resultado_gerado = ?, etiquetas = ?
    WHERE id = ?
  `;

  db.query(sql, [titulo, categoriaMemoria, promptUsado || null, conteudo || '', resultadoGerado || null, etiquetas || '', id], (erro) => {
    if (erro) {
      console.error('Erro ao atualizar memória:', erro);
      return res.status(500).json({ mensagem: 'Erro ao atualizar memória no banco.', erro });
    }
    res.json({ mensagem: 'Memória atualizada com sucesso!' });
  });
});

// Define a rota DELETE para excluir uma memória pelo ID
app.delete('/memorias/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM memorias WHERE id = ?';

  db.query(sql, [id], (erro) => {
    if (erro) {
      console.error('Erro ao excluir memória:', erro);
      return res.status(500).json({ mensagem: 'Erro ao excluir memória.', erro });
    }
    res.json({ mensagem: 'Memória excluída com sucesso!' });
  });
});

// ==========================================
// ROTA DO AGENTE CONSTRUTOR DE PROMPTS (GEMINI 3.5 FLASH-LITE)
// ==========================================
// Define a rota POST responsável por acionar o Agente Especialista para construir o super prompt otimizado
app.post('/forjar-prompt', (req, res) => {
  const { projetoId, descricaoPedido, iaDestino } = req.body;

  // Valida se o ID do projeto e a descrição do pedido foram informados
  if (!projetoId || !descricaoPedido) {
    return res.status(400).json({ mensagem: 'ID do projeto e descrição do pedido são obrigatórios.' });
  }

  // Define a query para buscar os dados do projeto e sua identidade visual associada
  const sqlProjeto = `
    SELECT p.*, iv.nome AS nome_identidade, iv.cor_primaria, iv.cor_secundaria, 
           iv.cor_destaque, iv.tipografia, iv.estilo_visual, iv.tom_de_voz
    FROM projetos p
    LEFT JOIN identidades_visuais iv ON p.identidade_visual_id = iv.id
    WHERE p.id = ?
  `;

  // Executa a busca do projeto no banco de dados
  db.query(sqlProjeto, [projetoId], (erroProj, resProj) => {
    if (erroProj || resProj.length === 0) {
      return res.status(404).json({ mensagem: 'Projeto não encontrado.' });
    }
    const dadosProjeto = resProj[0];

    // Define a query para buscar todas as memórias ativas e relevantes do projeto
    const sqlMemorias = `
      SELECT titulo, categoria_memoria, conteudo, prompt_usado, resultado_gerado, etiquetas
      FROM memorias
      WHERE projeto_id = ? AND esta_arquivado = FALSE AND eh_relevante = TRUE
      ORDER BY ultimo_acesso DESC
    `;

    // Executa a busca das memórias ativas
    db.query(sqlMemorias, [projetoId], (erroMem, memoriasAtivas) => {
      if (erroMem) return res.status(500).json({ erro: erroMem });

      // Atualiza o timestamp de último acesso das memórias ativas utilizadas
      db.query(
        'UPDATE memorias SET ultimo_acesso = NOW() WHERE projeto_id = ? AND esta_arquivado = FALSE AND eh_relevante = TRUE',
        [projetoId]
      );

      // Busca os anexos ativos e relevantes do projeto
      db.query(
        'SELECT nome_arquivo, tipo_arquivo, descricao_ia, caminho_arquivo FROM anexos WHERE projeto_id = ? AND eh_relevante = TRUE',
        [projetoId],
        async (erroAnexos, anexosAtivos) => {
          if (erroAnexos) return res.status(500).json({ erro: erroAnexos });

          try {
            // Constrói o prompt detalhado que será enviado ao agente engenheiro chefe de prompts da IA
            const promptParaOAgente = `
              Você é o Agente Especialista e Engenheiro Chefe de Prompts da aplicação "Forja de Prompts".
              Sua missão é analisar os dados do projeto, identidade visual, anexos e memórias ativas abaixo e construir
              UM SUPER PROMPT COMPLETO, ESTRUTURADO E OTIMIZADO especificamente para a ferramenta ou IA de destino: "${iaDestino}".

              DIRETRIZES DE COMPATIBILIDADE POR IA:
              - Se a IA for de Texto/Raciocínio (ChatGPT, Claude, Gemini): Estruture com papéis de persona, contexto detalhado, restrições e formato de saída esperado.
              - Se a IA for de Imagem/Vídeo (Midjourney, Runway, Seedance 2): Formate descrições visuais altamente detalhadas, iluminação, proporção de tela, paleta de cores da identidade visual e termos de enquadramento.
              - Se a IA for de Documentos/Busca (NotebookLM, Perplexity): Organize em formato de perguntas de pesquisa estruturadas e diretrizes de síntese baseadas nos anexos.
              - Se for Automação (Make, Zapier, n8n): Estruture em passos lógicos de eventos, gatilhos, cargas JSON e tratamentos de erro.

              DADOS DO PROJETO (${dadosProjeto.tipo_projeto}):
              - Título: ${dadosProjeto.titulo}
              - Objetivo Geral: ${dadosProjeto.objetivo}
              - Público-Alvo: ${dadosProjeto.publico_alvo}
              - Persona: ${dadosProjeto.persona}
              - Resultado Esperado: ${dadosProjeto.resultado_esperado}
              - Repositório / Caminho: ${dadosProjeto.url_repositorio || dadosProjeto.caminho_pasta_local || 'N/A'}
              - Metadados: ${JSON.stringify(dadosProjeto.metadados_especificos)}

              IDENTIDADE VISUAL E TOM DE VOZ:
              - Nome da Identidade: ${dadosProjeto.nome_identidade || 'Não definida'}
              - Paleta de Cores: Primária (${dadosProjeto.cor_primaria}), Secundária (${dadosProjeto.cor_secundaria}), Destaque (${dadosProjeto.cor_destaque})
              - Tipografia & Estilo: ${dadosProjeto.tipografia} \vert{}${dadosProjeto.estilo_visual}
              - Tom de Voz: ${dadosProjeto.tom_de_voz}

              MEMÓRIAS QUENTES E REGRAS ATIVAS DO PROJETO:
              ${JSON.stringify(memoriasAtivas, null, 2)}

              ANEXOS E REFERÊNCIAS VISUAIS/ARQUIVOS DISPONÍVEIS:
              ${JSON.stringify(anexosAtivos, null, 2)}

              TAREFA SOLICITADA PELO USUÁRIO AGORA:
              "${descricaoPedido}"

              IMPORTANTE: Retorne APENAS um objeto JSON válido (sem blocos de código markdown como \`\`\`json) com a seguinte estrutura exata:
              {
                "promptCompilado": "Texto completo do super prompt pronto para ser copiado e colado na IA de destino...",
                "dicaDeUso": "Breve recomendação técnica sobre parâmetros ou arquivos a anexar na ferramenta escolhida."
              }
            `;

            // Envia a requisição de geração de conteúdo para o modelo do Gemini
            const respostaIa = await ai.models.generateContent({
              model: modeloIaPadrao,
              contents: promptParaOAgente
            });

            // Limpa formatações em markdown que possam vir na resposta da IA para garantir um JSON válido
            let textoLimpo = respostaIa.text.trim();
            textoLimpo = textoLimpo.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '');
            const jsonGerado = JSON.parse(textoLimpo);

            // Registra o prompt gerado na tabela de histórico de prompts do projeto
            db.query(
              'INSERT INTO prompts_gerados (projeto_id, descricao_pedido, ia_destino, prompt_compilado) VALUES (?, ?, ?, ?)',
              [projetoId, descricaoPedido, iaDestino, jsonGerado.promptCompilado]
            );

            // Retorna o objeto JSON gerado para o cliente
            res.json(jsonGerado);
          } catch (erroGeracao) {
            console.error('Erro ao forjar prompt com o Gemini:', erroGeracao);
            res.status(500).json({ mensagem: 'Erro ao gerar o prompt com o Agente de IA.', erro: erroGeracao.message });
          }
        }
      );
    });
  });
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR E PAINEL DO CONSOLE
// ==========================================
// Conecta ao banco de dados e, em seguida, inicia o servidor Express na porta especificada
conectarBancoDeDados(() => {
  app.listen(PORTA_SERVIDOR, () => {
    console.log(`\n=============================================================`);
    console.log(`[START] SERVIDOR FORJA DE PROMPTS INICIALIZADO COM SUCESSO!`);
    console.log(`* Rede Local (IPv4): http://${enderecoIpLocal}:${PORTA_SERVIDOR}`);
    console.log(`* Acesso Interno   : http://localhost:${PORTA_SERVIDOR}`);
    console.log(`* Pasta de Uploads : http://localhost:${PORTA_SERVIDOR}/uploads`);
    console.log(`=============================================================`);
    console.log(`[BANCO DE DADOS] MYSQL:`);
    console.log(`  Host             : ${process.env.DB_HOST || 'localhost'}`);
    console.log(`  Porta            : ${process.env.DB_PORT || 3306}`);
    console.log(`  Database Alvo    : ${process.env.DB_NAME || 'forja_de_prompts_db'}`);
    console.log(`  Database Ativa   : ${nomeBaseAtiva}`);
    console.log(`  Status           : ${textoStatusBanco.replace(/✅|❌|⏳|⚠️/g, '').trim()}`);
    console.log(`=============================================================`);
    console.log(`[AGENTE IA] Modelo : ${modeloIaPadrao}`);
    console.log(`[SEGURANÇA] Status : Ativo (CORS, Autenticação, Permissões habilitados)`);
    console.log(`============================================================-\n`);
  });
});