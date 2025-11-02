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
            light = 'FFFFFF',
            format = 'png' 
        } = req.query;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: "Missing required parameter 'text'",
                message: "Please provide text parameter in URL",
                example: "/api/v1/generate-qr?text=HelloWorld"
            });
        }

        if (text.length > 4096) {
            return res.status(400).json({
                success: false,
                error: "Text too long",
                message: "Maximum text length is 4096 characters"
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

        if (format === 'svg') {
            const svgString = await QRCode.toString(text, { ...qrOptions, type: 'svg' });
            res.setHeader('Content-Type', 'image/svg+xml');
            res.send(svgString);
        } else if (format === 'png') {
            const pngBuffer = await QRCode.toBuffer(text, qrOptions);
            res.setHeader('Content-Type', 'image/png');
            res.send(pngBuffer);
        } else if (format === 'base64') {
            const base64String = await QRCode.toDataURL(text, qrOptions);
            res.json({
                success: true,
                data: {
                    text: text,
                    format: 'base64',
                    qrCode: base64String,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            return res.status(400).json({
                success: false,
                error: "Invalid format",
                message: "Format must be: png, svg, or base64"
            });
        }

    } catch (error) {
        console.error('QR generation error:', error);
        res.status(500).json({
            success: false,
            error: "QR generation failed",
            message: error.message
        });
    }
});

app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'QR Code API',
        timestamp: new Date().toISOString()
    });
});

app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
        message: "Available endpoint: /api/v1/generate-qr"
    });
});

app.listen(PORT, () => {
    console.log(`QR Code API running on port ${PORT}`);
});
