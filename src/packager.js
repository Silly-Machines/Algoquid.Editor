'use strict';

const config = require('./config');
const zip = require('jszip')();
const fs = require('fs');
const shell = require('electron').shell;
const ipc = require('electron').ipcRenderer;
const remote = require('electron').remote;
const Menu = remote.Menu;
const MenuItem = remote.MenuItem;

let files = []

document.getElementById('author').value = config.read().defaultAuthor;

document.getElementById('add').addEventListener('click', () => {
    ipc.send('open-file', {
        title: 'Ajouter un niveau - Éditeur de niveau Algoquid',
        filters: [
            { name: 'Fichiers Algoquid', extensions: ['json'] },
            { name: 'Tous les fichiers', extensions: ['*'] }
        ],
        properties: ['openFile']
    });
});

ipc.on('file-opened', (event, newFiles) => {
    newFiles.forEach((file) => {
        files.push (file);
        fs.readFile(file, {encoding: 'utf-8'}, (err, data) => {
            if (err) {
                alert('Erreur : ' + err);
                return;
            }

            let level = JSON.parse(data);
            let card = document.createElement('li');
            card.className = 'card';
            card.innerHTML = level.name ? level.name : file;
            card.title = file;

            let levels = document.getElementById('levels');
            levels.insertBefore(card, levels.firstChild);

            const menu = new Menu();
            menu.append(new MenuItem({label: 'Supprimer', click() {
                files = files.filter((fl) => {
                    return fl != file;
                });
                levels.removeChild(card);
            }}));

            card.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                menu.popup(remote.getCurrentWindow());
            });
        });
    })
});

document.getElementById('ok').addEventListener ('click', () => {
    let pack = {
        name: document.getElementById('name').value,
        author: document.getElementById('author').value,
        description: document.getElementById('desc').value,
        difficulty: document.getElementById('diff').value,
        levels: files
    };

    zip.file('pack.info', JSON.stringify(pack, null, '\t'));

    files.forEach((file) => {
        let content = fs.readFileSync(file, {encoding: 'utf-8'});
        zip.file(file, content);
    });

    let output = config.read().gamePath;
    if (process.platform == 'win32') {
        if (!output.endsWith('\\')) {
            output += '\\';
        }
    } else {
        if (!output.endsWith('/')) {
            output += '/';
        }
    }
    output = output + pack.name +'.zip';

    zip.generateNodeStream({type:'nodebuffer',streamFiles:true})
        .pipe(fs.createWriteStream(output))
        .on('finish', function () {
            shell.showItemInFolder(output);
        });
});

document.getElementById('cancel').addEventListener('click', () => {
    window.location = 'home.html';
});
