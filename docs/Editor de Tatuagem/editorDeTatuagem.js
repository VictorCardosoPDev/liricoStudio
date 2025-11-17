import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let model;
let selectedTattooMesh = null;
let isDragging = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tattoos = [];

init();
animate();

function init() {
  const container = document.getElementById('editor3D-container');

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaaaaaa);

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 3.4, 9);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 3.4, 0);
  controls.update();

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);

  const loader = new GLTFLoader();
  document.getElementById('loading-indicator').style.display = 'block';
  loader.load('assets/models/Human_Body.glb', function(gltf) {

    model = gltf.scene;
    model.scale.set(1.5, 1.5, 1.5);

    // Centralizar o modelo verticalmente
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Reposiciona o modelo para que o centro fique em (0, 1.5, 0)
    model.position.set(
      model.position.x - center.x,
      model.position.y - box.min.y, // sobe até a base tocar y = 0
      model.position.z - center.z
    );

    scene.add(model);


    document.getElementById('loading-indicator').style.display = 'none';
  });

  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  document.querySelectorAll('.tattoo-option').forEach(img => {
    img.addEventListener('click', () => loadTattoo(img.src));
  });

  document.getElementById('custom-upload').addEventListener('change', async function(event) {
    const file = event.target.files[0];
    if (!file) return;
  
    // Envia a imagem para o backend FastAPI
    const formData = new FormData();
    formData.append('file', file);
  
    try {
      const response = await fetch('http://localhost:8000/remove-background', {
        method: 'POST',
        body: formData,
      });
  
      if (!response.ok) throw new Error('Erro ao remover fundo');
  
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
  
      loadTattoo(imageUrl); // Aplica no modelo
  
    } catch (err) {
      console.error('Erro ao remover fundo:', err);
      alert('Falha ao processar a imagem. Tente novamente.');
    }
  });
  

  // === Controles de sliders ===
  document.getElementById('opacity-control').addEventListener('input', (e) => {
    const value = parseFloat(e.target.value) / 100;
    if (selectedTattooMesh) {
      selectedTattooMesh.material.opacity = value;
    }
  });

  document.getElementById('size-control').addEventListener('input', (e) => {
    const size = parseFloat(e.target.value) / 100;
    if (selectedTattooMesh) {
      selectedTattooMesh.scale.set(size, size, size);
    }
  });

  document.getElementById('rotation-control').addEventListener('input', (e) => {
    const value = THREE.MathUtils.degToRad(parseFloat(e.target.value));
    if (selectedTattooMesh) {
    selectedTattooMesh.rotation.z = value;
    }
  });

  document.getElementById('delete-tattoo-btn').addEventListener('click', () => {
    if (selectedTattooMesh) {
    scene.remove(selectedTattooMesh);
    const index = tattoos.indexOf(selectedTattooMesh);
    if (index !== -1) {
      tattoos.splice(index, 1);
    }
    selectedTattooMesh = null;
    document.getElementById('tattoo-controls').classList.add('hidden');
    }
  });

  document.getElementById('clear-btn').addEventListener('click', () => {
    tattoos.forEach(t => scene.remove(t));
    tattoos.length = 0;
    selectedTattooMesh = null;
    document.getElementById('tattoo-controls').classList.add('hidden');
    document.getElementById('delete-tattoo-btn').disabled = true;
  });

  renderer.domElement.addEventListener('pointerdown', (event) => {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Verifica se clicou em uma tatuagem
    const tattooHits = raycaster.intersectObjects(tattoos);
    if (tattooHits.length > 0) {
      const clickedTattoo = tattooHits[0].object;
      selectedTattooMesh = clickedTattoo;
      isDragging = true;
      controls.enabled = false;

      // Atualizar sliders
      document.getElementById('tattoo-controls').classList.remove('hidden');
      document.getElementById('opacity-control').value = selectedTattooMesh.material.opacity * 100;
      document.getElementById('size-control').value = selectedTattooMesh.scale.x * 100;
      document.getElementById('rotation-control').value = THREE.MathUtils.radToDeg(selectedTattooMesh.rotation.z);
      return;
    }

    // Verifica se clicou no corpo para posicionar
    const intersects = raycaster.intersectObject(model, true);
    if (intersects.length > 0 && selectedTattooMesh) {
      const intersect = intersects[0];
      selectedTattooMesh.position.copy(intersect.point);

      const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersect.object.matrixWorld);
      const normal = intersect.face.normal.clone().applyMatrix3(normalMatrix).normalize();
      const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      selectedTattooMesh.quaternion.copy(targetQuaternion);

      isDragging = true;
      controls.enabled = false;
      return;
    }

    // Se clicou fora do modelo, ativa movimentação da câmera
    isDragging = false;
    controls.enabled = true;
  });

  renderer.domElement.addEventListener('pointerup', () => {
    isDragging = false;
    controls.enabled = true; // volta a permitir mover o modelo
  });

  renderer.domElement.addEventListener('pointermove', (event) => {
    if (isDragging && selectedTattooMesh) {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(model, true);

      if (intersects.length > 0) {
        const intersect = intersects[0];
        selectedTattooMesh.position.copy(intersect.point);

        const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersect.object.matrixWorld);
        const normal = intersect.face.normal.clone().applyMatrix3(normalMatrix).normalize();
        const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        selectedTattooMesh.quaternion.copy(targetQuaternion);
      }
    }
  });

  document.getElementById('reset-view-btn').addEventListener('click', () => {
    camera.position.set(0, 3.4, 9);
    controls.target.set(0, 3.4, 0);
    controls.update();
  });

  document.getElementById('download-btn').addEventListener('click', () => {
    // Renderiza a cena novamente para garantir que está atualizada
    renderer.render(scene, camera);

    // Captura o canvas como imagem
    const imgDataUrl = renderer.domElement.toDataURL('image/png');

    // Cria um link temporário para download
    const link = document.createElement('a');
    link.href = imgDataUrl;
    link.download = 'simulacao_tatuagem.png';
    link.click();
  });

}

function onWindowResize() {
  const container = document.getElementById('editor3D-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function onPointerDown(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  // Primeiro: verificar se clicou em uma tatuagem existente
  const tattooHits = raycaster.intersectObjects(tattoos);
  if (tattooHits.length > 0) {
    const clickedTattoo = tattooHits[0].object;
    selectedTattooMesh = clickedTattoo;

    // Recarregar sliders com os valores da tatuagem clicada
    document.getElementById('tattoo-controls').classList.remove('hidden');
    document.getElementById('opacity-control').value = selectedTattooMesh.material.opacity * 100;
    document.getElementById('size-control').value = selectedTattooMesh.scale.x * 100;
    document.getElementById('rotation-control').value = THREE.MathUtils.radToDeg(selectedTattooMesh.rotation.z);
    return;
  }

const intersects = raycaster.intersectObject(model, true);
if (intersects.length > 0 && selectedTattooMesh) {
  const intersect = intersects[0];
  selectedTattooMesh.position.copy(intersect.point);

  const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersect.object.matrixWorld);
  const normal = intersect.face.normal.clone().applyMatrix3(normalMatrix).normalize();
  const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  selectedTattooMesh.quaternion.copy(targetQuaternion);
}

}


function loadTattoo(src) {
  const textureLoader = new THREE.TextureLoader();
  textureLoader.load(src, texture => {
    const geometry = new THREE.PlaneGeometry(0.3, 0.3);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false });
    const plane = new THREE.Mesh(geometry, material);

    // Posição inicial na região do peito
    plane.position.set(0, 1.5, 0.3);

    // Inclinação aproximada perpendicular ao peito
    plane.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0));

    scene.add(plane);
    selectedTattooMesh = plane;
    tattoos.push(plane);

    document.getElementById('delete-tattoo-btn').disabled = false;
    document.getElementById('tattoo-controls').classList.remove('hidden');
    document.getElementById('opacity-control').disabled = false;
    document.getElementById('size-control').disabled = false;
    document.getElementById('rotation-control').disabled = false;
  });
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

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