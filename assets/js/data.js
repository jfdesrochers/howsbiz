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
                        db.close()
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
    getUsers: function(lastupdate) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let users = db.collection('users')
                let query = {}
                if (lastupdate) query['lastModified'] = {$gte: lastupdate}
                users.find(query).project({'firstname': 1, 'lastname': 1, 'store': 1, 'position': 1, 'district': 1}).toArray()
                .then(function (userlist) {
                    db.close()
                    resolve(userlist)
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
    getHBs: function (district, week, lastupdate) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let hbs = db.collection('howsbiz')
                let query = {'district': district, 'week': week}
                if (lastupdate) query['lastModified'] = {$gte: lastupdate}
                hbs.find(query).toArray()
                .then(function (hblist) {
                    db.close()
                    resolve(hblist)
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
    getComments: function (hbid, lastupdate) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let hbs = db.collection('comments')
                let query = {hbid: hbid}
                if (lastupdate) query['postDate'] = {$gte: lastupdate}
                hbs.find(query).sort({'postDate': -1}).toArray()
                .then(function (commentlist) {
                    db.close()
                    resolve(commentlist)
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
    saveLikeViewComment: function (hbid, saveType, contents) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let hbs = db.collection('howsbiz')
                let changes = {lastModified: new Date()}
                changes[saveType] = contents
                hbs.update({_id: hbid}, {$set: changes})
                .then(function () {
                    db.close()
                    resolve()
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
    saveComment: function (comment, hbid, userid) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let cmts = db.collection('comments')
                let doc = {
                    hbid: hbid,
                    userid: userid,
                    comment: comment,
                    postDate: new Date()
                }
                cmts.insert(doc)
                .then(function () {
                    db.close()
                    resolve(doc)
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
    saveHB: function (hb) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let hbs = db.collection('howsbiz')
                hb.lastModified = new Date()
                if (hb._id) {
                    hbs.update({'_id': hb._id}, hb)
                    .then(function (res) {
                        db.close()
                        resolve(res)
                    })
                    .catch(function (err) {
                        db.close()
                        reject({errcode: 'e_mongoerr', errmsg: err})
                    })
                } else {
                    hbs.insert(hb)
                    .then(function (res) {
                        db.close()
                        resolve(res)
                    })
                    .catch(function (err) {
                        db.close()
                        reject({errcode: 'e_mongoerr', errmsg: err})
                    })
                }
            })
            .catch(function (err) {
                reject({errcode: 'e_mongoerr', errmsg: err})
            })
        })
    },
    uploadFile: function(store, week, file) {
        const dbx = new Dropbox({accessToken: env.DROPBOXTOKEN})
        return new Promise(function (resolve, reject) {
            dbx.filesUpload({path: '/' + store + '/' + week + '.jpg', mode: 'overwrite', contents: file})
            .then(function () {
                dbx.sharingCreateSharedLink({path: '/' + store + '/' + week + '.jpg', short_url: false})
                .then(function (link) {
                    resolve(link.url.replace('dl=0', 'raw=1'))
                })
                .catch(function (err) {
                    reject({errcode: 'e_dropboxerr', errmsg: err})
                })
            })
            .catch(function (err) {
                reject({errcode: 'e_dropboxerr', errmsg: err})
            })
        })
    },
    changePassword: function(user, oldpass, newpass) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let users = db.collection('users')
                users.findOne({'_id': user._id})
                .then(function (user) {
                    let hash = crypto.createHash('sha256');
                    hash.update(oldpass)
                    let oldpassword = hash.digest('hex')
                    if ((user) && (user.password === oldpassword)) {
                        hash = crypto.createHash('sha256');
                        hash.update(newpass)
                        let newpassword = hash.digest('hex')
                        users.update({'_id': user._id}, {'$set': {'password': newpassword, lastModified: new Date()}})
                        .then(function () {
                            db.close()
                            resolve()
                        })
                        .catch(function (err) {
                            db.close()
                            reject({errcode: 'e_mongoerr', errmsg: err})
                        })
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