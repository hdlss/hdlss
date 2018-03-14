#!/usr/bin/env node

const fs = require('fs-extra')
const request = require('request-promise')

const args = require('yargs')
    .command(['init', '$0'], 'initialize your hdlss.io configuration (or update it)', yargs => {
        yargs
            .alias('f', 'file')
            .nargs('f', 1)
            .describe('f', 'configuration file')
            .demandOption('f')
    }, async args => {
        // load config
        const config = require(args.f)
        // post it to api.hdlss.io/init

    })
    .demandCommand()
    .help('h')
    .alias('h', 'help')
    .argv
