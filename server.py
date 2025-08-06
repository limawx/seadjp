#!/usr/bin/env python3
"""
Servidor HTTP simples para Central de TI
Uso: python server.py
"""

import http.server
import socketserver
import os
import json
from urllib.parse import urlparse, parse_qs
import threading
import time

# Configurações
PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class CentralTIServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Adicionar headers para evitar cache e permitir CORS
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Rota padrão para index.html
        if self.path == '/':
            self.path = '/index.html'
        
        # Servir arquivos estáticos
        return super().do_GET()
    
    def do_POST(self):
        # API para salvar dados (opcional - para futuras funcionalidades)
        if self.path == '/api/save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                # Aqui você pode implementar salvamento em arquivo
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'success'}).encode())
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

def start_server():
    """Inicia o servidor HTTP"""
    os.chdir(DIRECTORY)
    
    with socketserver.TCPServer(("", PORT), CentralTIServer) as httpd:
        print(f"🚀 Servidor Central de TI iniciado!")
        print(f"📱 Acesse: http://localhost:{PORT}")
        print(f"🌐 Para acessar de outros computadores: http://SEU_IP:{PORT}")
        print(f"📁 Diretório: {DIRECTORY}")
        print(f"⏹️  Pressione Ctrl+C para parar o servidor")
        print("-" * 50)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Servidor parado!")

if __name__ == "__main__":
    start_server() 