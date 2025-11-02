const express = require('express');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const validateInput = (text) => {
  if (!text || text.trim().length === 0) {
    return { isValid: false, message: 'Text or URL content is required' };
  }
  if (text.length > 4096) {
    return { isValid: false, message: 'Content too long (max 4096 characters)' };
  }
  return { isValid: true };
};

app.post('/api/v1/generate-qr', async (req, res) => {
  try {
    const { text, url, config = {} } = req.body;
    
    const content = text || url;
    const validation = validateInput(content);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: validation.message 
      });
    }

    const qrOptions = {
      margin: config.margin || 4,
      width: config.width || 300,
      color: {
        dark: config.darkColor || '#000000',
        light: config.lightColor || '#FFFFFF'
      },
      errorCorrectionLevel: config.errorCorrectionLevel || 'M',
      type: config.type || 'png'
    };

    let qrResult;
    if (config.format === 'base64') {
      qrResult = await QRCode.toDataURL(content, qrOptions);
    } else {
      qrResult = await QRCode.toString(content, { ...qrOptions, type: 'terminal' });
    }

    res.json({
      success: true,
      data: {
        content: content,
        format: config.format || 'svg',
        timestamp: new Date().toISOString(),
        qrCode: qrResult
      }
    });

  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to generate QR code' 
    });
  }
});

app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'QR Code API' 
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: 'Check API documentation for available endpoints' 
  });
});

app.listen(PORT, () => {
  console.log(`QR Code API running on port ${PORT}`);
});
