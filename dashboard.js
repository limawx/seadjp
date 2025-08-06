// =============================================================================
// CONFIGURAÇÃO INICIAL E VERIFICAÇÕES
// =============================================================================

// Verifica o login no início de cada página protegida
if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index.html';
}

// Variáveis globais
let database = {};
let currentCodeCategory = '';

// =============================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// =============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    await initializeDatabase();
    setupEventListeners();
    renderAll();
});

// =============================================================================
// GERENCIAMENTO DE DADOS
// =============================================================================

/**
 * Inicializa o banco de dados carregando do arquivo ou localStorage
 */
async function initializeDatabase() {
    try {
        const response = await fetch('db.json');
        const fileData = await response.json();
        console.log('Dados carregados do arquivo db.json:', fileData);
        
        const savedData = localStorage.getItem('tiDatabase');
        if (savedData) {
            const localData = JSON.parse(savedData);
            console.log('Dados do localStorage:', localData);
            
            // Usa localStorage se tiver mais itens (dados mais recentes)
            if (localData.inventory && localData.inventory.length > fileData.inventory.length) {
                database = localData;
                console.log('Usando dados do localStorage (mais recentes)');
            } else {
                database = fileData;
                localStorage.setItem('tiDatabase', JSON.stringify(database));
                console.log('Usando dados do arquivo (mais atualizados)');
            }
        } else {
            database = fileData;
            localStorage.setItem('tiDatabase', JSON.stringify(database));
            console.log('Usando dados do arquivo (primeira vez)');
        }
    } catch (error) {
        console.error('Falha ao carregar o banco de dados do arquivo:', error);
        await loadFromLocalStorage();
    }
}

/**
 * Carrega dados do localStorage como fallback
 */
async function loadFromLocalStorage() {
    const savedData = localStorage.getItem('tiDatabase');
    if (savedData) {
        try {
            database = JSON.parse(savedData);
            console.log('Usando dados do localStorage (fallback)');
        } catch (localStorageError) {
            console.error('Erro ao carregar do localStorage:', localStorageError);
            showError('Erro: Não foi possível carregar dados. Adicione itens no painel admin primeiro.');
        }
    } else {
        showError('Erro: Não foi possível carregar dados. Adicione itens no painel admin primeiro.');
    }
}

/**
 * Salva dados no localStorage
 */
function saveToLocalStorage() {
    localStorage.setItem('tiDatabase', JSON.stringify(database));
}

// =============================================================================
// CONFIGURAÇÃO DE EVENT LISTENERS
// =============================================================================

/**
 * Configura todos os event listeners da aplicação
 */
function setupEventListeners() {
    // Botão de Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.removeItem('loggedIn');
        window.location.href = 'index.html';
    });
    
    // Botão para salvar alterações no banco de dados
    const header = document.querySelector('header nav');
    const saveBtn = document.createElement('button');
    saveBtn.textContent = '💾 Salvar Alterações';
    saveBtn.onclick = showSaveDatabaseDialog;
    header.appendChild(saveBtn);
}

// =============================================================================
// OPERAÇÕES DO INVENTÁRIO
// =============================================================================

/**
 * Altera a quantidade de um item no inventário
 * @param {number} itemId - ID do item
 * @param {number} change - Mudança na quantidade (-1 para diminuir, +1 para aumentar)
 */
function changeQuantity(itemId, change) {
    const item = database.inventory.find(i => i.id === itemId);
    if (item) {
        const newQuantity = item.quantity + change;
        if (newQuantity >= 0) {
            item.quantity = newQuantity;
            saveToLocalStorage();
            renderInventory();
            showNotification(`Quantidade de ${item.name} alterada para ${newQuantity}`);
        }
    }
}

/**
 * Remove um item do inventário
 * @param {number} itemId - ID do item a ser removido
 */
function removeItem(itemId) {
    const item = database.inventory.find(i => i.id === itemId);
    if (item) {
        if (confirm(`Tem certeza que deseja remover "${item.name}" do inventário?`)) {
            database.inventory = database.inventory.filter(i => i.id !== itemId);
            saveToLocalStorage();
            renderInventory();
            showNotification(`Item "${item.name}" removido do inventário`);
        }
    }
}

// =============================================================================
// SISTEMA DE NOTIFICAÇÕES
// =============================================================================

/**
 * Mostra uma notificação temporária na tela
 * @param {string} message - Mensagem a ser exibida
 */
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.1s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * Mostra uma mensagem de erro
 * @param {string} message - Mensagem de erro
 */
function showError(message) {
    alert(message);
}

// =============================================================================
// DIALOG DE SALVAMENTO DO BANCO DE DADOS
// =============================================================================

/**
 * Mostra o diálogo para salvar alterações no banco de dados
 */
function showSaveDatabaseDialog() {
    const newDbContent = JSON.stringify(database, null, 2);
    
    const overlay = createOverlay();
    const modal = createSaveModal(newDbContent);
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    setupModalEventListeners(overlay, modal, newDbContent);
}

/**
 * Cria o overlay escuro do modal
 */
function createOverlay() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 1000;
    `;
    return overlay;
}

/**
 * Cria o modal de salvamento
 */
function createSaveModal(newDbContent) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 800px;
        max-height: 80%;
        background: white;
        border-radius: 8px;
        padding: 30px;
        z-index: 1001;
        overflow-y: auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    modal.innerHTML = `
        <h2 style="margin-top: 0; color: #0056b3; border-bottom: 2px solid #eee; padding-bottom: 15px;">
            💾 Salvar Alterações no Banco de Dados
        </h2>
        
        <p style="margin-bottom: 20px; line-height: 1.6; color: #555;">
            Após adicionar ou modificar itens, clique no botão abaixo para gerar o novo banco de dados. 
            Em seguida, copie todo o texto da caixa e cole no seu arquivo <strong>db.json</strong>, 
            substituindo todo o conteúdo antigo.
        </p>
        
        <button id="generateDbBtn" style="
            background: #28a745;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-bottom: 20px;
            transition: background 0.2s;
        " onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
            🔄 Gerar Novo Banco de Dados
        </button>
        
        <textarea id="outputDb" readonly style="
            width: 100%;
            height: 300px;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            background: #f8f9fa;
            resize: vertical;
            margin-bottom: 20px;
        " placeholder="O conteúdo do banco de dados aparecerá aqui após clicar em 'Gerar Novo Banco de Dados'..."></textarea>
        
        <div style="text-align: center;">
            <button id="closeModalBtn" style="
                background: #6c757d;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                margin-right: 10px;
            " onmouseover="this.style.background='#5a6268'" onmouseout="this.style.background='#6c757d'">
                ❌ Fechar
            </button>
            
            <button id="copyContentBtn" style="
                background: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                margin-left: 10px;
            " onmouseover="this.style.background='#0056b3'" onmouseout="this.style.background='#007bff'">
                📋 Copiar Conteúdo
            </button>
        </div>
    `;
    
    return modal;
}

/**
 * Configura os event listeners do modal
 */
function setupModalEventListeners(overlay, modal, newDbContent) {
    document.getElementById('generateDbBtn').addEventListener('click', () => {
        const outputArea = document.getElementById('outputDb');
        outputArea.value = newDbContent;
        showNotification('Banco de dados gerado! Copie o conteúdo e salve no arquivo db.json.');
    });
    
    document.getElementById('copyContentBtn').addEventListener('click', () => {
        const outputArea = document.getElementById('outputDb');
        if (outputArea.value) {
            outputArea.select();
            document.execCommand('copy');
            showNotification('Conteúdo copiado para a área de transferência!');
        } else {
            showNotification('Primeiro gere o banco de dados!');
        }
    });
    
    const closeModal = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
    };
    
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
}

// =============================================================================
// FUNÇÕES DE RENDERIZAÇÃO
// =============================================================================

/**
 * Renderiza todas as seções da aplicação
 */
function renderAll() {
    renderInventory();
    renderDrivers();
    renderCodes();
    renderFiles();
}

/**
 * Renderiza a seção do inventário
 */
function renderInventory() {
    const list = document.getElementById('inventoryList');
    list.innerHTML = '';
    
    if (!database.inventory || database.inventory.length === 0) {
        list.innerHTML = '<p>Nenhum item no inventário</p>';
        return;
    }
    
    console.log('Renderizando inventário:', database.inventory);
    
    database.inventory.forEach(item => {
        const div = document.createElement('div');
        div.className = 'inventory-item';
        div.innerHTML = `
            <div class="item-header">
                <h3>${item.name}</h3>
                ${item.image ? `<span class="item-image">📷 ${item.image}</span>` : ''}
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="changeQuantity(${item.id}, -1)" ${item.quantity <= 0 ? 'disabled' : ''}>▼</button>
                <span class="quantity-display">${item.quantity}</span>
                <button class="quantity-btn" onclick="changeQuantity(${item.id}, 1)">▲</button>
            </div>
            <div class="item-actions">
                <button class="remove-btn" onclick="removeItem(${item.id})" title="Remover item">🗑️</button>
            </div>
        `;
        list.appendChild(div);
    });
}

/**
 * Renderiza a seção de drivers
 * @param {string} filter - Filtro de texto opcional
 */
function renderDrivers(filter = '') {
    const list = document.getElementById('driverList');
    list.innerHTML = '';
    
    const filteredDrivers = database.drivers.filter(d =>
        d.name.toLowerCase().includes(filter.toLowerCase()) ||
        d.category.toLowerCase().includes(filter.toLowerCase())
    );

    filteredDrivers.forEach(driver => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${driver.link}" target="_blank">${driver.name}</a> <em>(${driver.category})</em>`;
        list.appendChild(li);
    });
}

/**
 * Renderiza a seção de códigos
 * @param {string} filter - Filtro de texto opcional
 */
function renderCodes(filter = '') {
    const list = document.getElementById('codeList');
    list.innerHTML = '';
    
    let filteredCodes = database.codes;
    
    // Aplica filtro por categoria
    if (currentCodeCategory) {
        filteredCodes = filteredCodes.filter(c => 
            c.category.toLowerCase() === currentCodeCategory.toLowerCase()
        );
    }
    
    // Aplica filtro por texto
    if (filter) {
        filteredCodes = filteredCodes.filter(c =>
            c.name.toLowerCase().includes(filter.toLowerCase()) ||
            c.category.toLowerCase().includes(filter.toLowerCase())
        );
    }

    if (filteredCodes.length === 0) {
        list.innerHTML = '<p>Nenhum código encontrado para esta categoria.</p>';
        return;
    }

    filteredCodes.forEach(code => {
        const div = document.createElement('div');
        div.className = 'code-item';
        
        const formattedContent = code.description 
            ? `# ${code.description}\n\n${code.content}`
            : code.content;
        
        div.innerHTML = `
            <div class="code-header">
                <span><strong>${code.name}</strong> <em>(${code.category})</em></span>
                <button class="copy-btn" onclick="copyToClipboard('${code.id}')">Copiar</button>
            </div>
            <pre class="code-content" id="code-${code.id}">${formattedContent}</pre>
        `;
        list.appendChild(div);
    });
}

/**
 * Renderiza a seção de arquivos
 */
function renderFiles() {
    const list = document.getElementById('fileList');
    list.innerHTML = '';
    
    database.files.forEach(file => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${file.path}" download>${file.name}</a>`;
        list.appendChild(li);
    });
}

// =============================================================================
// FUNÇÕES DE FILTRO
// =============================================================================

/**
 * Filtra a lista de drivers
 */
function filterDrivers() {
    const filterText = document.getElementById('driverFilter').value;
    renderDrivers(filterText);
}

/**
 * Filtra a lista de códigos
 */
function filterCodes() {
    const filterText = document.getElementById('codeFilter').value;
    renderCodes(filterText);
}

/**
 * Filtra códigos por categoria
 * @param {string} category - Categoria selecionada
 */
function filterCodesByCategory(category) {
    currentCodeCategory = category;
    
    // Atualiza os botões ativos
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Encontra o botão clicado e marca como ativo
    const clickedButton = event.target;
    clickedButton.classList.add('active');
    
    // Reaplica o filtro de texto atual
    const filterText = document.getElementById('codeFilter').value;
    renderCodes(filterText);
}

// =============================================================================
// UTILITÁRIOS
// =============================================================================

/**
 * Copia código para a área de transferência
 * @param {string} codeId - ID do código a ser copiado
 */
function copyToClipboard(codeId) {
    const codeContent = document.getElementById(`code-${codeId}`).innerText;
    navigator.clipboard.writeText(codeContent).then(() => {
        showNotification('Código copiado para a área de transferência!');
    }, (err) => {
        showError('Falha ao copiar o código.');
        console.error('Erro de cópia:', err);
    });
}