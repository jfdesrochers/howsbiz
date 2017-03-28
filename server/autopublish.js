const {getWeekNo} = require('../assets/js/utils/dateutils.js')
const {Database} = require('./data.js')

const curWeek = String(getWeekNo(true))

console.log('Publishing all unpublished How\'s biz from week %s', curWeek)
Database.publishAllHB(curWeek).then(() => console.log('All Done!'))