const got = require('got')
const {remote} = require('electron')

const Updater = {}

Updater.checkUpdates = function () {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve.bind(this, false), 1000)
        console.log('App version: ' + remote.app.getVersion())
    })
}

module.exports = Updater