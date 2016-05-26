const THREE = require('./lib/three');
const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const config = require('./config');

let level = {
    name: 'Nouveau niveau',
    author: config.read().defaultAuthor,
    difficulty: 'Easy',
    elements: [],
    objectives: {
        position: {},
        inventory: []
    }
};
let currentFile;

let scene, camera, renderer;
const editorWidth = 1080, // doesn't work well window.innerWidth - 2 * 300, // left and right bar are of 200px
      editorHeight = editorWidth * 9 / 16, // to have 16/9
      caseSize = 1;
let gridSize = 12;
let mousePos = new THREE.Vector2(),
    raycaster = new THREE.Raycaster(),
    selectedObj;

window.addEventListener ('load', () => {
    ipc.send ('editor-loaded');
});

listObjects ();
initEditor ();
initScene ();

window.addEventListener ('resize', () => {
    var viewer = document.getElementById('viewer');
    renderer.setSize();
});

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
        properties: ['openFile']
    });
});

document.getElementById('save').addEventListener ('click', () => {
    saveAs(currentFile);
});

document.getElementById('saveas').addEventListener ('click', () => {
    saveAs();
});

document.getElementById('options').addEventListener('click', () => {
    ipc.send('show-options');
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
    if (file) {
        saveAs (file);
    }
});

function loadLevel (lvl) {
    initScene ();
    level = lvl;

    showLevelInfo();

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
            event.dataTransfer.setDragImage(img, 1000000, 1000000);
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
    for (let child of scene.children) {
        scene.remove(child);
    }


    var geometry = new THREE.PlaneGeometry(100, 100, 1, 1);
    var material = new THREE.MeshBasicMaterial( { color: 0xbe8b5b } );
    var ground = new THREE.Mesh(geometry, material);
    ground.name = 'notSelectable';
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
        line.name = 'notSelectable';
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
        xLine.name = 'notSelectable';
        scene.add(xLine);
    }

    if (config.read().showAxis) {
        drawAxis ();
    }
    render();
}

function render () {
    renderer.render(scene, camera);
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
    mesh.rotation.z = obj.rotation * 180 / Math.PI;
    mesh.algoquidObject = obj;

    if (config.read().autoFocusNew) {
        mesh.material.color.set(0xbbdefb);
        selectedObj = mesh;
        showObjectInfo();
    }

    render ();
    return mesh;
}

document.getElementById('viewer').addEventListener('dragover', function (evt) {
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

    let newObj = {
        name: event.dataTransfer.getData('text'),
        position: {
            x: Math.floor(gridSize + pos.x) + 1,
            z: Math.floor(gridSize + pos.y) + 1
        },
        rotation: 0
    };
    addObject (newObj);
    level.elements.push(newObj);
});

// objects edition

document.getElementById('viewer').addEventListener('mousedown', (event) => {
    mousePos.x = (event.offsetX / editorWidth) * 2 - 1;
    mousePos.y = -(event.offsetY / editorHeight) * 2 + 1;

    raycaster.setFromCamera(mousePos, camera);
	var intersects = raycaster.intersectObjects(scene.children);
    if (intersects[0].object && intersects[0].object.name != 'notSelectable') {
        if (selectedObj) {
            selectedObj.material.color.set(0x2196f3);
        }
        intersects[0].object.material.color.set(0xbbdefb);
        selectedObj = intersects[0].object;
        showObjectInfo();
    } else {
        selectedObj.material.color.set(0x2196f3);
        selectedObj = undefined;
        showLevelInfo();
    }

    render ();
});

function showLevelInfo () {
    var propPane = document.getElementById('properties');
    propPane.innerHTML = `<h3>Propriétés du niveau</h3>`;

    propPane.appendChild(createInput('name', 'Nom', 'text', level.name, (event) => {
        level.name = event.target.value;
    }));

    propPane.appendChild(createInput('author', 'Auteur', 'text', level.author, (event) => {
        level.author = event.target.value;
    }));

    propPane.appendChild(createInput('size', 'Dimensions', 'number', level.size, (event) => {
        let size = new Number(event.target.value);
        level.size = size;
        gridSize = size;
        initScene();
    }));

    let selectLabel = document.createElement('label');
    selectLabel.innerHTML = 'Difficultée : ';
    selectLabel.for = 'difficulties';

    let select = document.createElement('select');
    select.name = 'difficulties'
    let difficulties = [
        {
            name: 'Facile',
            id: 'Easy'
        },{
            name: 'Moyen',
            id: 'Medium'
        },{
            name: 'Difficile',
            id: 'Hard'
        }];
    difficulties.forEach((diff) => {
        let diffOpt = document.createElement('option');
        diffOpt.value = diff.id;
        diffOpt.innerHTML = diff.name;
        select.appendChild(diffOpt);
    });

    select.selectedIndex = difficulties.findIndex((elt) => {
        return elt.id == level.difficulty;
    });

    select.addEventListener('change', (event) => {
        level.difficulty = event.target.value;
    });

    let container = document.createElement('div');
    container.appendChild(selectLabel);
    container.appendChild(select);
    propPane.appendChild(container);

    // objectives

    let h3Objectives = document.createElement('h3');
    h3Objectives.innerHTML = 'Objectifs';
    propPane.appendChild(h3Objectives);

    let info = document.createElement('p');
    info.innerHTML = 'Laissez des valeurs vides (ou négatives) pour ne pas demander ces objetcifs.';
    propPane.appendChild(info);

    propPane.appendChild(createInput('posx', 'Position X', 'number', level.objectives.position.x, (event) => {
        if (event.target.value && event.target.value >= 0) {
            level.objectives.position.x = event.target.value;
        } else {
            level.objectives.position.x = undefined;
        }
    }));

    propPane.appendChild(createInput('posy', 'Position Y', 'number', level.objectives.position.z, (event) => {
        if (event.target.value && event.target.value >= 0) {
            level.objectives.position.z = event.target.value;
        } else {
            level.objectives.position.z = undefined;
        }
    }));

    // inventory

    let invList = document.createElement('select');
    invList.name = 'inv';
    invList.multiple = true;

    let objName = createInput('objname', 'Nom de l\'item', 'text', null, (event) => {
        let count = new Number(document.getElementById('objcount').value);
        level.objectives.inventory[invList.selectedIndex] = {
            id: event.target.value,
            count: count
        };
        invList.options[invList.selectedIndex].innerHTML = event.target.value + ' - ' + count;
    });

    let objCount = createInput('objcount', 'Nombre minimum à avoir', 'number', null, (event) => {
        let name = document.getElementById('objname').value;
        level.objectives.inventory[invList.selectedIndex] = {
            id: name,
            count: new Number(event.target.value)
        };
        invList.options[invList.selectedIndex].innerHTML = name + ' - ' + event.target.value;
    });

    let invLabel = document.createElement('h4');
    invLabel.innerHTML = 'Inventaire : ';

    let addInvObjective = (name, count) => {
        let opt = document.createElement('option');
        opt.innerHTML = `${name} - ${count}`;
        invList.appendChild(opt);
        invList.selectedIndex = invList.length - 1;
        invList.focus();
        invList.dispatchEvent(new Event('change'));
    };

    let newInv = document.createElement('button');
    newInv.innerHTML = 'Ajouter';
    newInv.addEventListener('click', () => addInvObjective('Inconnu', 0));

    level.objectives.inventory.forEach((objectif) => {
        addInvObjective(objectif.id, objectif.count);
    });

    invList.addEventListener('change', () => {
        let currOpt = invList.options[invList.selectedIndex];
        let match;
        if (match = currOpt.innerHTML.match(/^(.*) - (.*)/)) {
            document.getElementById('objname').value = match[1];
            document.getElementById('objcount').value = new Number(match[2]);
        }
    });

    propPane.appendChild(invLabel);
    propPane.appendChild(invList);
    propPane.appendChild(objName);
    propPane.appendChild(objCount);
    propPane.appendChild(newInv);
}

function showObjectInfo () {
    var propPane = document.getElementById('properties');
    propPane.innerHTML = `<h3>Propriétés de l'objet «${selectedObj.algoquidObject.name}»</h3>`; // un peu sale ... :-°
    propPane.appendChild(createInput('name', 'Identifiant', 'text', selectedObj.algoquidObject.name, (event) => {
        selectedObj.algoquidObject.name = event.target.value;
    }));

    propPane.appendChild(createInput('posx', 'Position X', 'number', selectedObj.algoquidObject.position.x, (event) => {
        let newVal = new Number(event.target.value);
        selectedObj.position.x = -((gridSize + 1) - newVal - caseSize / 2);
        render();
    }));

    propPane.appendChild(createInput('posy', 'Position Y', 'number', selectedObj.algoquidObject.position.z, (event) => {
        let newVal = new Number(event.target.value);
        selectedObj.position.y = -((gridSize + 1) - newVal - caseSize / 2);
        render();
    }));

    propPane.appendChild(createInput('rotation', 'Rotation', 'number', selectedObj.algoquidObject.rotation, (event) => {
        let newVal = new Number(event.target.value);
        newVal = newVal * Math.PI / 180
        selectedObj.rotation.z = newVal;
        selectedObj.algoquidObject.rotation = newVal;
        render();
    }));

    let delBt = document.createElement('button');
    delBt.innerHTML = 'Supprimer cet élément';
    delBt.addEventListener('click', () => {
        console.log('clicked');
        scene.remove(selectedObj);
        selectedObj.algoquidObject = undefined;
        render();
        showLevelInfo();
    });
    propPane.appendChild(delBt);
}

function createInput (name, title, type, defValue, change) {
    if (!name) {
        return;
    }
    var label = document.createElement('label');
    label.for = name;
    if (title) {
        label.innerHTML = title + ' : ';
    } else {
        label.innerHTML = name + ' : ';
    }

    var input = document.createElement('input');
    input.type = type ? type : 'text';
    input.id = name;
    input.name = name;

    if (defValue || defValue == 0) {
        input.value = defValue;
    }

    if (change) {
        input.addEventListener('change', change);
    }

    var container = document.createElement('div');
    container.appendChild(label);
    container.appendChild(input);

    return container;
}
