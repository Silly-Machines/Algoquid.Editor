'use strict';

const fs = require('fs');

module.exports = {
    write: (config) => {
        fs.writeFile('data.json', JSON.stringify(config, null, '\t'), {encoding: 'utf-8'});
    },

    read: () => {
        let data = fs.readFileSync('data.json', {encoding: 'utf-8'});
        return JSON.parse(data);
    }
};
