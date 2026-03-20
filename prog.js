function idJaExiste(idInformado, linhaIgnorada = null) {
    const corpo = document.getElementById('corpoTabela');
    const linhas = corpo.querySelectorAll('tr');
    const idNormalizado = idInformado.trim().toLowerCase();

    return Array.from(linhas).some((linha) => {
        if (linha === linhaIgnorada) {
            return false;
        }

        const idLinha = linha.cells[0].innerText.trim().toLowerCase();
        return idLinha === idNormalizado;
    });
}

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

function adicionarLinhaTabela(produto) {
    const tabela = document.getElementById('minhaTabela');
    const corpo = document.getElementById('corpoTabela');
    const novaLinha = corpo.insertRow();

    novaLinha.insertCell(0).innerText = produto.id;
    novaLinha.insertCell(1).innerText = produto.nome;
    novaLinha.insertCell(2).innerText = produto.quantidade;
    novaLinha.insertCell(3).innerText = 'R$ ' + Number(produto.preco).toFixed(2);
    novaLinha.insertCell(4).innerText = produto.fornecedor;

    const acoes = novaLinha.insertCell(5);
    acoes.innerHTML = `
        <button type="button" onclick="editarLinha(this)">Editar</button>
        <button type="button" onclick="deletarLinha(this)">Deletar</button>
    `;

    tabela.style.display = 'table';

    const termoAtual = document.getElementById('buscaProduto').value;
    filtrarProdutos(termoAtual);
}

async function enviarFormulario(evento) {
    evento.preventDefault();

    const formulario = document.getElementById('formProduto');
    const botaoInserir = document.getElementById('botaoInserir');
    const formData = new FormData(formulario);

    const nome = formData.get('nome').trim();
    const id = formData.get('id').trim();
    const quantidade = formData.get('quantidade').trim();
    const preco = formData.get('preco').trim();
    const fornecedor = formData.get('fornecedor').trim();

    if (!nome || !id || !quantidade || !preco || !fornecedor) {
        exibirMensagem('Por favor, preencha todos os campos.', 'erro');
        return;
    }

    if (Number.isNaN(Number(preco))) {
        exibirMensagem('Informe um preço válido.', 'erro');
        return;
    }

    if (idJaExiste(id)) {
        exibirMensagem('Este ID já está cadastrado. Informe um ID diferente.', 'erro');
        return;
    }

    limparMensagem();
    botaoInserir.disabled = true;
    botaoInserir.innerText = 'Inserindo...';

    try {
        const resposta = await fetch(formulario.action, {
            method: 'POST',
            body: formData,
            headers: {
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
        exibirMensagem(resultado.mensagem || 'Produto cadastrado com sucesso.', 'sucesso');
    } catch (erro) {
        exibirMensagem('Erro ao enviar os dados. Tente novamente.', 'erro');
    } finally {
        botaoInserir.disabled = false;
        botaoInserir.innerText = 'Inserir';
    }
}

function editarLinha(botao) {
    const linha = botao.closest('tr');
    const idAtual = linha.cells[0].innerText;
    const nomeAtual = linha.cells[1].innerText;
    const quantidadeAtual = linha.cells[2].innerText;
    const precoAtual = linha.cells[3].innerText.replace('R$ ', '').replace(',', '.');
    const fornecedorAtual = linha.cells[4].innerText;

    const novoId = prompt('Editar ID do produto:', idAtual);
    if (novoId === null || novoId.trim() === '') return;

    if (idJaExiste(novoId, linha)) {
        alert('Este ID já está cadastrado. Informe um ID diferente.');
        return;
    }

    const novoNome = prompt('Editar nome do produto:', nomeAtual);
    if (novoNome === null || novoNome.trim() === '') return;

    const novaQuantidade = prompt('Editar quantidade:', quantidadeAtual);
    if (novaQuantidade === null || novaQuantidade.trim() === '') return;

    const novoPreco = prompt('Editar preço:', precoAtual);
    if (novoPreco === null || novoPreco.trim() === '' || isNaN(parseFloat(novoPreco))) return;

    const novoFornecedor = prompt('Editar fornecedor:', fornecedorAtual);
    if (novoFornecedor === null || novoFornecedor.trim() === '') return;

    linha.cells[0].innerText = novoId;
    linha.cells[1].innerText = novoNome;
    linha.cells[2].innerText = novaQuantidade;
    linha.cells[3].innerText = 'R$ ' + parseFloat(novoPreco).toFixed(2);
    linha.cells[4].innerText = novoFornecedor;

    const termoAtual = document.getElementById('buscaProduto').value;
    filtrarProdutos(termoAtual);
}

function deletarLinha(botao) {
    const tabela = document.getElementById('minhaTabela');
    const corpo = document.getElementById('corpoTabela');
    const linha = botao.closest('tr');

    linha.remove();

    if (corpo.rows.length === 0) {
        tabela.style.display = 'none';
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
