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
    getHBs: function (hbdata) {
        return new Promise(function (resolve, reject) {
            MongoClient.connect(env.DBURL)
            .then(function(db) {
                let hbs = db.collection('howsbiz')
                let query = {'district': hbdata.district, 'week': hbdata.week}
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
                commentdata.userid = ObjectID(commentdata.userid)
                let doc = {
                    hbid: commentdata.hbid,
                    userid: commentdata.userid,
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
    }
}

module.exports.Database = Database