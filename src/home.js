const ipc = require('electron').ipcRenderer;
const fs = require('fs');
const config = require('./config');

document.getElementById('new').addEventListener('click', () => {
    window.location = 'editor.html';
});

document.getElementById('continue').addEventListener('click', () => {
    window.location = 'editor.html';
    ipc.send('open-file', {
        title: 'Ouvrir un fichier - Éditeur de niveau Algoquid',
        filters: [
            { name: 'Fichiers Algoquid', extensions: ['json'] },
            { name: 'Tous les fichiers', extensions: ['*'] }
        ],
        property: ['openFile']
    });
});

document.getElementById('pack').addEventListener('click', () => {
    window.location = 'packager.html';
});

let recents = config.read().recent;

if (recents.length > 0) {
    document.getElementById('recents').removeChild(document.getElementById('norecent'));
    recents.forEach((path) => {
        addRecent(path);
    });
}

function addRecent (path) {
    let li = document.createElement ('li');
    li.className = 'card';
    fs.readFile(path, {encoding: 'utf-8'}, (err, data) => {
        if (err) {
            alert('Erreur : ' + err);
            return;
        }

        li.innerHTML = JSON.parse(data).name;
        li.title = path;
        document.getElementById('recents').appendChild(li);

        li.addEventListener('click', () => {
            window.location = 'editor.html';
            ipc.send('load-level', path);
        });
    });
}
