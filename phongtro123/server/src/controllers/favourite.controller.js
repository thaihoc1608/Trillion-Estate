const modelFavourite = require('../models/favourite.model');
const modelUser = require('../models/users.model');
const modelPost = require('../models/post.model');

const { Created, OK } = require('../core/success.response');
const { BadRequestError } = require('../core/error.response');

class controllerFavourite {
    async createFavourite(req, res) {
        const { id } = req.user;
        const { postId } = req.body;
        const findUser = await modelUser.findById(id);
        const findPost = await modelPost.findById(postId);
        const findFavourite = await modelFavourite.findOne({ userId: id, postId });

        if (findFavourite) {
            throw new BadRequestError('Bạn đã thêm vào yêu thích');
        }

        const favourite = await modelFavourite.create({ userId: id, postId });

        const socket = global.usersMap.get(findPost.userId.toString());
        if (socket) {
            socket.emit('new-favourite', {
                favourite: favourite,
                avatar: findUser.avatar,
                content: `${findUser.fullName} đã thêm tin đăng ${findPost.title} vào yêu thích`,
            });
        }
        return new Created({
            message: 'Thêm vào yêu thích thành công',
            metadata: favourite,
        }).send(res);
    }

    async deleteFavourite(req, res) {
        const { id } = req.user;
        const { postId } = req.body;
        const findFavourite = await modelFavourite.findOne({ userId: id, postId });
        if (!findFavourite) {
            throw new BadRequestError('Bạn chưa thêm vào yêu thích');
        }
        await modelFavourite.deleteOne({ userId: id, postId });
        return new OK({
            message: 'Xóa khỏi yêu thích thành công',
        }).send(res);
    }

    async getFavourite(req, res) {
        const { id } = req.user;
        const findFavourite = await modelFavourite.find({ userId: id });
        const findPost = await modelPost.find({ _id: { $in: findFavourite.map((item) => item.postId) } });
        return new OK({
            message: 'Lấy danh sách yêu thích thành công',
            metadata: findPost,
        }).send(res);
    }
}

module.exports = new controllerFavourite();
