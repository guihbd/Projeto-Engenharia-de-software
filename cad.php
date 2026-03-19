<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <?php 
    $host = "localhost";
    $user = "root";     
    $pass = "";         
    $db   = "projeto_es";

    $conn = mysqli_connect($host, $user, $pass, $db);

    $nome = $_POST['nome'];
    $id = $_POST['id'];
    $quantidade = $_POST['quantidade'];
    $preco = $_POST['preco'];
    $fornecedor = $_POST['fornecedor'];

    $sql = "INSERT INTO produtos (id, nome, quantidade, preco, fornecedor) VALUES ('$id', '$nome', '$quantidade', '$preco', '$fornecedor')";
    
    ?>
    
</body>
</html>



