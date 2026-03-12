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

    // 6. Faz a tabela ficar visível
    tabela.style.display = 'table';

    // 7. Limpa o formulário para a próxima inserção
    document.querySelector('form').reset();
}