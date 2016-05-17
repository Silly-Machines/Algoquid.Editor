'use strict';

const fs = require('fs');
const path = 'data.json'

module.exports = {
    write: (config) => {
        fs.writeFile(path, JSON.stringify(config, null, '\t'), {encoding: 'utf-8'});
    },

    read: () => {
        let data = fs.readFileSync(path, {encoding: 'utf-8'});
        return JSON.parse(data);
    },
};
