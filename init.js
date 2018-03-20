const os = require('os')
const path = require('path')
const fs = require('fs-extra')
const request = require('request-promise')

// const API_URL = 'https://api.hdlss.io/v1'
const API_URL = 'http://localhost:4000/v1'
const UUID_PATH = path.join(os.homedir(), '.hdlss', 'uuid')

module.exports = {
    command: 'init',
    builder(yargs) {
    },
    async handler() {
        // workflow:
        // hdlss init
        // go and edit configuration file
        // but probably don't start from scratch, but instead from complete basic to intermediate template
        // hdlss apply

        const file = 'hdlss.config.js'

        if (!await fs.exists(file)) {
            console.error(`Expecting config file '${file}' in current directory, but none found. Please create it first.`)
            process.exit(1)
        }

        if (!await fs.exists(UUID_PATH)) {
            const {uuid} = await request({
                method: 'POST',
                url: `${API_URL}/cli/uuid`
            })
            await fs.mkdir(path.dirname(UUID_PATH))
            await fs.writeFile(UUID_PATH, uuid, 'utf8')
        }

        const uuid = await fs.readFile(UUID_PATH, 'utf8')

        const config = await fs.readFile(file, 'utf8')

        try {
            const {token} = await request({
                method: 'POST',
                url: `${API_URL}/init`,
                json: {
                    uuid,
                    config,
                }
            })

            console.log(token)
        } catch (e) {
            console.error(e.message)
            process.exit(1)
        }
    }
}
