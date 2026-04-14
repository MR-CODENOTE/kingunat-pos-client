export const formatCurrency = (amount) => {
    return `₱${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export const calculateCartTotals = (cart, currentDiscount) => {
    const subtotal = cart.reduce((sum, i) => sum + (parseFloat(i.price) * i.qty), 0);
    let discountAmt = 0;
    if (currentDiscount.type === 'percent') {
        discountAmt = subtotal * (currentDiscount.value / 100);
    } else if (currentDiscount.type === 'fixed') {
        discountAmt = currentDiscount.value;
    }
    if (discountAmt > subtotal) discountAmt = subtotal; // Discount cannot exceed subtotal

    const total = subtotal - discountAmt;
    const vatable = total / 1.12; // Assuming 12% VAT is inclusive
    const vat = total - vatable;

    return { subtotal, discountAmt, total, vatable, vat };
};

export const printContent = (elementId, title) => {
    const content = document.getElementById(elementId).innerHTML;
    const win = window.open('', '', 'height=800,width=600');
    if (!win) return alert('Pop-up blocker is preventing printing.'); // Use native alert, toast won't be available
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:monospace;padding:20px;font-size:12px;} .text-center{text-align:center;} .flex{display:flex;justify-content:space-between;} table{width:100%;border-collapse:collapse;} th,td{text-align:left;padding:4px;border-bottom:1px solid #eee;} th{font-weight:bold;background-color:#f9f9f9;} .text-right{text-align:right;} .font-bold{font-weight:bold;} .text-lg{font-size:1.125rem;} .text-xl{font-size:1.25rem;} .text-xs{font-size:0.75rem;} .opacity-90{opacity:0.9;} .border-b{border-bottom:1px solid #ddd;} .border-dashed{border-style:dashed;} .mb-4{margin-bottom:1rem;} .pb-2{padding-bottom:0.5rem;} .pt-2{padding-top:0.5rem;} .space-y-1 > *:not(:first-child){margin-top:0.25rem;} </style></head><body><h2 class="text-center" style="margin-bottom:1rem;font-size:1.5rem;">KINGUNAT<br><span style="font-size:0.8em;opacity:0.8;">${title}</span></h2>${content}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 500);
};
