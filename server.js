const express = require('express');
const QRCode = require('qrcode');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/api/v1/generate-qr', async (req, res) => {
    try {
        const { 
            text, 
            size = 300, 
            margin = 4, 
            dark = '000000', 
            light = 'FFFFFF'
        } = req.query;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameter 'text'",
                message: "Please provide text parameter in URL"
            });
        }

        const qrOptions = {
            width: parseInt(size),
            margin: parseInt(margin),
            color: {
                dark: `#${dark}`,
                light: `#${light}`
            },
            errorCorrectionLevel: 'H'
        };

        const qrBuffer = await QRCode.toBuffer(text, qrOptions);
        const base64Image = qrBuffer.toString('base64');
        
        const downloadUrl = `${req.protocol}://${req.get('host')}/api/v1/download-qr/${Buffer.from(text).toString('base64')}?size=${size}&margin=${margin}&dark=${dark}&light=${light}`;

        res.json({
            success: true,
            data: {
                text: text,
                downloadUrl: downloadUrl,
                directDownload: `${downloadUrl}&download=true`,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({
            success: false,
            error: "QR generation failed",
            message: error.message
        });
    }
});

app.get('/api/v1/download-qr/:textBase64', async (req, res) => {
    try {
        const text = Buffer.from(req.params.textBase64, 'base64').toString();
        const { 
            size = 300, 
            margin = 4, 
            dark = '000000', 
            light = 'FFFFFF',
            download = false
        } = req.query;

        const qrOptions = {
            width: parseInt(size),
            margin: parseInt(margin),
            color: {
                dark: `#${dark}`,
                light: `#${light}`
            },
            errorCorrectionLevel: 'H'
        };

        const qrBuffer = await QRCode.toBuffer(text, qrOptions);

        if (download === 'true') {
            res.setHeader('Content-Disposition', `attachment; filename="qrcode-${Date.now()}.png"`);
        }
        
        res.setHeader('Content-Type', 'image/png');
        res.send(qrBuffer);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Download failed",
            message: error.message
        });
    }
});

app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'QR Code Download API',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`QR Download API running on port ${PORT}`);
});
