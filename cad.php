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
$id = trim($_POST['id'] ?? '');
$quantidade = trim($_POST['quantidade'] ?? '');
$preco = trim($_POST['preco'] ?? '');
$fornecedor = trim($_POST['fornecedor'] ?? '');

if ($nome === '' || $id === '' || $quantidade === '' || $preco === '' || $fornecedor === '') {
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

$verifica = mysqli_prepare($conn, 'SELECT id FROM produtos WHERE id = ? LIMIT 1');
mysqli_stmt_bind_param($verifica, 's', $id);
mysqli_stmt_execute($verifica);
mysqli_stmt_store_result($verifica);

if (mysqli_stmt_num_rows($verifica) > 0) {
    http_response_code(409);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Este ID já está cadastrado no banco de dados.'
    ], JSON_UNESCAPED_UNICODE);
    mysqli_stmt_close($verifica);
    mysqli_close($conn);
    exit;
}

mysqli_stmt_close($verifica);

$sql = mysqli_prepare($conn, 'INSERT INTO produtos (id, nome, quantidade, preco, fornecedor) VALUES (?, ?, ?, ?, ?)');
mysqli_stmt_bind_param($sql, 'sssss', $id, $nome, $quantidade, $preco, $fornecedor);

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

mysqli_stmt_close($sql);
mysqli_close($conn);

echo json_encode([
    'sucesso' => true,
    'mensagem' => 'Produto cadastrado com sucesso sem recarregar a página.',
    'produto' => [
        'id' => $id,
        'nome' => $nome,
        'quantidade' => $quantidade,
        'preco' => $preco,
        'fornecedor' => $fornecedor
    ]
], JSON_UNESCAPED_UNICODE);
