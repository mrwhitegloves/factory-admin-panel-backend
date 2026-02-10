const QRCode = require('qrcode');

exports.generateQR = async (data) => {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(data, (err, url) => {
      if (err) reject(err);
      resolve(url);
    });
  });
};