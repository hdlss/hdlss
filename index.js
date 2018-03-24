#!/usr/bin/env node

require('yargs')
    .command(require('./init'))
    .command(require('./apply'))
    .demandCommand()
    .help('h')
    .alias('h', 'help')
    .argv
