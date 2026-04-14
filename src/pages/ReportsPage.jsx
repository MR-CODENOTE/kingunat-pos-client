import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/api';
import { formatCurrency, formatDate } from '../utils/helpers';
import PaginationControls from '../components/PaginationControls';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const ITEMS_PER_PAGE = 10;

const ReportsPage = () => {
  const { setCurrentRoute } = useAuth();
  const toast = useToast();
  const [sales, setSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [chartFilter, setChartFilter] = useState('daily');
  const [chartData, setChartData] = useState({
    labels: [],
    revenuePos: [],
    revenueOnline: [],
    volume: []
  });

  const chartInstances = useRef({});

  const fetchSales = useCallback(async () => {
    try {
      const response = await api.get('/sales');
      setSales(response.data.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date)));
    } catch (error) {
      toast.showToast('Failed to fetch sales data.', 'error');
      console.error('Error fetching sales:', error);
    }
  }, [toast]);

  useEffect(() => {
    setCurrentRoute('Sales Reports');
    fetchSales();
  }, [setCurrentRoute, fetchSales]);

  useEffect(() => {
    if (sales.length > 0) {
      processChartData(chartFilter);
    }
  }, [sales, chartFilter]); // Re-process charts when sales data or filter changes

  const processChartData = (timeframe) => {
    let labels = [];
    let rPos = [];
    let rOn = [];
    let vol = [];

    const validSales = sales.filter(s => s.status !== 'Refunded');

    if (timeframe === 'daily') {
      for (let i = 6; i >= 0; i--) {
        let d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }));

        let salesOfDay = validSales.filter(x => {
          const saleDate = new Date(x.sale_date);
          saleDate.setHours(0, 0, 0, 0);
          return saleDate.getTime() === d.getTime();
        });

        rPos.push(salesOfDay.filter(x => x.cashier_id !== null).reduce((a, b) => a + parseFloat(b.total_amount), 0));
        rOn.push(salesOfDay.filter(x => x.cashier_id === null).reduce((a, b) => a + parseFloat(b.total_amount), 0));
        vol.push(salesOfDay.length);
      }
    } else if (timeframe === 'monthly') {
      const currentYear = new Date().getFullYear();
      labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => `${m} ${currentYear}`);
      rPos = new Array(12).fill(0);
      rOn = new Array(12).fill(0);
      vol = new Array(12).fill(0);

      validSales.forEach(s => {
        const saleDate = new Date(s.sale_date);
        if (saleDate.getFullYear() === currentYear) {
          const month = saleDate.getMonth();
          if (s.cashier_id === null) {
            rOn[month] += parseFloat(s.total_amount);
          } else {
            rPos[month] += parseFloat(s.total_amount);
          }
          vol[month] += 1;
        }
      });
    }

    setChartData({
      labels,
      revenuePos: rPos,
      revenueOnline: rOn,
      volume: vol
    });
  };

  const handlePageChange = (page) => { setCurrentPage(page); };

  const paginatedSales = sales.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { title: { display: true, text: 'Period' } },
      y: { title: { display: true, text: 'Revenue (₱)' }, beginAtZero: true },
    },
  };

  const volumeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { title: { display: true, text: 'Period' } },
      y: { title: { display: true, text: 'Transactions' }, beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  const revenueChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'POS Revenue',
        data: chartData.revenuePos,
        borderColor: '#BC002D',
        backgroundColor: 'rgba(188, 0, 45, 0.5)',
        tension: 0.4,
      },
      {
        label: 'Online Revenue',
        data: chartData.revenueOnline,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
        tension: 0.4,
      },
    ],
  };

  const volumeChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Transaction Volume',
        data: chartData.volume,
        backgroundColor: '#2563EB',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="animate-fade-in">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Performance Trends</h3>
            <select value={chartFilter} onChange={(e) => setChartFilter(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="daily">Last 7 Days</option>
              <option value="monthly">This Year ({new Date().getFullYear()})</option>
            </select>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-center text-gray-500">Revenue (₱)</h4>
              <div className="h-64"><Line data={revenueChartData} options={revenueChartOptions} /></div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-center text-gray-500">Transactions</h4>
              <div className="h-64"><Bar data={volumeChartData} options={volumeChartOptions} /></div>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border">
          <h3 className="font-bold text-lg mb-4">Sales History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="py-2 px-2">Ref</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2">Cashier</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th className="py-2 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4 text-gray-500">No sales records.</td></tr>
                ) : (
                  paginatedSales.map(s => (
                    <tr key={s.id} className="border-b">
                      <td className="py-2 px-2 font-mono">#{s.id}</td>
                      <td className="py-2 px-2">{formatDate(s.sale_date)}</td>
                      <td className="py-2 px-2">{s.cashier || 'Online System'}</td>
                      <td className={`py-2 px-2 text-right font-bold ${s.status === 'Refunded' ? 'line-through text-red-500' : ''}`}>{formatCurrency(s.total_amount)}</td>
                      <td className="py-2 px-2 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'Refunded' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{s.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <PaginationControls
            totalItems={sales.length}
            itemsPerPage={ITEMS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
