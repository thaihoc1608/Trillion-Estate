const { google } = require('googleapis');
const nodemailer = require('nodemailer');
require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const SendMailReject = async (email, post, reason) => {
    try {
        const accessToken = await oAuth2Client.getAccessToken();
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                clientId: CLIENT_ID,
                clientSecret: CLIENT_SECRET,
                refreshToken: REFRESH_TOKEN,
                accessToken: accessToken,
            },
        });

        const info = await transport.sendMail({
            from: `"phongtro123" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Thông báo từ chối duyệt bài đăng',
            html: `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                    body {
                        font-family: 'Roboto', sans-serif;
                        background-color: #f2f4f8;
                        margin: 0;
                        padding: 0;
                        color: #2d3436;
                    }
                    .container {
                        max-width: 600px;
                        margin: 30px auto;
                        background-color: #ffffff;
                        border-radius: 10px;
                        overflow: hidden;
                        box-shadow: 0 6px 12px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #d63031, #e17055);
                        padding: 30px;
                        color: #ffffff;
                        text-align: center;
                    }
                    .header h2 {
                        margin: 0;
                        font-size: 22px;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                    }
                    .content {
                        padding: 30px;
                    }
                    .greeting {
                        font-size: 18px;
                        margin-bottom: 15px;
                        font-weight: 500;
                    }
                    .message {
                        margin-bottom: 20px;
                        line-height: 1.7;
                        color: #555;
                    }
                    .post-details {
                        background-color: #f1f2f6;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #dcdde1;
                        margin-bottom: 20px;
                    }
                    .post-title {
                        font-size: 20px;
                        font-weight: 600;
                        color: #2d3436;
                        margin-bottom: 15px;
                        border-bottom: 2px solid #e17055;
                        padding-bottom: 8px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 10px;
                    }
                    td {
                        padding: 10px 0;
                        vertical-align: top;
                    }
                    td:first-child {
                        font-weight: 500;
                        color: #2d3436;
                        width: 130px;
                    }
                    td:last-child {
                        color: #636e72;
                    }
                    .reason {
                        padding: 15px;
                        background-color: #ffeaa7;
                        border-left: 4px solid #d63031;
                        margin-bottom: 20px;
                        border-radius: 6px;
                        color: #2d3436;
                    }
                    .footer {
                        text-align: center;
                        font-size: 14px;
                        padding: 20px;
                        background-color: #f1f2f6;
                        color: #636e72;
                    }
                    .highlight {
                        color: #d63031;
                        font-weight: 600;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h2>Thông báo từ chối duyệt bài</h2>
                    </div>
                    <div class="content">
                        <div class="greeting">Kính gửi ${post.username},</div>

                        <div class="message">
                            Chúng tôi rất tiếc phải thông báo rằng bài đăng của bạn <strong>chưa được duyệt</strong> vì lý do sau:
                        </div>

                        <div class="reason">
                            ${reason}
                        </div>

                        <div class="post-details">
                            <div class="post-title">${post.title}</div>
                            <table>
                                <tr>
                                    <td>Địa chỉ:</td>
                                    <td>${post.location}</td>
                                </tr>
                                <tr>
                                    <td>Giá:</td>
                                    <td>${post.price.toLocaleString('vi-VN')} VNĐ/tháng</td>
                                </tr>
                                <tr>
                                    <td>Diện tích:</td>
                                    <td>${post.area} m²</td>
                                </tr>
                                <tr>
                                    <td>Số điện thoại:</td>
                                    <td>${post.phone}</td>
                                </tr>
                                <tr>
                                    <td>Loại:</td>
                                    <td>${post.category}</td>
                                </tr>
                                <tr>
                                    <td>Loại tin:</td>
                                    <td>${post.typeNews === 'vip' ? 'Tin VIP' : 'Tin thường'}</td>
                                </tr>
                            </table>
                        </div>

                        <div class="message">
                            Vui lòng chỉnh sửa nội dung bài viết theo yêu cầu và gửi lại để được duyệt lại.
                            Mọi thắc mắc xin liên hệ với đội ngũ hỗ trợ của chúng tôi.
                        </div>
                    </div>
                    <div class="footer">
                        Trân trọng,<br/>
                        <span class="highlight">phongtro123</span>
                    </div>
                </div>
            </body>
            </html>
            `,
        });
    } catch (error) {
        console.log('Error sending rejection email:', error);
    }
};

module.exports = SendMailReject;
