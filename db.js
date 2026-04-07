const http = require('http');
const { URL } = require('url');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'projeto_es',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

function responderJson(res, statusCode, dados) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=UTF-8'
  });

  res.end(JSON.stringify(dados));
}

function responderTexto(res, statusCode, conteudo, tipoConteudo) {
  res.writeHead(statusCode, {
    'Content-Type': tipoConteudo
  });

  res.end(conteudo);
}

function servirArquivoEstatico(res, nomeArquivo) {
  const caminhoArquivo = path.join(__dirname, nomeArquivo);

  const tipos = {
    '.html': 'text/html; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8'
  };

  const extensao = path.extname(caminhoArquivo).toLowerCase();
  const tipoConteudo = tipos[extensao] || 'application/octet-stream';

  fs.readFile(caminhoArquivo, (erro, conteudo) => {
    if (erro) {
      responderJson(res, 500, {
        sucesso: false,
        mensagem: 'Erro ao carregar os arquivos da interface.'
      });
      return;
    }

    responderTexto(res, 200, conteudo, tipoConteudo);
  });
}

function validarProduto(nome, quantidade, preco, fornecedor) {
  if (!nome || !quantidade || !preco || !fornecedor) {
    return {
      valido: false,
      statusCode: 422,
      mensagem: 'Preencha todos os campos antes de continuar.'
    };
  }

  if (Number.isNaN(Number(preco))) {
    return {
      valido: false,
      statusCode: 422,
      mensagem: 'Informe um preço válido.'
    };
  }

  return { valido: true };
}

async function obterCorpo(req) {
  return new Promise((resolve, reject) => {
    let corpo = '';

    req.on('data', (chunk) => {
      corpo += chunk;
    });

    req.on('end', () => {
      const tipo = req.headers['content-type'] || '';

      if (tipo.includes('application/json')) {
        try {
          resolve(JSON.parse(corpo || '{}'));
        } catch (erro) {
          reject(new Error('JSON inválido no corpo da requisição.'));
        }

        return;
      }

      resolve(querystring.parse(corpo));
    });

    req.on('error', reject);
  });
}

async function listarProdutos(res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, nome, quantidade, preco, fornecedor FROM produtos ORDER BY id DESC'
    );

    const produtos = rows.map((linha) => ({
      id: Number(linha.id),
      nome: linha.nome,
      quantidade: linha.quantidade,
      preco: Number(linha.preco),
      fornecedor: linha.fornecedor
    }));

    responderJson(res, 200, {
      sucesso: true,
      produtos
    });
  } catch (erro) {
    responderJson(res, 500, {
      sucesso: false,
      mensagem: 'Erro ao carregar os produtos do banco de dados.'
    });
  }
}

async function inserirProduto(res, dados) {
  const nome = String(dados.nome || '').trim();
  const quantidade = String(dados.quantidade || '').trim();
  const preco = String(dados.preco || '').trim();
  const fornecedor = String(dados.fornecedor || '').trim();

  const validacao = validarProduto(nome, quantidade, preco, fornecedor);
  if (!validacao.valido) {
    responderJson(res, validacao.statusCode, {
      sucesso: false,
      mensagem: validacao.mensagem
    });
    return;
  }

  try {
    const [resultado] = await pool.execute(
      'INSERT INTO produtos (nome, quantidade, preco, fornecedor) VALUES (?, ?, ?, ?)',
      [nome, quantidade, preco, fornecedor]
    );

    responderJson(res, 201, {
      sucesso: true,
      mensagem: 'Produto cadastrado com sucesso.',
      produto: {
        id: Number(resultado.insertId),
        nome,
        quantidade,
        preco: Number(preco),
        fornecedor
      }
    });
  } catch (erro) {
    responderJson(res, 500, {
      sucesso: false,
      mensagem: 'Erro ao salvar o produto no banco de dados.'
    });
  }
}

async function editarProduto(res, dados) {
  const id = Number(dados.id || 0);
  const nome = String(dados.nome || '').trim();
  const quantidade = String(dados.quantidade || '').trim();
  const preco = String(dados.preco || '').trim();
  const fornecedor = String(dados.fornecedor || '').trim();

  if (id <= 0) {
    responderJson(res, 422, {
      sucesso: false,
      mensagem: 'Informe um produto válido para edição.'
    });
    return;
  }

  const validacao = validarProduto(nome, quantidade, preco, fornecedor);
  if (!validacao.valido) {
    responderJson(res, validacao.statusCode, {
      sucesso: false,
      mensagem: validacao.mensagem
    });
    return;
  }

  try {
    const [resultado] = await pool.execute(
      'UPDATE produtos SET nome = ?, quantidade = ?, preco = ?, fornecedor = ? WHERE id = ?',
      [nome, quantidade, preco, fornecedor, id]
    );

    if (resultado.affectedRows === 0) {
      const [produto] = await pool.execute('SELECT id FROM produtos WHERE id = ?', [id]);

      if (!produto.length) {
        responderJson(res, 404, {
          sucesso: false,
          mensagem: 'Produto não encontrado para edição.'
        });
        return;
      }
    }

    responderJson(res, 200, {
      sucesso: true,
      mensagem: 'Produto atualizado com sucesso.',
      produto: {
        id,
        nome,
        quantidade,
        preco: Number(preco),
        fornecedor
      }
    });
  } catch (erro) {
    responderJson(res, 500, {
      sucesso: false,
      mensagem: 'Erro ao atualizar o produto no banco de dados.'
    });
  }
}

async function deletarProduto(res, dados) {
  const id = Number(dados.id || 0);

  if (id <= 0) {
    responderJson(res, 422, {
      sucesso: false,
      mensagem: 'Informe um produto válido para exclusão.'
    });
    return;
  }

  try {
    const [resultado] = await pool.execute('DELETE FROM produtos WHERE id = ?', [id]);

    if (resultado.affectedRows === 0) {
      responderJson(res, 404, {
        sucesso: false,
        mensagem: 'Produto não encontrado para exclusão.'
      });
      return;
    }

    responderJson(res, 200, {
      sucesso: true,
      mensagem: 'Produto deletado com sucesso.'
    });
  } catch (erro) {
    responderJson(res, 500, {
      sucesso: false,
      mensagem: 'Erro ao deletar o produto do banco de dados.'
    });
  }
}

async function processarRequisicao(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET') {
    if (url.pathname === '/' || url.pathname === '/index' || url.pathname === '/index.html') {
      servirArquivoEstatico(res, 'front.html');
      return;
    }

    if (url.pathname === '/front.html' || url.pathname === '/prog.js' || url.pathname === '/style.css') {
      servirArquivoEstatico(res, url.pathname.slice(1));
      return;
    }
  }

  if (url.pathname !== '/produtos') {
    responderJson(res, 404, {
      sucesso: false,
      mensagem: 'Rota não encontrada.'
    });
    return;
  }

  if (req.method === 'GET') {
    await listarProdutos(res);
    return;
  }

  if (req.method !== 'POST') {
    responderJson(res, 405, {
      sucesso: false,
      mensagem: 'Método não permitido.'
    });
    return;
  }

  try {
    const dados = await obterCorpo(req);
    const acao = String(dados.acao || 'inserir').trim();

    if (acao === 'editar') {
      await editarProduto(res, dados);
      return;
    }

    if (acao === 'deletar') {
      await deletarProduto(res, dados);
      return;
    }

    await inserirProduto(res, dados);
  } catch (erro) {
    responderJson(res, 400, {
      sucesso: false,
      mensagem: erro.message || 'Não foi possível processar a requisição.'
    });
  }
}

function criarServidor() {
  return http.createServer((req, res) => {
    processarRequisicao(req, res);
  });
}

if (require.main === module) {
  const porta = Number(process.env.PORT || 3000);
  const servidor = criarServidor();

  servidor.listen(porta, () => {
    console.log(`Servidor Node ativo em http://localhost:${porta}/produtos`);
  });
}

module.exports = {
  pool,
  criarServidor,
  processarRequisicao,
  listarProdutos,
  inserirProduto,
  editarProduto,
  deletarProduto
};
