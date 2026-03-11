const fs = require('fs');
const path = require('path');
const multer = require('multer');
const express = require('express');

const File = require('../models/File.model');

const { resp } = require('../func');
const { jwtAuth, keyAuth } = require('../auth');

// -------------------------------------------------------------------------- //

const jobs = new Map();
const router = express.Router();
const STORAGE_DIR = path.join(process.cwd(), 'files');

for (const dir of [STORAGE_DIR, `${STORAGE_DIR}/temp`]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const handleFile = multer({
  dest: `${STORAGE_DIR}/temp`,
  limits: { fileSize: 100 * 1024 * 1024 },
}).single('file');

// -------------------------------------------------------------------------- //

// router.get('/:prefix(temp)?/:fileId([0-9a-fA-F]+)', jwtAuth, async (req, res) => {
//   const { prefix, fileId } = req.params;
//   const filePath = path.join(STORAGE_DIR, prefix ?? '', fileId);

//   if (!filePath.startsWith(STORAGE_DIR + path.sep)) {
//     return resp(res, 400, 'Invalid path');
//   }

//   if (!fs.existsSync(filePath)) {
//     return resp(res, 404, 'File Not Found');
//   }

//   const readStream = fs.createReadStream(filePath);
//   readStream.on('error', err => res.destroy());

//   return readStream.pipe(res);
// });

// -------------------------------------------------------------------------- //

router.put('/:fileId([0-9a-fA-F]+)', keyAuth, handleFile, async (req, res) => {
  const { fileId } = req.params;

  const promise = jobs.get(fileId);
  const filePath = path.join(STORAGE_DIR, fileId);

  if (!req.file) {
    return resp(res, 400, 'No File Provided');
  }

  await fs.promises.rename(req.file.path, filePath);

  if (promise) {
    jobs.delete(fileId);
    promise.resolve(fileId);
  }

  return resp(res, 200, 'Updated File Successfully');
});

// -------------------------------------------------------------------------- //

router.post('/', jwtAuth, handleFile, async (req, res) => {
  if (!req.file) {
    return resp(res, 400, 'No File Provided');
  }

  const fileId = req.file.filename;
  const filePath = path.join(STORAGE_DIR, fileId);

  const url = `${process.env.ABSOLUTE_URI}/api/files/temp/${fileId}`;
  const extraHttpHeaders = { 'Authorization': `Apikey ${process.env.API_KEY}` };

  if (req.file.mimetype !== 'application/pdf') {
    const promise = new Promise((resolve, reject) => {
      jobs.set(fileId, { resolve, reject });
    });

    await fetch(`${process.env.GOTENBERG_URI}/forms/libreoffice/convert`, {
      method: 'POST',
      headers: {
        'Gotenberg-Webhook-Url': url,
        'Gotenberg-Webhook-Method': 'PUT',
        'Gotenberg-Webhook-Error-Url': url,
        'Gotenberg-Webhook-Error-Method': 'PUT',
        'Gotenberg-Webhook-Extra-Http-Headers': extraHttpHeaders
      },
      body: Object.assign(new FormData(), { downloadFrom: [{ url, extraHttpHeaders }] })
    });

    await promise;
  }

  const metadata = await (
    await fetch(`${process.env.GOTENBERG_URI}/forms/pdfengines/metadata/read`, {
      method: 'POST',
      body: Object.assign(new FormData(), { downloadFrom: [{ url, extraHttpHeaders }] })
    })
  ).json();

  fs.renameSync(req.file.path, filePath);

  await File.create({
    fileId,
    uploadedBy: req.user._id,
    numberOfPages: metadata.PageCount,
    originalName: req.file.originalname,
  });

  return resp(res, 201, 'File Uploaded Successfully', { fileId });
});

// -------------------------------------------------------------------------- //

module.exports = router;
