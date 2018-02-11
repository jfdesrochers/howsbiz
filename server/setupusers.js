const {MongoClient, ObjectID} = require('mongodb')
const crypto = require('crypto')

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

const stores = ['40', '75', '88', '105', '123', '128', '139', '164', '209', '220', '245', '292', '306', '316', '325', '333', '427']
const positions = [
    {
        firstname: 'Directeur Général',
        position: 'gm',
        email: '@busdep.com'
    },
    {
        firstname: 'Directeur',
        position: 'mgr',
        email: '@busdep.com'
    },
    {
        firstname: 'Superviseur',
        position: 'sup',
        email: '@staples.ca'
    } 
]

const createUsers = function() {
    let db = null
    let userPool = stores.reduce((users, str) => {
        let storeUsers = positions.map((pos) => {
            const hash = crypto.createHash('sha256')
            hash.update(`Staples${str}`)
            let astr = str.length > 2 ? str : '0' + str
            return {
                firstname: `${pos.firstname}`,
                lastname: `Magasin ${str}`,
                username: `store${astr}${pos.position}`,
                password: hash.digest('hex'),
                email: `s${astr}${pos.position}${pos.email}`,
                district: '19',
                store: str,
                position: pos.position,
                role: '20',
                serviceAccount: false,
                lastModified: new Date()
            }
        })
        users = users.concat(storeUsers)
        return users
    }, [])
    const hash = crypto.createHash('sha256')
    hash.update(`District19`)
    let dpass = hash.digest('hex')
    userPool = userPool.concat([
        {
            firstname: 'Martine',
            lastname: 'Dessureault',
            username: 'mdessureault',
            password: dpass,
            email: `martine.dessureault@staples.ca`,
            district: '19',
            store: '0',
            position: 'dm',
            role: '20',
            serviceAccount: false,
            lastModified: new Date()
        },
        {
            firstname: 'Isabelle',
            lastname: 'Daoust',
            username: 'idaoust',
            password: dpass,
            email: `isabelle.daoust@staples.ca`,
            district: '19',
            store: '0',
            position: 'dm',
            role: '20',
            serviceAccount: false,
            lastModified: new Date()
        }
    ])
    console.log('Creating all users for district 19...')
    MongoClient.connect(env.DBURL)
    .then(function(dbase) {
        db = dbase
        let users = db.collection('users')
        return users.insertMany(userPool)
    })
    .then(function () {
        db.close()
        console.log('Done.')
    })
    .catch(function (err) {
        if (db) db.close()
        console.error(err)
    })
}

createUsers()