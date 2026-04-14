import React, { useEffect, useState } from 'react';
import { Layers, Store, Globe, AlertTriangle, ShoppingCart, Monitor } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { formatCurrency } from '../utils/helpers';

const DashboardPage = () => {
  const { setCurrentRoute } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    lowStockNames: 'All stock optimal',
    posRevenue: 0,
    posTransactions: 0,
    onlineRevenue: 0,
    pendingOrders: 0,
    lowStockItems: []
  });

  useEffect(() => {
    setCurrentRoute('Dashboard');
    fetchDashboardData();
  }, [setCurrentRoute]);

  const fetchDashboardData = async () => {
    try {
      const [productsRes, salesRes, ordersRes] = await Promise.all([
        api.get('/products'),
        api.get('/sales'),
        api.get('/orders')
      ]);

      const products = productsRes.data;
      const sales = salesRes.data;
      const onlineOrders = ordersRes.data;

      const validSales = sales.filter(s => s.status !== 'Refunded');
      const onlineSales = validSales.filter(s => s.cashier === null); // Online System sales have null cashier_id
      const posSales = validSales.filter(s => s.cashier !== null);

      const pendingOrders = onlineOrders.filter(o => o.status === 'Pending').length;
      const lowStockItems = products.filter(p => p.stock < 20);
      const lowStockCount = lowStockItems.length;
      const lowStockNames = lowStockCount > 0
        ? lowStockItems.slice(0, 2).map(p => p.name).join(', ') + (lowStockCount > 2 ? ` +${lowStockCount - 2} more` : '')
        : 'All stock optimal';

      setDashboardData({
        totalProducts: products.length,
        lowStockCount,
        lowStockNames,
        posRevenue: posSales.reduce((a, b) => a + parseFloat(b.total_amount), 0),
        posTransactions: posSales.length,
        onlineRevenue: onlineSales.reduce((a, b) => a + parseFloat(b.total_amount), 0),
        pendingOrders,
        lowStockItems
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Layers className="text-japan-red" /> Centralized Inventory Status</h3>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between relative overflow-hidden gap-4">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-japan-red hidden md:block"></div>
          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertTriangle /></div>
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <h3 className="text-2xl font-bold {dashboardData.lowStockCount > 0 ? 'text-red-600' : ''}">
                  {dashboardData.lowStockCount} Items
                </h3>
                <p className={`text-[10px] sm:text-xs ${dashboardData.lowStockCount > 0 ? 'text-red-500' : 'text-green-500'} mt-0.5 max-w-[200px] md:max-w-xs leading-tight`} title={dashboardData.lowStockItems.map(p => p.name).join(', ')}>
                  {dashboardData.lowStockNames}
                </p>
              </div>
            </div>
            <div className="h-px w-full md:h-10 md:w-px bg-gray-200"></div>
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="font-bold text-xl">{dashboardData.totalProducts} SKUs</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Store className="w-32 h-32" /></div>
          <h4 className="font-bold mb-6 border-b pb-2"><Monitor className="inline w-5 h-5" /> In-Store POS</h4>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><p className="text-xs text-gray-400">Revenue</p><p className="text-2xl font-bold">{formatCurrency(dashboardData.posRevenue)}</p></div>
            <div><p className="text-xs text-gray-400">Transactions</p><p className="text-2xl font-bold">{dashboardData.posTransactions}</p></div>
          </div>
          <a href="/pos" className="w-full bg-gray-800 text-white py-3 rounded-lg text-sm font-medium text-center block">Open POS Terminal</a>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5"><Globe className="w-32 h-32 text-blue-900" /></div>
          <h4 className="font-bold mb-6 border-b pb-2"><ShoppingCart className="inline w-5 h-5 text-blue-600" /> Online Orders</h4>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div><p className="text-xs text-gray-400">Revenue</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(dashboardData.onlineRevenue)}</p></div>
            <div><p className="text-xs text-gray-400">Pending</p><p className="text-2xl font-bold text-yellow-600">{dashboardData.pendingOrders}</p></div>
          </div>
          <a href="/online-orders" className="w-full bg-blue-600 text-white py-3 rounded-lg text-sm font-medium text-center block">Manage Orders</a>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
