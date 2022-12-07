import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

(() => {
    const objectParameters = {
        renderer: null,
        scene: null,
        camera: null,
        controls: null,
        triangles: [],
        oldTime: 0,
        canvasId: "explode",
        isTimeToStartExplosion: false,
        clock: new THREE.Clock(),
        explosionTimeDuration: 6,
    }

    setupThreeJsGraphics(objectParameters.canvasId);
    loadObject();
    animate();

    setTimeout(changeLoadedObjectState, 2000);
    
    function changeLoadedObjectState() {
        objectParameters.isTimeToStartExplosion = true;
    }
    
    function setupThreeJsGraphics(canvasIdSelector) {
        // set renderer
        {
            const canvas = document.getElementById(canvasIdSelector);
    
            const renderer = new THREE.WebGLRenderer({
                canvas,
                alpha: true,
                antialias: true,
            });
    
            renderer.setPixelRatio(window.devicePixelRatio);
    
            objectParameters.renderer = renderer;
        }
    
        // set scene
        {
            const scene = new THREE.Scene();
            scene.name = "Explode";
    
            objectParameters.scene = scene;
        }
    
        // set camera
        {
            const fov = 50;
            const aspect = window.innerWidth / window.innerHeight;
            const near = 1;
            const far = 1000;
    
            const explodeWallCamera = new THREE.PerspectiveCamera(fov, aspect, near, far);
            explodeWallCamera.position.set(0, 0, -15);
            explodeWallCamera.rotation.set(0, 0, 0);
    
            explodeWallCamera.lookAt(0, 0, 0);
    
            let horizontalFov = 40;
    
            if (window.innerHeight > window.innerWidth) {
                horizontalFov /= window.innerHeight / window.innerWidth
            }
    
            explodeWallCamera.fov =
                (Math.atan(
                    Math.tan(((horizontalFov / 2) * Math.PI) / 180) /
                    explodeWallCamera.aspect
                ) * 2 * 180) / Math.PI;
    
            objectParameters.camera = explodeWallCamera;
    
            objectParameters.scene.add(explodeWallCamera);
        }
    
        // set controls
        {
            const controls = new OrbitControls(objectParameters.camera, objectParameters.renderer.domElement);
            controls.target.set(0, 0, 0);
            controls.update();
    
            objectParameters.controls = controls;
        }
    
        // set lights
        {
            {
                const skyColor = new THREE.Color("rgb(115, 145, 155)");
                const groundColor = new THREE.Color("rgb(80, 115, 130)");
                const intensity = 1;
                const light = new THREE.HemisphereLight(
                    skyColor,
                    groundColor,
                    intensity
                );
    
                objectParameters.scene.add(light);
            }
    
            {
                const color = new THREE.Color("rgb(100, 100, 100)");
                const intensity = 0.7;
                const light = new THREE.DirectionalLight(color, intensity);
    
                light.castShadow = true;
                light.position.set(20, 20, -10);
                light.target.position.set(0, 0, 0);
                objectParameters.scene.add(light);
                objectParameters.scene.add(light.target);
            }
        }
    }
    
    function loadObject() {
        const addLogoToScene = (rootScene) => {
            objectParameters.triangles = rootScene.children.filter(mech => mech.name.includes("Cube"));
    
            const logoObject = new THREE.Object3D();
            objectParameters.triangles.forEach(triangle => {
                logoObject.add(triangle);
            });
    
            logoObject.name = "LogoObject";
            logoObject.position.set(0, 0, 0);
            objectParameters.scene.add(logoObject);
        }
    
        const modifyTriangles = () => {
            objectParameters.triangles.forEach((triangle, index) => {
                triangle.name = `triangle${index < 9 ? `0${index + 1}` : index + 1}`;
    
                triangle.receiveShadow = true;
    
                const explodeAnimation = {
                    direction: {
                        x: getRandomNumber(-1, 1),
                        y: getRandomNumber(-1, 1),
                        z: getRandomNumber(-1, 1),
                        speed: getRandomNumber(0, 1),
                    },
                    rotation: {
                        vector: new THREE.Vector3(-1, -1, -1).normalize(),
                        speed: 0.003,
                    },
                };
    
                triangle.explodeAnimation = explodeAnimation;
    
                triangle.explodeAnimation.speed = {
                    x:
                        triangle.explodeAnimation.direction.x *
                        triangle.explodeAnimation.direction.speed,
                    y:
                        triangle.explodeAnimation.direction.y *
                        triangle.explodeAnimation.direction.speed,
                    z:
                        triangle.explodeAnimation.direction.z *
                        triangle.explodeAnimation.direction.speed,
                };
            });
        }
    
        addLogoToScene.bind(this);
        modifyTriangles.bind(this);
    
        const objLoader = new GLTFLoader();
        const path = "./assets/objects/logo.glb";
    
        objLoader.load(path, gltf => {
            const rootScene = gltf.scene;
    
            addLogoToScene(rootScene);
    
            modifyTriangles();
        })
    }
    
    function resizeRendererToDisplaySize() {
        const canvas = objectParameters.renderer.domElement;
    
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
    
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            objectParameters.renderer.setSize(width, height, false);
        }
    
        return needResize;
    }
    
    function animate(currentTime) {
        if (resizeRendererToDisplaySize()) {
            const canvas = objectParameters.renderer.domElement;
    
            objectParameters.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            objectParameters.camera.updateProjectionMatrix();
        }
    
        const deltaTime = (currentTime - objectParameters.oldTime) / 1000;
        objectParameters.oldTime = currentTime;
    
        if (objectParameters.isTimeToStartExplosion) {
            if (objectParameters.clock.getElapsedTime() <= objectParameters.explosionTimeDuration) {
                objectParameters.triangles.forEach(triangle => {
                    let multiplierSpeed = 7;
                    if (objectParameters.clock.getElapsedTime() > 1.9) {
                        multiplierSpeed = 0.01;
                    }
    
                    triangle.position.x +=
                        triangle.explodeAnimation.speed.x * deltaTime * multiplierSpeed;
                    triangle.position.y +=
                        triangle.explodeAnimation.speed.y * deltaTime * multiplierSpeed;
                    triangle.position.z +=
                        triangle.explodeAnimation.speed.z * deltaTime * multiplierSpeed;
                })
            }
    
            objectParameters.triangles.forEach(triangle => {
                triangle.rotateOnAxis(
                    triangle.explodeAnimation.rotation.vector,
                    triangle.explodeAnimation.rotation.speed
                )
            });
        }
    
        objectParameters.renderer.render(objectParameters.scene, objectParameters.camera);
        objectParameters.requestID = window.requestAnimationFrame(animate);
    }
    
    function getRandomNumber(min, max) {
        const number = Math.random() * (max - min) + min;

        return number;
    }
})();
