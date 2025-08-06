// Verifica o login no início de cada página protegida
if (sessionStorage.getItem('loggedIn') !== 'true') {
    window.location.href = 'index.html';
}

let database = {};

document.addEventListener('DOMContentLoaded', async () => {
    // Carrega o banco de dados inicial
    try {
        const response = await fetch('db.json');
        database = await response.json();
        // Salva no localStorage para backup
        localStorage.setItem('tiDatabase', JSON.stringify(database));
    } catch (error) {
        // Tenta carregar do localStorage se o arquivo não existir
        const savedData = localStorage.getItem('tiDatabase');
        if (savedData) {
            database = JSON.parse(savedData);
        } else {
            alert('Erro ao carregar db.json. Crie novos itens e gere um novo arquivo.');
            // Inicia um banco de dados vazio se não encontrar
            database = { inventory: [], drivers: [], codes: [], files: [] };
        }
    }

    // Event Listeners para os botões de adicionar
    document.getElementById('addInventoryBtn').addEventListener('click', addInventoryItem);
    document.getElementById('addDriverBtn').addEventListener('click', addDriver);
    document.getElementById('addCodeBtn').addEventListener('click', addCode);
    document.getElementById('addFileBtn').addEventListener('click', addFile);
});

async function addInventoryItem() {
    const name = document.getElementById('itemName').value;
    const quantity = parseInt(document.getElementById('itemQuantity').value);
    const image = document.getElementById('itemImage').value;

    if (!name || !quantity || !image) {
        alert('Por favor, preencha todos os campos do item de inventário.');
        return;
    }

    const newItem = {
        id: Date.now(), // ID único baseado no tempo
        name,
        quantity,
        image
    };

    database.inventory.push(newItem);
    
    // Salva automaticamente no localStorage
    try {
        localStorage.setItem('tiDatabase', JSON.stringify(database));
        alert(`Item "${name}" adicionado com sucesso! Agora aparecerá no dashboard.`);
        clearForm(['itemName', 'itemQuantity', 'itemImage']);
    } catch (error) {
        alert('Erro ao salvar o item. Tente novamente.');
        console.error('Erro ao salvar:', error);
    }
}

async function addDriver() {
    const name = document.getElementById('driverName').value;
    const category = document.getElementById('driverCategory').value;
    const link = document.getElementById('driverLink').value;

    if (!name || !category || !link) {
        alert('Por favor, preencha todos os campos do driver.');
        return;
    }

    const newDriver = {
        id: Date.now(),
        name,
        category,
        link
    };

    database.drivers.push(newDriver);
    
    // Salva automaticamente no localStorage
    try {
        localStorage.setItem('tiDatabase', JSON.stringify(database));
        alert(`Driver "${name}" adicionado com sucesso! Agora aparecerá no dashboard.`);
        clearForm(['driverName', 'driverCategory', 'driverLink']);
    } catch (error) {
        alert('Erro ao salvar o driver. Tente novamente.');
        console.error('Erro ao salvar:', error);
    }
}

async function addCode() {
    const name = document.getElementById('codeName').value;
    const category = document.getElementById('codeCategory').value;
    const description = document.getElementById('codeDescription').value;
    const content = document.getElementById('codeContent').value;

    if (!name || !category || !content) {
        alert('Por favor, preencha todos os campos obrigatórios do código (nome, categoria e conteúdo).');
        return;
    }

    const newCode = {
        id: Date.now(),
        name,
        category,
        description,
        content
    };

    database.codes.push(newCode);
    
    // Salva automaticamente no localStorage
    try {
        localStorage.setItem('tiDatabase', JSON.stringify(database));
        alert(`Código "${name}" adicionado com sucesso! Agora aparecerá no dashboard.`);
        clearForm(['codeName', 'codeCategory', 'codeDescription', 'codeContent']);
    } catch (error) {
        alert('Erro ao salvar o código. Tente novamente.');
        console.error('Erro ao salvar:', error);
    }
}

async function addFile() {
    const name = document.getElementById('fileName').value;
    const path = document.getElementById('filePath').value;

    if (!name || !path) {
        alert('Por favor, preencha todos os campos do arquivo.');
        return;
    }

    const newFile = {
        id: Date.now(),
        name,
        path
    };

    database.files.push(newFile);
    
    // Salva automaticamente no localStorage
    try {
        localStorage.setItem('tiDatabase', JSON.stringify(database));
        alert(`Arquivo "${name}" adicionado com sucesso! Agora aparecerá no dashboard.`);
        clearForm(['fileName', 'filePath']);
    } catch (error) {
        alert('Erro ao salvar o arquivo. Tente novamente.');
        console.error('Erro ao salvar:', error);
    }
}



function clearForm(fieldIds) {
    fieldIds.forEach(id => document.getElementById(id).value = '');
}

