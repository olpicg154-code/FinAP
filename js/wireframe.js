import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas = document.getElementById("financial-wireframe");

if (!canvas) {
    console.error("Financial wireframe canvas not found.");
} else {

    // =========================
    // SCENE
    // =========================

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x030711);


    // =========================
    // CAMERA
    // =========================

    const camera = new THREE.PerspectiveCamera(
        45,
        canvas.clientWidth / canvas.clientHeight,
        0.1,
        100
    );

    camera.position.set(0, 0, 8);


    // =========================
    // RENDERER
    // =========================

    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        canvas.clientWidth,
        canvas.clientHeight,
        false
    );


    // =========================
    // MAIN GROUP
    // =========================

    const financialGroup = new THREE.Group();

    scene.add(financialGroup);


    // =========================
    // WIREFRAME SPHERE
    // =========================

    const sphereGeometry =
        new THREE.IcosahedronGeometry(2.35, 4);

    const sphereMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x00e5ff,
            wireframe: true,
            transparent: true,
            opacity: 0.28
        });

    const sphere =
        new THREE.Mesh(
            sphereGeometry,
            sphereMaterial
        );

    financialGroup.add(sphere);


    // =========================
    // INNER SPHERE
    // =========================

    const innerGeometry =
        new THREE.IcosahedronGeometry(1.72, 3);

    const innerMaterial =
        new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.10
        });

    const innerSphere =
        new THREE.Mesh(
            innerGeometry,
            innerMaterial
        );

    financialGroup.add(innerSphere);


    // =========================
    // FINANCIAL NODES
    // =========================

    const nodeGeometry =
        new THREE.SphereGeometry(
            0.035,
            8,
            8
        );

    const nodeMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x00e5ff
        });


    const nodes = [];


    for (let i = 0; i < 95; i++) {

        const point =
            new THREE.Vector3();

        point.randomDirection();

        point.multiplyScalar(
            2.2 + Math.random() * 0.2
        );

        const node =
            new THREE.Mesh(
                nodeGeometry,
                nodeMaterial
            );

        node.position.copy(point);

        financialGroup.add(node);

        nodes.push(node);
    }


    // =========================
    // CONNECTIONS
    // =========================

    const connectionMaterial =
        new THREE.LineBasicMaterial({
            color: 0x00bcd4,
            transparent: true,
            opacity: 0.13
        });


    for (let i = 0; i < nodes.length; i++) {

        for (let j = i + 1; j < nodes.length; j++) {

            const distance =
                nodes[i].position.distanceTo(
                    nodes[j].position
                );

            if (distance < 0.65) {

                const geometry =
                    new THREE.BufferGeometry().setFromPoints([
                        nodes[i].position,
                        nodes[j].position
                    ]);

                const line =
                    new THREE.Line(
                        geometry,
                        connectionMaterial
                    );

                financialGroup.add(line);
            }
        }
    }


    // =========================
    // ORBIT RINGS
    // =========================

    const ringMaterial =
        new THREE.LineBasicMaterial({
            color: 0x00e5ff,
            transparent: true,
            opacity: 0.12
        });


    const ring1 =
        new THREE.LineLoop(
            new THREE.BufferGeometry().setFromPoints(
                new THREE.EllipseCurve(
                    0,
                    0,
                    2.75,
                    0.95,
                    0,
                    Math.PI * 2,
                    false,
                    0
                ).getPoints(120)
            ),
            ringMaterial
        );

    ring1.rotation.x = Math.PI / 2.4;

    financialGroup.add(ring1);


    const ring2 =
        ring1.clone();

    ring2.scale.set(
        0.78,
        1.15,
        1
    );

    ring2.rotation.y = Math.PI / 2;

    financialGroup.add(ring2);


    // =========================
    // FLOATING PARTICLES
    // =========================

    const particleGeometry =
        new THREE.BufferGeometry();

    const particleCount = 500;

    const particlePositions =
        new Float32Array(
            particleCount * 3
        );


    for (let i = 0; i < particleCount; i++) {

        particlePositions[i * 3] =
            (Math.random() - 0.5) * 9;

        particlePositions[i * 3 + 1] =
            (Math.random() - 0.5) * 6;

        particlePositions[i * 3 + 2] =
            (Math.random() - 0.5) * 5;
    }


    particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            particlePositions,
            3
        )
    );


    const particleMaterial =
        new THREE.PointsMaterial({
            color: 0x00e5ff,
            size: 0.018,
            transparent: true,
            opacity: 0.4
        });


    const particles =
        new THREE.Points(
            particleGeometry,
            particleMaterial
        );

    scene.add(particles);


    // =========================
    // MOUSE
    // =========================

    let mouseX = 0;
    let mouseY = 0;

    window.addEventListener(
        "mousemove",
        (event) => {

            mouseX =
                (event.clientX /
                    window.innerWidth) *
                2 - 1;

            mouseY =
                (event.clientY /
                    window.innerHeight) *
                2 - 1;

        }
    );


    // =========================
    // RESIZE
    // =========================

    function resize() {

        const width =
            canvas.clientWidth;

        const height =
            canvas.clientHeight;

        camera.aspect =
            width / height;

        camera.updateProjectionMatrix();

        renderer.setSize(
            width,
            height,
            false
        );
    }


    window.addEventListener(
        "resize",
        resize
    );


    resize();


    // =========================
    // ANIMATION
    // =========================

    const clock =
        new THREE.Clock();


    function animate() {

        requestAnimationFrame(
            animate
        );

        const elapsed =
            clock.getElapsedTime();


        financialGroup.rotation.y =
            elapsed * 0.12;

        financialGroup.rotation.x =
            Math.sin(elapsed * 0.35) * 0.08;


        financialGroup.rotation.y +=
            mouseX * 0.002;

        financialGroup.rotation.x +=
            mouseY * 0.001;


        particles.rotation.y =
            elapsed * 0.015;


        particles.rotation.x =
            elapsed * 0.008;


        renderer.render(
            scene,
            camera
        );
    }


    animate();
}