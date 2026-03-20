<?php
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Método não permitido.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'projeto_es';

$conn = mysqli_connect($host, $user, $pass, $db);

if (!$conn) {
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Falha ao conectar ao banco de dados.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

mysqli_set_charset($conn, 'utf8mb4');

$nome = trim($_POST['nome'] ?? '');
$quantidade = trim($_POST['quantidade'] ?? '');
$preco = trim($_POST['preco'] ?? '');
$fornecedor = trim($_POST['fornecedor'] ?? '');

if ($nome === '' || $quantidade === '' || $preco === '' || $fornecedor === '') {
    http_response_code(422);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Preencha todos os campos antes de inserir.'
    ], JSON_UNESCAPED_UNICODE);
    mysqli_close($conn);
    exit;
}

if (!is_numeric($preco)) {
    http_response_code(422);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Informe um preço válido.'
    ], JSON_UNESCAPED_UNICODE);
    mysqli_close($conn);
    exit;
}

$sql = mysqli_prepare($conn, 'INSERT INTO produtos (nome, quantidade, preco, fornecedor) VALUES (?, ?, ?, ?)');
mysqli_stmt_bind_param($sql, 'ssss', $nome, $quantidade, $preco, $fornecedor);

if (!mysqli_stmt_execute($sql)) {
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao salvar o produto no banco de dados.'
    ], JSON_UNESCAPED_UNICODE);
    mysqli_stmt_close($sql);
    mysqli_close($conn);
    exit;
}

$idInserido = mysqli_insert_id($conn);

mysqli_stmt_close($sql);
mysqli_close($conn);

echo json_encode([
    'sucesso' => true,
    'mensagem' => 'Produto cadastrado com sucesso.',
    'produto' => [
        'id' => $idInserido,
        'nome' => $nome,
        'quantidade' => $quantidade,
        'preco' => $preco,
        'fornecedor' => $fornecedor
    ]
], JSON_UNESCAPED_UNICODE);
