const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

// POST /api/ai/quiz - Generate quiz from notes
router.post('/quiz', auth, async (req, res) => {
    try {
        const { notes } = req.body;

        if (!notes || notes.trim().length < 20) {
            return res.status(400).json({ message: 'Please provide at least 20 characters of notes' });
        }

        // If AI API key is configured, use it
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

        // Fallback: generate smart mock quiz based on content
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

        // Ensure exactly 5 questions
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

// POST /api/ai/summary - Summarize chat
router.post('/summary', auth, async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages || messages.length === 0) {
            return res.status(400).json({ message: 'No messages to summarize' });
        }

        const chatText = messages.map(m => `${m.sender}: ${m.content}`).join('\n');

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
                                content: 'Summarize this study group chat into clear bullet points. Use simple, student-friendly language. Focus on key topics discussed, decisions made, and action items.'
                            },
                            { role: 'user', content: chatText }
                        ],
                        temperature: 0.5
                    })
                });

                const data = await response.json();
                return res.json({ summary: data.choices[0].message.content });
            } catch (aiError) {
                console.error('AI API error:', aiError);
            }
        }

        // Fallback: simple extractive summary
        const uniqueSenders = [...new Set(messages.map(m => m.sender))];
        const topMessages = messages
            .filter(m => m.content.length > 15)
            .slice(-10);

        let summary = `📝 **Chat Summary** (${messages.length} messages from ${uniqueSenders.length} participants)\n\n`;
        summary += `**Key Discussion Points:**\n`;

        topMessages.forEach((m, i) => {
            summary += `• ${m.sender}: "${m.content.substring(0, 100)}${m.content.length > 100 ? '...' : ''}"\n`;
        });

        if (topMessages.length === 0) {
            summary += `• Brief conversation with ${messages.length} messages exchanged\n`;
        }

        res.json({ summary });
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate summary', error: error.message });
    }
});

module.exports = router;
