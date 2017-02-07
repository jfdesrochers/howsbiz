const m = require('mithril')
const Property = require('../utils/Property.js')
const $ = window.$ || require('../../vendor/js/jquery-2.2.4.min.js')

const {ValidatingInput, ValidatingSelect} = require('./components.js')
const {districtList, storeList, positionList, Database} = require('../data.js')


const UserAccount = {
    firstname: Property(''),
    lastname: Property(''),
    username: Property(''),
    password: Property(''),
    passconf: Property(''),
    email: Property(''),
    district: Property('-1'),
    store: Property('-1'),
    position: Property('-1'),
    reset: () => {
        UserAccount.firstname('')
        UserAccount.lastname('')
        UserAccount.username('')
        UserAccount.password('')
        UserAccount.passconf('')
        UserAccount.email('')
        UserAccount.district('-1')
        UserAccount.store('-1')
        UserAccount.position('-1')
    }
}

const PasswordChange = {}

PasswordChange.oninit = function (vnode) {
    this.user = vnode.attrs.user
    this.oldpassword = Property('')
    this.newpassword = Property('')
    this.passconf = Property('')
    this.validations = {}
    this.goLogin = (e) => {
        e.preventDefault()
        let valid = Object.keys(this.validations).filter((val) => !this.validations[val].validate()).length === 0
        if (valid) {
            this.isLoading(true)
            Database.changePassword(this.oldpassword(), this.newpassword())
            .then(() => {
                if (typeof vnode.attrs.done === 'function') {
                    vnode.attrs.done(true)
                }
            })
            .catch((rsn) => {
                if (rsn.errcode == 'e_badpassword') {
                    console.log('Error [MongoDB] Wrong username or password')
                    this.validations['oldpassword'].validate(false, 'Votre ancien mot de passe entré est incorrect.')
                } else {
                    console.log('Error [MongoDB] ' + rsn.errmsg)
                    this.validations['oldpassword'].validate(false, 'Une erreur est survenue lors de la connexion au serveur! Veuillez réessayer ultérieurement!')
                }
                this.isLoading(false)
            })
        }
        return false
    }
}

PasswordChange.view = function () {
    m(".modal.fade.in#passchange[tabindex='-1']", [
		m(".modal-dialog", [
			m(".modal-content", [
				m(".modal-header", [
					m("button.close[type='button']", [m("span", "×")]),
					m("h4.modal-title[id='myModalLabel']", "Changer votre mot de passe")
				]),
				m(".modal-body", [
                    'Pour changer votre mot de passe, veuillez entrer les informations ci-dessous.',
                    m('form', {action: '', onsubmit: this.goChange, oncreate: () => $('#oldpassword').focus()}, [
                        m(ValidatingInput, {options:{
                            name: 'oldpassword',
                            type: 'password',
                            label: 'Ancien mot de passe',
                            showValid: true,
                            fieldValue: this.oldpassword,
                            validPattern: /.+/gi,
                            errMessage: 'Ce champ ne peut pas être vide!',
                            actions: this.validations
                        }}),
                        m(ValidatingInput, {options:{
                            name: 'newpassword',
                            type: 'password',
                            label: 'Nouveau mot de passe',
                            showValid: true,
                            fieldValue: this.newpassword,
                            validPattern: /.+/gi,
                            errMessage: 'Ce champ ne peut pas être vide!',
                            actions: this.validations
                        }}),
                        m(ValidatingInput, {options:{
                            name: 'passwordconf',
                            type: 'password',
                            label: 'Confirmation de mot de passe',
                            showValid: true,
                            fieldValue: this.passconf,
                            errMessage: 'Le mot de passe et sa confirmation doivent être identiques!',
                            onvalidate: (text) => (text === this.newpassword()),
                            actions: this.validations
                        }})
                    ])
                ]),
				m(".modal-footer", [
					m("button.btn.btn-default[type='button']", "Fermer"),
					m("button.btn.btn-primary[type='button']", "Sauvegarder")
				])
			])
		])
	])
}

const AccountsUI = {}

AccountsUI.oninit = function () {
    this.action = 'login'
}

const Accounts_oncreate = function (vnode) {
    $(vnode.dom).slideDown(() => {
        if (typeof vnode.attrs.onready === 'function') {
            vnode.attrs.onready()
        }
    })
}

const AccountsLogin = {
    validations: {},
    isLoading: Property(false, () => {m.redraw()}), 
    oninit: function (vnode) {
        this.app = vnode.attrs.app,
        this.parent = vnode.attrs.parent,
        this.goLogin = (e) => {
            e.preventDefault()
            let valid = Object.keys(this.validations).filter((val) => !this.validations[val].validate()).length === 0
            if (valid) {
                this.isLoading(true)
                Database.loginUser(UserAccount)
                .then((user) => {
                    delete user.password
                    UserAccount.reset()
                    this.app.user = user
                    this.isLoading(false)
                })
                .catch((rsn) => {
                    if (rsn.errcode == 'e_badpassword') {
                        console.log('Error [MongoDB] Wrong username or password')
                        this.validations['loginUser'].validate(false, 'Le nom d\'utilisateur ou le mot de passe entré est incorrect.')
                    } else {
                        console.log('Error [MongoDB] ' + rsn.errmsg)
                        this.validations['loginUser'].validate(false, 'Une erreur est survenue lors de la connexion au serveur! Veuillez réessayer ultérieurement!')
                    }
                    this.isLoading(false)
                })
            }
            return false
        }
        this.createAccount = (e) => {
            e.preventDefault()
            this.parent.action = 'newacct'
            m.redraw()
            return false
        }
    },
    oncreate: Accounts_oncreate,
    view: function () {
        return m('div.jumbotron.acctframe.uicontainer', [
            m('img.mainlogo', {src: './assets/img/logo.svg'}),
            m('form', {action: '', onsubmit: this.goLogin, oncreate: () => $('#loginUser').focus()}, [
                m(ValidatingInput, {options: {
                    name: 'loginUser',
                    type: 'text',
                    label: 'Nom d\'utilisateur',
                    showValid: false,
                    fieldValue: UserAccount.username,
                    validPattern: /.+/gi,
                    errMessage: 'Ce champ ne peut pas être vide!',
                    actions: this.validations
                }}),
                m(ValidatingInput, {options:{
                    name: 'loginPass',
                    type: 'password',
                    label: 'Mot de passe',
                    showValid: false,
                    fieldValue: UserAccount.password,
                    validPattern: /.+/gi,
                    errMessage: 'Ce champ ne peut pas être vide!',
                    actions: this.validations
                }}),
                m('div.btn-group.btn-group-justified', [
                    m('div.btn-group', m('button.btn.btn-primary' + (this.isLoading() ? '.disabled' : ''), {type: 'submit'}, this.isLoading() ? 'Chargement...' : 'S\'authentifier')),
                    m('div.btn-group',  m('button.btn.btn-default' + (this.isLoading() ? '.disabled' : ''), {type: 'button', onclick: this.createAccount}, 'Créer un compte'))
                ])
            ])
        ])
    }
}

const AccountsCreate = {
    validations: {},
    isLoading: Property(false, () => {m.redraw()}),
    validateSelects: function(value) {
        return (value !== '-1')
    },
    oninit: function (vnode) {
        this.app = vnode.attrs.app,
        this.parent = vnode.attrs.parent,
        this.goCreate = (e) => {
            e.preventDefault()
            let valid = Object.keys(this.validations).filter((val) => !this.validations[val].validate()).length === 0
            if (valid) {
                this.isLoading(true)
                Database.createUser(UserAccount)
                .then(() => {
                    this.parent.action = 'login'
                    this.isLoading(false)
                })
                .catch((rsn) => {
                    if (rsn.errcode == 'e_alreadyindb') {
                        console.log('Error [MongoDB] User is already in db')
                        this.validations['username'].validate(false, 'Cet utilisateur est déjà enregistré! Pour changer votre mot de passe, connectez-vous!')
                    } else {
                        console.log('Error [MongoDB] ' + rsn.errmsg)
                        this.validations['username'].validate(false, 'Une erreur est survenue lors de la création de ce compte! Veuillez réessayer ultérieurement!')
                    }
                    this.isLoading(false)
                })
            }
            return false
        }
        this.returnToAuth = (e) => {
            e.preventDefault()
            this.parent.action = 'login'
            m.redraw()
            return false
        }
    },
    oncreate: Accounts_oncreate,
    view: function () {
        return m('div.jumbotron.acctframe.uicontainer', [
            m('img.mainlogo', {src: './assets/img/logo.svg'}),
            m('form', {action: '', onsubmit: this.goCreate, oncreate: () => $('#firstname').focus()}, [
                m(ValidatingInput, {options: {
                    name: 'firstname',
                    type: 'text',
                    label: 'Prénom',
                    showValid: true,
                    fieldValue: UserAccount.firstname,
                    validPattern: /.+/gi,
                    errMessage: 'Ce champ ne peut pas être vide!',
                    actions: this.validations
                }}),
                m(ValidatingInput, {options:{
                    name: 'lastname',
                    type: 'text',
                    label: 'Nom de famille',
                    showValid: true,
                    fieldValue: UserAccount.lastname,
                    validPattern: /.+/gi,
                    errMessage: 'Ce champ ne peut pas être vide!',
                    actions: this.validations
                }}),
                m(ValidatingInput, {options:{
                    name: 'email',
                    type: 'text',
                    label: 'Adresse courriel',
                    showValid: true,
                    fieldValue: UserAccount.email,
                    validPattern: /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
                    stdMessage: 'Veuillez, si possible, spécifier votre adresse courriel de travail (@staples.ca ou @busdep.com)',
                    errMessage: 'Vous devez spécifier une adresse courriel valide!',
                    actions: this.validations
                }}),
                m(ValidatingSelect, {options:{
                    name: 'district',
                    label: 'District',
                    showValid: true,
                    fieldValue: UserAccount.district,
                    choices: [['-1', 'Choisissez un District'], ...Object.keys(districtList).map((item) => [item, districtList[item]])],
                    errMessage: 'Veuillez choisir un district!',
                    onvalidate: this.validateSelects,
                    onchange: (value) => {if (value === '-1') UserAccount.store('-1')},
                    actions: this.validations
                }}),
                m(ValidatingSelect, {options:{
                    name: 'store',
                    label: 'Magasin',
                    showValid: true,
                    fieldValue: UserAccount.store,
                    choices: UserAccount.district() !== '-1' ? [['-1', 'Choisissez un Magasin'], ...Object.keys(storeList[UserAccount.district()]).map((item) => [item, item + ' - ' + storeList[UserAccount.district()][item]])] : [['-1', 'Choisissez d\'abord un District!']],
                    errMessage: 'Veuillez choisir un magasin!',
                    onvalidate: this.validateSelects,
                    onchange: (value) => {if (value === '-1') UserAccount.position('-1')},
                    actions: this.validations
                }}),
                UserAccount.store() === '0' ? m('div.alert.alert-warning', m.trust('<strong>Attention</strong>: Si vous choisissez le magasin 0, vous ne pourrez pas rédiger d\'How\'s biz! Ce "magasin" est réservé pour la Direction et l\'administration régionale.')) : '',
                m(ValidatingSelect, {options:{
                    name: 'position',
                    label: 'Poste',
                    showValid: true,
                    fieldValue: UserAccount.position,
                    choices: UserAccount.store() !== '-1' ? [['-1', 'Choisissez un Poste'], ...Object.keys(positionList).filter((item) => {
                        if (UserAccount.store() === '0') {
                            return ((item === 'dm') || (item === 'dma'))
                        } else {
                            return ((item !== 'dm') && (item !== 'dma'))
                        }
                    }).map((item) => [item, positionList[item]])] : [['-1', 'Choisissez d\'abord un Magasin!']],
                    errMessage: 'Veuillez choisir un poste!',
                    onvalidate: this.validateSelects,
                    actions: this.validations
                }}),
                m(ValidatingInput, {options:{
                    name: 'username',
                    type: 'text',
                    label: 'Nom d\'utilisateur',
                    showValid: true,
                    fieldValue: UserAccount.username,
                    validPattern: /.+/gi,
                    stdMessage: 'Votre numéro d\'employé est recommandé; plus facile à retenir.',
                    errMessage: 'Ce champ ne peut pas être vide!',
                    actions: this.validations
                }}),
                m(ValidatingInput, {options:{
                    name: 'password',
                    type: 'password',
                    label: 'Mot de passe',
                    showValid: true,
                    fieldValue: UserAccount.password,
                    validPattern: /.+/gi,
                    errMessage: 'Ce champ ne peut pas être vide!',
                    actions: this.validations
                }}),
                m(ValidatingInput, {options:{
                    name: 'passwordconf',
                    type: 'password',
                    label: 'Confirmation de mot de passe',
                    showValid: true,
                    fieldValue: UserAccount.passconf,
                    errMessage: 'Le mot de passe et sa confirmation doivent être identiques!',
                    onvalidate: (text) => (text === UserAccount.password()),
                    actions: this.validations
                }}),
                m('div.btn-group.btn-group-justified', [
                    m('div.btn-group', m('button.btn.btn-primary' + (this.isLoading() ? '.disabled' : ''), {type: 'submit'}, this.isLoading() ? 'Chargement...' : 'Créer le compte')),
                    m('div.btn-group',  m('button.btn.btn-default' + (this.isLoading() ? '.disabled' : ''), {type: 'button', onclick: this.returnToAuth}, 'Annuler'))
                ])
            ])
        ])
    }
}

AccountsUI.view = function (vnode) {
    return m("div.accounts", 
        this.action === 'login' ? m(AccountsLogin, {app: vnode.attrs.app, parent: this}) : 
        this.action === 'newacct' ? m(AccountsCreate, {app: vnode.attrs.app, parent: this}) : ''
    )
}

module.exports = AccountsUI