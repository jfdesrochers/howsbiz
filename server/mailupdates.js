const {getWeekNo} = require('../assets/js/utils/dateutils.js')
const {mailWeeklyUpdate} = require('./mailhowsbiz')

const district = '19'
const curWeek = String(getWeekNo(true))

mailWeeklyUpdate(district, curWeek)