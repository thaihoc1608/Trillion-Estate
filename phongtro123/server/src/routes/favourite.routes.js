const express = require('express');
const router = express.Router();

const { asyncHandler, authUser, authAdmin } = require('../auth/checkAuth');

const controllerFavourite = require('../controllers/favourite.controller');

router.post('/api/create-favourite', authUser, asyncHandler(controllerFavourite.createFavourite));
router.post('/api/delete-favourite', authUser, asyncHandler(controllerFavourite.deleteFavourite));
router.get('/api/get-favourite', authUser, asyncHandler(controllerFavourite.getFavourite));

module.exports = router;
