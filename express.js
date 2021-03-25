const isString = require('lodash.isstring')
const { verifyData } = require('./index')

module.exports = function (getUser, pickPublicKey) {
  return async function (req, res, next) {
    let body
    if (req.body._sig && req.body.timestamp && req.body.userID) {
      body = req.body
    } else if (req.query._sig && req.query.timestamp && req.query.userID) {
      body = req.query
      if (isString(body.timestamp)) {
        body.timestamp = Number(body.timestamp)
      }
    }
    if (body) {
      const user = await getUser(body.userID)
      if (!user) {
        // res.status(401).header('WWW-Authenticate', 'SignedMessage').send()
        res.status(401).send({
          error: true,
          errorMessage: 'NO_USER_ID'
        })
        return
      }
      const pubKey = pickPublicKey(user)
      let validated = false
      try {
        validated = verifyData(body, pubKey)
      } catch (e) {
        throw e
        // TODO handle statistics?
      }
      if (!validated) {
        res.status(401).send({
          error: true,
          errorMessage: 'VERIFICATION_FAILED'
        })
        return
      }
      console.log('Validated:', validated)
      req.user = user
    }

    next()
  }
}

module.exports.authenticationMandatory = function (req, res, next) {
  if (!req.user) {
    res.status(403).send({
      error: true,
      errorMessage: 'AUTHENTICATION_MANDATORY'
    })
  } else {
    next()
  }
}