const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.send('LaTeX Server is Running! POST /compile to use.');
});

app.post('/compile', async (req, res) => {
  const { content, compiler = 'xelatex' } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'No content provided' });
  }

  const jobId = uuidv4();
  const workDir = `/tmp/${jobId}`;

  try {
    fs.mkdirSync(workDir, { recursive: true });
    fs.writeFileSync(`${workDir}/main.tex`, content, 'utf8');

    execSync(
      `cd ${workDir} && ${compiler} -interaction=nonstopmode main.tex`,
      { timeout: 60000, stdio: 'pipe' }
    );

    const pdfPath = `${workDir}/main.pdf`;

    if (fs.existsSync(pdfPath)) {
      const pdfBuffer = fs.readFileSync(pdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');
      res.send(pdfBuffer);
    } else {
      let log = '';
      try { log = fs.readFileSync(`${workDir}/main.log`, 'utf8'); } catch {}
      res.status(500).json({ error: 'PDF not generated', log: log.substring(0, 3000) });
    }

  } catch (e) {
    let log = '';
    try { log = fs.readFileSync(`${workDir}/main.log`, 'utf8'); } catch {}
    res.status(500).json({
      error: e.message,
      log: log.substring(0, 3000)
    });
  } finally {
    try { fs.rmSync(workDir, { recursive: true, force: true }); } catch {}
  }
});

app.listen(8080, '0.0.0.0', () => {
  console.log('LaTeX server running on port 8080');
});
