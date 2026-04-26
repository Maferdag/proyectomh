function validarDatos() {
    // Obtener los valores de los campos
    const nombre = document.forms["form"]["nombre completo"].value.trim();
    const correo = document.forms["form"]["correo electronico"].value.trim();
    const telefono = document.forms["form"]["telefono"].value.trim();
    const contraseña = document.forms["form"]["contraseña"].value.trim();
    
    // Validar que los campos no estén vacíos
    if (nombre === "") {
        alert("Por favor, ingresa tu nombre completo");
        return false;
    }
    
    if (correo === "") {
        alert("Por favor, ingresa tu correo electrónico");
        return false;
    }
    
    if (telefono === "") {
        alert("Por favor, ingresa tu teléfono");
        return false;
    }
    
    if (contraseña === "") {
        alert("Por favor, ingresa tu contraseña");
        return false;
    }
    
    // Validar nombre (solo letras y espacios Expresion regular es un patron de busqueda)
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
        alert("El nombre solo debe contener letras y espacios");
        return false;
    }
    
    // Validar formato de correo electrónico
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        alert("Por favor, ingresa un correo electrónico válido");
        return false;
    }
    
    // Validar teléfono (solo números, mínimo 8 dígitos)
    if (!/^\d{8,}$/.test(telefono)) {
        alert("El teléfono debe contener solo números y al menos 8 dígitos");
        return false;
    }
    
    // Validar contraseña (mínimo 6 caracteres)
    if (contraseña.length < 6) {
        alert("La contraseña debe tener al menos 6 caracteres");
        return false;
    }
    
    // Si todo está bien, el formulario se envía
    return true;
}