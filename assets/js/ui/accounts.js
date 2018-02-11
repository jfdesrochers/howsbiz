const m = require('mithril')
const Property = require('../utils/Property.js')
const $ = window.$ || require('jquery')

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
    role: Property('20'),
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
        UserAccount.role('20')
    }
}

const PasswordChange = {}

PasswordChange.oninit = function (vnode) {
    this.user = vnode.attrs.user
    this.oldpassword = Property('')
    this.newpassword = Property('')
    this.passconf = Property('')
    this.validations = {}
    this.isLoading = Property(false, () => {m.redraw()})
    this.passchanged = Property(false)
    this.goChange = (e) => {
        e.preventDefault()
        let valid = Object.keys(this.validations).filter((val) => !this.validations[val].validate()).length === 0
        if (valid) {
            this.isLoading(true)
            Database.changePassword(this.user, this.oldpassword(), this.newpassword())
            .then(() => {
                if (typeof vnode.attrs.done === 'function') {
                    this.passchanged(true)
                    $('#passchange').modal('hide')
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
    this.doCancel = (e) => {
        e.preventDefault()
        if (typeof vnode.attrs.done === 'function') {
            vnode.attrs.done(this.passchanged())
        }
    }
}

PasswordChange.view = function () {
    return m(".modal.fade#passchange[tabindex='-1']", {
            oncreate: (vdom) => {
                $(vdom.dom).modal('show')
                $(vdom.dom).on('hidden.bs.modal', this.doCancel)
                $(vdom.dom).on('shown.bs.modal', () => $('#oldpassword').focus())
            },
        }, [
		m(".modal-dialog", [
			m(".modal-content", [
				m(".modal-header", [
					m("button.close", {'data-dismiss': 'modal'}, m("span", "×")),
					m("h4.modal-title", "Changer votre mot de passe")
				]),
				m(".modal-body", [
                    'Pour changer votre mot de passe, veuillez entrer les informations ci-dessous.',
                    m('form', {action: '', onsubmit: this.goChange}, [
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
					m("button.btn.btn-default" + (this.isLoading() ? '.disabled' : ''), {'data-dismiss': 'modal'}, "Fermer"),
					m("button.btn.btn-primary" + (this.isLoading() ? '.disabled' : ''), {onclick: this.goChange}, this.isLoading() ? 'Chargement...' : "Sauvegarder")
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
                    UserAccount.reset()
                    if (user.serviceAccount) {
                        this.parent.action = 'newacct'
                    } else {
                        this.app.user = user
                    }
                    this.isLoading(false)
                })
                .catch((e) => {
                    if (e.message == 'Unauthorized') {
                        console.log('Error [MongoDB] Wrong username or password')
                        this.validations['loginUser'].validate(false, 'Le nom d\'utilisateur ou le mot de passe entré est incorrect.')
                    } else {
                        console.log('Error [MongoDB] ' + e.message)
                        this.validations['loginUser'].validate(false, 'Une erreur est survenue lors de la connexion au serveur! Veuillez réessayer ultérieurement!')
                    }
                    this.isLoading(false)
                })
            }
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
                    actions: this.validations,
                    disableMobileFeatures: true
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
                    m('div.btn-group', m('button.btn.btn-primary' + (this.isLoading() ? '.disabled' : ''), {type: 'submit'}, this.isLoading() ? 'Chargement...' : 'S\'authentifier'))
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
        this.app = vnode.attrs.app
        this.parent = vnode.attrs.parent
        this.userlist = []
        this.goCreate = (e) => {
            e.preventDefault()
            let valid = Object.keys(this.validations).filter((val) => !this.validations[val].validate()).length === 0
            if (valid) {
                this.isLoading(true)
                Database.createUser(UserAccount)
                .then(() => {
                    UserAccount.reset()
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
        this.refreshUserList = () => {
            Database.listUsers().then((userlist) => {
                userlist.sort((x, y) => ((x.username < y.username) ? -1 : ((x.username > y.username) ? 1 : 0)))
                this.userlist = userlist
            }).catch((e) => {
                console.error(e)
            })
        }
        this.refreshUserList()
    },
    oncreate: Accounts_oncreate,
    view: function () {
        return m('div.jumbotron.acctframe.uicontainer', [
            m('img.mainlogo', {src: './assets/img/logo.svg'}),
            this.userlist.length > 0 ? [
                m('h3', 'Liste des utilisateurs'),
                m('ul.list-group.userlist', this.userlist.map((o) => {
                    return m('li.list-group-item', {key: o.username}, [
                        o.username,
                        !o.serviceAccount ? m('button.btn.btn-danger.btn-xs.pull-right.ml5', m('span.glyphicon.glyphicon-trash')) : '',
                        m('button.btn.btn-warning.btn-xs.pull-right', m('span.glyphicon.glyphicon-pencil'))
                    ])
                }))
            ] : '',
            m('h3', 'Nouvel utilisateur'),
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
                UserAccount.role() === '80' ? m('div.alert.alert-warning', m.trust('<strong>Attention</strong>: Le rôle admimistrateur donne des grands pouvoirs et avec grands pouvoirs viennent de grandes responsabilités!')) : '',
                m(ValidatingSelect, {options:{
                    name: 'role',
                    label: 'Rôle',
                    showValid: true,
                    fieldValue: UserAccount.role,
                    choices: [['20', 'Utilisateur Régulier'], ['80', 'Administrateur']],
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
                    m('div.btn-group',  m('button.btn.btn-default' + (this.isLoading() ? '.disabled' : ''), {type: 'button', onclick: this.returnToAuth}, 'Retour'))
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

module.exports.AccountsUI = AccountsUI
module.exports.PasswordChange = PasswordChange