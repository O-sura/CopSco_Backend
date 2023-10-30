const IMAGE_SIZE = 5; // 5MB
const VIDEO_SIZE = 10; // 10MB
const IMAGE_FILE_SIZE_LIM = IMAGE_SIZE * 1024 * 1024;
const VIDEO_FILE_SIZE_LIM = VIDEO_SIZE * 1024 * 1024;

const imageFileSizeLimiter = (req, res, next) => {
  const files = req.files;
  const filesOverLimit = [];

  // Find which image files are over the accepted limit
  Object.keys(files).forEach(key => {
    if (files[key].size > IMAGE_FILE_SIZE_LIM) {
      filesOverLimit.push(files[key].name);
    }
  });

  if (filesOverLimit.length) {
    const proVerb = filesOverLimit.length > 1 ? 'are' : 'is';
    const sentence = `Upload failed. ${filesOverLimit.toString()} ${proVerb} over the file size limit of ${IMAGE_SIZE} MB.`.replaceAll(",", ", ");
    const message = filesOverLimit.length < 3
        ? sentence.replace(",", " and")
        : sentence.replace(/,(?=[^,]*$)/, " and");

    return res.status(413).json({ status: 'error', message });
  }

  next();
};


module.exports = { imageFileSizeLimiter };
