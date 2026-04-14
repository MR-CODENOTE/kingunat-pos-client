import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../api/api';
import { Plus, X, Printer, FileDown } from 'lucide-react';
import { formatCurrency, formatDateTime, formatDate, printContent } from '../utils/helpers';

const OnlineOrdersPage = () => {
  const { setCurrentRoute, user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]); // Needed for order item display
  const [filterStatus, setFilterStatus] = useState('All');

  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [newOrderCustomerName, setNewOrderCustomerName] = useState('');
  const [newOrderCustomerContact, setNewOrderCustomerContact] = useState('');
  const [newOrderCustomerAddress, setNewOrderCustomerAddress] = useState('');
  const [newOrderPaymentMethod, setNewOrderPaymentMethod] = useState('COD');
  const [newOrderNotes, setNewOrderNotes] = useState('');
  const [newOrderItems, setNewOrderItems] = useState([{ id: '', qty: 1 }]);

  const [isViewOrderModalOpen, setIsViewOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data.sort((a, b) => new Date(b.order_date) - new Date(a.order_date)));
    } catch (error) {
      toast.showToast('Failed to fetch online orders.', 'error');
      console.error('Error fetching online orders:', error);
    }
  }, [toast]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.showToast('Failed to fetch products for order creation.', 'error');
      console.error('Error fetching products:', error);
    }
  }, [toast]);

  // --- 🚨 INFINITE LOOP FIX HERE 🚨 ---
  useEffect(() => {
    setCurrentRoute('Online Orders');
    fetchOrders();
    fetchProducts();
  }, []); // <-- Empty array forces it to only run once!

  const filteredOrders = orders.filter(o => filterStatus === 'All' || o.status === filterStatus);

  // Create Order Modal handlers
  const openCreateOrderModal = () => {
    setNewOrderCustomerName('');
    setNewOrderCustomerContact('');
    setNewOrderCustomerAddress('');
    setNewOrderPaymentMethod('COD');
    setNewOrderNotes('');
    setNewOrderItems([{ id: '', qty: 1 }]);
    setIsCreateOrderModalOpen(true);
  };
  const closeCreateOrderModal = () => setIsCreateOrderModalOpen(false);

  const addOrderItemRow = () => {
    const availableProducts = products.filter(p => p.stock > 0);
    if (availableProducts.length === 0) {
      return toast.showToast('No products in stock to add.', 'error');
    }
    setNewOrderItems(prevItems => [...prevItems, { id: availableProducts[0].id, qty: 1 }]);
  };

  const updateNewOrderItem = (index, field, value) => {
    setNewOrderItems(prevItems =>
      prevItems.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const removeNewOrderItem = (index) => {
    setNewOrderItems(prevItems => prevItems.filter((_, idx) => idx !== index));
  };

  const submitNewOrder = async () => {
    if (!newOrderCustomerName || !newOrderCustomerContact || !newOrderCustomerAddress || newOrderItems.length === 0) {
      return toast.showToast('Please fill all required customer and item fields.', 'error');
    }

    const orderItemsPayload = [];
    let hasError = false;

    // Validate and consolidate items
    const consolidatedItems = {};
    for (const item of newOrderItems) {
      if (!item.id || item.qty <= 0) {
        toast.showToast('Please select a product and valid quantity for all items.', 'error');
        hasError = true;
        break;
      }
      if (consolidatedItems[item.id]) {
        consolidatedItems[item.id] += item.qty;
      } else {
        consolidatedItems[item.id] = item.qty;
      }
    }
    if (hasError) return;

    for (const productId in consolidatedItems) {
      const qty = consolidatedItems[productId];
      const product = products.find(p => p.id === productId);
      if (!product || product.stock < qty) {
        toast.showToast(`Insufficient stock for ${product?.name || productId}.`, 'error');
        hasError = true;
        break;
      }
      orderItemsPayload.push({ id: productId, qty });
    }
    if (hasError) return;

    try {
      await api.post('/orders', {
        customerName: newOrderCustomerName,
        customerContact: newOrderCustomerContact,
        customerAddress: newOrderCustomerAddress,
        items: orderItemsPayload,
        paymentMethod: newOrderPaymentMethod,
        notes: newOrderNotes,
      });
      toast.showToast('Online order created successfully!', 'success');
      closeCreateOrderModal();
      fetchOrders();
      fetchProducts(); // Refresh products for updated stock
    } catch (error) {
      toast.showToast(error.response?.data?.message || 'Failed to create online order.', 'error');
      console.error('Error creating online order:', error);
    }
  };

  // View Order Modal handlers
  const openViewOrderModal = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setSelectedOrder(response.data);
      setIsViewOrderModalOpen(true);
    } catch (error) {
      toast.showToast(error.response?.data?.message || 'Failed to fetch order details.', 'error');
      console.error('Error fetching order details:', error);
    }
  };
  const closeViewOrderModal = () => {
    setIsViewOrderModalOpen(false);
    setSelectedOrder(null);
  };

  const updateOrderStatus = async (status) => {
    if (!selectedOrder) return;

    const handleUpdate = async () => {
      try {
        await api.put(`/orders/${selectedOrder.id}/status`, { status });
        toast.showToast(`Order #${selectedOrder.id} status updated to ${status}.`, 'success');
        closeViewOrderModal();
        fetchOrders();
        fetchProducts(); // Refresh products if stock was returned/deducted
      } catch (error) {
        toast.showToast(error.response?.data?.message || 'Failed to update order status.', 'error');
        console.error('Error updating order status:', error);
      }
    };

    if (status === 'Canceled') {
      confirm.showConfirm(
        'Cancel Order',
        'Are you sure you want to cancel this order? Items will be returned to stock.',
        handleUpdate
      );
    } else if (status === 'Completed') {
      confirm.showConfirm(
        'Complete Order',
        'Are you sure you want to mark this order as Completed? It will be permanently recorded in sales and cannot be reversed.',
        handleUpdate
      );
    } else {
      handleUpdate();
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Paid': return 'bg-blue-100 text-blue-700';
      case 'Shipped': return 'bg-purple-100 text-purple-700';
      case 'Completed': return 'bg-green-100 text-green-700';
      case 'Canceled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusBadgeClass = (status) => {
    return status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  };

  const getProductName = (productId) => {
    return products.find(p => p.id === productId)?.name || 'Unknown Product';
  };

  const calculateItemTotal = (item) => {
    const product = products.find(p => p.id === item.product_id);
    return (item.quantity * (product ? product.price : item.product_price || 0));
  };

  const pendingOrdersCount = orders.filter(o => o.status === 'Pending').length;
  const totalOnlineRevenue = orders.filter(o => o.status !== 'Canceled').reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

  return (
    <div className="animate-fade-in">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-xs text-gray-500 uppercase font-bold">Pending</p>
            <h3 className="text-xl font-bold text-yellow-600">{pendingOrdersCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border">
            <p className="text-xs text-gray-500 uppercase font-bold">Revenue</p>
            <h3 className="text-xl font-bold">{formatCurrency(totalOnlineRevenue)}</h3>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center gap-4">
            <h3 className="font-bold text-lg">Orders</h3>
            <div className="flex gap-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border rounded px-2 py-1 text-sm">
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Shipped">Shipped</option>
                <option value="Completed">Completed</option>
                <option value="Canceled">Canceled</option>
              </select>
              <button onClick={openCreateOrderModal} className="bg-japan-red text-white px-3 py-1 rounded text-sm flex gap-1"><Plus className="w-4 h-4" /> New</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody id="orders-table-body">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan="5" className="text-center p-4">No orders found.</td></tr>
                ) : (
                  filteredOrders.map(o => (
                    <tr key={o.id} className="border-b">
                      <td className="px-6 py-4 font-mono">#{o.id}</td>
                      <td className="px-6 py-4">{o.customer_name}</td>
                      <td className="px-6 py-4 font-bold">{formatCurrency(o.total_amount)}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${getStatusBadgeClass(o.status)}`}>{o.status}</span></td>
                      <td className="px-6 py-4"><button onClick={() => openViewOrderModal(o.id)} className="text-blue-600 bg-blue-50 px-3 py-1 rounded">Manage</button></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Online Order Modal */}
      {isCreateOrderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={closeCreateOrderModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="font-bold text-lg text-gray-800">Create New Order</h3>
              <button onClick={closeCreateOrderModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label><input type="text" value={newOrderCustomerName} onChange={(e) => setNewOrderCustomerName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:border-japan-red" required /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label><input type="text" value={newOrderCustomerContact} onChange={(e) => setNewOrderCustomerContact(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:border-japan-red" required /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label><input type="text" value={newOrderCustomerAddress} onChange={(e) => setNewOrderCustomerAddress(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:border-japan-red" required /></div>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Order Items</label>
                    <button type="button" onClick={addOrderItemRow} className="text-sm text-blue-600 hover:underline">+ Add Item</button>
                  </div>
                  <div id="order-items-container" className="space-y-2">
                    {newOrderItems.map((item, index) => (
                      <div key={index} className="flex gap-2 p-2 bg-gray-50 rounded">
                        <select
                          className="flex-1 border p-1 rounded prod-sel"
                          value={item.id}
                          onChange={(e) => updateNewOrderItem(index, 'id', e.target.value)}
                        >
                          <option value="">Select Product</option>
                          {products.filter(p=>p.stock > 0).map(p => (
                            <option key={p.id} value={p.id} data-price={p.price} data-stock={p.stock}>
                              {p.name} (Stock: {p.stock})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          className="w-20 border p-1 rounded qty-val"
                          value={item.qty}
                          min="1"
                          onChange={(e) => updateNewOrderItem(index, 'qty', parseInt(e.target.value))}
                        />
                        <button type="button" onClick={() => removeNewOrderItem(index)} className="text-red-500 p-1"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <select value={newOrderPaymentMethod} onChange={(e) => setNewOrderPaymentMethod(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                      <option value="COD">COD</option>
                      <option value="GCash">GCash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Notes</label><input type="text" value={newOrderNotes} onChange={(e) => setNewOrderNotes(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:border-japan-red" /></div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 rounded-b-lg">
              <button onClick={closeCreateOrderModal} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm">Cancel</button>
              <button onClick={submitNewOrder} className="px-4 py-2 bg-japan-red hover:bg-red-800 text-white rounded-lg text-sm font-bold shadow-sm">Create Order</button>
            </div>
          </div>
        </div>
      )}

      {/* View Order Details Modal */}
      {isViewOrderModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={closeViewOrderModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b bg-gray-50 rounded-t-lg">
              <div>
                <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">Order #{selectedOrder.id}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusBadgeClass(selectedOrder.status)}`}>{selectedOrder.status}</span>
              </div>
              <button onClick={closeViewOrderModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="overflow-y-auto p-6 flex-1 space-y-6" id="printable-order-area">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500 uppercase text-xs font-bold">Customer</p><p className="font-medium text-gray-900">{selectedOrder.customer_name}</p><p className="text-gray-600">{selectedOrder.customer_contact}</p></div>
                <div className="md:text-right"><p className="text-gray-500 uppercase text-xs font-bold">Date</p><p className="text-gray-900">{formatDate(selectedOrder.order_date)}</p></div>
                <div className="md:col-span-2"><p className="text-gray-500 uppercase text-xs font-bold">Shipping Address</p><p className="text-gray-900">{selectedOrder.customer_address}</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr><th className="text-left py-2 px-2 font-medium text-gray-600">Item</th><th className="text-right py-2 px-2 font-medium text-gray-600">Qty</th><th className="text-right py-2 px-2 font-medium text-gray-600">Price</th><th className="text-right py-2 px-2 font-medium text-gray-600">Total</th></tr>
                  </thead>
                  <tbody id="view-order-items" className="divide-y divide-gray-100">
                    {selectedOrder.items.map(item => (
                      <tr key={item.product_id}>
                        <td className="py-2 px-2">{getProductName(item.product_id)}</td>
                        <td className="text-right py-2 px-2">{item.quantity}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(item.product_price)}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(calculateItemTotal(item))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-gray-200">
                    <tr><td colSpan="3" className="text-right py-2 px-2 font-bold">Total Amount</td><td className="text-right py-2 px-2 font-bold text-lg text-japan-red">{formatCurrency(selectedOrder.total_amount)}</td></tr>
                  </tfoot>
                </table>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center mb-2"><span className="text-sm text-blue-800 font-medium">Payment Method:</span><span className="text-sm font-bold text-gray-800">{selectedOrder.payment_method}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm text-blue-800 font-medium">Payment Status:</span><span className={`px-2 py-0.5 rounded text-xs font-bold ${getPaymentStatusBadgeClass(selectedOrder.payment_status)}`}>{selectedOrder.payment_status}</span></div>
                {selectedOrder.notes && (
                  <div className="mt-2 pt-2 border-t border-blue-200"><p className="text-xs text-blue-800"><span className="font-bold">Notes:</span> {selectedOrder.notes}</p></div>
                )}
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 rounded-b-lg flex flex-col gap-3">
              <div className="flex flex-col md:flex-row justify-between items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Update Status:</label>
                <div className="flex gap-2">
                  <button onClick={() => updateOrderStatus('Paid')} disabled={selectedOrder.status === 'Completed' || selectedOrder.status === 'Canceled'} className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-bold hover:bg-green-200 disabled:opacity-50">Mark Paid</button>
                  <button onClick={() => updateOrderStatus('Shipped')} disabled={selectedOrder.status === 'Completed' || selectedOrder.status === 'Canceled'} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold hover:bg-blue-200 disabled:opacity-50">Mark Shipped</button>
                  <button onClick={() => updateOrderStatus('Completed')} disabled={selectedOrder.status === 'Completed' || selectedOrder.status === 'Canceled'} className="px-3 py-1 bg-gray-800 text-white rounded text-xs font-bold hover:bg-gray-700 disabled:opacity-50">Complete</button>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <button onClick={() => printContent('printable-order-area', `Order Summary #${selectedOrder.id}`)} className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-2"><FileDown className="w-4 h-4" /> Print / PDF</button>
                <button onClick={() => updateOrderStatus('Canceled')} disabled={selectedOrder.status === 'Canceled'} className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50">Cancel Order</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnlineOrdersPage;