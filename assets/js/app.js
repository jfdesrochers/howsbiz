const m = require('mithril')
const AppLoader = require('./ui/loader.js')
const {AccountsUI} = require('./ui/accounts.js')
const MainWindow = require('./ui/mainwindow.js')
const {getClock} = require('./utils/dateutils')
window.jQuery = window.$ = require('jquery')
require('bootstrap')

const HowsApp = {}

HowsApp.app = {
    user: null,
    ready: false
}

HowsApp.oninit = function () {
    this.loaderReady = () => {
        console.log('Welcome to How\'s Biz by Jean-Francois Desrochers')
        setTimeout(() => {
            HowsApp.app.ready = true
            m.redraw()
        }, 1000)
    }
}

HowsApp.view = function () {
    return HowsApp.app.ready ? (HowsApp.app.user ? m(MainWindow, {app: HowsApp.app}) : m(AccountsUI, {app: HowsApp.app})) : m(AppLoader, {onready: this.loaderReady})
}

// Disable Dragging into the Window
'use strict';
document.addEventListener('dragstart', function (event) {
    event.preventDefault();
    return false;
}, false);
document.addEventListener('dragover', function (event) {
    event.preventDefault();
    return false;
}, false);
document.addEventListener('drop', function (event) {
    event.preventDefault();
    return false;
}, false);

// Start the clock
let clockelem = document.getElementById('clock')
function advanceClock() {
    clockelem.innerHTML = getClock()
}
setInterval(advanceClock, 1000)

// Mount the application
m.mount(document.getElementById("hbcontents"), HowsApp)
