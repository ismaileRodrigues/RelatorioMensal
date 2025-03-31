// Declaração global de variáveis (assumindo que estão no escopo global)
const formulario = document.getElementById('meuFormulario');
const modal = document.getElementById('modal');
const { jsPDF } = window.jspdf; // Certifique-se de que o jsPDF está carregado via CDN
let imagensParaPDF = []; // Array global para armazenar as imagens

// Evento de envio do formulário
formulario.addEventListener('submit', function(e) {
    e.preventDefault();

    const data = document.getElementById('data').value;
    const responsavel = document.getElementById('responsavel').value;
    const igreja = document.getElementById('igreja').value;
    const arquivos = document.getElementById('arquivo').files;
    const descricao = document.getElementById('descricao').value;

    document.getElementById('modalData').textContent = formatarData(data);
    document.getElementById('modalResponsavel').textContent = responsavel;
    document.getElementById('modalIgreja').textContent = igreja;
    document.getElementById('modalDescricao').textContent = descricao;

    let nomesArquivos = 'Nenhuma imagem';
    imagensParaPDF = [];

    if (arquivos.length > 0) {
        nomesArquivos = Array.from(arquivos).map(file => file.name).join(', ');
        processarImagens(arquivos);
    } else {
        modal.style.display = 'block'; // Mostra o modal imediatamente se não houver imagens
    }

    document.getElementById('modalArquivo').textContent = nomesArquivos;
});

// Função para formatar a data
function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Função para processar imagens
function processarImagens(arquivos) {
    const promises = Array.from(arquivos).map(file => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                resolve(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    });

    Promise.all(promises).then(imagens => {
        imagensParaPDF = imagens;
        modal.style.display = 'block'; // Mostra o modal após carregar as imagens
    }).catch(err => {
        console.error('Erro ao processar imagens:', err);
        modal.style.display = 'block'; // Mostra o modal mesmo em caso de erro
    });
}

// Função para fechar o modal
function fecharModal() {
    modal.style.display = 'none';
    formulario.reset();
    imagensParaPDF = [];
}

// Função para gerar o PDF
function gerarPDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10;

    // Cabeçalho
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO MENSAL", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 5;
    doc.setLineWidth(0.5);
    doc.line(10, yPosition, pageWidth - 10, yPosition); // Linha horizontal
    yPosition += 10;

    // Dados principais
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("INFORMAÇÕES GERAIS", 10, yPosition);
    yPosition += 5;
    doc.setLineWidth(0.2);
    doc.line(10, yPosition, pageWidth - 10, yPosition); // Linha divisória
    yPosition += 5;

    // Verificação de elementos DOM para evitar erros
    const modalData = document.getElementById('modalData')?.textContent || 'N/A';
    const modalResponsavel = document.getElementById('modalResponsavel')?.textContent || 'N/A';
    const modalIgreja = document.getElementById('modalIgreja')?.textContent || 'N/A';

    doc.text(`Data: ${modalData}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Responsável: ${modalResponsavel}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Igreja: ${modalIgreja}`, 15, yPosition);
    yPosition += 10;

    // Descrição
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIÇÃO", 10, yPosition);
    yPosition += 5;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 5;
    doc.setFont("helvetica", "normal");
    const descricao = document.getElementById('modalDescricao')?.textContent || 'Sem descrição';
    const linhasDescricao = doc.splitTextToSize(descricao, pageWidth - 30);
    doc.text(linhasDescricao, 15, yPosition);
    yPosition += (linhasDescricao.length * 7) + 10; // Aumentei o espaçamento para legibilidade

    // Imagens em grid
    if (imagensParaPDF.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text("IMAGENS ANEXADAS", 10, yPosition);
        yPosition += 5;
        doc.line(10, yPosition, pageWidth - 10, yPosition);
        yPosition += 10;

        const maxWidth = 80;
        const colunas = 2;
        const margem = 10;
        let imagensCarregadas = 0;
        let xPosition = margem;

        imagensParaPDF.forEach((imagemData, index) => {
            const img = new Image();
            img.src = imagemData;

            img.onload = function() {
                const imgWidth = img.width;
                const imgHeight = img.height;
                const ratio = maxWidth / imgWidth;
                const pdfHeight = imgHeight * ratio;

                if (yPosition + pdfHeight > pageHeight - 20) {
                    doc.addPage();
                    yPosition = 10;
                    xPosition = margem;
                }

                try {
                    doc.addImage(imagemData, 'JPEG', xPosition, yPosition, maxWidth, pdfHeight);
                    xPosition += maxWidth + margem;

                    if ((index + 1) % colunas === 0) {
                        yPosition += pdfHeight + margem;
                        xPosition = margem;
                    }
                } catch (error) {
                    console.error('Erro ao adicionar imagem:', error);
                }

                imagensCarregadas++;
                if (imagensCarregadas === imagensParaPDF.length) {
                    finalizarPDF(doc);
                }
            };

            img.onerror = function() {
                console.error('Erro ao carregar imagem:', index);
                imagensCarregadas++;
                if (imagensCarregadas === imagensParaPDF.length) {
                    finalizarPDF(doc);
                }
            };
        });
    } else {
        finalizarPDF(doc); // Finaliza imediatamente se não houver imagens
    }
}

// Função para finalizar o PDF
function finalizarPDF(doc) {
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 10, pageHeight - 10);

    // Gera o PDF como Blob e cria uma URL para visualização
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Abre o PDF em uma nova janela para visualização
    const novaJanela = window.open(pdfUrl, '_blank');
    if (novaJanela) {
        novaJanela.focus();
    } else {
        alert('Por favor, permita pop-ups para visualizar o PDF.');
    }

    // Prompt para baixar manualmente
    if (confirm('Deseja baixar o PDF agora?')) {
        doc.save('relatorio_mensal.pdf'); // Nome mais descritivo
    }

    // Libera a URL após o uso
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 10000);
}

// Fechar o modal ao clicar fora
window.onclick = function(event) {
    if (event.target === modal) {
        fecharModal();
    }
};
