const express = require('express');
const router = express.Router();

const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

const controllerMessager = require('../controllers/messager.controller');

router.post('/api/create-message', authUser, asyncHandler(controllerMessager.createMessage));
router.get('/api/get-messages', authUser, asyncHandler(controllerMessager.getMessages));
router.get('/api/get-messages-by-user-id', authUser, asyncHandler(controllerMessager.getMessagesByUserId));
router.post('/api/mark-message-read', authUser, asyncHandler(controllerMessager.markMessageAsRead));
router.post('/api/mark-all-messages-read', authUser, asyncHandler(controllerMessager.markAllMessagesAsRead));

module.exports = router;
