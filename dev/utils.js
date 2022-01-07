const uuid = require('uuid');

const createId = () => uuid.v1().split('-').join('');

module.exports = {createId};