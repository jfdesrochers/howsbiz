const {MongoClient, ObjectID} = require('mongodb')
const crypto = require('crypto');
const Dropbox = require('dropbox')

const env = require('../env.json')

// errors:
// e_mongoerr: MongoDB driver error (error message should be logged)
// e_badpassword: Authentication error (against info stored in database)
// e_alreadyindb: Username is already present in the database
// e_dropboxerr: Dropbox client error (error message should be logged)

const makeError = function (errcode, errmsg) {
    if (errmsg instanceof Error) errmsg = errmsg.message
    let err = new Error(errmsg)
    err.errcode = errcode
    return err
}

const dataUriToBuffer = function (uri) {
        uri = uri.replace(/\r?\n/g, '');
        var firstComma = uri.indexOf(',');
        if (-1 === firstComma || firstComma <= 4) return null;
        var meta = uri.substring(5, firstComma).split(';');
        var base64 = false;
        var charset = 'US-ASCII';
        for (var i = 0; i < meta.length; i++) {
            if ('base64' == meta[i]) {
            base64 = true;
            } else if (0 == meta[i].indexOf('charset=')) {
            charset = meta[i].substring(8);
            }
        }
        var data = unescape(uri.substring(firstComma + 1));
        var encoding = base64 ? 'base64' : 'ascii';
        var buffer = new Buffer(data, encoding);
        buffer.type = meta[0] || 'text/plain';
        buffer.charset = charset;
        return buffer;
    }

const Database = {
    createUser: function(usertoadd) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let users = db.collection('users')
                users.count({'username': usertoadd.username})
                .then(function (count) {
                    if (count > 0) {
                        db.close()
                        reject(makeError('e_alreadyindb', 'User already in database.'))
                    } else {
                        const hash = crypto.createHash('sha256');
                        hash.update(usertoadd.password)
                        usertoadd.password = hash.digest('hex')
                        usertoadd.lastModified = new Date(usertoadd.lastModified)
                        users.insertOne(usertoadd)
                        .then(function () {
                            db.close()
                            resolve(usertoadd)
                        })
                        .catch(function (err) {
                            db.close()
                            reject(makeError('e_mongoerr', err))
                        })
                    }
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        })
    },
    loginUser: function(userinfo) {
        let username = userinfo.username
        const hash = crypto.createHash('sha256');
        hash.update(userinfo.password)
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
                        reject(makeError('e_badpassword', 'Invalid username or password'))
                    }
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        }) 
    },
    getUsers: function(userdata) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let users = db.collection('users')
                let query = {district: userdata.district}
                if (userdata.lastupdate) {
                    userdata.lastupdate = new Date(userdata.lastupdate)
                    query['lastModified'] = {$gte: userdata.lastupdate}
                }
                users.find(query).project({'firstname': 1, 'lastname': 1, 'store': 1, 'position': 1, 'district': 1}).toArray()
                .then(function (userlist) {
                    db.close()
                    resolve(userlist)
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        }) 
    },
    listUsers: function() {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let users = db.collection('users')
                users.find().project({'password': 0}).toArray()
                .then(function (userlist) {
                    db.close()
                    resolve(userlist)
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        }) 
    },
    getHBs: function (hbdata) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let hbs = db.collection('howsbiz')
                let query = {'district': hbdata.district, 'week': hbdata.week}
                if (hbdata.store) query['store'] = hbdata.store
                if (hbdata.status) query['status'] = hbdata.status
                if (hbdata.lastupdate) {
                    hbdata.lastupdate = new Date(hbdata.lastupdate)
                    query['lastModified'] = {$gte: hbdata.lastupdate}
                }
                hbs.find(query).toArray()
                .then(function (hblist) {
                    db.close()
                    resolve(hblist)
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        })
    },
    countHBs: function (hbdata) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let hbs = db.collection('howsbiz')
                let query = {'district': hbdata.district, 'week': hbdata.week}
                if (hbdata.store) query['store'] = hbdata.store
                if (hbdata.status) query['status'] = hbdata.status
                if (hbdata.lastupdate) {
                    hbdata.lastupdate = new Date(hbdata.lastupdate)
                    query['lastModified'] = {$gte: hbdata.lastupdate}
                }
                hbs.find(query).project({'store': 1}).toArray()
                .then(function (hblist) {
                    db.close()
                    resolve(hblist)
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        })
    },
    getComments: function (commentsdata) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let hbs = db.collection('comments')
                commentsdata.hbid = ObjectID(commentsdata.hbid)
                let query = {hbid: commentsdata.hbid}
                if (commentsdata.lastupdate) {
                    commentsdata.lastupdate = new Date(commentsdata.lastupdate)
                    query['postDate'] = {$gte: commentsdata.lastupdate}
                }
                hbs.find(query).sort({'postDate': -1}).toArray()
                .then(function (commentlist) {
                    db.close()
                    resolve(commentlist)
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        })
    },
    saveLikeViewComment: function (savedata) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let hbs = db.collection('howsbiz')
                let changes = {lastModified: new Date()}
                savedata.hbid = ObjectID(savedata.hbid)
                changes[savedata.saveType] = savedata.contents
                hbs.update({_id: savedata.hbid}, {$set: changes})
                .then(function () {
                    db.close()
                    resolve()
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        })
    },
    saveComment: function (commentdata) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let cmts = db.collection('comments')
                commentdata.hbid = ObjectID(commentdata.hbid)
                let doc = {
                    hbid: commentdata.hbid,
                    username: commentdata.username,
                    comment: commentdata.comment,
                    postDate: new Date()
                }
                cmts.insert(doc)
                .then(function () {
                    db.close()
                    resolve(doc)
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
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
                    hb._id = ObjectID(hb._id)
                    hbs.update({'_id': hb._id}, hb)
                    .then(function () {
                        db.close()
                        resolve(hb)
                    })
                    .catch(function (err) {
                        db.close()
                        reject(makeError('e_mongoerr', err))
                    })
                } else {
                    hbs.insert(hb)
                    .then(function () {
                        db.close()
                        resolve(hb)
                    })
                    .catch(function (err) {
                        db.close()
                        reject(makeError('e_mongoerr', err))
                    })
                }
            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        })
    },
    publishAllHB: function (week) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let hbs = db.collection('howsbiz')
                hbs.update({'week': week, 'status': {$ne: 'published'}}, {$set: {'status': 'published'}}, {multi: true})
                .then(function () {
                    db.close()
                    resolve()
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })
            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        })
    },
    uploadFile: function(filedata) {
        const dbx = new Dropbox({accessToken: env.DROPBOXTOKEN})
        return new Promise(function (resolve, reject) {
            filedata.file = dataUriToBuffer(filedata.file)
            dbx.filesUpload({path: '/' + filedata.store + '/' + filedata.week + '.jpg', mode: 'overwrite', contents: filedata.file})
            .then(function () {
                dbx.sharingCreateSharedLink({path: '/' + filedata.store + '/' + filedata.week + '.jpg', short_url: false})
                .then(function (link) {
                    resolve({ url: link.url.replace('dl=0', 'raw=1') })
                })
                .catch(function (err) {
                    reject(makeError('e_dropboxerr', err))
                })
            })
            .catch(function (err) {
                reject(makeError('e_dropboxerr', err))
            })
        })
    },
    changePassword: function(userdata) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let users = db.collection('users')
                userdata.user._id = ObjectID(userdata.user._id)
                users.findOne({'_id': userdata.user._id})
                .then(function (user) {
                    let hash = crypto.createHash('sha256');
                    hash.update(userdata.oldpass)
                    let oldpassword = hash.digest('hex')
                    if ((user) && (user.password === oldpassword)) {
                        hash = crypto.createHash('sha256');
                        hash.update(userdata.newpass)
                        let newpassword = hash.digest('hex')
                        users.update({'_id': user._id}, {'$set': {'password': newpassword, lastModified: new Date()}})
                        .then(function () {
                            db.close()
                            resolve()
                        })
                        .catch(function (err) {
                            db.close()
                            reject(makeError('e_mongoerr', err))
                        })
                    } else {
                        db.close()
                        reject(makeError('e_badpassword', ''))
                    }
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        })
    },
    emailGetStores: function(emaildata) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let emails = db.collection('email')
                let query = {district: emaildata.district, week: emaildata.week}
                emails.findOne(query)
                .then(function (email) {
                    db.close()
                    if (email) {
                        resolve(email.storeList)
                    } else {
                        resolve([])
                    }
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        }) 
    },
    emailSetStores: function(emaildata) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let emails = db.collection('email')
                let query = {district: emaildata.district, week: emaildata.week}
                emails.updateOne(query, {$set: {storeList: emaildata.storeList}}, {upsert: true})
                .then(function () {
                    db.close()
                    resolve()
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        }) 
    },
    emailGetUsers: function() {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let users = db.collection('users')
                users.aggregate([
                    { $group: {_id: {district: "$district", store: "$store"}, emails: {$push: "$email"}} },
                    { $sort: {'_id.store': 1} }
                    ]).toArray()
                .then(function (userlist) {
                    db.close()
                    resolve(userlist)
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        }) 
    },
    emailGetEmails: function(query) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let users = db.collection('users')
                users.find(query).project({'email': 1, '_id': 0}).toArray()
                .then(function (userlist) {
                    db.close()
                    resolve(userlist)
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        }) 
    },
    emailGetComments: function (commentsdata) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let hbs = db.collection('comments')
                let query = {hbid: commentsdata.hbid}
                if (commentsdata.lastupdate) {
                    commentsdata.lastupdate = new Date(commentsdata.lastupdate)
                    query['postDate'] = {$gte: commentsdata.lastupdate}
                }
                hbs.aggregate([
                    {
                        $match: query
                    },
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'userid',
                            foreignField: '_id',
                            as: 'fromUser'
                        }
                    },
                    { $unwind: { path: "$fromUser", preserveNullAndEmptyArrays: true }}
                ]).toArray()
                .then(function (commentlist) {
                    db.close()
                    resolve(commentlist)
                })
                .catch(function (err) {
                    db.close()
                    reject(makeError('e_mongoerr', err))
                })

            })
            .catch(function (err) {
                reject(makeError('e_mongoerr', err))
            })
        })
    },
}

function initDB() {
    let db = null
    MongoClient.connect(env.DBURL).then(function(dbase) {
        db = dbase
        let users = db.collection('users')
        return users.count()
    }).then((count) => {
        if (count === 0) {
            return Database.createUser({
                firstname: 'Account',
                lastname: 'Master',
                username: 'AccountMaster',
                password: 'Master123',
                email: 'AccountMaster@howsbiz.jfd',
                district: '0',
                store: '0',
                position: 'gm',
                role: '80',
                serviceAccount: true,
                lastModified: new Date()
            })
        } else {
            return false
        }
    }).then((result) => {
        db.close()
        if (result) {
            console.log('Default user account AccountMaster created.')
        }
    }).catch((err) => {
        if (db) db.close()
        console.error('Error while creating the default user account', err)
    })
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

const hbColorMap = {
    success: '#00bc8c',
    primary: '#375a7f',
    danger: '#e74c3c'
}

module.exports.hbColorMap = hbColorMap

initDB()