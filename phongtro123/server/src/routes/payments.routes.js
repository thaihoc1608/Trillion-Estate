const express = require('express');
const router = express.Router();

const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

const controllerPayments = require('../controllers/payments.controller');

router.post('/api/payments', authUser, asyncHandler(controllerPayments.payments));
router.get('/api/check-payment-vnpay', asyncHandler(controllerPayments.checkPaymentVnpay));
router.get('/api/check-payment-momo', asyncHandler(controllerPayments.checkPaymentMomo));

module.exports = router;
