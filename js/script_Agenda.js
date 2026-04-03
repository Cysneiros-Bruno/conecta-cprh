// Aguarda o conteúdo da página ser totalmente carregado antes de executar o script
document.addEventListener('DOMContentLoaded', function() {

    // Seleciona todas as caixas de pesquisa pela sua classe
    const searchInputs = document.querySelectorAll('.search-input');
    
    // Seleciona o corpo da tabela onde os dados estão
    const tableBody = document.querySelector('#listaTelefonica tbody');
    
    // Seleciona todas as linhas de dados da tabela
    const tableRows = tableBody.querySelectorAll('tr');

    // Função que será chamada sempre que o usuário digitar em uma caixa de busca
    function filterTable() {
        // Pega os valores de todas as caixas de busca e converte para minúsculo
        const filterValues = Array.from(searchInputs).map(input => input.value.toLowerCase());

        // Itera sobre cada linha da tabela
        tableRows.forEach(row => {
            let isVisible = true; // Assume que a linha deve ser visível por padrão
            
            // Seleciona todas as células (<td>) da linha atual
            const cells = row.querySelectorAll('td');

            // Compara o valor de cada caixa de busca com a célula da coluna correspondente
            filterValues.forEach((filter, index) => {
                const cellValue = cells[index].textContent.toLowerCase();
                
                // Se o valor da célula não incluir o texto do filtro, a linha não deve ser visível
                if (!cellValue.includes(filter)) {
                    isVisible = false;
                }
            });

            // Mostra ou esconde a linha com base no resultado dos filtros
            row.style.display = isVisible ? '' : 'none';
        });
    }

    // Adiciona um "escutador de eventos" para cada caixa de pesquisa.
    // O evento 'keyup' dispara a função filterTable a cada tecla pressionada.
    searchInputs.forEach(input => {
        input.addEventListener('keyup', filterTable);
    });
    

    /* --- LÓGICA PARA O BOTÃO 'VOLTAR AO TOPO' --- */
    const btnTopo = document.getElementById('btnTopo');

    // VERIFIQUE SE O BOTÃO FOI ENCONTRADO
    if (btnTopo) { // Adicionando uma verificação extra
        function toggleBotaoTopo() {
            if (window.scrollY > 200) {
                btnTopo.classList.add('mostrar');
            } else {
                btnTopo.classList.remove('mostrar');
            }
        }

        function scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }

        window.addEventListener('scroll', toggleBotaoTopo);
        btnTopo.addEventListener('click', scrollToTop);
    }
    
});
