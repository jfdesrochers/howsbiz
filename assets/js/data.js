const {MongoClient} = require('mongodb')
const crypto = require('crypto');
const Dropbox = require('dropbox')

const env = require('../../env.json')

// errors:
// e_mongoerr: MongoDB driver error (error message should be logged)
// e_badpassword: Authentication error (against info stored in database)
// e_alreadyindb: Username is already present in the database
// e_dropboxerr: Dropbox client error (error message should be logged)

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
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let users = db.collection('users')
                users.count({'username': usertoadd.username})
                .then(function (count) {
                    if (count > 0) {
                        db.close()
                        reject({errcode: 'e_alreadyindb', errmsg: ''})
                    } else {
                        const hash = crypto.createHash('sha256');
                        hash.update(usertoadd.password)
                        usertoadd.password = hash.digest('hex')
                        users.insertOne(usertoadd)
                        .then(function (result) {
                            db.close()
                            resolve(result)
                        })
                        .catch(function (err) {
                            db.close()
                            reject({errcode: 'e_mongoerr', errmsg: err})
                        })
                    }
                })
                .catch(function (err) {
                    db.close()
                    reject({errcode: 'e_mongoerr', errmsg: err})
                })

            })
            .catch(function (err) {
                reject({errcode: 'e_mongoerr', errmsg: err})
            })
        })
    },
    loginUser: function(userinfo) {
        let username = userinfo.username()
        const hash = crypto.createHash('sha256');
        hash.update(userinfo.password())
        let password = hash.digest('hex')
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let users = db.collection('users')
                users.findOne({'username': username})
                .then(function (user) {
                    if ((user) && (user.password === password)) {
                        resolve(user)
                    } else {
                        db.close()
                        reject({errcode: 'e_badpassword', errmsg: ''})
                    }
                })
                .catch(function (err) {
                    db.close()
                    reject({errcode: 'e_mongoerr', errmsg: err})
                })

            })
            .catch(function (err) {
                reject({errcode: 'e_mongoerr', errmsg: err})
            })
        }) 
    },
    uploadFile: function(store, week, file) {
        const dbx = new Dropbox({accessToken: env.DROPBOXTOKEN})
        return new Promise(function (resolve, reject) {
            dbx.fileUpload({path: store + '/' + week + '.jpg', mode: 'overwrite', contents: file})
            .then(function () {
                dbx.sharingCreateSharedLink({path: store + '/' + week + '.jpg', short_url: false})
                .then(function (link) {
                    resolve(link.url)
                })
                .catch(function (err) {
                    reject({errcode: 'e_dropboxerr', errmsg: err})
                })
            })
            .catch(function (err) {
                reject({errcode: 'e_dropboxerr', errmsg: err})
            })
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