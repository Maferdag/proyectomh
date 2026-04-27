<?php

session_start();

$conexion = new mysqli("localhost", "root", "", "tiendamh");

if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

$correo = $_POST['correo'];
$password = $_POST['password'];

$sql = "SELECT * FROM usuarios WHERE correo = ?";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("s", $correo);
$stmt->execute();

$resultado = $stmt->get_result();

if ($resultado->num_rows > 0) {

    $usuario = $resultado->fetch_assoc();

    if (password_verify($password, $usuario['password'])) {

        $_SESSION['usuario'] = $usuario['nombre'];

        // 🔥 AQUÍ EL CAMBIO
        header("Location: tienda.html");
        exit();

    } else {
        echo "❌ Contraseña incorrecta.";
    }

} else {
    echo "❌ Usuario no encontrado.";
}

$stmt->close();
$conexion->close();

?>