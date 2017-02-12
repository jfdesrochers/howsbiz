const m = require('mithril')
const Updater = require('./updater.js')

const AppLoader = require('./ui/loader.js')
const {AccountsUI} = require('./ui/accounts.js')
const MainWindow = require('./ui/mainwindow.js')

const HowsApp = {}

const {ObjectID} = require('mongodb')
HowsApp.app = {
    user: {"_id":ObjectID("589409c7addba91b0490fca9"),"firstname":"Jean-François","lastname":"Desrochers","username":"1256614","email":"jean-francois.desrochers@staples.ca","district":"19","store":"139","position":"sls"},
    ready: true
}

HowsApp.oninit = function () {
    this.loaderReady = () => {
        console.log('Welcome to How\'s Biz by Jean-Francois Desrochers')
        AppLoader.status.msg('Vérifications des mises à jour...')
        Updater.checkUpdates()
        .then((shouldUpdate) => {
            if (shouldUpdate) {
                //perform update here
            }
        })
        .catch((err) => {
            AppLoader.status.err(err)
            return new Promise((resolve) => {
                setTimeout(resolve, 3000)
            })
        })
        .then(() => {
            HowsApp.app.ready = true
            m.redraw()
        })
    }
}

HowsApp.view = function () {
    return HowsApp.app.ready ? (HowsApp.app.user ? m(MainWindow, {app: HowsApp.app}) : m(AccountsUI, {app: HowsApp.app})) : m(AppLoader, {onready: this.loaderReady})
}

module.exports = HowsApp