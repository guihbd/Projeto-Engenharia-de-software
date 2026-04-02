function exibirMensagem(texto, tipo = 'sucesso') {
    const mensagem = document.getElementById('mensagemFormulario');
    mensagem.innerText = texto;
    mensagem.className = `mensagem-formulario ${tipo}`;
}

function limparMensagem() {
    const mensagem = document.getElementById('mensagemFormulario');
    mensagem.innerText = '';
    mensagem.className = 'mensagem-formulario';
}

function criarBotoesAcao() {
    const wrapper = document.createElement('div');

    const botaoEditar = document.createElement('button');
    botaoEditar.type = 'button';
    botaoEditar.innerText = 'Editar';
    botaoEditar.addEventListener('click', () => editarLinha(botaoEditar));

    const botaoDeletar = document.createElement('button');
    botaoDeletar.type = 'button';
    botaoDeletar.innerText = 'Deletar';
    botaoDeletar.addEventListener('click', () => deletarLinha(botaoDeletar));

    wrapper.appendChild(botaoEditar);
    wrapper.appendChild(botaoDeletar);

    return wrapper;
}

function preencherLinhaTabela(linha, produto) {
    linha.dataset.id = produto.id;
    linha.cells[0].innerText = produto.id;
    linha.cells[1].innerText = produto.nome;
    linha.cells[2].innerText = produto.quantidade;
    linha.cells[3].innerText = 'R$ ' + Number(produto.preco).toFixed(2);
    linha.cells[4].innerText = produto.fornecedor;
}

function adicionarLinhaTabela(produto) {
    const tabela = document.getElementById('minhaTabela');
    const corpo = document.getElementById('corpoTabela');
    const novaLinha = corpo.insertRow();

    for (let indice = 0; indice < 5; indice += 1) {
        novaLinha.insertCell(indice);
    }

    const acoes = novaLinha.insertCell(5);
    acoes.appendChild(criarBotoesAcao());

    preencherLinhaTabela(novaLinha, produto);
    tabela.style.display = 'table';

    const termoAtual = document.getElementById('buscaProduto').value;
    filtrarProdutos(termoAtual);
}

function preencherTabela(produtos) {
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '';

    produtos.forEach((produto) => {
        adicionarLinhaTabela(produto);
    });

    if (produtos.length === 0) {
        document.getElementById('minhaTabela').style.display = 'none';
    }
}

async function carregarProdutos() {
    try {
        const resposta = await fetch('/produtos', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            exibirMensagem(resultado.mensagem || 'Não foi possível carregar os produtos.', 'erro');
            return;
        }

        preencherTabela(resultado.produtos || []);
    } catch (erro) {
        exibirMensagem('Erro ao carregar os produtos cadastrados.', 'erro');
    }
}

async function enviarFormulario(evento) {
    evento.preventDefault();

    const formulario = document.getElementById('formProduto');
    const botaoInserir = document.getElementById('botaoInserir');
    const dados = new URLSearchParams({
        nome: formulario.nome.value.trim(),
        quantidade: formulario.quantidade.value.trim(),
        preco: formulario.preco.value.trim(),
        fornecedor: formulario.fornecedor.value.trim()
    });

    const nome = dados.get('nome');
    const quantidade = dados.get('quantidade');
    const preco = dados.get('preco');
    const fornecedor = dados.get('fornecedor');

    if (!nome || !quantidade || !preco || !fornecedor) {
        exibirMensagem('Por favor, preencha todos os campos.', 'erro');
        return;
    }

    if (Number.isNaN(Number(preco))) {
        exibirMensagem('Informe um preço válido.', 'erro');
        return;
    }

    limparMensagem();
    botaoInserir.disabled = true;
    botaoInserir.innerText = 'Inserindo...';

    try {
        const resposta = await fetch(formulario.action, {
            method: 'POST',
            body: dados.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            exibirMensagem(resultado.mensagem || 'Não foi possível salvar o produto.', 'erro');
            return;
        }

        adicionarLinhaTabela(resultado.produto);
        formulario.reset();
        exibirMensagem('Produto cadastrado com sucesso.', 'sucesso');
    } catch (erro) {
        exibirMensagem('Erro ao enviar os dados. Tente novamente.', 'erro');
    } finally {
        botaoInserir.disabled = false;
        botaoInserir.innerText = 'Inserir';
    }
}

async function editarLinha(botao) {
    const linha = botao.closest('tr');
    const id = linha.dataset.id;
    const nomeAtual = linha.cells[1].innerText;
    const quantidadeAtual = linha.cells[2].innerText;
    const precoAtual = linha.cells[3].innerText.replace('R$ ', '').replace(',', '.');
    const fornecedorAtual = linha.cells[4].innerText;

    const novoNome = prompt('Editar nome do produto:', nomeAtual);
    if (novoNome === null || novoNome.trim() === '') return;

    const novaQuantidade = prompt('Editar quantidade:', quantidadeAtual);
    if (novaQuantidade === null || novaQuantidade.trim() === '') return;

    const novoPreco = prompt('Editar preço:', precoAtual);
    if (novoPreco === null || novoPreco.trim() === '' || Number.isNaN(Number(novoPreco))) return;

    const novoFornecedor = prompt('Editar fornecedor:', fornecedorAtual);
    if (novoFornecedor === null || novoFornecedor.trim() === '') return;

    const dados = new URLSearchParams({
        acao: 'editar',
        id: String(id),
        nome: novoNome.trim(),
        quantidade: novaQuantidade.trim(),
        preco: novoPreco.trim(),
        fornecedor: novoFornecedor.trim()
    });

    botao.disabled = true;

    try {
        const resposta = await fetch('/produtos', {
            method: 'POST',
            body: dados.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            exibirMensagem(resultado.mensagem || 'Não foi possível atualizar o produto.', 'erro');
            return;
        }

        preencherLinhaTabela(linha, resultado.produto);
        exibirMensagem('Produto atualizado com sucesso.', 'sucesso');

        const termoAtual = document.getElementById('buscaProduto').value;
        filtrarProdutos(termoAtual);
    } catch (erro) {
        exibirMensagem('Erro ao atualizar o produto. Tente novamente.', 'erro');
    } finally {
        botao.disabled = false;
    }
}

async function deletarLinha(botao) {
    const tabela = document.getElementById('minhaTabela');
    const corpo = document.getElementById('corpoTabela');
    const linha = botao.closest('tr');
    const id = linha.dataset.id;

    const confirmou = confirm(`Deseja realmente deletar o produto ID ${id}?`);
    if (!confirmou) {
        return;
    }

    const dados = new URLSearchParams({
        acao: 'deletar',
        id: String(id)
    });

    botao.disabled = true;

    try {
        const resposta = await fetch('/produtos', {
            method: 'POST',
            body: dados.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            exibirMensagem(resultado.mensagem || 'Não foi possível deletar o produto.', 'erro');
            return;
        }

        linha.remove();
        exibirMensagem('Produto deletado com sucesso.', 'sucesso');

        if (corpo.rows.length === 0) {
            tabela.style.display = 'none';
            return;
        }

        const termoAtual = document.getElementById('buscaProduto').value;
        filtrarProdutos(termoAtual);
    } catch (erro) {
        exibirMensagem('Erro ao deletar o produto. Tente novamente.', 'erro');
    } finally {
        botao.disabled = false;
    }
}

function filtrarProdutos(termoBusca) {
    const tabela = document.getElementById('minhaTabela');
    const corpo = document.getElementById('corpoTabela');
    const linhas = corpo.querySelectorAll('tr');

    if (linhas.length === 0) {
        tabela.style.display = 'none';
        return;
    }

    const termo = termoBusca.trim().toLowerCase();
    let possuiLinhaVisivel = false;

    linhas.forEach((linha) => {
        const id = linha.cells[0].innerText.toLowerCase();
        const nome = linha.cells[1].innerText.toLowerCase();
        const fornecedor = linha.cells[4].innerText.toLowerCase();

        const corresponde = !termo || id.includes(termo) || nome.includes(termo) || fornecedor.includes(termo);

        linha.style.display = corresponde ? '' : 'none';

        if (corresponde) {
            possuiLinhaVisivel = true;
        }
    });

    tabela.style.display = possuiLinhaVisivel ? 'table' : 'none';
}

document.getElementById('formProduto').addEventListener('submit', enviarFormulario);
document.addEventListener('DOMContentLoaded', carregarProdutos);
