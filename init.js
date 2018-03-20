const os = require('os')
const path = require('path')
const fs = require('fs-extra')
const request = require('request-promise')

const API_URL = process.env.HDLSS_API_URL || 'https://api.hdlss.io/v1'
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
        const tokenFile = 'hdlss.token.js'

        if (!await fs.exists(file)) {
            console.error(`Expecting config file '${file}' in current directory (${process.cwd()}), but none found. Please create it first.`)
            process.exit(1)
        }

        let uuid
        if (!await fs.exists(UUID_PATH)) {
            try {
                uuid = (await request({
                    method: 'POST',
                    url: `${API_URL}/cli/uuid`,
                    json: true,
                })).uuid
                if (uuid) {
                    await fs.mkdirp(path.dirname(UUID_PATH))
                    await fs.writeFile(UUID_PATH, uuid, 'utf8')
                }
            } catch (e) {
                console.error(`Failed to generate and write CLI UUID: ${e.message}`)
            }
        } else {
            uuid = await fs.readFile(UUID_PATH, 'utf8')
        }

        if (!uuid) {
            console.error(`Could not create or retrieve CLI UUID. Cannot continue with initialization.`)
            process.exit(1)
        }

        const config = await fs.readFile(file, 'utf8')

        try {
            const token = await fs.exists(tokenFile) && JSON.parse((await fs.readFile(tokenFile, 'utf8')).replace('token = ', ''))
            const resp = await request({
                method: 'POST',
                url: `${API_URL}/init`,
                json: {
                    uuid,
                    token,
                    config,
                }
            })

            if (resp.noop) {
                console.error(`Warning: Project was already initialized.`)
            }

            if (resp.token && resp.token !== token) {
                if (resp.noop) {
                    console.error(`Warning: Token was not present, saving it to: ${tokenFile}`)
                }

                const tokenContent = `token = "${resp.token}"`
                console.log(tokenContent)

                if (tokenFile && tokenFile !== '-') {
                    await fs.writeFile(tokenFile, tokenContent, 'utf8')
                }
            }
        } catch (e) {
            console.error(e.message)
            process.exit(1)
        }
    }
}
