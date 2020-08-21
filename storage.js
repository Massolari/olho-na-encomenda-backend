const https = require('https')
const querystring = require('querystring')

const box = 'users_e2bba7328b532099d908'

const defaultOptions = {
    host: "jsonbox.io",
    path: `/${box}`,
}

const defaultHeaders = {
    'Content-Type': 'application/json'
}

const getPath= (path, query) =>
    (query && query.length > 0) ?
        `${ path }?${query}`
        :
        path

const getOptions = (apiKey, method, query, path) => ({
    ...defaultOptions,
    path: getPath(defaultOptions.path + path, query),
    headers: apiKey ? { ...defaultHeaders, 'x-api-key': apiKey } : defaultHeaders,
    method,
})

const request = (apiKey, query, method, body, path = "") => {
    return new Promise((resolve, reject) => {
        const options = getOptions(apiKey, method, query, path)
        console.log({ options });
        const req = https.request(options, function(response) {
            let str = ''

            response.on('data', (chunk) => str += chunk)

            response.on('end', () => {
                console.log({ str });
                try {
                    resolve(JSON.parse(str))
                } catch (e) {
                    console.error({ e });
                    reject(e)
                }
            });

        })
        console.log({ body });
        if (body) {
            const bodyStr = JSON.stringify(body)
            console.log({ bodyStr });
            req.write(bodyStr)
        }
        req.on('error', (e) => {
            console.error(e);
            reject(e)
        });
        req.end()
    })
}

const getRequest = (query = "", path = "") => request(null, query, "GET", null, path)

const postRequest = (apiKey, body, path = "") => request(apiKey, "", "POST", body, path)

const putRequest = (apiKey, body, path = "") => request(apiKey, "", "PUT", body, path)

const getUser = (email) => getRequest(`q=email:${email}`).then(users => users[0], "")

const createUser = (apiKey, email, orders) => postRequest(apiKey, { email, orders }, "")

const updateUser = (apiKey, user) => putRequest(apiKey, user, `/${user._id}`)

module.exports = {
    getUser,
    createUser,
    updateUser
}
