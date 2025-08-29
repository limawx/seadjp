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
        
        // Inicializa arrays vazios se não existirem
        if (!database.serviceOrders) database.serviceOrders = [];
        if (!database.passwords) database.passwords = [];
        
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

/**
 * Alterna entre tema claro e escuro
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    themeToggle.title = newTheme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro';
    
    // Notificação sonora
    playNotificationSound('theme');
}

/**
 * Carrega o tema salvo
 */
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    themeToggle.title = savedTheme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro';
}

/**
 * Configura atalhos de teclado
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+S - Salvar alterações
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            showSaveDatabaseDialog();
        }
        
        // Ctrl+D - Alternar tema
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            toggleTheme();
        }
        
        // Ctrl+F - Focar no campo de busca
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.querySelector('input[type="text"]');
            if (searchInput) searchInput.focus();
        }
        
        // Ctrl+E - Exportar relatórios
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            showExportDialog();
        }
    });
}

/**
 * Configura tooltips informativos
 */
function setupTooltips() {
    // Adiciona tooltips aos botões existentes
    const addButtons = document.querySelectorAll('.add-btn');
    addButtons.forEach(btn => {
        btn.title = 'Adicionar 1 unidade ao item (Clique)';
    });
    
    const withdrawButtons = document.querySelectorAll('.withdraw-btn');
    withdrawButtons.forEach(btn => {
        btn.title = 'Retirar item do armazém (Clique)';
    });
    
    const removeButtons = document.querySelectorAll('.remove-btn');
    removeButtons.forEach(btn => {
        btn.title = 'Excluir item completamente do inventário (Clique)';
    });
}

/**
 * Toca notificação sonora
 */
function playNotificationSound(type = 'default') {
    try {
        // Cria um beep simples usando Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(type === 'theme' ? 800 : 600, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Notificação sonora não suportada');
    }
}

/**
 * Mostra diálogo de exportação
 */
function showExportDialog() {
    const overlay = createOverlay();
    const modal = createExportModal();
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    setupExportModalEventListeners(overlay, modal);
}

/**
 * Cria modal de exportação
 */
function createExportModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 600px;
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 30px;
        z-index: 1001;
        box-shadow: var(--hover-shadow);
        color: var(--text-primary);
    `;
    
    modal.innerHTML = `
        <h2 style="margin-top: 0; color: var(--btn-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 15px;">
            Exportar Relatórios
        </h2>
        
        <div style="margin-bottom: 20px;">
            <h3>Selecione o tipo de relatório:</h3>
            
            <div style="margin: 15px 0;">
                <label style="display: flex; align-items: center; margin: 10px 0; cursor: pointer;">
                    <input type="radio" name="reportType" value="inventory" checked style="margin-right: 10px;">
                    Inventário Atual
                </label>
                <small style="color: var(--text-secondary); margin-left: 25px;">
                    Lista todos os itens com suas quantidades atuais
                </small>
            </div>
            
            <div style="margin: 15px 0;">
                <label style="display: flex; align-items: center; margin: 10px 0; cursor: pointer;">
                    <input type="radio" name="reportType" value="withdrawals">
                    Histórico de Retiradas
                </label>
                <small style="color: var(--text-secondary); margin-left: 25px;">
                    Todas as retiradas registradas com datas e setores
                </small>
            </div>
            
            <div style="margin: 15px 0;">
                <label style="display: flex; align-items: center; margin: 10px 0; cursor: pointer;">
                    <input type="radio" name="reportType" value="complete">
                    Relatório Completo
                </label>
                <small style="color: var(--text-secondary); margin-left: 25px;">
                    Inventário + Histórico de retiradas
                </small>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3>Formato de exportação:</h3>
            <div style="margin: 10px 0;">
                <label style="display: flex; align-items: center; margin: 10px 0; cursor: pointer;">
                    <input type="radio" name="format" value="excel" checked style="margin-right: 10px;">
                    Excel (CSV)
                </label>
                <label style="display: flex; align-items: center; margin: 10px 0; cursor: pointer;">
                    <input type="radio" name="format" value="json" style="margin-right: 10px;">
                    JSON
                </label>
            </div>
        </div>
        
        <div style="text-align: center;">
            <button id="exportConfirmBtn" style="
                background: var(--btn-success);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 10px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-success)'">
                Exportar
            </button>
            
            <button id="exportCancelBtn" style="
                background: var(--btn-secondary);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-secondary)'">
                Cancelar
            </button>
        </div>
    `;
    
    return modal;
}

/**
 * Configura event listeners do modal de exportação
 */
function setupExportModalEventListeners(overlay, modal) {
    document.getElementById('exportConfirmBtn').addEventListener('click', () => {
        const reportType = document.querySelector('input[name="reportType"]:checked').value;
        const format = document.querySelector('input[name="format"]:checked').value;
        
        exportReport(reportType, format);
        
        // Fecha o modal
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
    });
    
    const closeModal = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
    };
    
    document.getElementById('exportCancelBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
}

/**
 * Exporta relatório
 */
function exportReport(type, format) {
    let data, filename, content;
    
    switch (type) {
        case 'inventory':
            data = database.inventory || [];
            filename = `inventario_${new Date().toISOString().split('T')[0]}`;
            break;
        case 'withdrawals':
            data = database.withdrawals || [];
            filename = `retiradas_${new Date().toISOString().split('T')[0]}`;
            break;
        case 'complete':
            data = {
                inventory: database.inventory || [],
                withdrawals: database.withdrawals || [],
                returns: database.returns || [],
                transfers: database.transfers || [],
                exportDate: new Date().toISOString()
            };
            filename = `relatorio_completo_${new Date().toISOString().split('T')[0]}`;
            break;
    }
    
    if (format === 'excel') {
        content = convertToCSV(data, type);
        filename += '.csv';
    } else {
        content = JSON.stringify(data, null, 2);
        filename += '.json';
    }
    
    downloadFile(content, filename, format === 'excel' ? 'text/csv' : 'application/json');
    showNotification(`Relatório exportado: ${filename}`, 'success');
}

/**
 * Converte dados para CSV
 */
function convertToCSV(data, type) {
    if (type === 'inventory') {
        const headers = ['ID', 'Nome', 'Quantidade'];
        const rows = data.map(item => [item.id, item.name, item.quantity]);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else if (type === 'withdrawals') {
        const headers = ['ID', 'Item', 'Quantidade', 'Data', 'Setor', 'Observações'];
        const rows = data.map(w => [w.id, w.itemName, w.quantity, w.date, w.sector, w.notes || '']);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else if (type === 'returns') {
        const headers = ['ID', 'Item', 'Quantidade', 'Data', 'Observações'];
        const rows = data.map(r => [r.id, r.itemName, r.quantity, r.date, r.notes || '']);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else if (type === 'transfers') {
        const headers = ['ID', 'Item', 'Quantidade', 'Data', 'Setor Origem', 'Setor Destino', 'Observações'];
        const rows = data.map(t => [t.id, t.itemName, t.quantity, t.date, t.fromSector, t.toSector, t.notes || '']);
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else {
        // Relatório completo
        const inventoryCSV = convertToCSV(data.inventory, 'inventory');
        const withdrawalsCSV = convertToCSV(data.withdrawals, 'withdrawals');
        const returnsCSV = convertToCSV(data.returns, 'returns');
        const transfersCSV = convertToCSV(data.transfers, 'transfers');
        return `=== INVENTÁRIO ===\n${inventoryCSV}\n\n=== RETIRADAS ===\n${withdrawalsCSV}\n\n=== DEVOLUÇÕES ===\n${returnsCSV}\n\n=== TRANSFERÊNCIAS ===\n${transfersCSV}`;
    }
}

/**
 * Faz download do arquivo
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Configura ações avançadas
 */
function setupAdvancedActions() {
    document.getElementById('returnItemBtn').addEventListener('click', showReturnModal);
    document.getElementById('transferItemBtn').addEventListener('click', showTransferModal);
    document.getElementById('batchActionsBtn').addEventListener('click', showBatchModal);
    
    // Novas ações
    document.getElementById('addServiceOrderBtn').addEventListener('click', showServiceOrderModal);
    document.getElementById('addPasswordBtn').addEventListener('click', showPasswordModal);
}

/**
 * Mostra modal de devolução de item
 */
function showReturnModal() {
    const overlay = createOverlay();
    const modal = createReturnModal();
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    setupReturnModalEventListeners(overlay, modal);
}

/**
 * Cria modal de devolução
 */
function createReturnModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 500px;
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 30px;
        z-index: 1001;
        box-shadow: var(--hover-shadow);
        color: var(--text-primary);
    `;
    
    const today = new Date().toISOString().split('T')[0];
    
    modal.innerHTML = `
        <h2 style="margin-top: 0; color: var(--btn-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 15px;">
            Devolver Item ao Armazém
        </h2>
        
        <div style="margin-bottom: 15px;">
            <label for="returnItemSelect" style="display: block; margin-bottom: 5px; font-weight: bold;">Item a ser devolvido:</label>
            <select id="returnItemSelect" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 5px;
                font-size: 16px;
                background: var(--bg-secondary);
                color: var(--text-primary);
            ">
                <option value="">Selecione um item...</option>
            </select>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label for="returnQuantity" style="display: block; margin-bottom: 5px; font-weight: bold;">Quantidade a devolver:</label>
            <input type="number" id="returnQuantity" min="1" value="1" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 5px;
                font-size: 16px;
                background: var(--bg-secondary);
                color: var(--text-primary);
            ">
        </div>
        
        <div style="margin-bottom: 15px;">
            <label for="returnDate" style="display: block; margin-bottom: 5px; font-weight: bold;">Data de Devolução:</label>
            <input type="date" id="returnDate" value="${today}" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 5px;
                font-size: 16px;
                background: var(--bg-secondary);
                color: var(--text-primary);
            ">
        </div>
        
        <div style="margin-bottom: 20px;">
            <label for="returnNotes" style="display: block; margin-bottom: 5px; font-weight: bold;">Motivo da Devolução:</label>
            <textarea id="returnNotes" placeholder="Descreva o motivo da devolução..." style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 5px;
                font-size: 16px;
                height: 80px;
                resize: vertical;
                background: var(--bg-secondary);
                color: var(--text-primary);
            "></textarea>
        </div>
        
        <div style="text-align: center;">
            <button id="confirmReturnBtn" style="
                background: var(--btn-success);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 10px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-success)'">
                Confirmar Devolução
            </button>
            
            <button id="cancelReturnBtn" style="
                background: var(--btn-secondary);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-secondary)'">
                Cancelar
            </button>
        </div>
    `;
    
    // Popula o select com itens do inventário
    const select = modal.querySelector('#returnItemSelect');
    database.inventory.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = `${item.name} (${item.quantity} unidades)`;
        select.appendChild(option);
    });
    
    return modal;
}

/**
 * Configura event listeners do modal de devolução
 */
function setupReturnModalEventListeners(overlay, modal) {
    document.getElementById('confirmReturnBtn').addEventListener('click', () => {
        const itemId = parseInt(document.getElementById('returnItemSelect').value);
        const quantity = parseInt(document.getElementById('returnQuantity').value);
        const date = document.getElementById('returnDate').value;
        const notes = document.getElementById('returnNotes').value;
        
        if (!itemId || !quantity || !date) {
            showNotification('Por favor, preencha todos os campos obrigatórios!', 'warning');
            return;
        }
        
        const item = database.inventory.find(i => i.id === itemId);
        if (!item) {
            showNotification('Item não encontrado!', 'error');
            return;
        }
        
        // Adiciona quantidade ao item
        item.quantity += quantity;
        
        // Registra a devolução
        if (!database.returns) {
            database.returns = [];
        }
        
        const returnRecord = {
            id: Date.now(),
            itemId: itemId,
            itemName: item.name,
            quantity: quantity,
            date: date,
            notes: notes,
            timestamp: new Date().toISOString()
        };
        
        database.returns.push(returnRecord);
        
        saveToLocalStorage();
        renderInventory();
        renderWithdrawals();
        
        // Fecha o modal
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
        
        showNotification(`Item "${item.name}" devolvido com sucesso!`, 'success');
    });
    
    const closeModal = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
    };
    
    document.getElementById('cancelReturnBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
}

/**
 * Mostra modal de transferência entre setores
 */
function showTransferModal() {
    const overlay = createOverlay();
    const modal = createTransferModal();
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    setupTransferModalEventListeners(overlay, modal);
}

/**
 * Cria modal de transferência
 */
function createTransferModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 500px;
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 30px;
        z-index: 1001;
        box-shadow: var(--hover-shadow);
        color: var(--text-primary);
    `;
    
    const today = new Date().toISOString().split('T')[0];
    
    modal.innerHTML = `
        <h2 style="margin-top: 0; color: var(--btn-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 15px;">
            Transferir Entre Setores
        </h2>
        
        <div style="margin-bottom: 15px;">
            <label for="transferFromSector" style="display: block; margin-bottom: 5px; font-weight: bold;">Setor de Origem:</label>
            <select id="transferFromSector" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 5px;
                font-size: 16px;
                background: var(--bg-secondary);
                color: var(--text-primary);
            ">
                <option value="">Selecione o setor de origem...</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Segurança">Segurança</option>
                <option value="Educação">Educação</option>
                <option value="Saúde">Saúde</option>
                <option value="Obras">Obras</option>
                <option value="Transporte">Transporte</option>
                <option value="Cultura">Cultura</option>
                <option value="Esporte">Esporte</option>
                <option value="Meio Ambiente">Meio Ambiente</option>
                <option value="Assistência Social">Assistência Social</option>
                <option value="Tributação">Tributação</option>
                <option value="Engenharia">Engenharia</option>
            </select>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label for="transferToSector" style="display: block; margin-bottom: 5px; font-weight: bold;">Setor de Destino:</label>
            <select id="transferToSector" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 5px;
                font-size: 16px;
                background: var(--bg-secondary);
                color: var(--text-primary);
            ">
                <option value="">Selecione o setor de destino...</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Segurança">Segurança</option>
                <option value="Educação">Educação</option>
                <option value="Saúde">Saúde</option>
                <option value="Obras">Obras</option>
                <option value="Transporte">Transporte</option>
                <option value="Cultura">Cultura</option>
                <option value="Esporte">Esporte</option>
                <option value="Meio Ambiente">Meio Ambiente</option>
                <option value="Assistência Social">Assistência Social</option>
                <option value="Tributação">Tributação</option>
                <option value="Engenharia">Engenharia</option>
            </select>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label for="transferItemName" style="display: block; margin-bottom: 5px; font-weight: bold;">Nome do Item:</label>
            <input type="text" id="transferItemName" placeholder="Digite o nome do item..." style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 5px;
                font-size: 16px;
                background: var(--bg-secondary);
                color: var(--text-primary);
            ">
        </div>
        
        <div style="margin-bottom: 15px;">
            <label for="transferQuantity" style="display: block; margin-bottom: 5px; font-weight: bold;">Quantidade:</label>
            <input type="number" id="transferQuantity" min="1" value="1" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 5px;
                font-size: 16px;
                background: var(--bg-secondary);
                color: var(--text-primary);
            ">
        </div>
        
        <div style="margin-bottom: 15px;">
            <label for="transferDate" style="display: block; margin-bottom: 5px; font-weight: bold;">Data da Transferência:</label>
            <input type="date" id="transferDate" value="${today}" style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 5px;
                font-size: 16px;
                background: var(--bg-secondary);
                color: var(--text-primary);
            ">
        </div>
        
        <div style="margin-bottom: 20px;">
            <label for="transferNotes" style="display: block; margin-bottom: 5px; font-weight: bold;">Observações:</label>
            <textarea id="transferNotes" placeholder="Descreva o motivo da transferência..." style="
                width: 100%;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 5px;
                font-size: 16px;
                height: 80px;
                resize: vertical;
                background: var(--bg-secondary);
                color: var(--text-primary);
            "></textarea>
        </div>
        
        <div style="text-align: center;">
            <button id="confirmTransferBtn" style="
                background: var(--btn-success);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 10px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-success)'">
                Confirmar Transferência
            </button>
            
            <button id="cancelTransferBtn" style="
                background: var(--btn-secondary);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-secondary)'">
                Cancelar
            </button>
        </div>
    `;
    
    return modal;
}

/**
 * Configura event listeners do modal de transferência
 */
function setupTransferModalEventListeners(overlay, modal) {
    document.getElementById('confirmTransferBtn').addEventListener('click', () => {
        const fromSector = document.getElementById('transferFromSector').value;
        const toSector = document.getElementById('transferToSector').value;
        const itemName = document.getElementById('transferItemName').value;
        const quantity = parseInt(document.getElementById('transferQuantity').value);
        const date = document.getElementById('transferDate').value;
        const notes = document.getElementById('transferNotes').value;
        
        if (!fromSector || !toSector || !itemName || !quantity || !date) {
            showNotification('Por favor, preencha todos os campos obrigatórios!', 'warning');
            return;
        }
        
        if (fromSector === toSector) {
            showNotification('Setor de origem e destino não podem ser iguais!', 'warning');
            return;
        }
        
        // Registra a transferência
        if (!database.transfers) {
            database.transfers = [];
        }
        
        const transfer = {
            id: Date.now(),
            itemName: itemName,
            quantity: quantity,
            fromSector: fromSector,
            toSector: toSector,
            date: date,
            notes: notes,
            timestamp: new Date().toISOString()
        };
        
        database.transfers.push(transfer);
        
        saveToLocalStorage();
        renderWithdrawals();
        
        // Fecha o modal
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
        
        showNotification(`Transferência de "${itemName}" registrada com sucesso!`, 'success');
    });
    
    const closeModal = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
    };
    
    document.getElementById('cancelTransferBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
}

/**
 * Mostra modal de ações em lote
 */
function showBatchModal() {
    const overlay = createOverlay();
    const modal = createBatchModal();
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    setupBatchModalEventListeners(overlay, modal);
}

/**
 * Cria modal de ações em lote
 */
function createBatchModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 600px;
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 30px;
        z-index: 1001;
        box-shadow: var(--hover-shadow);
        color: var(--text-primary);
    `;
    
    modal.innerHTML = `
        <h2 style="margin-top: 0; color: var(--btn-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 15px;">
            Ações em Lote
        </h2>
        
        <div style="margin-bottom: 20px;">
            <h3>Selecione a ação:</h3>
            <div style="margin: 10px 0;">
                <label style="display: flex; align-items: center; margin: 10px 0; cursor: pointer;">
                    <input type="radio" name="batchAction" value="add" checked style="margin-right: 10px;">
                    Adicionar múltiplos itens
                </label>
                <label style="display: flex; align-items: center; margin: 10px 0; cursor: pointer;">
                    <input type="radio" name="batchAction" value="withdraw" style="margin-right: 10px;">
                    Retirar múltiplos itens
                </label>
            </div>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h3>Itens (um por linha):</h3>
            <textarea id="batchItems" placeholder="Digite os itens, um por linha:
Exemplo:
Fonte 200W, 5
Teclado USB, 3
Mouse, 2" style="
                width: 100%;
                height: 150px;
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 5px;
                font-size: 14px;
                background: var(--bg-secondary);
                color: var(--text-primary);
                resize: vertical;
            "></textarea>
        </div>
        
        <div style="text-align: center;">
            <button id="confirmBatchBtn" style="
                background: var(--btn-success);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 10px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-success)'">
                Executar Ação
            </button>
            
            <button id="cancelBatchBtn" style="
                background: var(--btn-secondary);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-secondary)'">
                Cancelar
            </button>
        </div>
    `;
    
    return modal;
}

/**
 * Configura event listeners do modal de lote
 */
function setupBatchModalEventListeners(overlay, modal) {
    document.getElementById('confirmBatchBtn').addEventListener('click', () => {
        const action = document.querySelector('input[name="batchAction"]:checked').value;
        const itemsText = document.getElementById('batchItems').value.trim();
        
        if (!itemsText) {
            showNotification('Por favor, digite os itens!', 'warning');
            return;
        }
        
        const items = itemsText.split('\n').filter(line => line.trim());
        let processed = 0;
        
        items.forEach(itemLine => {
            const [name, quantity] = itemLine.split(',').map(s => s.trim());
            if (name && quantity) {
                const qty = parseInt(quantity);
                if (action === 'add') {
                    addBatchItem(name, qty);
                } else {
                    withdrawBatchItem(name, qty);
                }
                processed++;
            }
        });
        
        // Fecha o modal
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
        
        showNotification(`${processed} itens processados com sucesso!`, 'success');
    });
    
    const closeModal = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
    };
    
    document.getElementById('cancelBatchBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
}

/**
 * Adiciona item em lote
 */
function addBatchItem(name, quantity) {
    let item = database.inventory.find(i => i.name.toLowerCase() === name.toLowerCase());
    
    if (item) {
        item.quantity += quantity;
    } else {
        // Cria novo item
        const newId = Math.max(...database.inventory.map(i => i.id), 0) + 1;
        item = {
            id: newId,
            name: name,
            quantity: quantity
        };
        database.inventory.push(item);
    }
    
    saveToLocalStorage();
    renderInventory();
}

/**
 * Retira item em lote
 */
function withdrawBatchItem(name, quantity) {
    const item = database.inventory.find(i => i.name.toLowerCase() === name.toLowerCase());
    
    if (item && item.quantity >= quantity) {
        item.quantity -= quantity;
        
        // Registra a retirada
        if (!database.withdrawals) {
            database.withdrawals = [];
        }
        
        const withdrawal = {
            id: Date.now() + Math.random(),
            itemId: item.id,
            itemName: item.name,
            quantity: quantity,
            date: new Date().toISOString().split('T')[0],
            sector: 'Lote',
            notes: 'Retirada em lote',
            timestamp: new Date().toISOString()
        };
        
        database.withdrawals.push(withdrawal);
        
        saveToLocalStorage();
        renderInventory();
        renderWithdrawals();
    }
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
    
    // Botão de alternar tema
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', toggleTheme);
    
    // Botão de exportar
    const exportBtn = document.getElementById('exportBtn');
    exportBtn.addEventListener('click', showExportDialog);
    
    // Carrega tema salvo
    loadTheme();
    
    // Botão para salvar alterações no banco de dados
    const header = document.querySelector('header nav');
    const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Salvar Alterações';
    saveBtn.title = 'Salvar alterações no banco de dados (Ctrl+S)';
    saveBtn.onclick = showSaveDatabaseDialog;
    header.appendChild(saveBtn);
    
    // Atalhos de teclado
    setupKeyboardShortcuts();
    
    // Tooltips
    setupTooltips();
    
    // Botões de ação avançada
    setupAdvancedActions();
}

// =============================================================================
// OPERAÇÕES DO INVENTÁRIO
// =============================================================================

/**
 * Adiciona quantidade a um item no inventário
 * @param {number} itemId - ID do item
 */
function addQuantity(itemId) {
    const item = database.inventory.find(i => i.id === itemId);
    if (item) {
        item.quantity += 1;
        saveToLocalStorage();
        renderInventory();
        renderWithdrawals();
        showNotification(`Quantidade de ${item.name} aumentada para ${item.quantity}`);
    }
}

/**
 * Abre modal para retirar item do inventário
 * @param {number} itemId - ID do item
 */
function withdrawItem(itemId) {
    const item = database.inventory.find(i => i.id === itemId);
    if (item && item.quantity > 0) {
        showWithdrawModal(item);
    } else {
        showNotification('Não é possível retirar este item - quantidade insuficiente');
    }
}

/**
 * Mostra modal para registrar saída de item
 * @param {Object} item - Item a ser retirado
 */
function showWithdrawModal(item) {
    const overlay = createOverlay();
    const modal = createWithdrawModal(item);
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    setupWithdrawModalEventListeners(overlay, modal, item);
}

/**
 * Cria modal de retirada de item
 */
function createWithdrawModal(item) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 500px;
        background: white;
        border-radius: 8px;
        padding: 30px;
        z-index: 1001;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    
    const today = new Date().toISOString().split('T')[0];
    
    modal.innerHTML = `
        <h2 style="margin-top: 0; color: var(--btn-primary); border-bottom: 2px solid #eee; padding-bottom: 15px;">
            Retirar Item do Armazém
        </h2>
        
        <div style="margin-bottom: 20px;">
            <p><strong>Item:</strong> ${item.name}</p>
            <p><strong>Quantidade Atual:</strong> ${item.quantity}</p>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label for="withdrawDate" style="display: block; margin-bottom: 5px; font-weight: bold;">Data de Saída:</label>
            <input type="date" id="withdrawDate" value="${today}" style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
            ">
        </div>
        
        <div style="margin-bottom: 20px;">
            <label for="withdrawSector" style="display: block; margin-bottom: 5px; font-weight: bold;">Setor de Destino:</label>
            <select id="withdrawSector" style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
            ">
                <option value="">Selecione o setor...</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Segurança">Segurança</option>
                <option value="Educação">Educação</option>
                <option value="Saúde">Saúde</option>
                <option value="Obras">Obras</option>
                <option value="Transporte">Transporte</option>
                <option value="Cultura">Cultura</option>
                <option value="Esporte">Esporte</option>
                <option value="Meio Ambiente">Meio Ambiente</option>
                <option value="Assistência Social">Assistência Social</option>
                <option value="Tributação">Tributação</option>
                <option value="Engenharia">Engenharia</option>
                <option value="Outro">Outro</option>
            </select>
        </div>
        
        <div style="margin-bottom: 20px;">
            <label for="withdrawNotes" style="display: block; margin-bottom: 5px; font-weight: bold;">Observações (opcional):</label>
            <textarea id="withdrawNotes" placeholder="Adicione observações sobre a retirada..." style="
                width: 100%;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 16px;
                height: 80px;
                resize: vertical;
            "></textarea>
        </div>
        
        <div style="text-align: center;">
            <button id="confirmWithdrawBtn" style="
                background: var(--btn-success);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 10px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-success)'">
                Confirmar Retirada
            </button>
            
            <button id="cancelWithdrawBtn" style="
                background: var(--btn-secondary);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-secondary)'">
                Cancelar
            </button>
        </div>
    `;
    
    return modal;
}

/**
 * Configura event listeners do modal de retirada
 */
function setupWithdrawModalEventListeners(overlay, modal, item) {
    document.getElementById('confirmWithdrawBtn').addEventListener('click', () => {
        const date = document.getElementById('withdrawDate').value;
        const sector = document.getElementById('withdrawSector').value;
        const notes = document.getElementById('withdrawNotes').value;
        
        if (!date || !sector) {
            showNotification('Por favor, preencha a data e o setor de destino!');
            return;
        }
        
        // Registra a retirada no histórico
        if (!database.withdrawals) {
            database.withdrawals = [];
        }
        
        const withdrawal = {
            id: Date.now(),
            itemId: item.id,
            itemName: item.name,
            quantity: 1,
            date: date,
            sector: sector,
            notes: notes,
            timestamp: new Date().toISOString()
        };
        
        database.withdrawals.push(withdrawal);
        
        // Diminui a quantidade do item
        item.quantity -= 1;
        
        saveToLocalStorage();
        renderInventory();
        renderWithdrawals();
        
        // Fecha o modal
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
        
        showNotification(`Item "${item.name}" retirado para ${sector} em ${date}`);
    });
    
    const closeModal = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
    };
    
    document.getElementById('cancelWithdrawBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
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
 * @param {string} type - Tipo de notificação (success, warning, error)
 */
function showNotification(message, type = 'success') {
    // Toca notificação sonora
    playNotificationSound(type);
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    const colors = {
        success: 'var(--btn-success)',
        warning: 'var(--btn-warning)',
        error: 'var(--btn-danger)'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.success};
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
        font-weight: bold;
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
        <h2 style="margin-top: 0; color: var(--btn-primary); border-bottom: 2px solid #eee; padding-bottom: 15px;">
            Salvar Alterações no Banco de Dados
        </h2>
        
        <p style="margin-bottom: 20px; line-height: 1.6; color: #555;">
            Depois de adicionar itens, cliqsr no botão para gerar o novo banco de dados. 
            Depois copiar todo o texto e colar no arquivo <strong>db.json</strong>, 
            substituindo todo o conteúdo antigo.
        </p>
        
        <button id="generateDbBtn" style="
            background: var(--btn-success);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin-bottom: 20px;
            transition: background 0.2s;
        " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-success)'">
            Gerar Novo Banco de Dados
        </button>
        
        <textarea id="outputDb" readonly style="
            width: 100%;
            height: 300px;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            background: var(--bg-secondary);
            resize: vertical;
            margin-bottom: 20px;
        " placeholder="O conteúdo do banco de dados aparecerá aqui após clicar em 'Gerar Novo Banco de Dados'..."></textarea>
        
        <div style="text-align: center;">
            <button id="closeModalBtn" style="
                background: var(--btn-secondary);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                margin-right: 10px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-secondary)'">
                Fechar
            </button>
            
            <button id="copyContentBtn" style="
                background: var(--btn-primary);
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                margin-left: 10px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-primary)'">
                Copiar Conteúdo
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
    renderWithdrawals();
    renderServiceOrders();
    renderPasswords();
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
            <div class="quantity-display">
                <span class="quantity-number">${item.quantity}</span>
                <span class="quantity-label">unidades</span>
            </div>
            <div class="item-actions">
                <button class="add-btn" onclick="addQuantity(${item.id})" title="Adicionar item">Adicionar</button>
                <button class="withdraw-btn" onclick="withdrawItem(${item.id})" ${item.quantity <= 0 ? 'disabled' : ''} title="Retirar item">Retirar</button>
                <button class="remove-btn" onclick="removeItem(${item.id})" title="Remover item">Excluir</button>
            </div>
        `;
        list.appendChild(div);
    });
}

/**
 * Renderiza a seção de histórico de retiradas
 */
function renderWithdrawals() {
    const list = document.getElementById('withdrawalsList');
    list.innerHTML = '';
    
    // Combina todas as movimentações
    const allMovements = [];
    
    // Adiciona retiradas
    if (database.withdrawals) {
        database.withdrawals.forEach(w => {
            allMovements.push({
                ...w,
                type: 'withdrawal',
                displayName: `Retirada: ${w.itemName}`
            });
        });
    }
    
    // Adiciona devoluções
    if (database.returns) {
        database.returns.forEach(r => {
            allMovements.push({
                ...r,
                type: 'return',
                displayName: `Devolução: ${r.itemName}`
            });
        });
    }
    
    // Adiciona transferências
    if (database.transfers) {
        database.transfers.forEach(t => {
            allMovements.push({
                ...t,
                type: 'transfer',
                displayName: `Transferência: ${t.itemName}`
            });
        });
    }
    
    if (allMovements.length === 0) {
        list.innerHTML = '<p>Nenhuma movimentação registrada</p>';
        return;
    }
    
    // Ordena por data mais recente primeiro
    const sortedMovements = allMovements.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    sortedMovements.forEach(movement => {
        const div = document.createElement('div');
        div.className = 'withdrawal-item';
        
        const date = new Date(movement.date).toLocaleDateString('pt-BR');
        
        let details = `<p><strong>Quantidade:</strong> ${movement.quantity} unidade(s)</p>`;
        
        if (movement.type === 'withdrawal') {
            details += `<p><strong>Setor:</strong> ${movement.sector}</p>`;
        } else if (movement.type === 'return') {
            details += `<p><strong>Tipo:</strong> Devolução ao armazém</p>`;
        } else if (movement.type === 'transfer') {
            details += `<p><strong>De:</strong> ${movement.fromSector} <strong>Para:</strong> ${movement.toSector}</p>`;
        }
        
        if (movement.notes) {
            details += `<p><strong>Observações:</strong> ${movement.notes}</p>`;
        }
        
        div.innerHTML = `
            <div class="withdrawal-header">
                <h4>${movement.displayName}</h4>
                <span class="withdrawal-date">${date}</span>
            </div>
            <div class="withdrawal-details">
                ${details}
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

// =============================================================================
// NOVAS FUNCIONALIDADES - ORDENS DE SERVIÇO
// =============================================================================

/**
 * Mostra modal para criar nova ordem de serviço
 */
function showServiceOrderModal() {
    const overlay = createOverlay();
    const modal = createServiceOrderModal();
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    setupServiceOrderModalEventListeners(overlay, modal);
}

/**
 * Cria modal de ordem de serviço
 */
function createServiceOrderModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 800px;
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 30px;
        z-index: 1001;
        box-shadow: var(--hover-shadow);
        color: var(--text-primary);
        max-height: 80vh;
        overflow-y: auto;
    `;
    
    const today = new Date().toISOString().split('T')[0];
    
    modal.innerHTML = `
        <h2 style="margin-top: 0; color: var(--btn-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 15px;">
            Nova Ordem de Serviço
        </h2>
        
        <div class="service-type-toggle">
            <input type="radio" id="maintenance" name="serviceType" value="maintenance" checked>
            <label for="maintenance">Manutenção</label>
            <input type="radio" id="inspection" name="serviceType" value="inspection">
            <label for="inspection">Vistoria/Visita</label>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="serviceSector">Setor:</label>
                <select id="serviceSector" required>
                    <option value="">Selecione o setor...</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Financeiro">Financeiro</option>
                    <option value="Recursos Humanos">Recursos Humanos</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Limpeza">Limpeza</option>
                    <option value="Segurança">Segurança</option>
                    <option value="Educação">Educação</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Obras">Obras</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Cultura">Cultura</option>
                    <option value="Esporte">Esporte</option>
                    <option value="Meio Ambiente">Meio Ambiente</option>
                    <option value="Assistência Social">Assistência Social</option>
                    <option value="Tributação">Tributação</option>
                    <option value="Engenharia">Engenharia</option>
                </select>
            </div>
            <div class="form-group">
                <label for="serviceDate">Data:</label>
                <input type="date" id="serviceDate" value="${today}" required>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label for="serviceTechnicians">Técnicos Responsáveis:</label>
                <input type="text" id="serviceTechnicians" placeholder="Nomes dos técnicos" required>
            </div>
            <div class="form-group">
                <label for="serviceReceptionist">Quem Recepcionou:</label>
                <input type="text" id="serviceReceptionist" placeholder="Nome da pessoa" required>
            </div>
        </div>
        
        <div class="form-group">
            <label for="serviceDescription">Descrição do Serviço/Problema:</label>
            <textarea id="serviceDescription" placeholder="Descreva o que foi solicitado ou o problema encontrado..." required></textarea>
        </div>
        
        <div id="maintenanceFields" class="form-group">
            <label for="serviceSolution">Solução Aplicada:</label>
            <textarea id="serviceSolution" placeholder="Descreva o que foi feito para resolver o problema..."></textarea>
        </div>
        
        <div class="form-group">
            <label for="serviceMaterials">Materiais Utilizados:</label>
            <textarea id="serviceMaterials" placeholder="Liste os materiais utilizados (opcional)"></textarea>
        </div>
        
        <div class="form-group">
            <label for="serviceObservations">Observações Adicionais:</label>
            <textarea id="serviceObservations" placeholder="Outras informações relevantes..."></textarea>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button id="saveServiceOrderBtn" style="
                background: var(--btn-success);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 10px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-success)'">
                Salvar Ordem
            </button>
            
            <button id="cancelServiceOrderBtn" style="
                background: var(--btn-secondary);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-secondary)'">
                Cancelar
            </button>
        </div>
    `;
    
    // Adiciona funcionalidade para mostrar/ocultar campos de manutenção
    const maintenanceRadio = modal.querySelector('#maintenance');
    const inspectionRadio = modal.querySelector('#inspection');
    const maintenanceFields = modal.querySelector('#maintenanceFields');
    
    function toggleMaintenanceFields() {
        if (maintenanceRadio.checked) {
            maintenanceFields.style.display = 'block';
        } else {
            maintenanceFields.style.display = 'none';
        }
    }
    
    maintenanceRadio.addEventListener('change', toggleMaintenanceFields);
    inspectionRadio.addEventListener('change', toggleMaintenanceFields);
    toggleMaintenanceFields();
    
    return modal;
}

/**
 * Configura event listeners do modal de ordem de serviço
 */
function setupServiceOrderModalEventListeners(overlay, modal) {
    document.getElementById('saveServiceOrderBtn').addEventListener('click', () => {
        const serviceType = document.querySelector('input[name="serviceType"]:checked').value;
        const sector = document.getElementById('serviceSector').value;
        const date = document.getElementById('serviceDate').value;
        const technicians = document.getElementById('serviceTechnicians').value;
        const receptionist = document.getElementById('serviceReceptionist').value;
        const description = document.getElementById('serviceDescription').value;
        const solution = document.getElementById('serviceSolution').value;
        const materials = document.getElementById('serviceMaterials').value;
        const observations = document.getElementById('serviceObservations').value;
        
        if (!sector || !date || !technicians || !receptionist || !description) {
            showNotification('Por favor, preencha todos os campos obrigatórios!', 'warning');
            return;
        }
        
        const serviceOrder = {
            id: Date.now(),
            type: serviceType,
            sector: sector,
            date: date,
            technicians: technicians,
            receptionist: receptionist,
            description: description,
            solution: solution,
            materials: materials,
            observations: observations,
            timestamp: new Date().toISOString()
        };
        
        database.serviceOrders.push(serviceOrder);
        saveToLocalStorage();
        renderServiceOrders();
        
        // Fecha o modal
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
        
        showNotification('Ordem de serviço criada com sucesso!', 'success');
    });
    
    const closeModal = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
    };
    
    document.getElementById('cancelServiceOrderBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
}

/**
 * Renderiza a seção de ordens de serviço
 */
function renderServiceOrders() {
    const list = document.getElementById('serviceOrdersList');
    list.innerHTML = '';
    
    if (!database.serviceOrders || database.serviceOrders.length === 0) {
        list.innerHTML = '<p>Nenhuma ordem de serviço registrada</p>';
        return;
    }
    
    // Ordena por data mais recente
    const sortedOrders = database.serviceOrders.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );
    
    sortedOrders.forEach(order => {
        const div = document.createElement('div');
        div.className = 'service-order-item';
        
        const date = new Date(order.date).toLocaleDateString('pt-BR');
        const typeLabel = order.type === 'maintenance' ? 'Manutenção' : 'Vistoria';
        
        let details = `
            <p><strong>Tipo:</strong> ${typeLabel}</p>
            <p><strong>Setor:</strong> ${order.sector}</p>
            <p><strong>Técnicos:</strong> ${order.technicians}</p>
            <p><strong>Recepcionou:</strong> ${order.receptionist}</p>
            <p><strong>Descrição:</strong> ${order.description}</p>
        `;
        
        if (order.solution) {
            details += `<p><strong>Solução:</strong> ${order.solution}</p>`;
        }
        
        if (order.materials) {
            details += `<p><strong>Materiais:</strong> ${order.materials}</p>`;
        }
        
        if (order.observations) {
            details += `<p><strong>Observações:</strong> ${order.observations}</p>`;
        }
        
        div.innerHTML = `
            <div class="service-order-header">
                <h4 class="service-order-title">${typeLabel} - ${order.sector}</h4>
                <span class="service-order-date">${date}</span>
            </div>
            <div class="service-order-details">
                ${details}
            </div>
        `;
        
        list.appendChild(div);
    });
    
    // Adiciona botão para gerar PDF
    if (database.serviceOrders.length > 0) {
        const pdfBtn = document.createElement('button');
        pdfBtn.className = 'generate-pdf-btn';
        pdfBtn.textContent = 'Gerar PDF das Ordens de Serviço';
        pdfBtn.onclick = generateServiceOrdersPDF;
        list.appendChild(pdfBtn);
    }
}

// =============================================================================
// NOVAS FUNCIONALIDADES - SENHAS E ACESSOS
// =============================================================================

/**
 * Mostra modal para adicionar nova senha
 */
function showPasswordModal() {
    const overlay = createOverlay();
    const modal = createPasswordModal();
    
    document.body.appendChild(overlay);
    document.body.appendChild(modal);
    
    setupPasswordModalEventListeners(overlay, modal);
}

/**
 * Cria modal de senha
 */
function createPasswordModal() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 90%;
        max-width: 500px;
        background: var(--bg-secondary);
        border-radius: 8px;
        padding: 30px;
        z-index: 1001;
        box-shadow: var(--hover-shadow);
        color: var(--text-primary);
    `;
    
    modal.innerHTML = `
        <h2 style="margin-top: 0; color: var(--btn-primary); border-bottom: 2px solid var(--border-color); padding-bottom: 15px;">
            Nova Senha/Acesso
        </h2>
        
        <div class="form-group">
            <label for="passwordTitle">Título:</label>
            <input type="text" id="passwordTitle" placeholder="Ex: WiFi Setor Administrativo" required>
        </div>
        
        <div class="form-group">
            <label for="passwordCategory">Categoria:</label>
            <select id="passwordCategory" required>
                <option value="">Selecione a categoria...</option>
                <option value="WiFi">WiFi</option>
                <option value="Roteador">Roteador</option>
                <option value="Sistema">Sistema</option>
                <option value="Email">Email</option>
                <option value="Servidor">Servidor</option>
                <option value="Outro">Outro</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="passwordUsername">Usuário:</label>
            <input type="text" id="passwordUsername" placeholder="Nome de usuário (se aplicável)">
        </div>
        
        <div class="form-group">
            <label for="passwordPassword">Senha:</label>
            <input type="password" id="passwordPassword" placeholder="Senha" required>
        </div>
        
        <div class="form-group">
            <label for="passwordUrl">URL/IP:</label>
            <input type="text" id="passwordUrl" placeholder="Endereço de acesso (se aplicável)">
        </div>
        
        <div class="form-group">
            <label for="passwordNotes">Observações:</label>
            <textarea id="passwordNotes" placeholder="Informações adicionais..."></textarea>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button id="savePasswordBtn" style="
                background: var(--btn-success);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                margin-right: 10px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-success)'">
                Salvar Senha
            </button>
            
            <button id="cancelPasswordBtn" style="
                background: var(--btn-secondary);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
            " onmouseover="this.style.background='var(--btn-hover)'" onmouseout="this.style.background='var(--btn-secondary)'">
                Cancelar
            </button>
        </div>
    `;
    
    return modal;
}

/**
 * Configura event listeners do modal de senha
 */
function setupPasswordModalEventListeners(overlay, modal) {
    document.getElementById('savePasswordBtn').addEventListener('click', () => {
        const title = document.getElementById('passwordTitle').value;
        const category = document.getElementById('passwordCategory').value;
        const username = document.getElementById('passwordUsername').value;
        const password = document.getElementById('passwordPassword').value;
        const url = document.getElementById('passwordUrl').value;
        const notes = document.getElementById('passwordNotes').value;
        
        if (!title || !category || !password) {
            showNotification('Por favor, preencha os campos obrigatórios!', 'warning');
            return;
        }
        
        const passwordItem = {
            id: Date.now(),
            title: title,
            category: category,
            username: username,
            password: password,
            url: url,
            notes: notes,
            timestamp: new Date().toISOString()
        };
        
        database.passwords.push(passwordItem);
        saveToLocalStorage();
        renderPasswords();
        
        // Fecha o modal
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
        
        showNotification('Senha salva com sucesso!', 'success');
    });
    
    const closeModal = () => {
        document.body.removeChild(overlay);
        document.body.removeChild(modal);
    };
    
    document.getElementById('cancelPasswordBtn').addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
}

/**
 * Renderiza a seção de senhas
 */
function renderPasswords() {
    const list = document.getElementById('passwordsList');
    list.innerHTML = '';
    
    if (!database.passwords || database.passwords.length === 0) {
        list.innerHTML = '<p>Nenhuma senha registrada</p>';
        return;
    }
    
    database.passwords.forEach(item => {
        const div = document.createElement('div');
        div.className = 'password-item';
        
        div.innerHTML = `
            <div class="password-header">
                <h4 class="password-title">${item.title}</h4>
                <span class="password-category">${item.category}</span>
            </div>
            <div class="password-details">
                ${item.username ? `<p><strong>Usuário:</strong> ${item.username}</p>` : ''}
                <p><strong>Senha:</strong> <span id="password-${item.id}" style="display: none;">${item.password}</span><span id="dots-${item.id}">••••••••</span></p>
                ${item.url ? `<p><strong>URL/IP:</strong> ${item.url}</p>` : ''}
                ${item.notes ? `<p><strong>Observações:</strong> ${item.notes}</p>` : ''}
            </div>
            <div class="password-actions">
                <button class="show-password-btn" onclick="togglePassword(${item.id})">Mostrar/Ocultar</button>
                <button class="copy-password-btn" onclick="copyPassword('${item.password}')">Copiar Senha</button>
            </div>
        `;
        
        list.appendChild(div);
    });
}

/**
 * Alterna entre mostrar e ocultar senha
 */
function togglePassword(id) {
    const passwordSpan = document.getElementById(`password-${id}`);
    const dotsSpan = document.getElementById(`dots-${id}`);
    
    if (passwordSpan.style.display === 'none') {
        passwordSpan.style.display = 'inline';
        dotsSpan.style.display = 'none';
    } else {
        passwordSpan.style.display = 'none';
        dotsSpan.style.display = 'inline';
    }
}

/**
 * Copia senha para a área de transferência
 */
function copyPassword(password) {
    navigator.clipboard.writeText(password).then(() => {
        showNotification('Senha copiada para a área de transferência!', 'success');
    }, (err) => {
        showError('Falha ao copiar a senha.');
        console.error('Erro de cópia:', err);
    });
}

// =============================================================================
// GERAÇÃO DE PDF
// =============================================================================

/**
 * Gera PDF das ordens de serviço
 */
function generateServiceOrdersPDF() {
    // Cria o conteúdo do PDF
    let pdfContent = `
        <html>
        <head>
            <title>Relatório de Ordens de Serviço</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #333; text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .order { margin-bottom: 30px; border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
                .order-header { background: #f5f5f5; padding: 10px; margin: -15px -15px 15px -15px; border-radius: 5px 5px 0 0; }
                .order-title { margin: 0; color: #333; }
                .order-date { float: right; background: #007bff; color: white; padding: 5px 10px; border-radius: 15px; font-size: 12px; }
                .order-details p { margin: 8px 0; }
                .order-details strong { color: #333; }
                .page-break { page-break-before: always; }
            </style>
        </head>
        <body>
            <h1>Relatório de Ordens de Serviço</h1>
            <p><strong>Data de Geração:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Total de Ordens:</strong> ${database.serviceOrders.length}</p>
    `;
    
    database.serviceOrders.forEach((order, index) => {
        if (index > 0) {
            pdfContent += '<div class="page-break"></div>';
        }
        
        const date = new Date(order.date).toLocaleDateString('pt-BR');
        const typeLabel = order.type === 'maintenance' ? 'Manutenção' : 'Vistoria';
        
        let details = `
            <p><strong>Tipo:</strong> ${typeLabel}</p>
            <p><strong>Setor:</strong> ${order.sector}</p>
            <p><strong>Técnicos:</strong> ${order.technicians}</p>
            <p><strong>Recepcionou:</strong> ${order.receptionist}</p>
            <p><strong>Descrição:</strong> ${order.description}</p>
        `;
        
        if (order.solution) {
            details += `<p><strong>Solução:</strong> ${order.solution}</p>`;
        }
        
        if (order.materials) {
            details += `<p><strong>Materiais:</strong> ${order.materials}</p>`;
        }
        
        if (order.observations) {
            details += `<p><strong>Observações:</strong> ${order.observations}</p>`;
        }
        
        pdfContent += `
            <div class="order">
                <div class="order-header">
                    <h3 class="order-title">${typeLabel} - ${order.sector}</h3>
                    <span class="order-date">${date}</span>
                </div>
                <div class="order-details">
                    ${details}
                </div>
            </div>
        `;
    });
    
    pdfContent += '</body></html>';
    
    // Cria uma nova janela com o conteúdo
    const newWindow = window.open('', '_blank');
    newWindow.document.write(pdfContent);
    newWindow.document.close();
    
    // Aguarda o carregamento e imprime
    newWindow.onload = function() {
        newWindow.print();
    };
    
    showNotification('PDF gerado com sucesso!', 'success');
}