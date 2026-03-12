function gerarTabela() {
    // 1. Captura os elementos de entrada (Verifique as cedilhas!)
    const nome = document.getElementById('nome').value;
    const id = document.getElementById('id').value;
    const quantidade = document.getElementById('quantidade').value;
    const preco = document.getElementById('preço').value; // Com cedilha igual ao HTML
    const fornecedor = document.getElementById('fornecedor').value;

    // 2. Validação: verifica se algum campo está vazio
    if (!nome || !id || !quantidade || !preco || !fornecedor) {
        alert('Por favor, preencha todos os campos!');
        return;
    }

    // 3. Seleciona os elementos da tabela
    const tabela = document.getElementById('minhaTabela');
    const corpo = document.getElementById('corpoTabela');

    // 4. Cria uma nova linha e insere as células
    const novaLinha = corpo.insertRow();

    // 5. Preenche as células na ordem correta
    novaLinha.insertCell(0).innerText = id;
    novaLinha.insertCell(1).innerText = nome;
    novaLinha.insertCell(2).innerText = quantidade;
    novaLinha.insertCell(3).innerText = "R$ " + parseFloat(preco).toFixed(2);
    novaLinha.insertCell(4).innerText = fornecedor;

    const acoes = novaLinha.insertCell(5);
    acoes.innerHTML = `
        <button type="button" onclick="editarLinha(this)">Editar</button>
        <button type="button" onclick="deletarLinha(this)">Deletar</button>
    `;

    // 6. Faz a tabela ficar visível
    tabela.style.display = 'table';

    // 7. Limpa o formulário para a próxima inserção
    document.querySelector('form').reset();

    // 8. Reaplica filtro atual, se houver
    const termoAtual = document.getElementById('buscaProduto').value;
    filtrarProdutos(termoAtual);
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
    linha.cells[3].innerText = "R$ " + parseFloat(novoPreco).toFixed(2);
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
