document.addEventListener('DOMContentLoaded', function() {
  console.log('portifolio.js carregado!');
  const boxJeff = document.getElementById('tatuador-jeff');
  const boxVivian = document.getElementById('tatuador-vivian');
  const galeriaJeff = document.getElementById('galeria-jeff');
  const galeriaVivian = document.getElementById('galeria-vivian');

  function fecharTodasGalerias() {
    galeriaJeff.classList.remove('ativo');
    galeriaVivian.classList.remove('ativo');
  }

  if (boxJeff && boxVivian) {
    boxJeff.addEventListener('click', function() {
      if (galeriaJeff.classList.contains('ativo')) {
        galeriaJeff.classList.remove('ativo');
      } else {
        fecharTodasGalerias();
        galeriaJeff.classList.add('ativo');
      }
    });
    boxVivian.addEventListener('click', function() {
      if (galeriaVivian.classList.contains('ativo')) {
        galeriaVivian.classList.remove('ativo');
      } else {
        fecharTodasGalerias();
        galeriaVivian.classList.add('ativo');
      }
    });
  }

  // --- Modal de imagem ampliada ---
  const modalZoom = document.getElementById('modal-img-zoom');
  const modalZoomImg = document.getElementById('modal-img-zoom-img');
  const modalZoomFechar = document.querySelector('.modal-img-zoom-fechar');

  document.querySelectorAll('.galeria-tatuagens img').forEach(img => {
    img.addEventListener('click', function(e) {
      e.stopPropagation();
      modalZoomImg.src = img.src;
      modalZoom.classList.add('ativo');
    });
  });

  modalZoomFechar.addEventListener('click', function() {
    modalZoom.classList.remove('ativo');
    modalZoomImg.src = '';
  });
  modalZoom.addEventListener('click', function(e) {
    if (e.target === modalZoom) {
      modalZoom.classList.remove('ativo');
      modalZoomImg.src = '';
    }
  });
});
//chatbot
const chatButton = document.getElementById("chat-button");
const chatContainer = document.getElementById("chat-container");
const closeChat = document.getElementById("close-chat");
const sendButton = document.getElementById("send-button");
const userInput = document.getElementById("user-input");
const chatMessages = document.getElementById("chat-messages");
const sugestaoBtn = document.getElementById("sugestao-Btn")

chatButton.addEventListener("click", () => {
  chatContainer.style.display = "flex";
  chatButton.style.display = "none";
  iniciarChat();
});

closeChat.addEventListener("click", () => {
  chatContainer.style.display = "none";
  chatButton.style.display = "flex";
});

sendButton.addEventListener("click", () => {
  const userText = userInput.value.trim();
  if (userText !== "") {
    addMessage("Você", userText);
    generateResponse(userText);
    userInput.value = "";
  }
});

function addMessage(sender, message) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("message");
  messageElement.innerHTML = `<strong>${sender}:</strong> ${message}`;
  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function iniciarChat() {
  // Impede que os botões sejam adicionados mais de uma vez
  if (document.getElementById("options-box")) return;

  const optionsDiv = document.createElement("div");
  optionsDiv.classList.add("message");
  optionsDiv.id = "options-box";

  const sugestaoBtn = document.createElement("button");
  sugestaoBtn.innerText = "Me dê uma sugestão";
  sugestaoBtn.classList.add("sugestao-btn", "limpar-btn");

  const limparBtn = document.createElement("button");
  limparBtn.innerText = "Limpar sugestão";
  limparBtn.classList.add("limpar-btn");
  limparBtn.style.display = "none"; // esconde até aparecer sugestão

  // Evento para gerar sugestão
  sugestaoBtn.addEventListener("click", () => {
    addMessage("Você", "Me dê uma sugestão");
    gerarSugestaoAleatoria();
    limparBtn.style.display = "inline-block";
  });

  // Evento para limpar sugestão
  limparBtn.addEventListener("click", () => {
    const mensagens = document.querySelectorAll("#chat-messages .message");
    for (let i = mensagens.length - 1; i >= 0; i--) {
      const msg = mensagens[i];
      if (msg.textContent.includes("Chatbot:")) {
        msg.remove();
        break;
      }
    }
    limparBtn.style.display = "none";
  });

  optionsDiv.appendChild(sugestaoBtn);
  optionsDiv.appendChild(limparBtn);
  chatMessages.appendChild(optionsDiv);
}



function gerarSugestaoAleatoria() {
  const sugestoes = [
    "Tatuagens com flores e natureza são delicadas e cheias de significado. Tatuagem de uma flor seria o ideal pra você 🌺🌿",
    "Animais são símbolos poderosos para tatuagens. 🐺🦁🦋",
    "Uma frase inspiradora pode carregar muito significado. ✍️",
    "Tatuagens afetivas eternizam vínculos e memórias. ❤️👨‍👩‍👧‍👦",
    "Tatuagens espirituais expressam fé, crença e conexão. ✝️🙏",
    "Símbolos místicos são profundos e únicos. 🌌🌙🔮",
    "Cultura pop em tatuagens mostra sua personalidade e paixões! 🎮📺🦸‍♂️",
    "Tatuagens com datas importantes eternizam momentos especiais. 📅💫",
    "Tatuagens que representam o que você ama são muito autênticas! 🎨📸🎶",
    "O estilo e o local fazem toda diferença na tatuagem! 💎✨",
    "Tatuagens dark e caveiras trazem um estilo forte e impactante. 💀🔥",
    "Tatuagens medievais e mitológicas são cheias de história e bravura! ⚔🐉",
    "Tatuagens náuticas representam liberdade e aventura. ⚓🌊",
    "Símbolos de sonhos e esperança dão um toque poético à tatuagem. 🌠✨",
    "Tatuagens sobre o tempo lembram a importância de cada instante. ⏳🕰",
    "Tatuagens futuristas são modernas e ousadas. 🤖🚀"
  ];
  const aleatoria = sugestoes[Math.floor(Math.random() * sugestoes.length)];
  addMessage("Chatbot", aleatoria);
}

function generateResponse(userText) {
  const text = userText.toLowerCase();
  let response = "Desculpe, não entendi sua pergunta.";

  if (
    text.includes("flor") || text.includes("flores") || text.includes("rosa") ||
    text.includes("girassol") || text.includes("lótus") || text.includes("peônia") ||
    text.includes("lavanda") || text.includes("árvore") || text.includes("natureza") ||
    text.includes("folha") || text.includes("raiz")
  ) {
    response = "Tatuagens com flores e natureza são delicadas e cheias de significado. 🌺🌿";
  } else if (
    text.includes("animal") || text.includes("lobo") || text.includes("leão") ||
    text.includes("tigre") || text.includes("elefante") || text.includes("borboleta") ||
    text.includes("coruja") || text.includes("pássaro") || text.includes("águia") ||
    text.includes("gato") || text.includes("cachorro") || text.includes("raposa") ||
    text.includes("cobra") || text.includes("dragão") || text.includes("fênix") ||
    text.includes("urso") || text.includes("cervo") || text.includes("tartaruga")
  ) {
    response = "Animais são símbolos poderosos para tatuagens. 🐺🦁🦋";
  } else if (
    text.includes("frase") || text.includes("frases") || text.includes("mensagem") ||
    text.includes("texto") || text.includes("citação") || text.includes("palavra") ||
    text.includes("verso") || text.includes("poesia") || text.includes("inspiração")
  ) {
    response = "Uma frase inspiradora pode carregar muito significado. ✍️";
  } else if (
    text.includes("amor") || text.includes("coração") || text.includes("família") ||
    text.includes("pai") || text.includes("mãe") || text.includes("filho") ||
    text.includes("filha") || text.includes("irmão") || text.includes("irmã") ||
    text.includes("namorado") || text.includes("namorada") || text.includes("marido") ||
    text.includes("esposa") || text.includes("amizade") || text.includes("relacionamento")
  ) {
    response = "Tatuagens afetivas eternizam vínculos e memórias. ❤️👨‍👩‍👧‍👦";
  } else if (
    text.includes("fé") || text.includes("deus") || text.includes("jesus") ||
    text.includes("oração") || text.includes("cruz") || text.includes("espiritual") ||
    text.includes("anjo") || text.includes("alma") || text.includes("religião") ||
    text.includes("espírito")
  ) {
    response = "Tatuagens espirituais expressam fé, crença e conexão. ✝️🙏";
  } else if (
    text.includes("símbolo") || text.includes("mandala") || text.includes("olho") ||
    text.includes("olho de hórus") || text.includes("yin yang") || text.includes("chakra") ||
    text.includes("infinito") || text.includes("zodíaco") || text.includes("signo") ||
    text.includes("lua") || text.includes("sol") || text.includes("planeta") ||
    text.includes("universo") || text.includes("galáxia") || text.includes("energia")
  ) {
    response = "Símbolos místicos são profundos e únicos. 🌌🌙🔮";
  } else if (
    text.includes("anime") || text.includes("mangá") || text.includes("filme") ||
    text.includes("série") || text.includes("game") || text.includes("jogo") ||
    text.includes("personagem") || text.includes("marvel") || text.includes("dc") ||
    text.includes("pokémon") || text.includes("naruto") || text.includes("one piece") ||
    text.includes("star wars") || text.includes("harry potter") || text.includes("goku")
  ) {
    response = "Cultura pop em tatuagens mostra sua personalidade e paixões! 🎮📺🦸‍♂️";
  } else if (
    text.includes("data") || text.includes("aniversário") || text.includes("nascimento") ||
    text.includes("morte") || text.includes("vida") || text.includes("eterno") ||
    text.includes("homenagem") || text.includes("memória")
  ) {
    response = "Tatuagens com datas importantes eternizam momentos especiais. 📅💫";
  } else if (
    text.includes("profissão") || text.includes("trabalho") || text.includes("música") ||
    text.includes("instrumento") || text.includes("arte") || text.includes("pincel") ||
    text.includes("dança") || text.includes("fotografia") || text.includes("câmera") ||
    text.includes("livro") || text.includes("caneta") || text.includes("culinária")
  ) {
    response = "Tatuagens que representam o que você ama são muito autênticas! 🎨📸🎶";
  } else if (
    text.includes("minimalista") || text.includes("realista") || text.includes("aquarela") ||
    text.includes("preto") || text.includes("branco") || text.includes("colorida") ||
    text.includes("traço fino") || text.includes("grande") || text.includes("pequena") ||
    text.includes("braço") || text.includes("perna") || text.includes("pulso") ||
    text.includes("costas") || text.includes("ombro") || text.includes("mão") ||
    text.includes("pescoço") || text.includes("dedo") || text.includes("tornozelo")
  ) {
    response = "O estilo e o local fazem toda diferença na tatuagem! 💎✨";
  } else if (
    text.includes("caveira") || text.includes("skull") || text.includes("gótica") ||
    text.includes("dark") || text.includes("sombria") || text.includes("terror") ||
    text.includes("demônio") || text.includes("monstro") || text.includes("macabro")
  ) {
    response = "Tatuagens dark e caveiras trazem um estilo forte e impactante. 💀🔥";
  } else if (
    text.includes("espada") || text.includes("armadura") || text.includes("cavaleiro") ||
    text.includes("castelo") || text.includes("vikings") || text.includes("mitologia") ||
    text.includes("deus nórdico") || text.includes("odin") || text.includes("thor")
  ) {
    response = "Tatuagens medievais e mitológicas são cheias de história e bravura! ⚔🐉";
  } else if (
    text.includes("mar") || text.includes("oceano") || text.includes("onda") ||
    text.includes("âncora") || text.includes("navio") || text.includes("bússola") ||
    text.includes("mapa") || text.includes("viagem") || text.includes("exploração")
  ) {
    response = "Tatuagens náuticas representam liberdade e aventura. ⚓🌊";
  } else if (
    text.includes("estrela") || text.includes("cometa") || text.includes("sonho") ||
    text.includes("esperança") || text.includes("futuro") || text.includes("destino")
  ) {
    response = "Símbolos de sonhos e esperança dão um toque poético à tatuagem. 🌠✨";
  } else if (
    text.includes("relógio") || text.includes("ampulheta") || text.includes("tempo") ||
    text.includes("passado") || text.includes("presente") || text.includes("eternidade")
  ) {
    response = "Tatuagens sobre o tempo lembram a importância de cada instante. ⏳🕰";
  } else if (
    text.includes("tecnologia") || text.includes("robô") || text.includes("cyberpunk") ||
    text.includes("futurista") || text.includes("inteligência artificial") ||
    text.includes("neon") || text.includes("matrix")
  ) {
    response = "Tatuagens futuristas são modernas e ousadas. 🤖🚀";
  }

  addMessage("Chatbot", response);
}