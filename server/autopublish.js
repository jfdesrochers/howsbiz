const {getWeekNo} = require('../assets/js/utils/dateutils.js')
const {Database} = require('./data.js')

const curWeek = String(getWeekNo(true))

Database.publishAllHB(curWeek).then(() => console.log('All Done!'))