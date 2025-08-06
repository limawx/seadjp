const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API para salvar dados (opcional)
app.post('/api/save', (req, res) => {
    try {
        const data = req.body;
        // Aqui você pode implementar salvamento em arquivo
        res.json({ status: 'success', message: 'Dados salvos com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🚀 Servidor Central de TI iniciado!');
    console.log(`📱 Acesse: http://localhost:${PORT}`);
    console.log(`🌐 Para acessar de outros computadores: http://SEU_IP:${PORT}`);
    console.log(`📁 Diretório: ${__dirname}`);
    console.log(`⏹️  Pressione Ctrl+C para parar o servidor`);
    console.log('-'.repeat(50));
}); 