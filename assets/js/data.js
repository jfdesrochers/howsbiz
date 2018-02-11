const m = require('mithril')

// errors:
// e_mongoerr: MongoDB driver error (error message should be logged)
// e_badpassword: Authentication error (against info stored in database)
// e_alreadyindb: Username is already present in the database
// e_dropboxerr: Dropbox client error (error message should be logged)

const dbRequest = function(reqEndpoint, reqData) {
    return m.request({
        method: 'post',
        url: '/dbrequest',
        data: {
            endpoint: reqEndpoint,
            data: reqData
        }
    })
}

const Database = {
    createUser: function(userinfo) {
        let usertoadd = {
            firstname: userinfo.firstname(),
            lastname: userinfo.lastname(),
            username: userinfo.username(),
            password: userinfo.password(),
            email: userinfo.email(),
            district: userinfo.district(),
            store: userinfo.store(),
            position: userinfo.position(),
            role: userinfo.role(),
            serviceAccount: false,
            lastModified: new Date()
        }
        return m.request({
            method: 'post',
            url: '/createuser',
            data: usertoadd
        })
    },
    listUsers: function() {
        return m.request({
            method: 'get',
            url: '/listusers'
        })
    },
    loginUser: function(userinfo) {
        return m.request({
            method: 'post',
            url: '/login',
            data: {
                username: userinfo.username(),
                password: userinfo.password()
            }
        })
    },
    getUsers: function(district, lastupdate) {
        return dbRequest('getUsers', {
            district: district,
            lastupdate: lastupdate
        })
    },
    getHBs: function (district, week, lastupdate) {
        return dbRequest('getHBs', {
            district: district,
            week: week,
            lastupdate: lastupdate
        }) 
    },
    getComments: function (hbid, lastupdate) {
        return dbRequest('getComments', {
            hbid: hbid,
            lastupdate: lastupdate
        })
    },
    saveLikeViewComment: function (hbid, saveType, contents) {
        return dbRequest('saveLikeViewComment', {
            hbid: hbid,
            saveType: saveType,
            contents: contents
        })
    },
    saveComment: function (comment, hbid, username) {
        return dbRequest('saveComment', {
            hbid: hbid,
            comment: comment,
            username: username
        })
    },
    saveHB: function (hb) {
        return dbRequest('saveHB', hb)
    },
    uploadFile: function(store, week, file) {
        return dbRequest('uploadFile', {
            store: store,
            week: week,
            file: file
        })
    },
    changePassword: function(user, oldpass, newpass) {
        return dbRequest('changePassword', {
            user: user,
            oldpass: oldpass,
            newpass: newpass
        })
    }
}

module.exports.Database = Database

const districtList = {
    '19': 'District 19'
}

const storeList = {
    '19': {
        '0': 'Région',
        '40': 'Sherbrooke',
        '75': 'Greenfield Park',
        '88': 'St-Jean',
        '105': 'St-Hyacinthe',
        '123': 'Longueuil',
        '128': 'St-Bruno',
        '139': 'Drummondville',
        '164': 'Granby',
        '209': 'Châteauguay',
        '220': 'Sorel',
        '245': 'Boucherville',
        '292': 'Magog',
        '306': 'Montréal',
        '316': 'Brossard Dix30',
        '325': 'Candiac',
        '333': 'Rouyn-Noranda',
        '427': 'Beloeil'
    }
}

const positionList = {
    'gm': 'Direction - Général',
    'mgr': 'Direction',
    'sup': 'Supervision',
    'dm': 'Direction - Régional'
}

module.exports.districtList = districtList
module.exports.storeList = storeList
module.exports.positionList = positionList

const hbSections = [
    {
        name: 'salesSection',
        title: 'Ventes',
        color: 'primary',
        subsections: [
            {
                title: 'Vos initiatives de ventes',
                name: 'salesInit'
            },
            {
                title: 'Marchandisage et opérations',
                name: 'salesOps'
            },
            {
                title: 'Les bons coups de la compétition',
                name: 'salesComp'
            }
        ],
        helptext: '<strong>Initiatives de ventes</strong>: Parlez ici des idées que vous avez mises en place pour améliorer vos ventes, votre conversion, etc. Parlez de vos <em>shows</em> sur le plancher, de votre coaching, des concours que vous avez mis en place, etc...<br>' +
                  '<strong>Marchandisage et opérations</strong>: Quel est l\'état de votre magasin? Parlez ici de vos <em>Out of stock</em>, de votre mise en marché des circulaires et de votre progression sur les opérations du moment (<em>reflows</em>, planogrammes, etc.)<br>' +
                  '<strong>La compétition</strong>: Avez-vous visité votre compétition (Best Buy, Buropro, etc.)? Parlez ici des bonnes idées et des promotions intéressantes de votre compétition.'
    },
    {
        name: 'servSection',
        title: 'Services',
        color: 'success',
        subsections: [
            {
                title: 'Services d\'impression et de marketing',
                name: 'servCopy'
            },
            {
                title: 'Services de soutien technique',
                name: 'servTech'
            }
        ],
        helptext: '<strong>Services d\'impression et de marketing</strong>: Parlez ici des initiatives par rapport au centre de copies (promotions et playbook, appels clients, formation et coaching, nouveaux services, grosses ventes, etc...).<br>' +
                  '<strong>Services de soutien technique</strong>: Parlez ici des initiatives par rapport au techno-centre (services à domicile, appels clients, formation et coaching, Liquid Armor, installations, etc...).'
    },
    {
        name: 'devSection',
        title: 'Développement des affaires',
        color: 'danger',
        subsections: [
            {
                title: 'Programmes scolaires',
                name: 'devSchool'
            },
            {
                title: 'Votre histoire de la semaine',
                name: 'devStory'
            },
            {
                title: 'Autres commentaires',
                name: 'devCom'
            }
        ],
        helptext: '<strong>Programmes scolaires</strong>: Parlez ici des actions que vous avez prises pour mettre de l\'avant les différents programmes scolaires (comme AVAN), les relations que vous avez bâti avec les écoles, la mise en place d\'événements comme les journées des profs, etc.<br>' +
                  '<strong>Histoire de la semaine</strong>: Racontez-nous votre histoire de développement des affaires pour cette semaine.<br>' +
                  '<strong>Autres commentaires</strong>: Écrivez ici toutes les autres démarches, initiatives, etc. que vous avez prises en rapport au développement des affaires.'
    }
]

module.exports.hbSections = hbSections