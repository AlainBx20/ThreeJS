import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
    depth: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Post-processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// Add Bloom effect
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,  // strength
    0.4,  // radius
    0.85   // threshold
);
composer.addPass(bloomPass);

// Add SMAA anti-aliasing
const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
composer.addPass(smaaPass);

// Custom chromatic aberration shader
const chromaticAberrationShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "resolution": { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        "power": { value: 0.003 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform vec2 resolution;
        uniform float power;
        varying vec2 vUv;
        
        void main() {
            vec2 uv = vUv;
            vec2 direction = normalize(vec2(0.5) - uv);
            vec2 dist = (vec2(0.5) - uv) * power;
            
            vec4 cr = texture2D(tDiffuse, uv + dist);
            vec4 cg = texture2D(tDiffuse, uv);
            vec4 cb = texture2D(tDiffuse, uv - dist);
            
            gl_FragColor = vec4(cr.r, cg.g, cb.b, 1.0);
        }
    `
};

const chromaticAberrationPass = new ShaderPass(chromaticAberrationShader);
composer.addPass(chromaticAberrationPass);

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Load Earth textures
const earthDayTexture = textureLoader.load('./model/Albedo.jpg');
const earthBumpTexture = textureLoader.load('./model/Bump.jpg');
const earthCloudsTexture = textureLoader.load('./model/Clouds.png');
const earthNightTexture = textureLoader.load('./model/night_lights_modified.png');

// Lighting
const ambientLight = new THREE.AmbientLight(0x333333, 2.0);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 4.0);
directionalLight.position.set(50, 20, 20);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.far = 200;
scene.add(directionalLight);

// Add a subtle blue rim light for atmosphere effect
const rimLight = new THREE.DirectionalLight(0x4477ff, 2.0);
rimLight.position.set(-50, 20, -20);
scene.add(rimLight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enablePan = false;
controls.maxDistance = 100;
controls.minDistance = 5;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.3;

// Create space background with nebula effect
function createSpaceBackground() {
    return null;
}

// Update star field for better visibility
function createStarField() {
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 25000;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    for(let i = 0; i < starCount; i++) {
        const radius = 300 + Math.random() * 900;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos((Math.random() * 2) - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        sizes[i] = Math.random() * 2 + 0.5;

        const colorType = Math.random();
        if (colorType > 0.995) { // Blue giants (very rare)
            colors[i * 3] = 0.7;
            colors[i * 3 + 1] = 0.8;
            colors[i * 3 + 2] = 1;
        } else if (colorType > 0.98) { // Red giants (rare)
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 0.3;
            colors[i * 3 + 2] = 0.3;
        } else if (colorType > 0.95) { // Yellow stars
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 0.9;
            colors[i * 3 + 2] = 0.5;
        } else {
            const brightness = 0.9 + Math.random() * 0.1;
            colors[i * 3] = brightness;
            colors[i * 3 + 1] = brightness;
            colors[i * 3 + 2] = brightness;
        }
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    starsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const starsMaterial = new THREE.PointsMaterial({
        size: 1.0,
        sizeAttenuation: true,
        vertexColors: true,
        transparent: false,
        opacity: 1.0,
        blending: THREE.NoBlending,
        depthWrite: true,
        depthTest: true
    });

    return new THREE.Points(starsGeometry, starsMaterial);
}

// Create and add the space background
const spaceBackground = createSpaceBackground();

// Create and add the star field
const starField = createStarField();
scene.add(starField);

// Create volumetric nebula clouds
function createNebulaClouds() {
    const nebulaGroup = new THREE.Group();
    
    // Create multiple nebula clouds with different colors and positions
    const createNebulaCloud = (color, position, scale) => {
        const particleCount = 1000;
    const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        const baseColor = new THREE.Color(color);
        
        for(let i = 0; i < particleCount; i++) {
            // Create a cloud-like shape using random spherical coordinates
            const radius = Math.random() * scale;
        const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);

            positions[i * 3] = position.x + (radius * Math.sin(phi) * Math.cos(theta));
            positions[i * 3 + 1] = position.y + (radius * Math.sin(phi) * Math.sin(theta));
            positions[i * 3 + 2] = position.z + (radius * Math.cos(phi));

            // Very dark colors
            colors[i * 3] = baseColor.r * 0.1;
            colors[i * 3 + 1] = baseColor.g * 0.1;
            colors[i * 3 + 2] = baseColor.b * 0.1;

            sizes[i] = Math.random() * 10 + 5; // Smaller particles
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 2,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: false,
            opacity: 1.0,
            blending: THREE.NoBlending,
            depthWrite: true,
            depthTest: true
    });

    return new THREE.Points(geometry, material);
};

    // Create multiple nebula clouds with different colors and positions
    const nebulaClouds = [
        // Very dark versions of the nebula colors
        createNebulaCloud(0x0a0a1a, new THREE.Vector3(-300, -100, -1500), 300),
        createNebulaCloud(0x0a0508, new THREE.Vector3(400, 200, -1300), 250),
        createNebulaCloud(0x080a12, new THREE.Vector3(0, -200, -1600), 280),
        createNebulaCloud(0x050a0a, new THREE.Vector3(-200, 300, -1400), 260)
    ];

    nebulaClouds.forEach(cloud => {
        cloud.position.z -= 1000; // Move nebulas much further back
        nebulaGroup.add(cloud);
    });
    return nebulaGroup;
}

// Create and add nebula clouds
const nebulaClouds = createNebulaClouds();
scene.add(nebulaClouds);

// Camera position and controls setup
camera.position.set(0, 100, 20); // Start from higher position
const finalCameraPosition = new THREE.Vector3(0, 2, 8);
controls.target.set(0, 0, 6);
controls.minDistance = 3;
controls.maxDistance = 100;
controls.enabled = false; // Disable controls initially
controls.update();

// Add initial camera animation
let initialAnimationComplete = false;
let initialAnimationStartTime = null;

function initialCameraAnimation(timestamp) {
    if (!initialAnimationStartTime) initialAnimationStartTime = timestamp;
    const elapsed = timestamp - initialAnimationStartTime;
    const duration = 8000; // 8 seconds for smoother animation
    const progress = Math.min(elapsed / duration, 1);

    // Smoother easing function
    const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

    // Calculate current camera position
    const currentY = 100 * (1 - easeProgress) + 2 * easeProgress;
    const currentZ = 20 * (1 - easeProgress) + 8 * easeProgress;
    
    // Update camera position
    camera.position.set(0, currentY, currentZ);
    
    // Gradually rotate camera to look at the scene
    const startRotation = -Math.PI / 2; // Looking straight down
    const endRotation = 0; // Looking forward
    const currentRotation = startRotation * (1 - easeProgress) + endRotation * easeProgress;
    camera.rotation.x = currentRotation;

    if (progress < 1) {
        requestAnimationFrame(initialCameraAnimation);
    } else {
        initialAnimationComplete = true;
        controls.enabled = true;
    }
}

// Start the initial animation using requestAnimationFrame
requestAnimationFrame(initialCameraAnimation);

// Set scene background to pure black for better star visibility
scene.background = new THREE.Color(0x000000);

// Create Earth
const earthGeometry = new THREE.SphereGeometry(30, 64, 64);
const earthMaterial = new THREE.MeshPhongMaterial({
    map: earthDayTexture,
    bumpMap: earthBumpTexture,
    bumpScale: 0.2,
    specular: 0x333333,
    shininess: 15
});

const earth = new THREE.Mesh(earthGeometry, earthMaterial);
earth.castShadow = true;
earth.receiveShadow = true;
earth.position.set(0, 0, -50);
scene.add(earth);

// Create cloud layer
const cloudGeometry = new THREE.SphereGeometry(30.3, 64, 64);
const cloudMaterial = new THREE.MeshPhongMaterial({
    map: earthCloudsTexture,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.NormalBlending,
    color: 0xffffff
});

const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
earth.add(clouds);

// Load Moon textures
const moonTexture = textureLoader.load('./model/Moon/Moon.jpg');
const moonDisplacementMap = textureLoader.load('./model/Moon/Moon_displacement.jpg');

// Create Moon with detailed textures
const moonGeometry = new THREE.SphereGeometry(8, 64, 64); // Increased geometry detail
const moonMaterial = new THREE.MeshPhongMaterial({
    map: moonTexture,
    bumpMap: moonDisplacementMap,
    bumpScale: 0.15,
    shininess: 2,
    specular: 0x222222
});

const moon = new THREE.Mesh(moonGeometry, moonMaterial);
const moonPivot = new THREE.Object3D();
moonPivot.position.copy(earth.position);

// Add a subtle rim light for the moon
const moonRimLight = new THREE.DirectionalLight(0x444444, 0.5);
moonRimLight.position.set(-1, 0, 0);
moon.add(moonRimLight);

scene.add(moonPivot);
moonPivot.add(moon);

// Position moon relative to Earth
moon.position.set(100, 0, 0);
moon.scale.set(0.4, 0.4, 0.4);

// Add moon label
const moonLabel = createLabel('Moon', new THREE.Vector3(0, 15, 0), 0.8);
moonLabel.material.opacity = 0; // Start invisible
moon.add(moonLabel);

// Tilt moon's orbit slightly
moonPivot.rotation.x = Math.PI * 0.05; // 5-degree tilt

// Replace the book creation code with paper models
const fbxLoader = new FBXLoader();
const papers = [];

// Define models with their textures
const paperModels = [
    {
        model: 'model/papers/Notepad_LP.fbx',
        textures: {
            baseColor: 'model/papers/Notepad_Color.png',
            normal: 'model/papers/Notepad_Normal.png',
            metallic: 'model/papers/Notepad_Metallic.png',
            roughness: 'model/papers/Notepad_Roughness.png',
            ao: 'model/papers/Notepad_AO.png'
        },
        scale: 0.002 // Reduced scale for notepad
    },
    {
        model: 'model/open/open_book_reallistic__0316155948_texture.fbx',
        textures: {
            baseColor: 'model/open/open_book_reallistic__0316155948_texture.png'
        },
        scale: 0.003 // Reduced scale for open book
    }
];

// Add after scene setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Define paper labels before createPaper function
const paperLabels = ['Éducation', 'Expérience', 'Compétences', 'À Propos', 'Mes Projets'];

// Update the createLabel function
function createLabel(text, position, scale = 1) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = '#ffffff';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.image.title = text; // Store the text in the texture

    const material = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0
    });

    const sprite = new THREE.Sprite(material);
    sprite.position.copy(position);
    sprite.position.y += 0.5;
    sprite.scale.set(1.5 * scale, 0.25 * scale, 1);
    sprite.name = text; // Store the text as the sprite's name
    return sprite;
}

// Create and position the paper models
const numberOfPapers = 5; // Increased from 4 to 5
const radius = 1.5; // Slightly increased radius to accommodate new model
const loadPapers = async () => {
    for(let i = 0; i < numberOfPapers; i++) {
        const angle = (i / numberOfPapers) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle * 2) * 0.2;
        const z = Math.sin(angle) * radius + 6;
        const position = new THREE.Vector3(x, y, z);
        
        const isStanding = i % 2 === 0;
        const randomRotation = () => Math.random() * Math.PI * 0.5 - Math.PI * 0.25;
        const rotation = new THREE.Euler(
            isStanding ? Math.PI / 2 + randomRotation() * 0.3 : randomRotation(),
            -angle + Math.PI / 2 + randomRotation() * 0.5,
            isStanding ? randomRotation() * 0.3 : randomRotation()
        );
        
        const modelIndex = i % 2;
        await createPaper(paperModels[modelIndex], position, rotation, i);
    }
};

// Update the createPaper function to include animation parameters
const createPaper = (modelData, position, rotation, index) => {
    return new Promise((resolve) => {
        // Load textures first
        const textures = {};
        const texturePromises = Object.entries(modelData.textures).map(([key, path]) => {
            return new Promise(textureResolve => {
                textureLoader.load(path, texture => {
                    textures[key] = texture;
                    textureResolve();
                });
            });
        });

        // After textures are loaded, load the model
        Promise.all(texturePromises).then(() => {
            fbxLoader.load(modelData.model, (fbx) => {
                const scale = modelData.scale || 0.01;
                fbx.scale.set(scale, scale, scale);
                fbx.position.copy(position);
                fbx.rotation.copy(rotation);
                
                // Apply materials and properties
                fbx.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Create material based on available textures
                        const materialProps = {
                            map: textures.baseColor,
                            normalMap: textures.normal,
                            metalnessMap: textures.metallic,
                            roughnessMap: textures.roughness,
                            aoMap: textures.ao,
                            metalness: 0.3,
        roughness: 0.8,
                            transparent: false,
                            depthWrite: true,
                            depthTest: true
                        };

                        // Only include texture maps that exist
                        Object.keys(materialProps).forEach(key => {
                            if (!materialProps[key]) delete materialProps[key];
                        });

                        child.material = new THREE.MeshStandardMaterial(materialProps);
                    }
                });

                // Store animation parameters
                fbx.userData.initialPosition = position.clone();
                fbx.userData.floatSpeed = Math.random() * 0.002 + 0.001;
                fbx.userData.rotationSpeed = Math.random() * 0.001 + 0.0005;
                fbx.userData.floatOffset = Math.random() * Math.PI * 2;
                fbx.userData.floatRadius = Math.random() * 0.2 + 0.1;

                // Add label above the paper model
                const labelPosition = position.clone();
                labelPosition.y += 0.5;
                const label = createLabel(paperLabels[index], labelPosition);
                scene.add(label);

                // Store label reference in the model's userData
                fbx.userData.label = label;

                scene.add(fbx);
                papers.push(fbx);
                resolve();
            });
        });
    });
};

// Load the papers
loadPapers();

// After Earth creation and before moon creation, add sun rays
const sunRaysVertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const sunRaysFragmentShader = `
uniform float time;
uniform vec3 sunDirection;
varying vec2 vUv;

float rand(vec2 co) {
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float dist = length(uv);
    
    if (dist > 1.0) {
        discard;
    }
    
    // Enhanced ray pattern
    float angle = atan(uv.y, uv.x);
    float rays = abs(cos(angle * 12.0 + time * 0.1)) * 0.5 + 0.5;
    rays *= pow(1.0 - dist, 2.0);
    
    // Multiple ray layers
    float rays2 = abs(cos(angle * 8.0 - time * 0.15)) * 0.3;
    rays2 *= pow(1.0 - dist, 1.8);
    rays += rays2;
    
    // Dynamic noise
    float noise = rand(uv + time * 0.1) * 0.1;
    float noise2 = rand(uv * 2.0 - time * 0.05) * 0.05;
    rays += noise + noise2;
    
    // Enhanced edge fade
    rays *= smoothstep(1.0, 0.4, dist);
    
    // Add pulsing intensity
    float intensity = 0.6 + sin(time * 0.5) * 0.2; // Pulsing between 0.4 and 0.8
    
    // Improved sun color with corona effect
    vec3 innerColor = vec3(1.0, 0.9, 0.7);
    vec3 outerColor = vec3(1.0, 0.6, 0.3);
    vec3 rayColor = mix(innerColor, outerColor, dist);
    
    float alpha = rays * (1.0 - dist);
    if (alpha < 0.01) {
        discard;
    }
    
    gl_FragColor = vec4(rayColor * rays * intensity, alpha * intensity);
}
`;

// Create sun rays mesh with fixed position
const segments = 64;
const sunRaysGeometry = new THREE.CircleGeometry(100, segments);
const sunRaysMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        sunDirection: { value: new THREE.Vector3(1, 1, 1).normalize() }
    },
    vertexShader: sunRaysVertexShader,
    fragmentShader: sunRaysFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: false,
    alphaTest: 0.01
});

const sunRays = new THREE.Mesh(sunRaysGeometry, sunRaysMaterial);
// Position the sun rays in top right behind Earth, slightly more to the left
sunRays.position.set(60, 60, -150); // Changed from (80, 60, -150)
scene.add(sunRays);

// Add audio loader after other loaders
const audioLoader = new THREE.AudioLoader();
const listener = new THREE.AudioListener();
camera.add(listener);

// Create audio for hover effect
const hoverSound = new THREE.Audio(listener);
let lastHoveredModel = null;

// Load the sound but don't play it
audioLoader.load('./hover-button-287656.mp3', function(buffer) {
    hoverSound.setBuffer(buffer);
    hoverSound.setVolume(0.7);
});

// Add content for each section
const sectionContent = {
    'Éducation': `
    • Licence en Technologies de l'Information et de la Communication (TIC)
      Faculté des Sciences Mathématiques, Physiques et Naturelles de Tunis
      09/2022 – 12/2024

    • Baccalauréat en informatique
      Lycée Pilote des Arts Radhiâ Haddad in El Omrane
      06/2022
    `,
    'Expérience': `
    • Stage en Développement Web - Smart Team
      06/2023 – 08/2023 | Tunis, Tunisia
      Description : Réalisation d'un stage en développement web où j'ai travaillé avec différents frameworks.
      Compétences acquises : Maîtrise de frameworks tels que React, Angular, et Node.js; développement front-end 
      et back-end; collaboration au sein d'une équipe agile.

    • Workshop: AI x Web3 - Dione Protocol
      06/2024 – 07/2024 | Tunis, Tunisia
      Description : Réalisation d'un atelier en intelligence artificielle avec TensorFlow et frameworks de machine learning.
      Participation à un atelier avancé sur l'application des technologies IA et Web3 à la désagrégation de l'énergie.



    •Stage en Développement  - Societé Tunisienne de banque(STB)
    02/2025-05/2025 | Tunis, Tunisia
    Description : Réalisation d'un stage en développement web avec React et Node.js et Spring boot.
    Compétences acquises : Maîtrise de frameworks tels que React, Angular, et Node.js; développement front-end  et xsd (xml schema definition)
    et back-end; collaboration au sein d'une équipe agile.

    
    • Stage en Développement et Réseautique - Tunisair
      07/2024 – 08/2024 | Tunis, Tunisia
      Description : Stage en développement et réseautique, maîtrise des principes CCMA et développement web.
      Réalisation d'un site web pour la configuration à distance des ports Ethernet et la gestion réseau.
    `,
    'Compétences': `
    • Développement Web
      - HTML, CSS, JavaScript
      - Frameworks: React, Angular, Node.js
      - Développement front-end et back-end

    • Réseaux
      - Configuration et gestion des réseaux
      - Principes CCMA
      - Administration réseau

    • Intelligence Artificielle
      - PyTorch
      - Keras
      - TensorFlow
      - Machine Learning

    • Certifications
      - Problem Solving (Algorithm)
      - Python (Machine-Learning)
      - IA x Web3
      - Generative AI et Large Language Models
      - Diplôme en Machine Learning (Python)
    `,
    'À Propos': `
    Étudiant en 3ème année Licence de Réseautique et TIC à la Faculté des Sciences de Tunis.
    Passionné par le développement web et l'intelligence artificielle.
    
    En recherche d'un stage de Projet de Fin d'Études (PFE) pour mettre en pratique mes connaissances 
    et développer mes compétences dans un environnement professionnel stimulant.

    Langues:
    • Arabe : Maternelle
    • Anglais : Compétent
    • Français : Avancé
    `,
    'Mes Projets': `
    • Project Ecology Simulation (AI-Agent)
      GitHub: github.com/AlainBx20/Ecology-Simulation
      
    • AI-Maze Using Reinforcement-Learning
      GitHub: github.com/AlainBx20/AI-Maze
      
    • Lung-Disease-Classification
      GitHub: github.com/AlainBx20/Lung-Disease-Classification
    `,
    'Contact': `
    • Email: alaachulkha@gmail.com
    • Github: github.com/AlainBx20
    • LinkedIn: linkedin.com/in/alaa-chulkhaa-216a0a257
    • Site Web: alainbx20.github.io/Alaa19.github.io/

    Localisation: Tunis, Tunisia
    Téléphone: 27003338
    `
};

// Add content overlay
const contentOverlay = document.createElement('div');
contentOverlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 2em;
    border-radius: 10px;
    font-family: Arial, sans-serif;
    max-width: 80%;
    max-height: 80vh;
    overflow-y: auto;
    display: none;
    z-index: 1000;
    white-space: pre-line;
    border: 1px solid #444;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
`;

const closeButton = document.createElement('button');
closeButton.textContent = '×';
closeButton.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 5px 10px;
    border-radius: 5px;
`;
closeButton.addEventListener('mouseover', () => closeButton.style.background = 'rgba(255, 255, 255, 0.1)');
closeButton.addEventListener('mouseout', () => closeButton.style.background = 'none');

contentOverlay.appendChild(closeButton);
document.body.appendChild(contentOverlay);

let isZooming = false;
let selectedModel = null;
const originalCameraPosition = camera.position.clone();
const originalControlsTarget = controls.target.clone();

// Handle click events
function onClick(event) {
    if (isZooming) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(papers, true);

    if (intersects.length > 0) {
        const hoveredObject = intersects[0].object;
        let parentModel = hoveredObject;
        
        while (parentModel && !parentModel.userData.label) {
            parentModel = parentModel.parent;
        }

        if (parentModel && parentModel.userData.label) {
            selectedModel = parentModel;
            zoomToModel(parentModel);
        }
    }
}

function zoomToModel(model) {
    isZooming = true;
    const modelPosition = model.position.clone();
    
    // Calculate a better target position that's closer to the model
    const modelBoundingBox = new THREE.Box3().setFromObject(model);
    const modelSize = modelBoundingBox.getSize(new THREE.Vector3());
    const maxDimension = Math.max(modelSize.x, modelSize.y, modelSize.z);
    
    // Calculate zoom distance based on model size
    const zoomDistance = maxDimension * 2; // Closer zoom
    
    // Position camera in front of the model
    const targetPosition = modelPosition.clone().add(new THREE.Vector3(0, 0.2, zoomDistance));
    
    // Disable controls during animation
    controls.enabled = false;

    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const animationDuration = 1200; // Slightly longer animation
        const startTime = Date.now();
        
    function animateCamera() {
            const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Improved easing function for smoother animation
        const easeProgress = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Update camera position
        camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        controls.target.lerpVectors(startTarget, modelPosition, easeProgress);
        
        // Ensure camera is always looking at the model
        camera.lookAt(modelPosition);
            
            if (progress < 1) {
            requestAnimationFrame(animateCamera);
            } else {
            // Animation complete
            controls.enabled = true;
            controls.minDistance = zoomDistance * 0.5; // Allow closer zoom
            controls.maxDistance = zoomDistance * 2; // Limit how far user can zoom out
            showContent(model);
        }
    }

    animateCamera();
}

function showContent(model) {
    if (!model || !model.userData || !model.userData.label) return;
    
    // Get the label text from the model's userData
    const labelMaterial = model.userData.label.material;
    if (!labelMaterial || !labelMaterial.map || !labelMaterial.map.image) return;
    
    const labelText = labelMaterial.map.image.title || model.userData.label.name;
    const content = sectionContent[labelText];
    
    if (!content) {
        console.error('No content found for label:', labelText);
        return;
    }

    contentOverlay.innerHTML = `
        <div style="position: relative; padding: 20px;">
            <h2 style="margin-top: 0; color: #4a9eff; font-size: 24px; margin-bottom: 20px;">${labelText}</h2>
            <div style="font-size: 16px; line-height: 1.6;">${content}</div>
            <button id="closeOverlay" style="
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                color: white;
                font-size: 28px;
                cursor: pointer;
                padding: 5px 15px;
                border-radius: 5px;
                transition: background-color 0.3s;">×</button>
        </div>
    `;
    
    const closeBtn = document.getElementById('closeOverlay');
    if (closeBtn) {
        closeBtn.addEventListener('mouseover', () => {
            closeBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        });
        closeBtn.addEventListener('mouseout', () => {
            closeBtn.style.backgroundColor = 'transparent';
        });
        closeBtn.addEventListener('click', resetView);
    }
    
    contentOverlay.style.display = 'block';
}

function resetView() {
    if (!isZooming && !contentOverlay.style.display === 'block') return;

    isZooming = true;
    controls.enabled = false;

    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = Date.now();
    const animationDuration = 1500; // Longer duration for smoother reset

    function animateReset() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);
        
        // Smooth easing
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // Smoothly move back to original position
        camera.position.lerpVectors(startPosition, finalCameraPosition, easeProgress);
        controls.target.lerpVectors(startTarget, new THREE.Vector3(0, 0, 6), easeProgress);

        if (progress < 1) {
            requestAnimationFrame(animateReset);
        } else {
            isZooming = false;
            controls.enabled = true;
            controls.minDistance = 3;
            controls.maxDistance = 100;
            selectedModel = null;
            contentOverlay.style.display = 'none';
        }
    }

    animateReset();
    contentOverlay.style.display = 'none';
}

// Event listeners
window.addEventListener('click', onClick, false);

// Add camera orbit parameters after scene setup
let cameraOrbitAngle = Math.PI / 2;
const cameraOrbitSpeed = 0.02;
const cameraOrbitRadius = 4;
const cameraOrbitHeight = 0.8;
const centerPoint = new THREE.Vector3(0, 0.7, 6);

// Update the animate function to include camera orbiting
const animate = () => {
        requestAnimationFrame(animate);
        
        const time = Date.now() * 0.001;
        
    // Only update controls if initial animation is complete and not zoomed in
    if (initialAnimationComplete && !isZooming && !selectedModel) {
        // Orbit camera around the scene (negative for opposite direction)
        cameraOrbitAngle -= cameraOrbitSpeed * 0.005;
        
        // Calculate new camera position to orbit around reset position
        const newX = Math.cos(cameraOrbitAngle) * cameraOrbitRadius;
        const newZ = Math.sin(cameraOrbitAngle) * cameraOrbitRadius + 6;
        const newY = cameraOrbitHeight + Math.sin(time * 0.3) * 0.2;
        
        camera.position.set(newX, newY, newZ);
        camera.lookAt(centerPoint);
    } else if (initialAnimationComplete) {
        controls.update();
    }
    
    // Update raycaster
            raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(papers, true);
    
    // Reset all labels to invisible
    papers.forEach(paper => {
        if (paper.userData.label) {
            paper.userData.label.material.opacity = 0;
        }
    });
    
    // Handle hover and sound
    if (intersects.length > 0) {
        const hoveredObject = intersects[0].object;
        let parentModel = hoveredObject;
        
        while (parentModel && !parentModel.userData.label) {
            parentModel = parentModel.parent;
        }
        
        if (parentModel && parentModel.userData.label) {
            parentModel.userData.label.material.opacity = 0.8;
            
            if (lastHoveredModel !== parentModel) {
                hoverSound.play();
                lastHoveredModel = parentModel;
            }
        }
    } else {
        lastHoveredModel = null;
    }
    
    // Rotate Earth
    earth.rotation.y += 0.0002;
    clouds.rotation.y += 0.00025;
    
    // Rotate Moon around Earth
    moonPivot.rotation.y += 0.0003;
    moon.rotation.y += 0.0001;
    
    moon.position.y = Math.sin(time * 0.1) * 5;
    moon.rotation.z = Math.sin(time * 0.05) * 0.02;
    
    // Enhanced floating animation for papers
    papers.forEach((paper, index) => {
        const initialPos = paper.userData.initialPosition;
        const floatSpeed = paper.userData.floatSpeed;
        const rotSpeed = paper.userData.rotationSpeed;
        const offset = paper.userData.floatOffset;
        const floatRadius = paper.userData.floatRadius * 0.7;

        paper.position.x = initialPos.x + Math.sin(time * floatSpeed + offset) * floatRadius;
        paper.position.y = initialPos.y + Math.sin(time * floatSpeed * 1.5 + offset) * floatRadius;
        paper.position.z = initialPos.z + Math.cos(time * floatSpeed + offset) * (floatRadius * 0.5);

        const rotationMultiplier = index % 2 === 0 ? 0.7 : 1.0;
        paper.rotation.x += Math.sin(time * 0.5 + offset) * rotSpeed * rotationMultiplier;
        paper.rotation.y += Math.cos(time * 0.3 + offset) * rotSpeed * rotationMultiplier;
        paper.rotation.z += Math.sin(time * 0.4 + offset) * rotSpeed * rotationMultiplier;
    });
    
    // Update sun rays with pulsing
    sunRays.material.uniforms.time.value = time;
    
    // Update raycaster for moon interaction
    const moonIntersects = raycaster.intersectObject(moon);
    if (moonIntersects.length > 0) {
        const moonLabel = moon.children.find(child => child.name === 'Moon');
        if (moonLabel) {
            moonLabel.material.opacity = 0.8;
        }
    } else {
        const moonLabel = moon.children.find(child => child.name === 'Moon');
        if (moonLabel) {
            moonLabel.material.opacity = 0;
        }
    }
    
    composer.render();
};

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    composer.setSize(width, height);
    
    chromaticAberrationPass.uniforms.resolution.value.set(width, height);
});

// Add mouse move event listener
function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove, false);

animate(); 