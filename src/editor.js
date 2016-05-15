'use strict';

const THREE = require('./lib/three');
const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const config = require('./config');

let level = {}

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

function saveAs () {

}

// Level loading and saving

ipc.on ('file-opened', (event, files) => {

    console.log(files);

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

        loadLevel(content);
    });
});

function loadLevel (jsonLevel) {
    level = JSON.parse(jsonLevel);
    console.log(level);
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

// Editor

const editorWidth = 1000, editorHeight = editorWidth * 9 / 16; // pour avoir du 16/9

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(45, editorWidth / editorHeight, 0.1, 1000);
camera.position.set(25, 3, 5);

var renderer = new THREE.WebGLRenderer();
renderer.setSize(editorWidth, editorHeight);
document.getElementById('viewer').appendChild(renderer.domElement);

var geometry = new THREE.PlaneGeometry(15, 15, 1, 1);
var material = new THREE.MeshBasicMaterial( { color: 0xbe8b5b } );
var ground = new THREE.Mesh(geometry, material);
scene.add(ground);

ground.position.x = -6;
ground.position.y = -6;
ground.position.z = -0.1;

camera.position.z = 15;
camera.position.y = -15;
camera.position.x = 5;

scene.fog = new THREE.FogExp2 (0x0000ff, 0.00001);

var light = new THREE.PointLight(0xffffff);
light.position.set(0,250,0);
scene.add(light);
var ambientLight = new THREE.AmbientLight(0x111111);
scene.add(ambientLight);

//camera.rotation.z = 2 / 3;
//camera.rotation.x = 0.5;
//camera.rotation.y = 0.5;

const gridSize = 12;

for (let i = 0; i <= gridSize; i++) {

    // y lines

    let material = new THREE.LineBasicMaterial({
    	color: 0xff00ff
    });

    let geometry = new THREE.Geometry();
    geometry.vertices.push(
    	new THREE.Vector3(-gridSize, -i, 0 ),
    	new THREE.Vector3(0, -i, 0 )
    );

    let line = new THREE.Line( geometry, material );
    scene.add(line);

    // x lines

    let xMaterial = new THREE.LineBasicMaterial({
    	color: 0xff00ff
    });

    let xGeometry = new THREE.Geometry();
    xGeometry.vertices.push(
    	new THREE.Vector3(-i, -gridSize, 0 ),
    	new THREE.Vector3(-i, 0, 0 )
    );

    let xLine = new THREE.Line(xGeometry, xMaterial);
    scene.add(xLine);
}

var render = function () {
	requestAnimationFrame(render);

    //camera.rotation.z += 0.005;
    camera.position.z += 0.05;

	renderer.render(scene, camera);
};

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
    console.log ('adding ', obj, 'to scene');
    let mat = new THREE.MeshBasicMaterial({ color: 0x2196f3 });
    let geo = new THREE.BoxGeometry (1, 1, 1);
    let mesh = new THREE.Mesh(geo, mat);

    scene.add (mesh);
    mesh.position.x = obj.position.x;
    mesh.position.y = obj.position.y;
}

drawAxis ();
render();
