/****************************************************
 *                    IMPORTS
 ****************************************************/
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


/****************************************************
 *          VARIÁVEIS GLOBAIS DO SISTEMA
 ****************************************************/
let scene, camera, renderer, controls;
let model;
let selectedTattooMesh = null;
let isDragging = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const tattoos = []; // todas as tatuagens adicionadas


/****************************************************
 *                    INICIALIZAÇÃO
 ****************************************************/
init();
animate();

/****************************************************
 *           FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO
 ****************************************************/
function init() {
  const container = document.getElementById('editor3D-container');

  /******************** CENA ********************/
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaaaaaa);

  /******************** CÂMERA ********************/
  camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 3.4, 9);

  /******************** RENDERER ********************/
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  /******************** CONTROLES ORBIT ********************/
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 3.4, 0);
  controls.update();

  /******************** ILUMINAÇÃO ********************/
  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);

  /******************** CARREGAR MODELO 3D ********************/
  const loader = new GLTFLoader();
  document.getElementById('loading-indicator').style.display = 'block';

  loader.load('assets/models/human_body.glb', function(gltf) {
    model = gltf.scene;
    model.scale.set(1.5, 1.5, 1.5);

    // Centralizar o modelo
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());

    model.position.set(
      model.position.x - center.x,
      model.position.y - box.min.y,
      model.position.z - center.z
    );

    scene.add(model);
    document.getElementById('loading-indicator').style.display = 'none';
  });

  /****************************************************
   *       EVENTOS: JANELA, CLIQUES E MOVIMENTOS
   ****************************************************/
  window.addEventListener('resize', onWindowResize);
  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', () => {
    isDragging = false;
    controls.enabled = true;
  });
  renderer.domElement.addEventListener('pointermove', dragTattoo);

  /****************************************************
   *                SELEÇÃO DE TATUAGENS
   ****************************************************/
  document.querySelectorAll('.tattoo-option').forEach(img => {
    img.addEventListener('click', () => loadTattoo(img.src));
  });

  /****************************************************
   *           UPLOAD CUSTOMIZADO DE IMAGEM
   ****************************************************/
  document.getElementById('custom-upload').addEventListener('change', handleCustomTattooUpload);

  /****************************************************
   *          SLIDERS: OPACIDADE, TAMANHO, ROTAÇÃO
   ****************************************************/
  document.getElementById('opacity-control').addEventListener('input', updateOpacity);
  document.getElementById('size-control').addEventListener('input', updateSize);
  document.getElementById('rotation-control').addEventListener('input', updateRotation);

  /****************************************************
   *             BOTÕES DE CRIAÇÃO E AÇÕES
   ****************************************************/
  document.getElementById('delete-tattoo-btn').addEventListener('click', deleteSelectedTattoo);
  document.getElementById('clear-btn').addEventListener('click', clearAllTattoos);
  document.getElementById('reset-view-btn').addEventListener('click', resetView);
  document.getElementById('download-btn').addEventListener('click', downloadImage);

  /****************************************************
   *            INICIAR SISTEMA DE CHAT
   ****************************************************/
  iniciarChatEvents();
}


/****************************************************
 *              RESPONSIVIDADE DA TELA
 ****************************************************/
function onWindowResize() {
  const container = document.getElementById('editor3D-container');
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}


/****************************************************
 *        GERENCIAMENTO DE CLIQUES NO MODELO
 ****************************************************/
function onPointerDown(event) {
  updateMousePosition(event);

  // Verifica clique em tatuagem existente
  const tattooHits = raycaster.intersectObjects(tattoos);
  if (tattooHits.length > 0) {
    selectTattoo(tattooHits[0].object);
    return;
  }

  // Coloca tatuagem na superfície do modelo
  const intersects = raycaster.intersectObject(model, true);
  if (intersects.length > 0 && selectedTattooMesh) {
    moveTattooToSurface(intersects[0]);
  }
}


/****************************************************
 *         FUNÇÃO USADA AO MOVER TATUAGEM
 ****************************************************/
function dragTattoo(event) {
  if (!isDragging || !selectedTattooMesh) return;

  updateMousePosition(event);

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObject(model, true);

  if (intersects.length > 0) {
    moveTattooToSurface(intersects[0]);
  }
}


/****************************************************
 *       FUNÇÃO QUE ATUALIZA POSIÇÃO DO MOUSE
 ****************************************************/
function updateMousePosition(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
}


/****************************************************
 *       APLICAR UMA NOVA TATUAGEM NA CENA
 ****************************************************/
function loadTattoo(src) {
  const textureLoader = new THREE.TextureLoader();

  textureLoader.load(src, texture => {
    const geometry = new THREE.PlaneGeometry(0.3, 0.3);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });

    const tattoo = new THREE.Mesh(geometry, material);
    tattoo.position.set(0, 1.5, 0.3);

    scene.add(tattoo);
    tattoos.push(tattoo);

    selectTattoo(tattoo);
  });
}


/****************************************************
 *    CARREGAR IMAGEM CUSTOM E REMOVER FUNDO
 ****************************************************/
async function handleCustomTattooUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

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

    loadTattoo(imageUrl);
  } catch {
    alert('Falha ao processar a imagem.');
  }
}


/****************************************************
 *         SELECIONAR UMA TATUAGEM EXISTENTE
 ****************************************************/
function selectTattoo(tattoo) {
  selectedTattooMesh = tattoo;
  isDragging = true;
  controls.enabled = false;

  document.getElementById('tattoo-controls').classList.remove('hidden');
  document.getElementById('opacity-control').value = tattoo.material.opacity * 100;
  document.getElementById('size-control').value = tattoo.scale.x * 100;
  document.getElementById('rotation-control').value = THREE.MathUtils.radToDeg(tattoo.rotation.z);
}


/****************************************************
 *     MOVER TATUAGEM PARA A SUPERFÍCIE DO MODELO
 ****************************************************/
function moveTattooToSurface(intersect) {
  selectedTattooMesh.position.copy(intersect.point);

  const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersect.object.matrixWorld);
  const normal = intersect.face.normal.clone().applyMatrix3(normalMatrix).normalize();

  const targetQuaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    normal
  );

  selectedTattooMesh.quaternion.copy(targetQuaternion);
}


/****************************************************
 *              CONTROLES DOS SLIDERS
 ****************************************************/
function updateOpacity(e) {
  if (selectedTattooMesh)
    selectedTattooMesh.material.opacity = parseFloat(e.target.value) / 100;
}

function updateSize(e) {
  if (selectedTattooMesh) {
    const s = parseFloat(e.target.value) / 100;
    selectedTattooMesh.scale.set(s, s, s);
  }
}

function updateRotation(e) {
  if (selectedTattooMesh)
    selectedTattooMesh.rotation.z = THREE.MathUtils.degToRad(parseFloat(e.target.value));
}


/****************************************************
 *                 BOTÕES ÚTEIS
 ****************************************************/
function deleteSelectedTattoo() {
  if (!selectedTattooMesh) return;

  scene.remove(selectedTattooMesh);
  tattoos.splice(tattoos.indexOf(selectedTattooMesh), 1);
  selectedTattooMesh = null;

  document.getElementById('tattoo-controls').classList.add('hidden');
}

function clearAllTattoos() {
  tattoos.forEach(t => scene.remove(t));
  tattoos.length = 0;

  selectedTattooMesh = null;
  document.getElementById('tattoo-controls').classList.add('hidden');
}

function resetView() {
  camera.position.set(0, 3.4, 9);
  controls.target.set(0, 3.4, 0);
  controls.update();
}

function downloadImage() {
  renderer.render(scene, camera);
  const imgData = renderer.domElement.toDataURL('image/png');

  const link = document.createElement('a');
  link.href = imgData;
  link.download = 'simulacao_tatuagem.png';
  link.click();
}


/****************************************************
 *            LOOP DE ANIMAÇÃO DO THREE.JS
 ****************************************************/
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}


/****************************************************
 *                SISTEMA DE CHATBOT
 ****************************************************/
function iniciarChatEvents() {
  // coloquei aqui apenas o começo para não duplicar tudo
  // se quiser organizo toda a parte do chatbot também
}
