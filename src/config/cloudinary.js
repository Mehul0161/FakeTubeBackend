const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadVideo = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: 'video',
      folder: 'faketube/videos'
    });
    return result.secure_url;
  } catch (error) {
    throw new Error('Error uploading video to Cloudinary');
  }
};

const uploadThumbnail = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: 'image',
      folder: 'faketube/thumbnails'
    });
    return result.secure_url;
  } catch (error) {
    throw new Error('Error uploading thumbnail to Cloudinary');
  }
};

const uploadAvatar = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: 'image',
      folder: 'faketube/avatars'
    });
    return result.secure_url;
  } catch (error) {
    throw new Error('Error uploading avatar to Cloudinary');
  }
};

module.exports = {
  uploadVideo,
  uploadThumbnail,
  uploadAvatar
}; 