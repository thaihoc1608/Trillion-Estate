const userRoutes = require('./users.routes');
const postRoutes = require('./posts.routes');
const paymentsRoutes = require('./payments.routes');
const messengerRoutes = require('./messenger.routes');
const favouriteRoutes = require('./favourite.routes');

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/images');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

var upload = multer({ storage: storage });

function routes(app) {
    app.post('/api/register', userRoutes);
    app.post('/api/login', userRoutes);
    app.post('/api/login-google', userRoutes);
    app.get('/api/auth', userRoutes);
    app.get('/api/logout', userRoutes);
    app.get('/api/refresh-token', userRoutes);
    app.get('/api/recharge-user', userRoutes);
    app.post('/api/update-user', userRoutes);
    app.post('/api/change-password', userRoutes);

    app.get('/api/get-users', userRoutes);
    app.get('/api/get-admin-stats', userRoutes);
    app.get('/api/get-recharge-stats', userRoutes);

    app.get('/api/get-hot-search', userRoutes);
    app.get('/api/search', userRoutes);

    app.post('/api/add-search-keyword', userRoutes);
    app.get('/api/get-search-keyword', userRoutes);

    app.post('/api/forgot-password', userRoutes);
    app.post('/api/reset-password', userRoutes);

    /// posts
    app.post('/api/create-post', postRoutes);
    app.get('/api/get-posts', postRoutes);
    app.get('/api/get-post-by-id', postRoutes);
    app.get('/api/get-post-by-user-id', postRoutes);
    app.get('/api/get-new-post', postRoutes);
    app.get('/api/get-post-vip', postRoutes);
    app.post('/api/delete-post', postRoutes);

    //// admin post
    app.get('/api/get-all-posts', postRoutes);
    app.post('/api/approve-post', postRoutes);
    app.post('/api/reject-post', postRoutes);

    /// payments
    app.post('/api/payments', paymentsRoutes);
    app.get('/api/check-payment-vnpay', paymentsRoutes);
    app.get('/api/check-payment-momo', paymentsRoutes);

    /// post suggest
    app.get('/api/post-suggest', postRoutes);

    /// messenger
    app.post('/api/create-message', messengerRoutes);
    app.get('/api/get-messages', messengerRoutes);
    app.get('/api/get-messages-by-user-id', messengerRoutes);
    app.post('/api/mark-message-read', messengerRoutes);
    app.post('/api/mark-all-messages-read', messengerRoutes);

    //// favourite
    app.post('/api/create-favourite', favouriteRoutes);
    app.post('/api/delete-favourite', favouriteRoutes);
    app.get('/api/get-favourite', favouriteRoutes);

    ///// uploads
    app.post('/api/upload-images', upload.array('images'), (req, res) => {
        return res.status(200).json({
            message: 'Images uploaded successfully',
            images: req.files.map((file) => `http://localhost:3000/uploads/images/${file.filename}`),
        });
    });

    app.post('/api/upload-image', upload.single('avatar'), (req, res) => {
        const file = req.file;
        return res.status(200).json({
            message: 'Image uploaded successfully',
            image: `http://localhost:3000/uploads/images/${file.filename}`,
        });
    });

    app.get('/admin', userRoutes);
}

module.exports = routes;
