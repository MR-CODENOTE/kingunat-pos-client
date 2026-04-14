import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import api from '../api/api';
import { RotateCcw } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/helpers';
import PaginationControls from '../components/PaginationControls';

const ITEMS_PER_PAGE = 10;

const RefundsPage = () => {
  const { setCurrentRoute } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [sales, setSales] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchSales = useCallback(async () => {
    try {
      const response = await api.get('/sales');
      // Only show sales that are 'Completed' and not yet 'Refunded'
      setSales(response.data.sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date)));
    } catch (error) {
      toast.showToast('Failed to fetch sales for refunds.', 'error');
      console.error('Error fetching sales:', error);
    }
  }, [toast]);

  useEffect(() => {
    setCurrentRoute('Refund Management');
    fetchSales();
  }, [setCurrentRoute, fetchSales]);

  const processRefund = (saleId, totalAmount) => {
    confirm.showConfirm(
      "Process Refund",
      `Are you sure you want to refund this sale (ID: #${saleId}, Amount: ${formatCurrency(totalAmount)})? Items will be returned to stock.`, 
      async () => {
      try {
        await api.put(`/sales/${saleId}/refund`);
        toast.showToast(`Sale #${saleId} refunded successfully.`, 'success');
        fetchSales(); // Re-fetch sales to update status
      } catch (error) {
        toast.showToast(error.response?.data?.message || 'Failed to process refund.', 'error');
        console.error('Error processing refund:', error);
      }
    });
  };

  const handlePageChange = (page) => { setCurrentPage(page); };

  const refundableSales = sales.filter(s => s.status === 'Completed');
  const paginatedSales = refundableSales.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="animate-fade-in">
      <div className="bg-white p-6 rounded-xl border">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <RotateCcw className="w-5 h-5 text-red-700" /> Refundable Sales
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="py-2 px-2">Ref</th>
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Cashier</th>
                <th className="py-2 px-2 text-right">Amount</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-4 text-gray-500">No refundable sales found.</td></tr>
              ) : (
                paginatedSales.map(s => (
                  <tr key={s.id} className="border-b">
                    <td className="py-2 px-2">#{s.id}</td>
                    <td className="py-2 px-2">{formatDate(s.sale_date)}</td>
                    <td className="py-2 px-2">{s.cashier || 'Online System'}</td>
                    <td className="py-2 px-2 text-right font-bold">{formatCurrency(s.total_amount)}</td>
                    <td className="py-2 px-2"><span className={`px-2 py-1 rounded text-xs font-bold ${s.status === 'Refunded' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{s.status}</span></td>
                    <td className="py-2 px-2">
                      {s.status !== 'Refunded' ? (
                        <button
                          onClick={() => processRefund(s.id, s.total_amount)}
                          className="text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-bold hover:bg-red-100"
                        >
                          Refund
                        </button>
                      ) : (
                        <span className="text-gray-500">Refunded</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          totalItems={refundableSales.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default RefundsPage;
