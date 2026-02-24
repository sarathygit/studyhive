const express = require('express');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Multer config for document uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
    filename: (req, file, cb) => cb(null, `doc-${Date.now()}-${file.originalname}`)
});

const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png'
];

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    }
});

// ─── Text Extraction Helpers ───────────────────────────────

async function extractFromPDF(filePath) {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
}

async function extractFromDocx(filePath) {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
}

async function extractFromPptx(filePath) {
    // Simple PPTX text extraction using mammoth fallback or manual XML parsing
    const AdmZip = require('adm-zip');
    try {
        const zip = new AdmZip(filePath);
        const entries = zip.getEntries();
        let text = '';
        for (const entry of entries) {
            if (entry.entryName.startsWith('ppt/slides/slide') && entry.entryName.endsWith('.xml')) {
                const xml = entry.getData().toString('utf8');
                // Extract text between <a:t> tags
                const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
                if (matches) {
                    const slideText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
                    text += slideText + '\n\n';
                }
            }
        }
        return text || 'Could not extract text from this PowerPoint file.';
    } catch (err) {
        throw new Error('Failed to parse PowerPoint file');
    }
}

async function extractFromImage(filePath) {
    const { createWorker } = require('tesseract.js');
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(filePath);
    await worker.terminate();
    return text;
}

async function extractText(filePath, mimetype) {
    switch (mimetype) {
        case 'application/pdf':
            return extractFromPDF(filePath);
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            return extractFromDocx(filePath);
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            return extractFromPptx(filePath);
        case 'text/plain':
            return fs.readFileSync(filePath, 'utf-8');
        case 'image/jpeg':
        case 'image/png':
            return extractFromImage(filePath);
        default:
            throw new Error('Unsupported file type');
    }
}

// ─── AI Summarization ──────────────────────────────────────

async function aiSummarize(text, shorter = false) {
    const maxChars = 8000;
    const trimmedText = text.length > maxChars ? text.substring(0, maxChars) + '...' : text;

    const lengthInstruction = shorter
        ? 'Keep the summary very brief — maximum 5 bullet points covering only the most critical concepts.'
        : 'Provide a thorough summary with 8-15 bullet points.';

    if (process.env.AI_API_KEY) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.AI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a study assistant that creates clear, structured summaries for students. ${lengthInstruction}

Rules:
- Use bullet points (•) for each point
- Highlight key concepts in **bold**
- Include important formulas, dates, or facts
- Use simple, student-friendly language
- Focus on essential learning points for revision
- Group related points under short section headers if the content covers multiple topics`
                        },
                        { role: 'user', content: `Summarize this study material:\n\n${trimmedText}` }
                    ],
                    temperature: 0.4
                })
            });

            const data = await response.json();
            if (data.choices?.[0]?.message?.content) {
                return data.choices[0].message.content;
            }
        } catch (aiError) {
            console.error('AI API error:', aiError);
        }
    }

    // Fallback: extractive summary
    return generateFallbackSummary(trimmedText, shorter);
}

function generateFallbackSummary(text, shorter) {
    const sentences = text
        .split(/[.!?\n]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20 && s.length < 300);

    if (sentences.length === 0) {
        return '• No meaningful content could be extracted from this document.';
    }

    // Score sentences by importance (length + keyword density)
    const keywords = ['important', 'key', 'main', 'definition', 'formula', 'theorem',
        'concept', 'principle', 'conclusion', 'result', 'note', 'remember'];

    const scored = sentences.map(s => {
        const lower = s.toLowerCase();
        let score = s.length > 50 ? 2 : 1;
        keywords.forEach(k => { if (lower.includes(k)) score += 3; });
        // First and last sentences often important
        if (sentences.indexOf(s) < 3) score += 2;
        return { text: s, score };
    });

    scored.sort((a, b) => b.score - a.score);

    const limit = shorter ? 5 : Math.min(12, scored.length);
    const topSentences = scored.slice(0, limit);

    // Sort back to original order
    topSentences.sort((a, b) => sentences.indexOf(a.text) - sentences.indexOf(b.text));

    let summary = shorter ? '📝 **Brief Summary:**\n\n' : '📝 **Document Summary:**\n\n';
    topSentences.forEach(s => {
        summary += `• ${s.text}\n`;
    });

    return summary;
}

// ─── Routes ────────────────────────────────────────────────

// POST /api/ai/summarize-doc — Upload & summarize document
router.post('/summarize-doc', auth, upload.single('document'), async (req, res) => {
    const filePath = req.file?.path;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Extract text
        const extractedText = await extractText(filePath, req.file.mimetype);

        if (!extractedText || extractedText.trim().length < 10) {
            return res.status(400).json({
                message: 'Could not extract meaningful text from this file. It may be empty or contain only images/scanned content.'
            });
        }

        // Summarize
        const summary = await aiSummarize(extractedText, false);

        res.json({
            summary,
            filename: req.file.originalname,
            textLength: extractedText.length,
            fileType: req.file.mimetype
        });
    } catch (error) {
        console.error('Document summarization error:', error);
        res.status(500).json({ message: error.message || 'Failed to process document' });
    } finally {
        // Clean up uploaded file
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
});

// POST /api/ai/summarize-shorter — Generate shorter version
router.post('/summarize-shorter', auth, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length < 10) {
            return res.status(400).json({ message: 'No text provided' });
        }

        const summary = await aiSummarize(text, true);
        res.json({ summary });
    } catch (error) {
        console.error('Shorter summary error:', error);
        res.status(500).json({ message: 'Failed to generate shorter summary' });
    }
});

// POST /api/ai/quiz — Generate quiz from notes
router.post('/quiz', auth, async (req, res) => {
    try {
        const { notes } = req.body;

        if (!notes || notes.trim().length < 20) {
            return res.status(400).json({ message: 'Please provide at least 20 characters of notes' });
        }

        if (process.env.AI_API_KEY) {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.AI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo',
                        messages: [
                            {
                                role: 'system',
                                content: 'You are a quiz generator. Generate exactly 5 multiple choice questions from the given notes. Return a JSON array with objects having: question, options (array of 4 strings), correctAnswer (index 0-3). Only return valid JSON, no extra text.'
                            },
                            { role: 'user', content: `Generate 5 MCQs from these notes:\n\n${notes}` }
                        ],
                        temperature: 0.7
                    })
                });

                const data = await response.json();
                const quiz = JSON.parse(data.choices[0].message.content);
                return res.json({ quiz });
            } catch (aiError) {
                console.error('AI API error:', aiError);
            }
        }

        // Fallback mock quiz
        const sentences = notes.split(/[.!?]+/).filter(s => s.trim().length > 10);
        const quiz = [];

        for (let i = 0; i < Math.min(5, Math.max(sentences.length, 5)); i++) {
            const sentence = sentences[i % sentences.length]?.trim() || `Concept ${i + 1} from the notes`;
            const words = sentence.split(' ').filter(w => w.length > 3);
            const keyword = words[Math.floor(Math.random() * words.length)] || 'concept';

            quiz.push({
                question: `Based on your notes, which statement about "${keyword}" is correct?`,
                options: [
                    sentence.length > 60 ? sentence.substring(0, 60) + '...' : sentence,
                    `${keyword} is not relevant to this topic`,
                    `${keyword} refers to a completely different concept`,
                    `None of the above statements are accurate`
                ],
                correctAnswer: 0
            });
        }

        while (quiz.length < 5) {
            quiz.push({
                question: `What is an important concept from your study notes? (Question ${quiz.length + 1})`,
                options: [
                    'The first key concept mentioned',
                    'An unrelated topic',
                    'A contradictory statement',
                    'None of the above'
                ],
                correctAnswer: 0
            });
        }

        res.json({ quiz: quiz.slice(0, 5) });
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate quiz', error: error.message });
    }
});

module.exports = router;
