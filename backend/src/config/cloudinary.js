const cloudinary = require('cloudinary').v2;
const config = require('./index');

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

function uploadBufferToCloudinary(buffer, folder = 'soniq') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (err, res) => {
      if (err || !res) return reject(err || new Error('Cloudinary upload failed'));
      resolve({ url: res.secure_url, publicId: res.public_id });
    });
    stream.end(buffer);
  });
}

async function deleteFromCloudinary(publicId) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId).catch(() => undefined);
}

module.exports = { cloudinary, uploadBufferToCloudinary, deleteFromCloudinary };
