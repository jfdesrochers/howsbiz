const got = require('got')
const zlib = require('zlib')
const tar = require('tar')
const {remote} = require('electron')
const semver = require('semver')

const repoUrl = 'https://github.com/jfdesrochers/howsbiz/releases/latest'
const zipUrl = 'https://github.com/jfdesrochers/howsbiz/archive/'

const Updater = {}

Updater.checkUpdates = function () {
    return new Promise(function (resolve, reject) {
        let curver = remote.app.getVersion()
        console.log('App version: ' + curver)
        got.head(repoUrl)
        .then((res) => {
            let latestTag = res.socket._httpMessage.path.split('/').pop()
            if (semver.lt(curver, latestTag)) {
                console.log('New version: ' + latestTag)
                resolve(latestTag)
            } else {
                console.log('No updates.')
                resolve(false)
            }
        })
        .catch((err) => {
            console.log('Error [updater] ' + err)
            reject('Impossible de vérifier les mises à jour pour l\'instant.')
        })
    })
}

Updater.doUpdate = function (version) {
    return new Promise(function (resolve, reject) {
        got.stream(zipUrl + version + '.tar.gz').pipe(zlib.createGunzip()).pipe(tar.Extract({path: remote.app.getAppPath(), strip: 1}))
        .on('error', (err) => {
            console.log('Error [untar]' + err)
            reject('Impossible d\'installer les mises à jour pour l\'instant.')
        })
        .on('end', () => resolve());
    })
}

module.exports = Updater