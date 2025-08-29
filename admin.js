// Verifica o login no início de cada página protegida
if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index.html';
}

// Variáveis globais
let database = {};

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await initializeDatabase();
    setupEventListeners();
    setCurrentDate();
});

// Inicializa o banco de dados
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

// Carrega dados do localStorage como fallback
async function loadFromLocalStorage() {
    const savedData = localStorage.getItem('tiDatabase');
    if (savedData) {
        try {
            database = JSON.parse(savedData);
            console.log('Usando dados do localStorage (fallback)');
        } catch (localStorageError) {
            console.error('Erro ao carregar do localStorage:', localStorageError);
            showError('Erro: Não foi possível carregar dados.');
        }
    } else {
        showError('Erro: Não foi possível carregar dados.');
    }
}

// Salva dados no localStorage
function saveToLocalStorage() {
    localStorage.setItem('tiDatabase', JSON.stringify(database));
}

// Configura event listeners
function setupEventListeners() {
    // Botões de inventário
    document.getElementById('addInventoryBtn').addEventListener('click', addInventoryItem);
    
    // Botões de drivers
    document.getElementById('addDriverBtn').addEventListener('click', addDriver);
    
    // Botões de códigos
    document.getElementById('addCodeBtn').addEventListener('click', addCode);
    
    // Botões de arquivos
    document.getElementById('addFileBtn').addEventListener('click', addFile);
    
    // Novos botões
    document.getElementById('addServiceOrderBtn').addEventListener('click', addServiceOrder);
    document.getElementById('addPasswordBtn').addEventListener('click', addPassword);
    
    // Botão de gerar banco de dados
    document.getElementById('generateDbBtn').addEventListener('click', generateDatabase);
    
    // Botão de copiar conteúdo
    document.getElementById('copyContentBtn').addEventListener('click', copyDatabaseContent);
}

// Define a data atual nos campos de data
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        input.value = today;
    });
}

// Adiciona item ao inventário
function addInventoryItem() {
    const name = document.getElementById('itemName').value.trim();
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    const image = document.getElementById('itemImage').value.trim();
    
    if (!name || isNaN(quantity) || quantity < 0) {
        showError('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    const newId = Math.max(...(database.inventory || []).map(i => i.id), 0) + 1;
    const newItem = {
        id: newId,
        name: name,
        quantity: quantity
    };
    
    if (image) {
        newItem.image = image;
    }
    
    if (!database.inventory) {
        database.inventory = [];
    }
    
    database.inventory.push(newItem);
    saveToLocalStorage();
    
    // Limpa os campos
    document.getElementById('itemName').value = '';
    document.getElementById('itemQuantity').value = '';
    document.getElementById('itemImage').value = '';
    
    showSuccess(`Item "${name}" adicionado ao inventário com sucesso!`);
}

// Adiciona driver
function addDriver() {
    const name = document.getElementById('driverName').value.trim();
    const category = document.getElementById('driverCategory').value.trim();
    const link = document.getElementById('driverLink').value.trim();
    
    if (!name || !category || !link) {
        showError('Por favor, preencha todos os campos.');
        return;
    }
    
    const newId = Math.max(...(database.drivers || []).map(d => d.id), 0) + 1;
    const newDriver = {
        id: newId,
        name: name,
        category: category,
        link: link
    };
    
    if (!database.drivers) {
        database.drivers = [];
    }
    
    database.drivers.push(newDriver);
    saveToLocalStorage();
    
    // Limpa os campos
    document.getElementById('driverName').value = '';
    document.getElementById('driverCategory').value = '';
    document.getElementById('driverLink').value = '';
    
    showSuccess(`Driver "${name}" adicionado com sucesso!`);
}

// Adiciona código
function addCode() {
    const name = document.getElementById('codeName').value.trim();
    const category = document.getElementById('codeCategory').value.trim();
    const description = document.getElementById('codeDescription').value.trim();
    const content = document.getElementById('codeContent').value.trim();
    
    if (!name || !category || !content) {
        showError('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    const newId = Math.max(...(database.codes || []).map(c => c.id), 0) + 1;
    const newCode = {
        id: newId,
        name: name,
        category: category,
        content: content
    };
    
    if (description) {
        newCode.description = description;
    }
    
    if (!database.codes) {
        database.codes = [];
    }
    
    database.codes.push(newCode);
    saveToLocalStorage();
    
    // Limpa os campos
    document.getElementById('codeName').value = '';
    document.getElementById('codeCategory').value = '';
    document.getElementById('codeDescription').value = '';
    document.getElementById('codeContent').value = '';
    
    showSuccess(`Código "${name}" adicionado com sucesso!`);
}

// Adiciona arquivo
function addFile() {
    const name = document.getElementById('fileName').value.trim();
    const path = document.getElementById('filePath').value.trim();
    
    if (!name || !path) {
        showError('Por favor, preencha todos os campos.');
        return;
    }
    
    const newId = Math.max(...(database.files || []).map(f => f.id), 0) + 1;
    const newFile = {
        id: newId,
        name: name,
        path: path
    };
    
    if (!database.files) {
        database.files = [];
    }
    
    database.files.push(newFile);
    saveToLocalStorage();
    
    // Limpa os campos
    document.getElementById('fileName').value = '';
    document.getElementById('filePath').value = '';
    
    showSuccess(`Arquivo "${name}" adicionado com sucesso!`);
}

// Adiciona ordem de serviço
function addServiceOrder() {
    const type = document.getElementById('adminServiceType').value;
    const sector = document.getElementById('adminServiceSector').value;
    const date = document.getElementById('adminServiceDate').value;
    const technicians = document.getElementById('adminServiceTechnicians').value.trim();
    const receptionist = document.getElementById('adminServiceReceptionist').value.trim();
    const materials = document.getElementById('adminServiceMaterials').value.trim();
    const description = document.getElementById('adminServiceDescription').value.trim();
    const solution = document.getElementById('adminServiceSolution').value.trim();
    const observations = document.getElementById('adminServiceObservations').value.trim();
    
    if (!type || !sector || !date || !technicians || !receptionist || !description) {
        showError('Por favor, preencha todos os campos obrigatórios.');
        return;
    }
    
    const newId = Math.max(...(database.serviceOrders || []).map(s => s.id), 0) + 1;
    const newServiceOrder = {
        id: newId,
        type: type,
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
    
    if (!database.serviceOrders) {
        database.serviceOrders = [];
    }
    
    database.serviceOrders.push(newServiceOrder);
    saveToLocalStorage();
    
    // Limpa os campos
    document.getElementById('adminServiceType').value = '';
    document.getElementById('adminServiceSector').value = '';
    document.getElementById('adminServiceDate').value = '';
    document.getElementById('adminServiceTechnicians').value = '';
    document.getElementById('adminServiceReceptionist').value = '';
    document.getElementById('adminServiceMaterials').value = '';
    document.getElementById('adminServiceDescription').value = '';
    document.getElementById('adminServiceSolution').value = '';
    document.getElementById('adminServiceObservations').value = '';
    
    // Redefine a data atual
    setCurrentDate();
    
    showSuccess(`Ordem de serviço para ${sector} criada com sucesso!`);
}

// Adiciona senha
function addPassword() {
    const title = document.getElementById('adminPasswordTitle').value.trim();
    const category = document.getElementById('adminPasswordCategory').value;
    const username = document.getElementById('adminPasswordUsername').value.trim();
    const password = document.getElementById('adminPasswordPassword').value;
    const url = document.getElementById('adminPasswordUrl').value.trim();
    const notes = document.getElementById('adminPasswordNotes').value.trim();
    
    if (!title || !category || !password) {
        showError('Por favor, preencha os campos obrigatórios.');
        return;
    }
    
    const newId = Math.max(...(database.passwords || []).map(p => p.id), 0) + 1;
    const newPassword = {
        id: newId,
        title: title,
        category: category,
        username: username,
        password: password,
        url: url,
        notes: notes,
        timestamp: new Date().toISOString()
    };
    
    if (!database.passwords) {
        database.passwords = [];
    }
    
    database.passwords.push(newPassword);
    saveToLocalStorage();
    
    // Limpa os campos
    document.getElementById('adminPasswordTitle').value = '';
    document.getElementById('adminPasswordCategory').value = '';
    document.getElementById('adminPasswordUsername').value = '';
    document.getElementById('adminPasswordPassword').value = '';
    document.getElementById('adminPasswordUrl').value = '';
    document.getElementById('adminPasswordNotes').value = '';
    
    showSuccess(`Senha "${title}" adicionada com sucesso!`);
}

// Gera o banco de dados
function generateDatabase() {
    const outputArea = document.getElementById('outputDb');
    const dbContent = JSON.stringify(database, null, 2);
    outputArea.value = dbContent;
    showSuccess('Banco de dados gerado! Copie o conteúdo e salve no arquivo db.json.');
}

// Copia o conteúdo do banco de dados
function copyDatabaseContent() {
    const outputArea = document.getElementById('outputDb');
    if (outputArea.value) {
        outputArea.select();
        document.execCommand('copy');
        showSuccess('Conteúdo copiado para a área de transferência!');
    } else {
        showError('Primeiro gere o banco de dados!');
    }
}

// Mostra mensagem de sucesso
function showSuccess(message) {
    showNotification(message, 'success');
}

// Mostra mensagem de erro
function showError(message) {
    showNotification(message, 'error');
}

// Mostra notificação
function showNotification(message, type = 'success') {
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
        max-width: 300px;
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

