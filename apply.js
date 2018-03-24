const fs = require('fs-extra')
const request = require('request-promise')

const API_URL = process.env.HDLSS_API_URL || 'https://api.hdlss.io/v1'

module.exports = {
    command: ['apply', 'config', 'configure'],
    desc: 'apply updated configuration',
    builder(yargs) {
    },
    async handler() {
        const file = 'hdlss.config.js'
        const tokenFile = 'hdlss.token.js'

        if (!await fs.exists(file)) {
            console.error(`Expecting config file '${file}' in current directory (${process.cwd()}), but none found. Please create it first.`)
            process.exit(1)
        }

        if (!await fs.exists(tokenFile)) {
            console.error(`Expecting token file '${tokenFile}' in current directory (${process.cwd()}), but none found. Please create it first.`)
            process.exit(1)
        }

        const config = await fs.readFile(file, 'utf8')

        try {
            const {changed} = await request({
                method: 'POST',
                url: `${API_URL}/apply`,
                json: {
                    token: JSON.parse((await fs.readFile(tokenFile, 'utf8')).replace('token = ', '')),
                    config,
                }
            })
            if (changed === 0) {
                console.log(`OK - no changes made`)
            } else {
                console.log(`OK - successfully applied configuration`)
            }
        } catch (e) {
            console.error(e.message)
            process.exit(1)
        }
    }
}
