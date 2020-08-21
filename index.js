const { rastro } = require('rastrojs')
const restify = require('restify')
const {getUser, createUser, updateUser} = require('./storage')

const apiKey = process.env.JSONBOX_APIKEY
const port = process.env.PORT

if (!apiKey) {
    console.error("JSONBOX_APIKEY not found");
    return
}

if (!port) {
    console.error("PORT not found");
    return
}

const getResponse = (message, success, data) => {
    if (success) {
        return { data, success }
    }
    return { message, success }
}

const getSuccessResponse = (data) => getResponse(null, true, data)

const getErrorResponse = (message) => getResponse(message, false, null)

const server = restify.createServer();

server.use(restify.plugins.bodyParser())

server.get('/pacote/:code', async function(req, res, next) {
    const track = await rastro.track(req.params.code);
    res.send(getSuccessResponse(track))
    return next()
})

server.get('/pacotes/:email', async function(req, res, next) {
    const user = await getUser(req.params.email)
    if (!user) {
        res.send(getSuccessResponse([]))
        return next()
    }
    const tracks = await rastro.track(user.orders.map(o => o.code))
    const ordersWithTracks = user.orders.map(o => {
        const track = tracks.find(t => t.code == o.code)
        if (track.isInvalid) {
            return { ...o, tracks: [] }
        }
        return { ...track, description: o.description }
    })
    res.send(getSuccessResponse({ email: user.email, orders: ordersWithTracks }))
    return next()
})

server.post('/pacotes/:email', async function(req, res, next) {
    const body = req.body
    if (!body.description) {
        res.send(getErrorResponse("O campo description é obrigatório"))
        return next()
    }
    if (!body.code) {
        res.send(getErrorResponse("O campo code é obrigatório"))
        return next()
    }
    const order = {
        code: body.code,
        description: body.description
    }
    const trackList = await rastro.track(order.code);
    const track = trackList[0]
    console.log({ track });
    if (track.isInvalid) {
        res.send(getErrorResponse("Código inválido"))
        return next()
    }

    const user = await getUser(req.params.email)
    console.log({ user });
    if (!user) {
        const createdUser = await createUser(apiKey, req.params.email, [order])
        console.log({ createdUser });
    } else {
        const updatedUser = await updateUser(apiKey, { ...user, orders: [ ...user.orders, order ] })
        console.log({ updatedUser });
    }

    res.send(getSuccessResponse(track))
    return next()
})

server.listen(port, function() {
    console.log('%s listening at %s', server.name, server.url)
})
