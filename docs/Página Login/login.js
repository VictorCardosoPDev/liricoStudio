// Por enquanto, apenas validações básicas podem ser adicionadas aqui
document.addEventListener("DOMContentLoaded", () => {
    const usuario = document.getElementById("usuario");
    const senha = document.getElementById("senha");
  
    usuario.addEventListener("input", () => {
      usuario.style.borderColor = "";
    });
  
    senha.addEventListener("input", () => {
      senha.style.borderColor = "";
    });
  });
  