/* ============================================
   DIYA PHARMA — Quotation System Logic
   ============================================ */

let selectedProducts = new Set();

function openQuoteModal() {
    document.getElementById('quoteModal').classList.add('active');
    renderQuoteProductList(ProductData);
    document.body.style.overflow = 'hidden'; // Prevent scroll
}

function closeQuoteModal() {
    document.getElementById('quoteModal').classList.remove('active');
    document.body.style.overflow = '';
    backToSelection();
}

function renderQuoteProductList(products) {
    const list = document.getElementById('quoteProductList');
    list.innerHTML = products.map(p => `
        <div class="quote-product-item ${selectedProducts.has(p.id) ? 'selected' : ''}" onclick="toggleProductSelection(${p.id}, this, event)">
            <input type="checkbox" ${selectedProducts.has(p.id) ? 'checked' : ''} onchange="handleCheckboxChange(${p.id}, this)">
            <div class="quote-product-info">
                <h4>${p.name}</h4>
                <p>${p.composition}</p>
                <p style="color:var(--primary-600)">Packing: ${p.packType}</p>
            </div>
        </div>
    `).join('');
}

function filterQuoteProducts(query) {
    const q = query.toLowerCase();
    const filtered = ProductData.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.composition.toLowerCase().includes(q)
    );
    renderQuoteProductList(filtered);
}

function handleCheckboxChange(id, checkbox) {
    const item = checkbox.closest('.quote-product-item');
    if (checkbox.checked) {
        selectedProducts.add(id);
        item.classList.add('selected');
    } else {
        selectedProducts.delete(id);
        item.classList.remove('selected');
    }
    updateSelectionUI();
}

function toggleProductSelection(id, element, event) {
    const checkbox = element.querySelector('input[type="checkbox"]');
    // If we didn't click the checkbox itself, toggle it
    if (event.target !== checkbox) {
        checkbox.checked = !checkbox.checked;
        handleCheckboxChange(id, checkbox);
    }
}

function updateSelectionUI() {
    const count = selectedProducts.size;
    document.getElementById('selectedCount').textContent = `${count} products selected`;
    document.getElementById('btnGenerateQuote').disabled = count === 0;
}

function generateQuotation() {
    const user = DiyaPharma.user;
    if (!user) {
        showToast('Please login to generate a personalized quotation', 'info');
        // We still allow them to see it, but we prompt for better experience
    }

    // Populate User Details
    const userDetails = document.getElementById('invoiceUserDetails');
    if (user) {
        userDetails.innerHTML = `
            <h4>Customer Details</h4>
            <p><strong>Name:</strong> ${user.name || 'Valued Customer'}</p>
            <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
            <p><strong>Phone:</strong> ${user.phone || 'N/A'}</p>
        `;
    } else {
        userDetails.innerHTML = `
            <h4>Customer Details</h4>
            <p><strong>Status:</strong> Guest User</p>
            <p><a href="login.html" style="color:var(--primary-600)">Login</a> for full details</p>
        `;
    }

    // Populate Table
    const tableBody = document.getElementById('invoiceTableBody');
    const selectedItems = ProductData.filter(p => selectedProducts.has(p.id));
    
    let subtotal = 0;
    
    tableBody.innerHTML = selectedItems.map(p => {
        subtotal += p.mrp;
        return `
            <tr>
                <td style="font-weight:600">${p.name}</td>
                <td style="font-size:12px;color:var(--neutral-600)">${p.composition}</td>
                <td>${p.packType}</td>
                <td style="text-align:right">₹${p.mrp.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    const tax = subtotal * 0.12;
    const grandTotal = subtotal + tax;

    document.getElementById('quoteSubtotal').textContent = `₹${subtotal.toFixed(2)}`;
    document.getElementById('quoteTax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('quoteGrandTotal').textContent = `₹${grandTotal.toFixed(2)}`;

    // Switch Views
    document.getElementById('quoteSelectionView').classList.add('hidden');
    document.getElementById('selectionActions').classList.add('hidden');
    document.getElementById('quoteInvoiceView').classList.remove('hidden');
    document.getElementById('invoiceActions').classList.remove('hidden');
}

function backToSelection() {
    document.getElementById('quoteSelectionView').classList.remove('hidden');
    document.getElementById('selectionActions').classList.remove('hidden');
    document.getElementById('quoteInvoiceView').classList.add('hidden');
    document.getElementById('invoiceActions').classList.add('hidden');
}

async function downloadQuotationPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const user = DiyaPharma.user;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 31, 91); // Primary 900
    doc.text("DIYA PHARMA", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Quality Healthcare Solutions", 14, 26);
    doc.text("Quotation Date: " + new Date().toLocaleDateString(), 14, 32);

    // Customer Details
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Customer Information:", 14, 45);
    doc.setFontSize(10);
    doc.text("Name: " + (user ? user.name : "Guest User"), 14, 52);
    doc.text("Email: " + (user ? user.email : "N/A"), 14, 58);
    doc.text("Phone: " + (user ? user.phone : "N/A"), 14, 64);

    // Table
    const selectedItems = ProductData.filter(p => selectedProducts.has(p.id));
    const tableData = selectedItems.map(p => [
        p.name,
        p.composition,
        p.packType,
        "Rs. " + p.mrp.toFixed(2)
    ]);

    doc.autoTable({
        startY: 75,
        head: [['Product Name', 'Composition', 'Packing', 'MRP (Incl. Tax)']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 31, 91] }
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    const subtotal = selectedItems.reduce((s, p) => s + p.mrp, 0);
    const tax = subtotal * 0.12;
    const total = subtotal + tax;

    doc.setFontSize(10);
    doc.text(`Subtotal: Rs. ${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`GST (12%): Rs. ${tax.toFixed(2)}`, 140, finalY + 7);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Grand Total: Rs. ${total.toFixed(2)}`, 140, finalY + 15);

    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(150);
    doc.text("This is a computer generated quotation for estimation purposes only.", 14, doc.internal.pageSize.height - 10);

    doc.save(`Quotation_DiyaPharma_${Date.now()}.pdf`);
    showToast('Quotation downloaded successfully!', 'success');
}
