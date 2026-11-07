const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const info = {
    cwd: process.cwd(),
    dirname: __dirname,
    rootReaddir: fs.readdirSync(process.cwd()),
    taskReaddir: fs.existsSync('/var/task') ? fs.readdirSync('/var/task') : [],
    hasApiParaphraser: fs.existsSync(path.join(__dirname, 'paraphraser')),
    dirnameReaddir: fs.readdirSync(__dirname)
  };
  res.status(200).json(info);
};
