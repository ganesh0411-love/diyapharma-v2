/* ============================================
   DIYA PHARMA — Quotation System Logic
   ============================================ */

// Store product id -> quantity mapping
let selectedProducts = {};

function openQuoteModal() {
    // Require login first
    if (!DiyaPharma.user) {
        alert('Please login first to generate a quotation.');
        window.location.href = 'login.html';
        return;
    }
    document.getElementById('quoteModal').classList.add('active');
    renderQuoteProductList(ProductData);
    document.body.style.overflow = 'hidden';
}

function closeQuoteModal() {
    document.getElementById('quoteModal').classList.remove('active');
    document.body.style.overflow = '';
    backToSelection();
}

function renderQuoteProductList(products) {
    const list = document.getElementById('quoteProductList');
    list.innerHTML = products.map(p => {
        const isSelected = selectedProducts[p.id] !== undefined;
        const qty = selectedProducts[p.id] || 1;
        return `
        <div class="quote-product-item ${isSelected ? 'selected' : ''}" id="qp_${p.id}">
            <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="handleCheckboxChange(${p.id}, this)">
            <div class="quote-product-info" onclick="handleCardClick(${p.id})">
                <h4>${p.name}</h4>
                <p>${p.composition}</p>
                <p style="color:var(--primary-600)">₹${p.mrp.toFixed(2)} | ${p.packType}</p>
            </div>
            <div class="quote-qty-controls" style="display:${isSelected ? 'flex' : 'none'}">
                <button type="button" onclick="event.stopPropagation(); changeQty(${p.id}, -1)" class="qty-btn">−</button>
                <span class="qty-display" id="qty_${p.id}">${qty}</span>
                <button type="button" onclick="event.stopPropagation(); changeQty(${p.id}, 1)" class="qty-btn">+</button>
            </div>
        </div>
        `;
    }).join('');
}

function handleCardClick(id) {
    const item = document.getElementById('qp_' + id);
    const checkbox = item.querySelector('input[type="checkbox"]');
    checkbox.checked = !checkbox.checked;
    handleCheckboxChange(id, checkbox);
}

function handleCheckboxChange(id, checkbox) {
    const item = document.getElementById('qp_' + id);
    const qtyControls = item.querySelector('.quote-qty-controls');
    if (checkbox.checked) {
        selectedProducts[id] = 1;
        item.classList.add('selected');
        qtyControls.style.display = 'flex';
    } else {
        delete selectedProducts[id];
        item.classList.remove('selected');
        qtyControls.style.display = 'none';
    }
    updateSelectionUI();
}

function changeQty(id, delta) {
    if (selectedProducts[id] === undefined) return;
    let newQty = (selectedProducts[id] || 1) + delta;
    if (newQty < 1) newQty = 1;
    if (newQty > 999) newQty = 999;
    selectedProducts[id] = newQty;
    const display = document.getElementById('qty_' + id);
    if (display) display.textContent = newQty;
}

function filterQuoteProducts(query) {
    const q = query.toLowerCase();
    const filtered = ProductData.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.composition.toLowerCase().includes(q) ||
        p.division.toLowerCase().includes(q)
    );
    renderQuoteProductList(filtered);
}

function selectAllProducts() {
    ProductData.forEach(p => {
        if (selectedProducts[p.id] === undefined) {
            selectedProducts[p.id] = 1;
        }
    });
    renderQuoteProductList(ProductData);
    document.getElementById('quoteSearch').value = '';
    updateSelectionUI();
}

function clearAllProducts() {
    selectedProducts = {};
    renderQuoteProductList(ProductData);
    document.getElementById('quoteSearch').value = '';
    updateSelectionUI();
}

function updateSelectionUI() {
    const count = Object.keys(selectedProducts).length;
    document.getElementById('selectedCount').textContent = `${count} product${count !== 1 ? 's' : ''} selected`;
    document.getElementById('btnGenerateQuote').disabled = count === 0;
}

function generateQuotation() {
    const user = DiyaPharma.user;

    // Populate User Details
    const userDetails = document.getElementById('invoiceUserDetails');
    userDetails.innerHTML = `
        <h4>Quotation For</h4>
        <p><strong>${user.name || user.email || 'Valued Customer'}</strong></p>
        <p>${user.email || ''}</p>
        <p>${user.phone || ''}</p>
        <p style="font-size:11px;color:var(--neutral-400);margin-top:8px">Date: ${new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'})}</p>
    `;

    // Populate Table
    const tableBody = document.getElementById('invoiceTableBody');
    const selectedIds = Object.keys(selectedProducts).map(Number);
    const selectedItems = ProductData.filter(p => selectedIds.includes(p.id));

    let subtotal = 0;

    tableBody.innerHTML = selectedItems.map(p => {
        const qty = selectedProducts[p.id] || 1;
        const lineTotal = p.mrp * qty;
        subtotal += lineTotal;
        return `
            <tr>
                <td style="font-weight:600">${p.name}</td>
                <td style="font-size:12px;color:var(--neutral-600)">${p.composition}</td>
                <td>${p.packType}</td>
                <td style="text-align:center">${qty}</td>
                <td style="text-align:right">₹${p.mrp.toFixed(2)}</td>
                <td style="text-align:right;font-weight:600">₹${lineTotal.toFixed(2)}</td>
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

function viewAndDownloadPDF() {
    // First open in new tab for viewing, then download
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const user = DiyaPharma.user;
    const selectedIds = Object.keys(selectedProducts).map(Number);
    const selectedItems = ProductData.filter(p => selectedIds.includes(p.id));

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 31, 91);
    doc.text("DIYA PHARMA", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Quality Healthcare Solutions", 14, 26);
    doc.text("Quotation Date: " + new Date().toLocaleDateString('en-IN', {day:'2-digit', month:'short', year:'numeric'}), 14, 32);

    // Quotation number
    doc.setFontSize(10);
    doc.setTextColor(0, 31, 91);
    doc.text("Quotation #: DPQ-" + Date.now().toString().slice(-6), 140, 20);

    // Customer Details
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Quotation For:", 14, 45);
    doc.setFontSize(10);
    doc.text("Name: " + (user ? (user.name || user.email) : "N/A"), 14, 52);
    doc.text("Email: " + (user ? user.email : "N/A"), 14, 58);
    doc.text("Phone: " + (user ? (user.phone || "N/A") : "N/A"), 14, 64);

    // Table with Quantity column
    const tableData = selectedItems.map(p => {
        const qty = selectedProducts[p.id] || 1;
        return [
            p.name,
            p.composition.length > 40 ? p.composition.substring(0, 40) + '...' : p.composition,
            p.packType,
            qty.toString(),
            "Rs. " + p.mrp.toFixed(2),
            "Rs. " + (p.mrp * qty).toFixed(2)
        ];
    });

    doc.autoTable({
        startY: 75,
        head: [['Product', 'Composition', 'Pack', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 31, 91], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 50 },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        }
    });

    // Totals
    const finalY = doc.lastAutoTable.finalY + 10;
    let subtotal = 0;
    selectedItems.forEach(p => { subtotal += p.mrp * (selectedProducts[p.id] || 1); });
    const tax = subtotal * 0.12;
    const total = subtotal + tax;

    doc.setFontSize(10);
    doc.text(`Subtotal: Rs. ${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`GST (12%): Rs. ${tax.toFixed(2)}`, 140, finalY + 7);
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 31, 91);
    doc.text(`Grand Total: Rs. ${total.toFixed(2)}`, 140, finalY + 16);

    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(150);
    doc.text("This is a computer-generated quotation for estimation purposes only. Prices are subject to change.", 14, doc.internal.pageSize.height - 15);
    doc.text("Contact: +91 82200 96233 | groupseverest@gmail.com", 14, doc.internal.pageSize.height - 10);

    // Open in new window for viewing first
    var pdfBlob = doc.output('blob');
    var blobURL = URL.createObjectURL(pdfBlob);
    window.open(blobURL, '_blank');

    // Also trigger download
    doc.save(`Quotation_DiyaPharma_${new Date().toISOString().slice(0,10)}.pdf`);

    if (typeof showToast === 'function') {
        showToast('Quotation opened for viewing & downloaded!', 'success');
    }
}
