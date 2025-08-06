# 🖥️ Como Usar o Servidor Local - Central de TI

## 📋 Pré-requisitos

### Opção A: Python (Mais Simples)
- Python 3.6+ instalado no computador
- Não precisa instalar nada mais

### Opção B: Node.js (Mais Robusto)
- Node.js instalado no computador
- Executar `npm install` uma vez

---

## 🚀 Como Iniciar o Servidor

### **Opção A: Python (Recomendado para iniciantes)**

1. **Abra o PowerShell/CMD** na pasta do projeto
2. **Execute o comando:**
   ```bash
   python server.py
   ```
3. **Pronto!** O servidor estará rodando

### **Opção B: Node.js**

1. **Instale as dependências (só na primeira vez):**
   ```bash
   npm install
   ```

2. **Inicie o servidor:**
   ```bash
   npm start
   ```

---

## 🌐 Como Acessar

### **No seu computador:**
- Abra o navegador
- Acesse: `http://localhost:8080`

### **De outros computadores na rede:**
1. **Descubra seu IP:**
   ```bash
   ipconfig
   ```
   Procure por "IPv4 Address" (exemplo: 192.168.1.100)

2. **Acesse de outros computadores:**
   - `http://SEU_IP:8080`
   - Exemplo: `http://192.168.1.100:8080`

---

## 🔧 Configurações Avançadas

### **Mudar a porta (se 8080 estiver ocupada):**

**Python:** Edite o arquivo `server.py` linha 15:
```python
PORT = 8081  # ou qualquer porta
```

**Node.js:** Edite o arquivo `server.js` linha 6:
```javascript
const PORT = process.env.PORT || 8081;
```

### **Criar atalho para iniciar automaticamente:**

1. **Crie um arquivo `.bat`** (Windows):
   ```batch
   @echo off
   cd /d "C:\caminho\para\sua\pasta"
   python server.py
   pause
   ```

2. **Salve como `iniciar_servidor.bat`**

---

## 📱 Como Usar no Trabalho

### **Passo a Passo:**

1. **Copie toda a pasta** para um local fixo no servidor/computador principal
2. **Execute o servidor** usando uma das opções acima
3. **Deixe rodando** durante o horário de trabalho
4. **Acesse de qualquer computador** da rede usando o IP

### **Para facilitar o uso:**

1. **Crie um atalho** no desktop para iniciar o servidor
2. **Configure para iniciar com o Windows** (opcional)
3. **Crie um atalho no navegador** para acessar rapidamente

---

## 🔒 Segurança

### **Recomendações para ambiente corporativo:**

1. **Use apenas na rede interna** da empresa
2. **Configure firewall** para permitir apenas a porta 8080
3. **Mantenha o servidor atualizado**
4. **Faça backup regular** dos dados

### **Para maior segurança:**

1. **Adicione autenticação** (usuário/senha)
2. **Use HTTPS** (certificado SSL)
3. **Configure IPs permitidos**

---

## 🛠️ Solução de Problemas

### **Erro: "Porta já em uso"**
- Mude a porta no arquivo de configuração
- Ou feche outros programas que usam a porta 8080

### **Erro: "Python não encontrado"**
- Instale Python do site oficial
- Ou use a versão Node.js

### **Não consegue acessar de outros computadores**
- Verifique se o firewall está permitindo a porta
- Confirme se está na mesma rede
- Teste o ping entre os computadores

### **Dados não salvam**
- O sistema usa localStorage do navegador
- Os dados ficam salvos no computador que acessa
- Para dados compartilhados, implemente um banco de dados

---

## 📞 Suporte

Se tiver problemas:
1. Verifique se todos os arquivos estão na pasta
2. Confirme se Python/Node.js está instalado
3. Teste primeiro no localhost
4. Verifique as configurações de rede

**Boa sorte! 🚀** 