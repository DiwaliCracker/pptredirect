import express from 'express';
import puppeteer from 'puppeteer';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/fetch', async (req, res) => {
  const targetUrl = req.query.url;

  if (!targetUrl) {
    return res.status(400).send("Missing ?url parameter");
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new", // 'new' for latest versions
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    let videoUrl = null;

    // Intercept requests
    page.on('request', (req) => {
      const url = req.url();
      if (url.match(/\.(mp4|m3u8|vid)(\?|$)/)) {
        videoUrl = url;
      }
    });

    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForTimeout(5000); // wait for JS and ads to load

    await browser.close();

    if (videoUrl) {
      res.json({ videoUrl });
    } else {
      res.status(404).send("Video URL not found");
    }

  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
