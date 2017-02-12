const got = require('got')
const gotZip = require('got-zip')
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
            console.log(latestTag)
            if (semver.lt(curver, latestTag)) {
                resolve(latestTag)
            } else {
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
        gotZip(zipUrl + version + '.zip', {
            dest: './.tmp',
            extract: true,
            cleanup: true,
            exclude: ['readme.md'],
            strip: 0
        }).then(function () {
            resolve()
        }).catch(function (err) {
            console.log('Error [updater] ' + err)
            reject('Impossible de télécharger les mises à jour pour l\'instant.')
        })
    })
}

module.exports = Updater