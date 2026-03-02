const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const fsp = require('fs/promises');
const { pipeline } = require('stream/promises');

const { resp } = require('../func');
const File = require('../models/File.model');
const { STORAGE_DIR } = require('../middlewares/handleFile');

// -------------------------------------------------------------------------- //

exports.downloadFile = async (req, res) => {
  const { hash } = req.params;

  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
    return resp(res, 404, 'File Not Found');
  }

  const fileDoc = await File.findOne({ hash });
  const filePath = path.join(STORAGE_DIR, hash);

  if (!fileDoc || !fs.existsSync(filePath)) {
    return resp(res, 404, 'File Not Found');
  }

  if (fileDoc.mimeType === 'application/pdf') {
    fileDoc.originalName += '.pdf';
  }

  res.setHeader('Content-Type', fileDoc.mimeType);
  res.setHeader('Content-Length', fileDoc.sizeInBytes);
  res.setHeader('Content-Disposition', `attachment; filename="${ fileDoc.originalName }"`);

  const readStream = fs.createReadStream(filePath);
  readStream.on('error', err => res.destroy());

  return readStream.pipe(res);
};

// -------------------------------------------------------------------------- //

exports.uploadFile = async (req, res) => {
  if (!req.file) return resp(res, 400, 'No File Provided');

  const rawHash = crypto.createHash('sha256');
  const readStream = fs.createReadStream(req.file.path);

  await new Promise((resolve, reject) => {
    readStream.on('end', resolve);
    readStream.on('error', reject);
    readStream.on('data', chunk => {
      rawHash.update(chunk)
    });
  });

  const hash = rawHash.digest('hex');
  const finalPath = path.join(STORAGE_DIR, hash);

  if (fs.existsSync(finalPath)) {
    fs.unlinkSync(req.file.path);
    return resp(res, 200, 'File Already Exists', { hash });
  }

  fs.renameSync(req.file.path, finalPath);
  await File.create({
    hash,
    status: "uploaded",
    sizeInBytes: req.file.size,
    mimeType: req.file.mimetype,
    uploadedBy: req.user._id,
    originalName: req.file.originalname
  });

  const formData = new FormData();
  formData.append('downloadFrom', JSON.stringify([{
    url: `${ process.env.GOTENBERG_WEBHOOK_URL }/api/files/${ hash }`,
    extraHttpHeaders: { 'Authorization': `Apikey ${ process.env.API_KEY }` }
  }]));

  await fetch(`${ process.env.GOTENBERG_URL }/forms/libreoffice/convert`, {
    method: 'POST',
    headers: {
      'Gotenberg-Webhook-Url': `${ process.env.GOTENBERG_WEBHOOK_URL }/api/files/${ hash }`,
      'Gotenberg-Webhook-Error-Url': `${ process.env.GOTENBERG_WEBHOOK_URL }/api/files/${ hash }`,
      'Gotenberg-Webhook-Method': 'PUT',
      'Gotenberg-Webhook-Error-Method': 'PUT',
      'Gotenberg-Webhook-Extra-Http-Headers': JSON.stringify({
        'Authorization': `Apikey ${ process.env.API_KEY }`
      })
    },
    body: formData
  });

  return resp(res, 202, 'File Uploaded Successfully', { hash });
};

// -------------------------------------------------------------------------- //

exports.getFileStatus = async (req, res) => {
  const { hash } = req.params;

  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
    return resp(res, 404, 'File Not Found');
  }

  const fileDoc = await File.findOne({ hash });
  if (!fileDoc) return resp(res, 404, 'File Not Found');

  return resp(res, 200, 'File Status Retrieved', {
    hash, status: fileDoc.status
  });
};

// -------------------------------------------------------------------------- //

exports.updateFile = async (req, res) => {
  const { hash } = req.params;

  if (!hash || !/^[a-f0-9]{64}$/.test(hash)) {
    return resp(res, 404, 'File Not Found');
  }

  const fileDoc = await File.findOne({ hash });
  if (!fileDoc) return resp(res, 404, 'File Not Found');

  const finalPath = path.join(STORAGE_DIR, hash);
  const tempPath = finalPath + ".tmp";

  await pipeline(req, fs.createWriteStream(tempPath));
  await fsp.rename(tempPath, finalPath);

  fileDoc.status = "processed";
  fileDoc.mimeType = req.get('Content-Type');
  fileDoc.sizeInBytes = req.get('Content-Length');
  await fileDoc.save();

  return resp(res, 200, "File Replaced Successfully", { hash });
};
