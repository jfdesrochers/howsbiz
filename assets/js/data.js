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
            lastModified: new Date()
        }
        return m.request({
            method: 'post',
            url: '/createuser',
            data: usertoadd
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
    saveComment: function (comment, hbid, userid) {
        return dbRequest('saveComment', {
            hbid: hbid,
            comment: comment,
            userid: userid
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
    'sls': 'Direction - Ventes',
    'srv': 'Direction - Services',
    'slssup': 'Supervision - Ventes',
    'slsssup': 'Supervision - Soutien aux Ventes',
    'srvsup': 'Supervision - Services',
    'dm': 'Direction - Régional',
    'dma': 'Administration - Régional'
}

module.exports.districtList = districtList
module.exports.storeList = storeList
module.exports.positionList = positionList