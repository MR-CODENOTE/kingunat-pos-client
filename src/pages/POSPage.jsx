import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Edit2, Tag, UserCheck, Plus, X, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../api/api';
import { calculateCartTotals, formatCurrency, printContent } from '../utils/helpers';

const POSPage = () => {
  const { setCurrentRoute } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [discountPresets, setDiscountPresets] = useState([]);
  const [currentDiscount, setCurrentDiscount] = useState({ type: 'none', value: 0, label: 'None' });
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.showToast('Failed to fetch products.', 'error');
      console.error('Error fetching products:', error);
    }
  }, [toast]);

  const fetchDiscountPresets = useCallback(async () => {
    try {
      const response = await api.get('/settings/discounts');
      setDiscountPresets(response.data);
    } catch (error) {
      toast.showToast('Failed to fetch discount presets.', 'error');
      console.error('Error fetching discount presets:', error);
    }
  }, [toast]);

  useEffect(() => {
    setCurrentRoute('Point of Sale');
    fetchProducts();
    fetchDiscountPresets();
  }, [setCurrentRoute, fetchProducts, fetchDiscountPresets]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) {
      return toast.showToast('Out of stock!', 'error');
    }

    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
      if (existingItem.qty + 1 > product.stock) {
        return toast.showToast('Maximum stock reached for this item.', 'error');
      }
      setCart(prevCart => prevCart.map(item =>
        item.id === productId ? { ...item, qty: item.qty + 1 } : item
      ));
    } else {
      setCart(prevCart => [...prevCart, { ...product, qty: 1 }]);
    }
  };

  const updateCartQuantity = (productId, delta) => {
    const product = products.find(p => p.id === productId);
    const item = cart.find(i => i.id === productId);
    if (!item || !product) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
      removeFromCart(productId);
    } else if (newQty > product.stock) {
      toast.showToast('Maximum stock reached.', 'error');
    } else {
      setCart(prevCart => prevCart.map(i =>
        i.id === productId ? { ...i, qty: newQty } : i
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const { subtotal, discountAmt, total, vatable, vat } = calculateCartTotals(cart, currentDiscount);

  // Discount Modal Handlers
  const openDiscountModal = () => setIsDiscountModalOpen(true);
  const closeDiscountModal = () => setIsDiscountModalOpen(false);

  const setDiscount = (type, value, label) => {
    setCurrentDiscount({ type, value, label });
    closeDiscountModal();
    if (type !== 'none') toast.showToast(`${label} applied.`, 'success');
  };

  const applyCustomDiscount = () => {
    const customType = document.getElementById('custom-discount-type').value;
    const customValue = parseFloat(document.getElementById('custom-discount-val').value);
    if (isNaN(customValue) || customValue <= 0) {
      return toast.showToast('Enter a valid amount for custom discount.', 'error');
    }
    if (customType === 'percent' && customValue > 100) {
      return toast.showToast('Percentage discount cannot exceed 100%.', 'error');
    }
    setDiscount(customType, customValue, `${customType === 'percent' ? customValue + '%' : formatCurrency(customValue)} Custom`);
  };

  // Payment Modal Handlers
  const openPaymentModal = () => {
    if (total <= 0 && subtotal <= 0) return toast.showToast('Cart is empty or total is zero.', 'error');
    setPaymentMethod('Cash');
    setAmountTendered('');
    setChangeAmount(0);
    setIsPaymentModalOpen(true);
  };
  const closePaymentModal = () => setIsPaymentModalOpen(false);

  const selectPaymentMethod = (method) => {
    setPaymentMethod(method);
    if (method !== 'Cash') {
      setAmountTendered(total.toFixed(2));
    } else {
      setAmountTendered('');
    }
  };

  const handleAmountTenderedChange = (e) => {
    const value = e.target.value;
    setAmountTendered(value);
  };

  useEffect(() => {
    const tendered = parseFloat(amountTendered) || 0;
    const calculatedChange = tendered - total;
    setChangeAmount(calculatedChange);
  }, [amountTendered, total]);

  const setTenderedAmount = (amount) => {
    setAmountTendered(amount.toString());
  };

  const matchExactAmount = () => {
    setTenderedAmount(total.toFixed(2));
  };

  const processTransaction = () => {
    confirm.showConfirm('Complete Sale', 'Are you sure you want to finalize this transaction? Stock will be permanently deducted.', async () => {
      try {
        const saleItems = cart.map(item => ({
          id: item.id,
          qty: item.qty,
        }));

        const salePayload = {
          items: saleItems,
          subtotal: subtotal,
          discountLabel: currentDiscount.label,
          discountAmt: discountAmt,
          vatable: vatable,
          vat: vat,
          total: total,
          paymentMethod: paymentMethod,
          amountTendered: parseFloat(amountTendered) || total,
          change: changeAmount,
        };

        const response = await api.post('/sales', salePayload);
        const newSale = response.data;

        // Prepare receipt data
        setReceiptData({
          id: newSale.id,
          date: newSale.sale_date,
          items: cart.map(item => ({ name: item.name, qty: item.qty, price: parseFloat(item.price) })),
          subtotal: parseFloat(newSale.subtotal),
          discountLabel: newSale.discount_label,
          discountAmt: parseFloat(newSale.discount_amount),
          vat: parseFloat(newSale.vat_amount),
          total: parseFloat(newSale.total_amount),
          cashier: newSale.cashier || 'Online System',
          paymentMethod: newSale.payment_method,
          amountTendered: parseFloat(newSale.amount_tendered),
          change: parseFloat(newSale.change_amount),
        });

        setCart([]);
        setCurrentDiscount({ type: 'none', value: 0, label: 'None' });
        fetchProducts(); // Refresh product stock
        closePaymentModal();
        setIsReceiptModalOpen(true);
        toast.showToast('Transaction Completed!', 'success');
      } catch (error) {
        toast.showToast(error.response?.data?.message || 'Failed to complete transaction.', 'error');
        console.error('Transaction error:', error);
      }
    });
  };

  // Receipt Modal Handlers
  const closeReceiptModal = () => setIsReceiptModalOpen(false);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] md:h-full pb-16 lg:pb-0">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <div className="mb-4 relative flex-shrink-0">
            <ShoppingCart className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
            <input
              type="text"
              id="pos-search"
              onKeyUp={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-12 pr-4 py-3 rounded-xl border-0 shadow-sm focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
          <div id="pos-grid" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-20 lg:pb-4 pr-2">
            {filteredProducts.map(p => (
              <div
                key={p.id}
                onClick={() => addToCart(p.id)}
                className={`bg-white p-4 rounded-xl shadow-sm border border-transparent hover:border-japan-red cursor-pointer transition-all flex flex-col items-center relative overflow-hidden h-44
                  ${p.stock === 0 ? 'opacity-70 grayscale cursor-not-allowed' : ''}`}
              >
                <div className="text-3xl mb-2 mt-1 drop-shadow-sm">{p.image}</div>
                <div className="mt-auto w-full">
                  <h4 className="font-bold text-sm text-center line-clamp-2 h-9">{p.name}</h4>
                  <div className="flex justify-between items-center bg-gray-50 rounded-lg p-2 border border-gray-100">
                    <span className="text-japan-red font-bold text-sm whitespace-nowrap">{formatCurrency(p.price)}</span>
                    <span className="text-xs text-gray-500 whitespace-nowrap font-medium">{p.stock} left</span>
                  </div>
                </div>
                {p.stock === 0 && <div className="absolute inset-0 bg-white/80 flex items-center justify-center font-bold text-gray-500 backdrop-blur-[2px] z-10">Out of Stock</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Cart Sidebar */}
        <div className="fixed bottom-0 left-0 right-0 lg:static lg:w-96 bg-white lg:shadow-lg flex flex-col lg:h-full z-20 border-t lg:border border-gray-200 rounded-t-xl lg:rounded-xl">
          <div className="p-4 border-b bg-gray-50 hidden lg:block">
            <h3 className="font-bold text-lg"><ShoppingCart className="inline w-5 h-5 text-japan-red mr-2" /> Current Order</h3>
          </div>
          {/* Desktop Cart Items */}
          <div id="cart-items" className="flex-1 overflow-y-auto p-4 space-y-3 hidden lg:block lg:max-h-none">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-400 opacity-50 h-full min-h-[100px]">
                <ShoppingCart className="w-10 h-10 mb-2" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-white border rounded p-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 flex items-center justify-center text-lg">{item.image}</div>
                    <div>
                      <p className="font-bold text-sm truncate w-24">{item.name}</p>
                      <p className="text-[10px] text-gray-500">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded border">
                      <button onClick={() => updateCartQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center">-</button>
                      <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateCartQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center">+</button>
                    </div>
                    <p className="font-bold text-sm w-12 text-right">{formatCurrency(item.price * item.qty)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Mobile Cart Toggle & Items */}
          <div
            className="lg:hidden p-3 bg-gray-50 border-b flex justify-between items-center cursor-pointer"
            onClick={() => document.getElementById('cart-items-mobile').classList.toggle('hidden')}
          >
            <span className="font-bold"><ShoppingCart className="inline mr-2" /> Cart ({cart.reduce((s, i) => s + i.qty, 0)})</span>
            <Plus className="w-4 h-4" />
          </div>
          <div id="cart-items-mobile" className="hidden lg:hidden max-h-48 overflow-y-auto p-4 space-y-3 bg-white border-b">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-gray-400 opacity-50 h-full min-h-[100px]">
                <ShoppingCart className="w-10 h-10 mb-2" />
                <p>Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-white border rounded p-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 flex items-center justify-center text-lg">{item.image}</div>
                    <div>
                      <p className="font-bold text-sm truncate w-24">{item.name}</p>
                      <p className="text-[10px] text-gray-500">{formatCurrency(item.price)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-100 rounded border">
                      <button onClick={() => updateCartQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center">-</button>
                      <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateCartQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center">+</button>
                    </div>
                    <p className="font-bold text-sm w-12 text-right">{formatCurrency(item.price * item.qty)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Cart Summary Footer */}
          <div id="cart-summary-footer" className="p-4 bg-gray-50 border-t lg:rounded-b-xl">
            <div className="space-y-1 mb-2 text-xs">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div onClick={openDiscountModal} className="flex justify-between text-japan-red cursor-pointer bg-red-50 p-1 rounded"><span className="flex items-center gap-1">Discount ({currentDiscount.label}) <Edit2 className="w-3 h-3" /></span><span>- {formatCurrency(discountAmt)}</span></div>
              <div className="flex justify-between text-[10px] text-gray-400"><span>VAT (12% inc)</span><span>{formatCurrency(vat)}</span></div>
            </div>
            <div className="flex justify-between mb-3 font-bold text-lg border-t pt-2"><span>Total Due</span><span className="text-japan-red">{formatCurrency(total)}</span></div>
            <button onClick={openPaymentModal} className={`w-full bg-japan-red text-white font-bold py-3 rounded-lg shadow-lg ${cart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={cart.length === 0}>
              Checkout & Pay
            </button>
          </div>
        </div>
      </div>

      {/* Discount Modal */}
      {isDiscountModalOpen && (discountPresets && discountPresets[0] && discountPresets[1]) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in" onClick={closeDiscountModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-gray-800">Apply Discount</h3>
              <button onClick={closeDiscountModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <button onClick={() => setDiscount('none', 0, 'None')} className="w-full py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-left px-4 font-medium text-gray-700 transition-colors">No Discount</button>
              <button
                onClick={() => setDiscount(discountPresets[0].type, discountPresets[0].value, discountPresets[0].label)}
                className="w-full py-2 border border-gray-200 rounded-lg hover:bg-blue-50 text-left px-4 font-medium text-blue-700 transition-colors"
              >
                <Tag className="inline w-4 h-4 mr-1" /> {discountPresets[0].label}
              </button>
              <button
                onClick={() => setDiscount(discountPresets[1].type, discountPresets[1].value, discountPresets[1].label)}
                className="w-full py-2 border border-gray-200 rounded-lg hover:bg-green-50 text-left px-4 font-medium text-green-700 transition-colors"
              >
                <UserCheck className="inline w-4 h-4 mr-1" /> {discountPresets[1].label}
              </button>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Custom Discount</label>
                <div className="flex items-center gap-2 w-full">
                  <select id="custom-discount-type" className="flex-shrink-0 w-16 px-2 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-gray-700 font-medium">
                    <option value="percent">%</option>
                    <option value="fixed">₱</option>
                  </select>
                  <input type="number" id="custom-discount-val" placeholder="0.00" className="flex-1 min-w-0 w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500" />
                  <button onClick={applyCustomDiscount} className="flex-shrink-0 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Apply</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in" onClick={closePaymentModal}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gray-900 p-6 text-white text-center">
              <p className="text-sm opacity-75 uppercase tracking-wide">Total Due</p>
              <h2 className="text-4xl font-bold mt-1" id="pay-modal-total">{formatCurrency(total)}</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => selectPaymentMethod('Cash')} className={`payment-btn py-2 rounded-lg text-sm font-medium ${paymentMethod === 'Cash' ? 'bg-japan-red text-white border-japan-red border' : 'bg-white text-gray-600 border-gray-300 border'}`}>Cash</button>
                  <button type="button" onClick={() => selectPaymentMethod('GCash')} className={`payment-btn py-2 rounded-lg text-sm font-medium ${paymentMethod === 'GCash' ? 'bg-japan-red text-white border-japan-red border' : 'bg-white text-gray-600 border-gray-300 border'}`}>GCash</button>
                  <button type="button" onClick={() => selectPaymentMethod('Card')} className={`payment-btn py-2 rounded-lg text-sm font-medium ${paymentMethod === 'Card' ? 'bg-japan-red text-white border-japan-red border' : 'bg-white text-gray-600 border-gray-300 border'}`}>Card</button>
                </div>
              </div>
              <div id="cash-input-section" className={`${paymentMethod !== 'Cash' ? 'opacity-50 pointer-events-none' : ''}`}>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Tendered</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">₱</span>
                  <input
                    type="number"
                    id="pay-amount-tendered"
                    value={amountTendered}
                    onChange={handleAmountTenderedChange}
                    className="w-full pl-8 pr-4 py-2 text-lg font-bold border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                    disabled={paymentMethod !== 'Cash'}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setTenderedAmount(100)} className="flex-1 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border">₱100</button>
                  <button onClick={() => setTenderedAmount(500)} className="flex-1 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border">₱500</button>
                  <button onClick={() => setTenderedAmount(1000)} className="flex-1 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border">₱1000</button>
                  <button onClick={matchExactAmount} className="flex-1 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded border">Exact</button>
                </div>
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-gray-600 font-medium">Change</span>
                <span className={`text-2xl font-bold ${changeAmount >= 0 ? 'text-gray-900' : 'text-red-600'}`} id="pay-change">
                  {changeAmount >= 0 ? formatCurrency(changeAmount) : 'Insufficient'}
                </span>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t flex gap-3">
              <button onClick={closePaymentModal} className="flex-1 py-3 text-gray-600 hover:bg-gray-200 rounded-lg font-medium">Cancel</button>
              <button onClick={processTransaction} id="btn-complete-payment" className={`flex-1 py-3 bg-green-600 text-white rounded-lg font-bold transition-colors ${changeAmount < 0 && paymentMethod === 'Cash' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`} disabled={changeAmount < 0 && paymentMethod === 'Cash'}>
                Complete Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptModalOpen && receiptData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={closeReceiptModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fade-in flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="bg-japan-red p-4 text-white text-center flex-shrink-0">
              <h3 className="font-bold text-lg">Purchase Receipt</h3>
              <p className="text-xs opacity-90">Kingunat Japanese Goods</p>
            </div>
            <div className="p-4 overflow-y-auto" id="receipt-content">
              <div className="text-center mb-4 border-b border-dashed pb-2">
                <p className="font-bold text-xl">KINGUNAT</p>
                <p className="text-xs text-gray-500">Ref: #{receiptData.id} | Cashier: {receiptData.cashier}</p>
                <p className="text-xs text-gray-500">{new Date(receiptData.date).toLocaleString()}</p>
              </div>
              <div className="text-sm space-y-1 mb-2 border-b border-dashed pb-2">
                {receiptData.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{i.name} x{i.qty}</span>
                    <span>{formatCurrency(i.price * i.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs space-y-1 border-b border-dashed pb-2 text-gray-600">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(receiptData.subtotal)}</span></div>
                <div className="flex justify-between"><span>Disc ({receiptData.discountLabel})</span><span>- {formatCurrency(receiptData.discountAmt)}</span></div>
                <div className="flex justify-between text-[10px]"><span>VAT</span><span>{formatCurrency(receiptData.vat)}</span></div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-bold text-lg"><span>TOTAL</span><span>{formatCurrency(receiptData.total)}</span></div>
                <div className="flex justify-between text-xs text-gray-500"><span>Paid ({receiptData.paymentMethod})</span><span>{formatCurrency(receiptData.amountTendered)}</span></div>
                <div className="flex justify-between text-xs text-gray-500"><span>Change</span><span>{formatCurrency(receiptData.change)}</span></div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-center gap-2 flex-shrink-0">
              <button
                onClick={() => printContent('receipt-content', 'Purchase Receipt')}
                className="bg-japan-red text-white px-4 py-2 rounded-lg hover:bg-red-800 text-sm flex items-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print PDF
              </button>
              <button onClick={closeReceiptModal} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPage;
