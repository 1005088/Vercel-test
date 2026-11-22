'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const continents = [
    [[-168, 70], [-145, 72], [-125, 60], [-115, 48], [-96, 50], [-82, 25], [-98, 15], [-112, 28], [-130, 48], [-155, 58]],
    [[-81, 12], [-66, 10], [-50, -2], [-44, -20], [-54, -40], [-70, -55], [-76, -30], [-80, -8]],
    [[-11, 72], [30, 70], [42, 55], [28, 42], [38, 30], [20, 10], [10, -5], [30, -35], [17, -35], [-2, -15], [-15, 5], [-18, 35], [-8, 52]],
    [[28, 70], [65, 75], [105, 72], [145, 60], [170, 52], [155, 40], [130, 35], [120, 20], [105, 5], [80, 8], [65, 25], [45, 28], [35, 45]],
    [[112, -11], [130, -10], [153, -20], [151, -39], [134, -44], [115, -33]],
    [[-52, 83], [-25, 78], [-37, 60], [-54, 60], [-64, 72]],
    [[46, -13], [50, -18], [49, -25], [45, -23]],
    [[-180, -70], [-120, -73], [-60, -75], [0, -72], [60, -74], [120, -72], [180, -70], [180, -90], [-180, -90]],
];

function isLand(longitude, latitude) {
    return continents.some((polygon) => {
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
            const [xi, yi] = polygon[i];
            const [xj, yj] = polygon[j];
            const crosses = (yi > latitude) !== (yj > latitude)
                && longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;
            if (crosses) inside = !inside;
        }
        return inside;
    });
}

function terrainNoise(longitude, latitude) {
    const x = longitude * Math.PI / 180;
    const y = latitude * Math.PI / 180;
    return (
        Math.sin(x * 7 + Math.sin(y * 5)) * 0.42
        + Math.sin(y * 13 + x * 3) * 0.28
        + Math.sin(x * 23 - y * 17) * 0.18
        + Math.cos(x * 41 + y * 29) * 0.12
    );
}

function createTerrainTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 180;
    const context = canvas.getContext('2d');
    const image = context.createImageData(canvas.width, canvas.height);

    for (let y = 0; y < canvas.height; y += 1) {
        const latitude = 90 - (y / (canvas.height - 1)) * 180;
        for (let x = 0; x < canvas.width; x += 1) {
            const longitude = (x / (canvas.width - 1)) * 360 - 180;
            const variation = terrainNoise(longitude, latitude);
            const land = isLand(longitude, latitude);
            const elevation = variation + (latitude > 55 || latitude < -55 ? -0.08 : 0);
            let color;

            if (land) {
                if (elevation > 0.36) color = [226, 218, 179];
                else if (elevation > 0.12) color = [150, 177, 112];
                else if (elevation > -0.2) color = [89, 143, 104];
                else color = [52, 111, 92];
            } else {
                const depth = Math.max(0, Math.min(1, (variation + 1) / 2));
                color = [Math.round(12 + depth * 14), Math.round(54 + depth * 33), Math.round(91 + depth * 42)];
            }

            const offset = (y * canvas.width + x) * 4;
            image.data[offset] = color[0];
            image.data[offset + 1] = color[1];
            image.data[offset + 2] = color[2];
            image.data[offset + 3] = 255;
        }
    }

    context.putImageData(image, 0, 0);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function createFlagTexture(country) {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 64;
    const context = canvas.getContext('2d');
    context.fillStyle = country.flagColor;
    context.fillRect(0, 0, 96, 64);

    context.font = 'bold 22px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.lineWidth = 3;
    context.strokeStyle = 'rgba(0, 0, 0, 0.65)';
    context.fillStyle = '#ffffff';
    context.strokeText(country.code, 48, 32);
    context.fillText(country.code, 48, 32);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

function countryPosition(country) {
    const longitude = THREE.MathUtils.degToRad(180 - country.longitude);
    const latitude = THREE.MathUtils.degToRad(country.latitude);
    const radius = 1.025;
    return new THREE.Vector3(
        -Math.cos(longitude) * Math.cos(latitude) * radius,
        Math.sin(latitude) * radius,
        Math.sin(longitude) * Math.cos(latitude) * radius,
    );
}

export default function EarthGlobe({ countries, selectedCountry, onSelectCountry }) {
    const hostRef = useRef(null);
    const earthGroupRef = useRef(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return undefined;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
        camera.position.set(0, 0, 3.25);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setClearColor(0x000000, 0);
        host.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 1.5));
        const sunlight = new THREE.DirectionalLight(0xffffff, 1.8);
        sunlight.position.set(-4, 2.5, 5);
        scene.add(sunlight);

        const earthGroup = new THREE.Group();
        earthGroupRef.current = earthGroup;
        scene.add(earthGroup);

        const texture = createTerrainTexture();
        const geometry = new THREE.SphereGeometry(1, 64, 48);
        const positions = geometry.attributes.position;
        const uvs = geometry.attributes.uv;
        for (let i = 0; i < positions.count; i += 1) {
            const longitude = uvs.getX(i) * 360 - 180;
            const latitude = uvs.getY(i) * 180 - 90;
            const relief = isLand(longitude, latitude)
                ? Math.max(0, terrainNoise(longitude, latitude)) * 0.01
                : 0;
            const vertex = new THREE.Vector3()
                .fromBufferAttribute(positions, i)
                .normalize()
                .multiplyScalar(1 + relief);
            positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        geometry.computeVertexNormals();

        const earthMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95 });
        const earthMesh = new THREE.Mesh(geometry, earthMaterial);
        earthGroup.add(earthMesh);

        const flagTextures = [];
        const flagSprites = countries.map((country) => {
            const flagTexture = createFlagTexture(country);
            flagTextures.push(flagTexture);
            const material = new THREE.SpriteMaterial({
                map: flagTexture,
                transparent: true,
                depthTest: true,
                depthWrite: false,
            });
            const sprite = new THREE.Sprite(material);
            sprite.position.copy(countryPosition(country));
            sprite.scale.set(0.2, 0.14, 1);
            sprite.userData.countryCode = country.code;
            earthGroup.add(sprite);
            return sprite;
        });

        const resize = () => {
            const { width, height } = host.getBoundingClientRect();
            if (!width || !height) return;
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        let dragging = false;
        let pointerMoved = false;
        let previousX = 0;
        let previousY = 0;

        const onPointerDown = (event) => {
            dragging = true;
            pointerMoved = false;
            previousX = event.clientX;
            previousY = event.clientY;
            renderer.domElement.setPointerCapture(event.pointerId);
        };
        const onPointerMove = (event) => {
            if (!dragging) return;
            const deltaX = event.clientX - previousX;
            const deltaY = event.clientY - previousY;
            if (Math.abs(deltaX) + Math.abs(deltaY) > 2) pointerMoved = true;
            earthGroup.rotation.y += deltaX * 0.006;
            earthGroup.rotation.x += deltaY * 0.004;
            earthGroup.rotation.x = Math.max(-1.1, Math.min(1.1, earthGroup.rotation.x));
            previousX = event.clientX;
            previousY = event.clientY;
        };
        const onPointerUp = (event) => {
            if (!dragging) return;
            dragging = false;
            if (pointerMoved) return;

            const bounds = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
            pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
            scene.updateMatrixWorld(true);
            raycaster.setFromCamera(pointer, camera);
            const [hit] = raycaster.intersectObjects([earthMesh, ...flagSprites], false);
            if (hit?.object.userData.countryCode) {
                onSelectCountry(hit.object.userData.countryCode);
            }
        };
        renderer.domElement.addEventListener('pointerdown', onPointerDown);
        renderer.domElement.addEventListener('pointermove', onPointerMove);
        renderer.domElement.addEventListener('pointerup', onPointerUp);
        renderer.domElement.addEventListener('pointercancel', onPointerUp);

        let frameId;
        const render = () => {
            frameId = window.requestAnimationFrame(render);
            renderer.render(scene, camera);
        };
        render();

        return () => {
            window.cancelAnimationFrame(frameId);
            resizeObserver.disconnect();
            renderer.domElement.removeEventListener('pointerdown', onPointerDown);
            renderer.domElement.removeEventListener('pointermove', onPointerMove);
            renderer.domElement.removeEventListener('pointerup', onPointerUp);
            renderer.domElement.removeEventListener('pointercancel', onPointerUp);
            geometry.dispose();
            texture.dispose();
            earthMaterial.dispose();
            flagSprites.forEach((sprite) => sprite.material.dispose());
            flagTextures.forEach((flagTexture) => flagTexture.dispose());
            renderer.dispose();
            host.removeChild(renderer.domElement);
            earthGroupRef.current = null;
        };
    }, [countries, onSelectCountry]);

    useEffect(() => {
        if (!earthGroupRef.current) return;
        earthGroupRef.current.rotation.y = THREE.MathUtils.degToRad(selectedCountry.longitude - 90);
    }, [selectedCountry]);

    return (
        <div
            className="earth-canvas"
            ref={hostRef}
            role="img"
            aria-label={`Interactive globe with a flag marker for ${selectedCountry.name}`}
        />
    );
}
