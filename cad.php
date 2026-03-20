<?php
header('Content-Type: application/json; charset=UTF-8');

$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'projeto_es';

function responderJson(int $statusCode, array $dados): void
{
    http_response_code($statusCode);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

function conectarBanco(string $host, string $user, string $pass, string $db): mysqli
{
    $conn = mysqli_connect($host, $user, $pass, $db);

    if (!$conn) {
        responderJson(500, [
            'sucesso' => false,
            'mensagem' => 'Falha ao conectar ao banco de dados.'
        ]);
    }

    mysqli_set_charset($conn, 'utf8mb4');

    return $conn;
}

function validarProduto(string $nome, string $quantidade, string $preco, string $fornecedor, mysqli $conn): void
{
    if ($nome === '' || $quantidade === '' || $preco === '' || $fornecedor === '') {
        mysqli_close($conn);
        responderJson(422, [
            'sucesso' => false,
            'mensagem' => 'Preencha todos os campos antes de continuar.'
        ]);
    }

    if (!is_numeric($preco)) {
        mysqli_close($conn);
        responderJson(422, [
            'sucesso' => false,
            'mensagem' => 'Informe um preço válido.'
        ]);
    }
}

$conn = conectarBanco($host, $user, $pass, $db);
$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $resultado = mysqli_query($conn, 'SELECT id, nome, quantidade, preco, fornecedor FROM produtos ORDER BY id DESC');

    if (!$resultado) {
        mysqli_close($conn);
        responderJson(500, [
            'sucesso' => false,
            'mensagem' => 'Erro ao carregar os produtos do banco de dados.'
        ]);
    }

    $produtos = [];

    while ($linha = mysqli_fetch_assoc($resultado)) {
        $produtos[] = [
            'id' => (int) $linha['id'],
            'nome' => $linha['nome'],
            'quantidade' => $linha['quantidade'],
            'preco' => (float) $linha['preco'],
            'fornecedor' => $linha['fornecedor']
        ];
    }

    mysqli_free_result($resultado);
    mysqli_close($conn);

    responderJson(200, [
        'sucesso' => true,
        'produtos' => $produtos
    ]);
}

if ($metodo !== 'POST') {
    mysqli_close($conn);
    responderJson(405, [
        'sucesso' => false,
        'mensagem' => 'Método não permitido.'
    ]);
}

$acao = trim($_POST['acao'] ?? 'inserir');
$id = (int) ($_POST['id'] ?? 0);
$nome = trim($_POST['nome'] ?? '');
$quantidade = trim($_POST['quantidade'] ?? '');
$preco = trim($_POST['preco'] ?? '');
$fornecedor = trim($_POST['fornecedor'] ?? '');

if ($acao === 'editar') {
    if ($id <= 0) {
        mysqli_close($conn);
        responderJson(422, [
            'sucesso' => false,
            'mensagem' => 'Informe um produto válido para edição.'
        ]);
    }

    validarProduto($nome, $quantidade, $preco, $fornecedor, $conn);

    $sql = mysqli_prepare($conn, 'UPDATE produtos SET nome = ?, quantidade = ?, preco = ?, fornecedor = ? WHERE id = ?');
    mysqli_stmt_bind_param($sql, 'ssssi', $nome, $quantidade, $preco, $fornecedor, $id);

    if (!mysqli_stmt_execute($sql)) {
        mysqli_stmt_close($sql);
        mysqli_close($conn);
        responderJson(500, [
            'sucesso' => false,
            'mensagem' => 'Erro ao atualizar o produto no banco de dados.'
        ]);
    }

    if (mysqli_stmt_affected_rows($sql) === 0) {
        $consulta = mysqli_prepare($conn, 'SELECT id FROM produtos WHERE id = ?');
        mysqli_stmt_bind_param($consulta, 'i', $id);
        mysqli_stmt_execute($consulta);
        mysqli_stmt_store_result($consulta);
        $produtoExiste = mysqli_stmt_num_rows($consulta) > 0;
        mysqli_stmt_close($consulta);

        if (!$produtoExiste) {
            mysqli_stmt_close($sql);
            mysqli_close($conn);
            responderJson(404, [
                'sucesso' => false,
                'mensagem' => 'Produto não encontrado para edição.'
            ]);
        }
    }

    mysqli_stmt_close($sql);
    mysqli_close($conn);

    responderJson(200, [
        'sucesso' => true,
        'mensagem' => 'Produto atualizado com sucesso.',
        'produto' => [
            'id' => $id,
            'nome' => $nome,
            'quantidade' => $quantidade,
            'preco' => (float) $preco,
            'fornecedor' => $fornecedor
        ]
    ]);
}

if ($acao === 'deletar') {
    if ($id <= 0) {
        mysqli_close($conn);
        responderJson(422, [
            'sucesso' => false,
            'mensagem' => 'Informe um produto válido para exclusão.'
        ]);
    }

    $sql = mysqli_prepare($conn, 'DELETE FROM produtos WHERE id = ?');
    mysqli_stmt_bind_param($sql, 'i', $id);

    if (!mysqli_stmt_execute($sql)) {
        mysqli_stmt_close($sql);
        mysqli_close($conn);
        responderJson(500, [
            'sucesso' => false,
            'mensagem' => 'Erro ao deletar o produto do banco de dados.'
        ]);
    }

    if (mysqli_stmt_affected_rows($sql) === 0) {
        mysqli_stmt_close($sql);
        mysqli_close($conn);
        responderJson(404, [
            'sucesso' => false,
            'mensagem' => 'Produto não encontrado para exclusão.'
        ]);
    }

    mysqli_stmt_close($sql);
    mysqli_close($conn);

    responderJson(200, [
        'sucesso' => true,
        'mensagem' => 'Produto deletado com sucesso.'
    ]);
}

validarProduto($nome, $quantidade, $preco, $fornecedor, $conn);

$sql = mysqli_prepare($conn, 'INSERT INTO produtos (nome, quantidade, preco, fornecedor) VALUES (?, ?, ?, ?)');
mysqli_stmt_bind_param($sql, 'ssss', $nome, $quantidade, $preco, $fornecedor);

if (!mysqli_stmt_execute($sql)) {
    mysqli_stmt_close($sql);
    mysqli_close($conn);
    responderJson(500, [
        'sucesso' => false,
        'mensagem' => 'Erro ao salvar o produto no banco de dados.'
    ]);
}

$idInserido = mysqli_insert_id($conn);

mysqli_stmt_close($sql);
mysqli_close($conn);

responderJson(201, [
    'sucesso' => true,
    'mensagem' => 'Produto cadastrado com sucesso.',
    'produto' => [
        'id' => $idInserido,
        'nome' => $nome,
        'quantidade' => $quantidade,
        'preco' => (float) $preco,
        'fornecedor' => $fornecedor
    ]
]);
