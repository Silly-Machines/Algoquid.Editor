'use strict';

const config = require ('./config');
const ipc = require('electron').ipcRenderer;
let conf = config.read();

window.addEventListener('load', () => {
    let showAxis = document.getElementById('showaxis');
    showAxis.checked = conf.showAxis;
    showAxis.addEventListener('change', (event) => {
        conf.showAxis = showAxis.checked;
    });

    let autoFocus = document.getElementById('autoFocus');
    autoFocus.checked = conf.autoFocusNew;
    autoFocus.addEventListener('change', (event) => {
        conf.autoFocusNew = autoFocus.checked;
    });

    let author = document.getElementById('author');
    author.value = conf.defaultAuthor;
    author.addEventListener('change', (event) => {
        conf.defaultAuthor = author.value;
    });

    let path = document.getElementById('gamePath');
    path.value = conf.gamePath;
    path.addEventListener('change', (event) => {
        conf.gamePath = path.value;
    });
});

document.getElementById('ok').addEventListener('click', () => {
    config.write(conf);
    close();
});

document.getElementById('cancel').addEventListener('click', () => {
    close();
});

document.getElementById('explore').addEventListener('click', () => {
    ipc.send('open-file', {
        title: 'Chemin du jeu - Éditeur de niveau Algoquid',
        properties: ['openDirectory']
    });
});

ipc.on ('file-opened', (event, files) => {
    document.getElementById('gamePath').value = files[0];
    conf.gamePath = files[0];
});
