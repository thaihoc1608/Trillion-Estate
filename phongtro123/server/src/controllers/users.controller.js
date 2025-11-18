const modelUser = require('../models/users.model');
const modelApiKey = require('../models/apiKey.model');
const modelRechargeUser = require('../models/RechargeUser.model');
const modelPost = require('../models/post.model');
const modelKeyWordSearch = require('../models/keyWordSearch.model');
const modelOtp = require('../models/otp.model');

const sendMailForgotPassword = require('../utils/SendMail/sendMailForgotPassword');
const { BadRequestError } = require('../core/error.response');
const { createApiKey, createToken, createRefreshToken, verifyToken } = require('../services/tokenSevices');
const { Created, OK } = require('../core/success.response');

const bcrypt = require('bcrypt');
const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
const otpGenerator = require('otp-generator');
const { jwtDecode } = require('jwt-decode');

const { AiSearchKeyword } = require('../utils/AISearch/AISearch');

class controllerUsers {
    async register(req, res) {
        const { fullName, email, password, phone } = req.body;

        if (!fullName || !email || !password || !phone) {
            throw new BadRequestError('Vui lòng nhập đày đủ thông tin');
        }
        const user = await modelUser.findOne({ email });
        if (user) {
            throw new BadRequestError('Người dùng đã tồn tại');
        } else {
            const saltRounds = 10;
            const salt = bcrypt.genSaltSync(saltRounds);
            const passwordHash = bcrypt.hashSync(password, salt);
            const newUser = await modelUser.create({
                fullName,
                email,
                password: passwordHash,
                typeLogin: 'email',
                phone,
            });
            await newUser.save();
            await createApiKey(newUser._id);
            const token = await createToken({ id: newUser._id });
            const refreshToken = await createRefreshToken({ id: newUser._id });
            res.cookie('token', token, {
                httpOnly: true, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: true, // Chỉ gửi trên HTTPS (để đảm bảo an toàn)
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 15 * 60 * 1000, // 15 phút
            });

            res.cookie('logged', 1, {
                httpOnly: false, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: true, // Chỉ gửi trên HTTPS (để đảm bảo an toàn)
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });

            // Đặt cookie HTTP-Only cho refreshToken (tùy chọn)
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            new Created({ message: 'Đăng ký thành công', metadata: { token, refreshToken } }).send(res);
        }
    }
    async login(req, res) {
        const { email, password } = req.body;
        if (!email || !password) {
            throw new BadRequestError('Vui lòng nhập đầy đủ thông tin');
        }
        const user = await modelUser.findOne({ email });
        if (!user) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        if (user.typeLogin === 'google') {
            throw new BadRequestError('Tài khoản đăng nhập bằng google');
        }

        const checkPassword = bcrypt.compareSync(password, user.password);
        if (!checkPassword) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        await createApiKey(user._id);
        const token = await createToken({ id: user._id });
        const refreshToken = await createRefreshToken({ id: user._id });

        res.cookie('token', token, {
            httpOnly: true, // Chặn truy cập từ JavaScript (bảo mật hơn)
            secure: true, // Chỉ gửi trên HTTPS (để đảm bảo an toàn)
            sameSite: 'Strict', // Chống tấn công CSRF
            maxAge: 15 * 60 * 1000, // 15 phút
        });

        res.cookie('logged', 1, {
            httpOnly: false, // Chặn truy cập từ JavaScript (bảo mật hơn)
            secure: true, // Chỉ gửi trên HTTPS (để đảm bảo an toàn)
            sameSite: 'Strict', // Chống tấn công CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });

        // Đặt cookie HTTP-Only cho refreshToken (tùy chọn)
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });

        new OK({ message: 'Đăng nhập thành công', metadata: { token, refreshToken } }).send(res);
    }

    async loginGoogle(req, res) {
        const { credential } = req.body;
        const dataToken = jwtDecode(credential);
        const user = await modelUser.findOne({ email: dataToken.email });
        if (user) {
            await createApiKey(user._id);
            const token = await createToken({ id: user._id });
            const refreshToken = await createRefreshToken({ id: user._id });
            res.cookie('token', token, {
                httpOnly: true, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: true, // Chỉ gửi trên HTTPS (để đảm bảo an toàn)
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 15 * 60 * 1000, // 15 phút
            });
            res.cookie('logged', 1, {
                httpOnly: false, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: true, // Chỉ gửi trên HTTPS (để đảm bảo an toàn)
                sameSite: 'Strict', // Chống tấn công CSRF
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            new OK({ message: 'Đăng nhập thành công', metadata: { token, refreshToken } }).send(res);
        } else {
            const newUser = await modelUser.create({
                fullName: dataToken.name,
                email: dataToken.email,
                typeLogin: 'google',
            });
            await newUser.save();
            await createApiKey(newUser._id);
            const token = await createToken({ id: newUser._id });
            const refreshToken = await createRefreshToken({ id: newUser._id });
            res.cookie('token', token, {
                httpOnly: true, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: true, // Chỉ gửi trên HTTPS (để đảm bảo an toàn)
                sameSite: 'Strict', // ChONGL tấn công CSRF
                maxAge: 15 * 60 * 1000, // 15 phút
            });
            res.cookie('logged', 1, {
                httpOnly: false, // Chặn truy cập từ JavaScript (bảo mật hơn)
                secure: true, // Chỉ gửi trên HTTPS (để đảm bảo an toàn)
                sameSite: 'Strict', // ChONGL tấn công CSRF
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
            });
            new OK({ message: 'Đăng nhập thành công', metadata: { token, refreshToken } }).send(res);
        }
    }

    async authUser(req, res) {
        const user = req.user;
        const findUser = await modelUser.findOne({ _id: user.id });
        if (!findUser) {
            throw new BadRequestError('Tài khoản hoặc mật khẩu không chính xác');
        }
        const userString = JSON.stringify(findUser);
        const auth = CryptoJS.AES.encrypt(userString, process.env.SECRET_CRYPTO).toString();
        new OK({ message: 'success', metadata: { auth } }).send(res);
    }

    async logout(req, res) {
        const user = req.user;
        await modelApiKey.deleteOne({ userId: user.id });
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        res.clearCookie('logged');

        new OK({ message: 'Đăng xuất thành công' }).send(res);
    }

    async refreshToken(req, res) {
        const refreshToken = req.cookies.refreshToken;

        const decoded = await verifyToken(refreshToken);

        const user = await modelUser.findById(decoded.id);
        const token = await createToken({ id: user._id });
        res.cookie('token', token, {
            httpOnly: true, // Chặn truy cập từ JavaScript (bảo mật hơn)
            secure: true, // Chỉ gửi trên HTTPS (để đảm bảo an toàn)
            sameSite: 'Strict', // Chống tấn công CSRF
            maxAge: 15 * 60 * 1000, // 15 phút
        });

        res.cookie('logged', 1, {
            httpOnly: false, // Chặn truy cập từ JavaScript (bảo mật hơn)
            secure: true, // Chỉ gửi trên HTTPS (để đảm bảo an toàn)
            sameSite: 'Strict', // Chống tấn công CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
        });

        new OK({ message: 'Refresh token thành công', metadata: { token } }).send(res);
    }

    async getAdminStats(req, res) {
        try {
            // Get total users count
            const totalUsers = await modelUser.countDocuments();

            // Get new users in the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const newUsers = await modelUser.countDocuments({
                createdAt: { $gte: thirtyDaysAgo },
            });

            // Calculate user growth percentage
            const previousPeriodUsers = await modelUser.countDocuments({
                createdAt: {
                    $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                    $lt: thirtyDaysAgo,
                },
            });
            const userGrowth = previousPeriodUsers > 0 ? ((newUsers / previousPeriodUsers) * 100).toFixed(1) : 100;

            // Get total posts count
            const totalPosts = await modelPost.countDocuments();

            // Get active posts count
            const activePosts = await modelPost.countDocuments({ status: 'active' });

            // Get new posts in the last 30 days
            const newPosts = await modelPost.countDocuments({
                createdAt: { $gte: thirtyDaysAgo },
            });

            // Calculate post growth percentage
            const previousPeriodPosts = await modelPost.countDocuments({
                createdAt: {
                    $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                    $lt: thirtyDaysAgo,
                },
            });
            const postGrowth = previousPeriodPosts > 0 ? ((newPosts / previousPeriodPosts) * 100).toFixed(1) : 100;

            // Get total transactions and revenue
            const totalTransactions = await modelRechargeUser.countDocuments();
            const totalRevenue = await modelRechargeUser.aggregate([
                { $match: { status: 'success' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Get transactions in the last 30 days
            const recentTransactions = await modelRechargeUser.countDocuments({
                createdAt: { $gte: thirtyDaysAgo },
            });

            // Calculate transaction growth percentage
            const previousPeriodTransactions = await modelRechargeUser.countDocuments({
                createdAt: {
                    $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                    $lt: thirtyDaysAgo,
                },
            });
            const transactionGrowth =
                previousPeriodTransactions > 0
                    ? ((recentTransactions / previousPeriodTransactions) * 100).toFixed(1)
                    : 100;

            // Get revenue in the last 30 days
            const recentRevenue = await modelRechargeUser.aggregate([
                {
                    $match: {
                        createdAt: { $gte: thirtyDaysAgo },
                        status: 'success',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Calculate revenue growth percentage
            const previousPeriodRevenue = await modelRechargeUser.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
                            $lt: thirtyDaysAgo,
                        },
                        status: 'success',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            const revenueGrowth =
                previousPeriodRevenue.length > 0 && previousPeriodRevenue[0].total > 0
                    ? (
                          ((recentRevenue.length > 0 ? recentRevenue[0].total : 0) / previousPeriodRevenue[0].total) *
                          100
                      ).toFixed(1)
                    : 100;

            // Get posts data for the last 7 days
            const last7DaysArray = Array.from({ length: 7 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            }).reverse();

            const last7Days = new Date();
            last7Days.setDate(last7Days.getDate() - 7);

            const postsData = await modelPost.aggregate([
                {
                    $match: {
                        createdAt: { $gte: last7Days },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        posts: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            // Map posts data to ensure all 7 days are included
            const formattedPostsData = last7DaysArray.map((date) => {
                const dayData = postsData.find((item) => item._id === date);
                return {
                    date: date,
                    posts: dayData ? dayData.posts : 0,
                };
            });

            // Get recent transactions
            const recentTransactionsList = await modelRechargeUser
                .find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('userId', 'fullName');

            const formattedRecentTransactions = recentTransactionsList.map((transaction) => ({
                _id: transaction._id.toString(),
                userId: transaction.userId._id || transaction.userId,
                username: transaction.userId.fullName || 'Unknown User',
                amount: transaction.amount,
                typePayment: transaction.typePayment,
                status: transaction.status,
                createdAt: transaction.createdAt,
            }));

            // Get top users by post count
            const topUsers = await modelPost.aggregate([
                {
                    $group: {
                        _id: '$userId',
                        posts: { $sum: 1 },
                    },
                },
                { $sort: { posts: -1 } },
                { $limit: 5 },
            ]);

            const topUsersWithDetails = await Promise.all(
                topUsers.map(async (user) => {
                    const userDetails = await modelUser.findById(user._id);
                    return {
                        id: user._id,
                        name: userDetails ? userDetails.fullName : 'Unknown User',
                        posts: user.posts,
                        avatar: userDetails ? userDetails.avatar : null,
                    };
                }),
            );

            new OK({
                message: 'Lấy thống kê thành công',
                metadata: {
                    // User statistics
                    totalUsers,
                    newUsers,
                    userGrowth: parseFloat(userGrowth),

                    // Post statistics
                    totalPosts,
                    activePosts,
                    newPosts,
                    postGrowth: parseFloat(postGrowth),

                    // Transaction statistics
                    totalTransactions,
                    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
                    recentTransactions,
                    transactionGrowth: parseFloat(transactionGrowth),

                    // Revenue statistics
                    recentRevenue: recentRevenue.length > 0 ? recentRevenue[0].total : 0,
                    revenueGrowth: parseFloat(revenueGrowth),

                    // Posts data for chart
                    postsData: formattedPostsData,

                    // Recent transactions
                    recentTransactions: formattedRecentTransactions,

                    // Top users
                    topUsers: topUsersWithDetails,
                },
            }).send(res);
        } catch (error) {
            console.error('Error in getAdminStats:', error);
            throw new BadRequestError('Lỗi khi lấy thống kê');
        }
    }

    async changePassword(req, res) {
        const { id } = req.user;
        const { oldPassword, newPassword, confirmPassword } = req.body;
        if (!oldPassword || !newPassword || !confirmPassword) {
            throw new BadRequestError('Vui lòng nhập đày đủ thông tin');
        }

        if (newPassword !== confirmPassword) {
            throw new BadRequestError('Mật khẩu không khớp');
        }

        const user = await modelUser.findById(id);
        if (!user) {
            throw new BadRequestError('Không tìm thấy người dùng');
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new BadRequestError('Mật khẩu cũ không chính xác');
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();
        new OK({ message: 'Đổi mật khẩu thành công' }).send(res);
    }

    async getRechargeUser(req, res) {
        const { id } = req.user;
        const rechargeUser = await modelRechargeUser.find({ userId: id });
        new OK({ message: 'Lấy thông tin nạp tiền thành công', metadata: rechargeUser }).send(res);
    }

    async updateUser(req, res) {
        const { id } = req.user;
        const { fullName, phone, email, address, avatar } = req.body;
        const user = await modelUser.findByIdAndUpdate(id, { fullName, phone, email, address, avatar }, { new: true });
        new OK({ message: 'Cập nhật thông tin thành công', metadata: user }).send(res);
    }

    async getUsers(req, res) {
        const dataUser = await modelUser.find();
        const data = await Promise.all(
            dataUser.map(async (user) => {
                const post = await modelPost.find({ userId: user._id, status: 'active' });
                const totalPost = post.length;
                const totalSpent = post.reduce((sum, post) => sum + post.price, 0);
                return { user, totalPost, totalSpent };
            }),
        );

        new OK({ message: 'Lấy danh sách người dùng thành công', metadata: data }).send(res);
    }

    async getRechargeStats(req, res) {
        try {
            // Get total transactions and revenue
            const totalTransactions = await modelRechargeUser.countDocuments();
            const totalRevenue = await modelRechargeUser.aggregate([
                { $match: { status: 'success' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Get recent transactions (last 7 days)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const recentTransactions = await modelRechargeUser.countDocuments({
                createdAt: { $gte: sevenDaysAgo },
            });

            // Get previous period transactions (7-14 days ago)
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            const previousPeriodTransactions = await modelRechargeUser.countDocuments({
                createdAt: {
                    $gte: fourteenDaysAgo,
                    $lt: sevenDaysAgo,
                },
            });

            // Calculate transaction growth
            const transactionGrowth =
                previousPeriodTransactions > 0
                    ? ((recentTransactions / previousPeriodTransactions) * 100 - 100).toFixed(1)
                    : 100;

            // Get recent revenue (last 7 days)
            const recentRevenue = await modelRechargeUser.aggregate([
                {
                    $match: {
                        createdAt: { $gte: sevenDaysAgo },
                        status: 'success',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Get previous period revenue (7-14 days ago)
            const previousPeriodRevenue = await modelRechargeUser.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: fourteenDaysAgo,
                            $lt: sevenDaysAgo,
                        },
                        status: 'success',
                    },
                },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);

            // Calculate revenue growth
            const revenueGrowth =
                previousPeriodRevenue.length > 0 && previousPeriodRevenue[0].total > 0
                    ? (
                          ((recentRevenue.length > 0 ? recentRevenue[0].total : 0) / previousPeriodRevenue[0].total) *
                              100 -
                          100
                      ).toFixed(1)
                    : 100;

            // Get recent transactions list with user details
            const recentTransactionsList = await modelRechargeUser
                .find()
                .sort({ createdAt: -1 })
                .limit(50)
                .populate('userId', 'fullName');

            const formattedTransactions = recentTransactionsList.map((transaction) => ({
                key: transaction._id.toString(),
                username: transaction.userId?.fullName || 'Unknown User',
                amount: transaction.amount,
                typePayment: transaction.typePayment,
                status: transaction.status,
                createdAt: transaction.createdAt,
            }));

            new OK({
                message: 'Lấy thống kê nạp tiền thành công',
                metadata: {
                    totalTransactions,
                    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
                    recentTransactions,
                    transactionGrowth: parseFloat(transactionGrowth),
                    recentRevenue: recentRevenue.length > 0 ? recentRevenue[0].total : 0,
                    revenueGrowth: parseFloat(revenueGrowth),
                    transactions: formattedTransactions,
                },
            }).send(res);
        } catch (error) {
            console.error('Error in getRechargeStats:', error);
            throw new BadRequestError('Lỗi khi lấy thống kê nạp tiền');
        }
    }

    async searchKeyword(req, res) {
        const { keyword } = req.query;
        if (!keyword) {
            const hotSearch = await modelKeyWordSearch.find().sort({ count: -1 }).limit(5);
            return new OK({ message: 'Lấy từ khóa tìm kiếm thành công', metadata: hotSearch }).send(res);
        } else {
            const result = await AiSearchKeyword(keyword);
            return new OK({ message: 'Lấy từ khóa tìm kiếm thành công', metadata: result }).send(res);
        }
    }

    async addSearchKeyword(req, res) {
        const { title } = req.body;
        const keyWordSearch = await modelKeyWordSearch.findOne({ title });
        if (keyWordSearch) {
            keyWordSearch.count++;
            await keyWordSearch.save();
        } else {
            await modelKeyWordSearch.create({ title, count: 1 });
        }
        return new OK({ message: 'Thêm từ khóa tìm kiếm thành công' }).send(res);
    }

    async forgotPassword(req, res) {
        const { email } = req.body;
        if (!email) {
            throw new BadRequestError('Vui lòng nhập email');
        }

        const user = await modelUser.findOne({ email });
        if (!user) {
            throw new BadRequestError('Email không tồn tại');
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '15m' });
        const otp = await otpGenerator.generate(6, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
        });

        const saltRounds = 10;

        bcrypt.hash(otp, saltRounds, async function (err, hash) {
            if (err) {
                console.error('Error hashing OTP:', err);
            } else {
                await modelOtp.create({
                    email: user.email,
                    otp: hash,
                    type: 'forgotPassword',
                });
                await sendMailForgotPassword(email, otp);

                return res
                    .setHeader('Set-Cookie', [
                        `tokenResetPassword=${token};  Secure; Max-Age=300; Path=/; SameSite=Strict`,
                    ])
                    .status(200)
                    .json({ message: 'Gửi thành công !!!' });
            }
        });
    }

    async resetPassword(req, res) {
        const token = req.cookies.tokenResetPassword;
        const { otp, password } = req.body;

        if (!token) {
            throw new BadRequestError('Vui lòng gửi yêu cầu quên mật khẩu');
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        if (!decode) {
            throw new BadRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
        }

        const findOTP = await modelOtp.findOne({ email: decode.email }).sort({ createdAt: -1 });
        if (!findOTP) {
            throw new BadRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
        }

        // So sánh OTP
        const isMatch = await bcrypt.compare(otp, findOTP.otp);
        if (!isMatch) {
            throw new BadRequestError('Sai mã OTP hoặc đã hết hạn, vui lòng lấy OTP mới');
        }

        // Hash mật khẩu mới
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Tìm người dùng
        const findUser = await modelUser.findOne({ email: decode.email });
        if (!findUser) {
            throw new BadRequestError('Người dùng không tồn tại');
        }

        // Cập nhật mật khẩu mới
        findUser.password = hashedPassword;
        await findUser.save();

        // Xóa OTP sau khi đặt lại mật khẩu thành công
        await modelOtp.deleteOne({ email: decode.email });
        res.clearCookie('tokenResetPassword');
        return new OK({ message: 'Đặt lại mật khẩu thành công' }).send(res);
    }
}

module.exports = new controllerUsers();
