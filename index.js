#!/usr/bin/env node

const args = require('yargs')
    .command(require('./init'))
    .command(['apply', 'config', 'configure'], 'apply configuration', yargs => {
    }, async args => {
        // load config
        // post it to api.hdlss.io/init
    })
    .demandCommand()
    .help('h')
    .alias('h', 'help')
    .argv
