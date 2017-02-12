const m = require('mithril')
const Updater = require('./updater.js')

const AppLoader = require('./ui/loader.js')
const {AccountsUI} = require('./ui/accounts.js')
const MainWindow = require('./ui/mainwindow.js')

const HowsApp = {}

//debug const {ObjectID} = require('mongodb')
HowsApp.app = {
    // debug user: {"_id":ObjectID("589409c7addba91b0490fca9"),"firstname":"Jean-François","lastname":"Desrochers","username":"1256614","email":"jean-francois.desrochers@staples.ca","district":"19","store":"139","position":"sls"},
    ready: false
}

HowsApp.oninit = function () {
    this.loaderReady = () => {
        console.log('Welcome to How\'s Biz by Jean-Francois Desrochers')
        AppLoader.status.msg('Vérifications des mises à jour...')
        Updater.checkUpdates()
        .then((newVersion) => {
            if (newVersion) {
                Updater.doUpdate(newVersion)
                .then(() => {
                    //location.reload()
                    console.log('done')
                })
                .catch((err) => {
                    AppLoader.status.err(err)
                    setTimeout(() => {
                        HowsApp.app.ready = true
                        m.redraw()
                    }, 3000)
                })
            } else {
                HowsApp.app.ready = true
                m.redraw()
            }
        })
        .catch((err) => {
            AppLoader.status.err(err)
            setTimeout(() => {
                HowsApp.app.ready = true
                m.redraw()
            }, 3000)
        })
    }
}

HowsApp.view = function () {
    return HowsApp.app.ready ? (HowsApp.app.user ? m(MainWindow, {app: HowsApp.app}) : m(AccountsUI, {app: HowsApp.app})) : m(AppLoader, {onready: this.loaderReady})
}

module.exports = HowsApp