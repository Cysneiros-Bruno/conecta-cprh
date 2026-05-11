// Arquivo: services/apiService.js

// ÚNICO LUGAR DO SISTEMA ONDE O IP FICA ARMAZENADO
const BASE_URL = 'http://10.0.1.70:3000/api';

/**
 * Motor para requisições PÚBLICAS (Sem JWT)
 * Ex: Login LDAP, Carregar setores para usuários
 */
export async function fetchPublico(endpoint, options = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    return await response.json(); // Já converte para JSON automaticamente!
}

/**
 * Motor VIP para requisições PROTEGIDAS (Com JWT)
 * Ex: Tudo que acontece dentro do Backoffice Admin
 */
export async function fetchAutenticado(endpoint, options = {}) {
    const token = sessionStorage.getItem('cprh_token');
    
    const headers = {
        ...options.headers,
        'Authorization': token ? `Bearer ${token}` : ''
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    
    // Tratamento global de erro de sessão
    if (response.status === 401 || response.status === 403) {
        if (window.Swal) window.Swal.fire('Sessão Expirada', 'Sua sessão foi encerrada. Faça login novamente.', 'warning');
        if (window.sairPainelAdmin) window.sairPainelAdmin();
        throw new Error('Sessão JWT expirada ou inválida');
    }
    
    return await response.json(); // Já converte para JSON!
}