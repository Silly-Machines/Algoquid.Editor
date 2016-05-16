'use strict';

const THREE = require('./lib/three');
const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const config = require('./config');

let level = {
    name: 'Nouveau niveau',
    author: 'Silly Machines',
    difficulty: 'Easy',
    elements: []
};
let currentFile;

let scene, camera, renderer;
const editorWidth = window.innerWidth - 2 * 200, // left and right bar are of 200px
      editorHeight = editorWidth * 9 / 16, // to have 16/9
      gridSize = 12,
      caseSize = 1;

window.addEventListener ('load', () => {
    ipc.send ('editor-loaded');
});

listObjects ();
initEditor ();
initScene ();

// Menu

document.getElementById('home').addEventListener ('click', () => {
    window.location = 'home.html';
});

document.getElementById('open').addEventListener ('click', () => {
    ipc.send('open-file', {
        title: 'Ouvrir un fichier - Éditeur de niveau Algoquid',
        filters: [
            { name: 'Fichiers Algoquid', extensions: ['json'] },
            { name: 'Tous les fichiers', extensions: ['*'] }
        ],
        property: ['openFile']
    });


});

document.getElementById('save').addEventListener ('click', () => {
    saveAs(currentFile);
});

document.getElementById('saveas').addEventListener ('click', () => {
    saveAs();
});

function saveAs (path) {
    if (!path) {
        ipc.send ('save-file', {
            title: 'Sauvegarder un fichier - Éditeur de niveau Algoquid',
            filters: [
                { name: 'Fichiers Algoquid', extensions: ['json'] },
            ]
        });
    } else {
        level.author = document.getElementById('author').value;
        level.name = document.getElementById('name').value;
        let difficulties = ['Easy', 'Medium', 'Hard'];
        level.difficulty = difficulties[document.getElementById('difficulty').selectedIndex];

        fs.writeFile (path, JSON.stringify(level, null, '\t'), (err) => {
            if (err) {
                alert ('Error : ' + err);
            }
        });

        let title = level.name + ' - Éditeur de niveau Algoquid';
        document.getElementById('title').innerHTML = title;
        window.title = title;
    }
}

// Level loading and saving

ipc.on('new-level', () => {
    loadLevel(level);
});

ipc.on ('file-opened', (event, files) => {

    currentFile = files[0];

    // add file to 'recent files' list
    let configuration = config.read();
    var alreadyInConf = false;
    configuration.recent.forEach((file) => {
        if (file == files[0]) {
            alreadyInConf = true;
        }
    });
    if (!alreadyInConf) {
        configuration.recent.push(files[0]);
        config.write(configuration);
    }

    // open level
    fs.readFile(files[0], {encoding: 'utf-8'}, (err, content) => {
        if (err) {
            alert ('Erreur : ' + err);
            return;
        }

        loadLevel(JSON.parse(content));
    });
});

ipc.on ('save-in', (event, file) => {
    saveAs (file);
});

function loadLevel (lvl) {
    initScene ();
    level = lvl;

    document.getElementById('author').value = level.author;
    document.getElementById('name').value = level.name;
    let difficulty = 0;
    if (level.difficulty == 'Easy') {
        difficulty = 0;
    } else if (level.difficulty == 'Medium') {
        difficulty = 1;
    } else {
        difficulty = 2;
    }
    document.getElementById('difficulty').selectedIndex = difficulty;
    let title = level.name + ' - Éditeur de niveau Algoquid';
    document.getElementById('title').innerHTML = title;
    window.title = title;

    // add objects to scene
    level.elements.forEach((elem) => {
        addObject (elem);
    });
}

function listObjects () {
    let conf = config.read ();
    conf.objects.forEach ((obj) => {
        var container = document.createElement('li');
        var img = document.createElement('img');

        img.src = obj.icon;
        img.alt = obj.name;
        container.appendChild(img);

        container.innerHTML += obj.name;
        container.draggable = true;
        container.addEventListener('dragstart', (event) => {
            event.dataTransfer.setDragImage(img, 0, 0);
            event.dataTransfer.setData('text/plain', obj.id);
        });
        document.getElementById('objects').appendChild(container);
    });
}

// Editor

function initEditor () {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, editorWidth / editorHeight, 0.1, 1000);
    camera.position.set(25, 3, 5);

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(editorWidth, editorHeight);
    document.getElementById('viewer').appendChild(renderer.domElement);
}

function initScene () {
    var geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    var material = new THREE.MeshBasicMaterial( { color: 0xbe8b5b } );
    var ground = new THREE.Mesh(geometry, material);
    scene.add(ground);

    ground.position.x = -6;
    ground.position.y = -6;
    ground.position.z = -0.1;

    camera.position.z = 15;
    camera.position.y = -15;
    camera.position.x = 5;

    var light = new THREE.AmbientLight(0x0000ff, 1); // soft white light
    scene.add(light);

    camera.rotation.z = 2 / 3;
    camera.rotation.x = 0.5;
    camera.rotation.y = 0.5;

    for (let i = 0; i <= gridSize; i++) {

        // y lines

        let material = new THREE.LineBasicMaterial({
        	color: 0xff00ff
        });

        let geometry = new THREE.Geometry();
        geometry.vertices.push(
        	new THREE.Vector3(-gridSize, -i * caseSize, 0 ),
        	new THREE.Vector3(0, -i * caseSize, 0 )
        );

        let line = new THREE.Line( geometry, material );
        scene.add(line);

        // x lines

        let xMaterial = new THREE.LineBasicMaterial({
        	color: 0xff00ff
        });

        let xGeometry = new THREE.Geometry();
        xGeometry.vertices.push(
        	new THREE.Vector3(-i * caseSize, -gridSize, 0 ),
        	new THREE.Vector3(-i * caseSize, 0, 0 )
        );

        let xLine = new THREE.Line(xGeometry, xMaterial);
        scene.add(xLine);
    }

    drawAxis ();
    render();
}

function render () {
    console.log ('rendering');
    //requestAnimationFrame(render);

    //camera.position.z += 0.001;

    console.log('rendu :', renderer.render(scene, camera));
}

function drawAxis () {

    // z

    var zMat = new THREE.LineBasicMaterial({
        color: 0x0000ff,
        linewidth: 5
    });

    var zGeometry = new THREE.Geometry();
    zGeometry.vertices.push(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 10)
    );

    var zAxis = new THREE.Line(zGeometry, zMat);
    scene.add(zAxis);

    // x

    var xMat = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 5
    });

    var xGeometry = new THREE.Geometry();
    xGeometry.vertices.push(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(10, 0, 0)
    );

    var xAxis = new THREE.Line(xGeometry, xMat);
    scene.add(xAxis);

    // y

    var yMat = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 5
    });

    var yGeometry = new THREE.Geometry();
    yGeometry.vertices.push(
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 10, 0)
    );

    var yAxis = new THREE.Line(yGeometry, yMat);
    scene.add(yAxis);

}

function addObject (obj) {
    let mat = new THREE.MeshBasicMaterial({ color: 0x2196f3 });
    let geo = new THREE.BoxGeometry (1, 1, 1);
    let mesh = new THREE.Mesh(geo, mat);

    scene.add (mesh);
    mesh.position.x = -((gridSize + 1) - obj.position.x - caseSize / 2);
    mesh.position.y = -((gridSize + 1) - obj.position.z - caseSize / 2);
    mesh.position.z = 0.5;
    render ();
}

document.getElementById('viewer').addEventListener("dragover", function (evt) {
    evt.preventDefault();
}, false);

// from http://stackoverflow.com/a/13091694
document.getElementById('viewer').addEventListener ('drop', (event) => {
    event.preventDefault ();
    var vector = new THREE.Vector3();
    vector.set(
        (event.offsetX / editorWidth) * 2 - 1,
        -(event.offsetY / editorHeight) * 2 + 1,
        0.5);
    vector.unproject(camera);
    var dir = vector.sub( camera.position ).normalize();
    var distance = - camera.position.z / dir.z;
    var pos = camera.position.clone().add( dir.multiplyScalar( distance ) );
    console.log(pos);
    addObject ({
        position: {
            x: Math.floor(gridSize + pos.x) + 1,
            z: Math.floor(gridSize + pos.y) + 1
        }
    });
    level.elements.push({
        name: event.dataTransfer.getData('text'),
        position: {
            x: Math.floor(gridSize + pos.x) + 1,
            z: Math.floor(gridSize + pos.y) + 1
        },
        rotation: 0
    });
});
