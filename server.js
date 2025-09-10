import express from 'express';
import cors from 'cors';
import https from 'https';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

const upload = multer();

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage} - ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });
    req.on('error', (error) => {
      reject(error);
    });
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function uploadFile(apiKey, audioBuffer) {
  console.log("Server: Uploading file to AssemblyAI...");
  const uploadResponse = await makeRequest("https://api.assemblyai.com/v2/upload", {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/octet-stream'
    },
  }, audioBuffer);

  return uploadResponse.upload_url;
}

async function performTranscription(base64Audio, mimeType) {
  const API_KEY = "b83e3a63827241059296e24e2f90b5f9";
  console.log("Server: Starting transcription with AssemblyAI...");

  const base64Data = base64Audio.split(',')[1];
  if (!base64Data) {
    throw new Error('Invalid base64 audio data received.');
  }
  const audioBuffer = Buffer.from(base64Data, 'base64');

  const uploadUrl = await uploadFile(API_KEY, audioBuffer);
  console.log("Server: File uploaded, URL:", uploadUrl);
  
  const transcriptResult = await makeRequest("https://api.assemblyai.com/v2/transcript", {
    method: 'POST',
    headers: { 'Authorization': API_KEY, 'Content-Type': 'application/json' },
  }, JSON.stringify({
    audio_url: uploadUrl,
    speech_model: 'best',
    language_code: 'de',
    speaker_labels: true,
    format_text: true,
    punctuate: true
  }));

  const transcriptId = transcriptResult.id;
  console.log("Server: Transcription started, ID:", transcriptId);

  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log(`Server: Checking status... (attempt ${attempts + 1})`);
    const transcript = await makeRequest(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
      method: 'GET',
      headers: { 'Authorization': API_KEY },
    });

    if (transcript.status === 'completed') {
      console.log("Server: Transcription completed.");
      if (!transcript.text) {
        throw new Error("The API returned an empty transcription.");
      }
      return transcript.text;
    } else if (transcript.status === 'error') {
      throw new Error(`Transcription failed: ${transcript.error}`);
    }
    attempts++;
  }

  throw new Error('Transcription timed out.');
}

app.post('/api/transcribe', async (req, res) => {
  console.log("Server received transcription request.");
  try {
    const { base64Audio, mimeType } = req.body;
    
    if (!base64Audio || !mimeType) {
      return res.status(400).json({ error: 'Missing base64Audio or mimeType' });
    }

    const result = await performTranscription(base64Audio, mimeType);
    res.json({ transcription: result });
  } catch (error) {
    console.error("Error in server during transcription:", error);
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Opus AI Transcriber server running on port ${port}`);
});