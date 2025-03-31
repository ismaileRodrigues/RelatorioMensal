const formulario = document.getElementById('meuFormulario');
const modal = document.getElementById('modal');
const { jsPDF } = window.jspdf;
let imagensParaPDF = [];

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
        modal.style.display = 'block';
    }

    document.getElementById('modalArquivo').textContent = nomesArquivos;
});

function formatarData(data) {
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

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
        modal.style.display = 'block';
    });
}

function fecharModal() {
    modal.style.display = 'none';
    formulario.reset();
    imagensParaPDF = [];
}

function gerarPDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 10;

    // Cabeçalho
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("  RELATORIO MENSAL", pageWidth / 2, yPosition, { align: "center" });
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

    doc.text(`Data: ${document.getElementById('modalData').textContent}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Responsável: ${document.getElementById('modalResponsavel').textContent}`, 15, yPosition);
    yPosition += 7;
    doc.text(`Igreja: ${document.getElementById('modalIgreja').textContent}`, 15, yPosition);
    yPosition += 7;
    // doc.text(`Arquivos: ${document.getElementById('modalArquivo').textContent}`, 15, yPosition);
    // yPosition += 10;

    // Descrição
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIÇÃO", 10, yPosition);
    yPosition += 5;
    doc.line(10, yPosition, pageWidth - 10, yPosition);
    yPosition += 5;
    doc.setFont("helvetica", "normal");
    const descricao = document.getElementById('modalDescricao').textContent;
    const linhasDescricao = doc.splitTextToSize(descricao, pageWidth - 30);
    doc.text(linhasDescricao, 15, yPosition);
    yPosition += (linhasDescricao.length * 5) + 10;

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

                doc.addImage(imagemData, 'JPEG', xPosition, yPosition, maxWidth, pdfHeight);
                xPosition += maxWidth + margem;

                if ((index + 1) % colunas === 0) {
                    yPosition += pdfHeight + margem;
                    xPosition = margem;
                }

                imagensCarregadas++;
                if (imagensCarregadas === imagensParaPDF.length) {
                    // Rodapé
                    doc.setFontSize(8);
                    doc.setFont("helvetica", "normal");
                    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 10, pageHeight - 10);
                    doc.save('nota_fiscal_registro.pdf');
                }
            };

            img.onerror = function() {
                imagensCarregadas++;
                if (imagensCarregadas === imagensParaPDF.length) {
                    doc.setFontSize(8);
                    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 10, pageHeight - 10);
                    doc.save('nota_fiscal_registro.pdf');
                }
            };
        });
    } else {
        // Rodapé sem imagens
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 10, pageHeight - 10);
        doc.save('nota_fiscal_registro.pdf');
    }
}

window.onclick = function(event) {
    if (event.target == modal) {
        fecharModal();
    }
}