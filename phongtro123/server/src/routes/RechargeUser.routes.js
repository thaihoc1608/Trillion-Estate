const express = require('express');
const router = express.Router();

const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

const controllerUser = require('../controllers/users.controller');

router.get('/api/recharge-user', authUser, asyncHandler(controllerUser.getRechargeUser));

module.exports = router;
