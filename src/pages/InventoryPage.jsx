import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { usePrompt } from '../context/PromptContext';
import api from '../api/api';
import { Settings2, Plus, Edit2, Trash2, X } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const InventoryPage = () => {
  const { setCurrentRoute, user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const prompt = usePrompt();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdStock, setNewProdStock] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📦');

  const [isManageCategoryModalOpen, setIsManageCategoryModalOpen] = useState(false);
  const [manageCatName, setManageCatName] = useState('');
  const [editCatOriginalId, setEditCatOriginalId] = useState(null);
  const [editCatOriginalName, setEditCatOriginalName] = useState('');


  const fetchProducts = useCallback(async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      toast.showToast('Failed to fetch products.', 'error');
      console.error('Error fetching products:', error);
    }
  }, [toast]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
      if (response.data.length > 0 && !newProdCategory) {
        setNewProdCategory(response.data[0].name);
      }
    } catch (error) {
      toast.showToast('Failed to fetch categories.', 'error');
      console.error('Error fetching categories:', error);
    }
  }, [toast, newProdCategory]);

  useEffect(() => {
    setCurrentRoute('Inventory Management');
    fetchProducts();
    fetchCategories();
  }, [setCurrentRoute, fetchProducts, fetchCategories]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const deleteProduct = (id, name) => {
    confirm.showConfirm("Delete Product", `Are you sure you want to delete ${name}?`, async () => {
      try {
        await api.delete(`/products/${id}`);
        toast.showToast('Product deleted.', 'info');
        fetchProducts();
      } catch (error) {
        toast.showToast(error.response?.data?.message || 'Failed to delete product.', 'error');
        console.error('Error deleting product:', error);
      }
    });
  };

  const editProductStock = (id, name, currentStock) => {
    prompt.showPrompt(
      `Update Stock for ${name}:`,
      currentStock.toString(),
      async (newStock) => {
        const parsedStock = parseInt(newStock);
        if (isNaN(parsedStock) || parsedStock < 0) {
          return toast.showToast('Invalid stock amount.', 'error');
        }
        try {
          await api.put(`/products/${id}/stock`, { stock: parsedStock });
          toast.showToast(`Stock for ${name} updated to ${parsedStock}.`, 'success');
          fetchProducts();
        } catch (error) {
          toast.showToast(error.response?.data?.message || 'Failed to update stock.', 'error');
          console.error('Error updating stock:', error);
        }
      },
      'number'
    );
  };

  // Add Product Modal handlers
  const openAddProductModal = () => {
    setNewProdName('');
    setNewProdPrice('');
    setNewProdStock('');
    setNewProdCategory(categories[0]?.name || '');
    setSelectedIcon('📦');
    setIsAddProductModalOpen(true);
  };
  const closeAddProductModal = () => setIsAddProductModalOpen(false);
  const handleAddProductSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', {
        name: newProdName,
        price: parseFloat(newProdPrice),
        stock: parseInt(newProdStock),
        category: newProdCategory,
        image: selectedIcon,
      });
      toast.showToast('Product added successfully!', 'success');
      closeAddProductModal();
      fetchProducts();
    } catch (error) {
      toast.showToast(error.response?.data?.message || 'Failed to add product.', 'error');
      console.error('Error adding product:', error);
    }
  };

  // Manage Category Modal Handlers
  const openManageCategoryModal = () => {
    setManageCatName('');
    setEditCatOriginalId(null);
    setEditCatOriginalName('');
    setIsManageCategoryModalOpen(true);
  };
  const closeManageCategoryModal = () => setIsManageCategoryModalOpen(false);

  const handleManageCategorySubmit = async (e) => {
    e.preventDefault();
    const trimmedName = manageCatName.trim();

    if (!trimmedName) {
      return toast.showToast('Category name cannot be empty.', 'error');
    }

    try {
      if (editCatOriginalId) {
        // Update existing category
        await api.put(`/categories/${editCatOriginalId}`, { name: trimmedName });
        toast.showToast(`Category '${editCatOriginalName}' renamed to '${trimmedName}'.`, 'success');
      } else {
        // Add new category
        await api.post('/categories', { name: trimmedName });
        toast.showToast(`Category '${trimmedName}' added.`, 'success');
      }
      setManageCatName('');
      setEditCatOriginalId(null);
      setEditCatOriginalName('');
      fetchCategories();
      fetchProducts(); // Refresh products in case categories changed
    } catch (error) {
      toast.showToast(error.response?.data?.message || 'Failed to manage category.', 'error');
      console.error('Error managing category:', error);
    }
  };

  const startEditCategory = (category) => {
    setManageCatName(category.name);
    setEditCatOriginalId(category.id);
    setEditCatOriginalName(category.name);
  };

  const deleteCategory = (id, name) => {
    confirm.showConfirm(
      "Delete Category",
      `Are you sure you want to delete '${name}'? Products in this category will be moved to 'General' or the first available category.`, 
      async () => {
      try {
        await api.delete(`/categories/${id}`);
        toast.showToast(`Category '${name}' deleted.`, 'info');
        fetchCategories();
        fetchProducts(); // Refresh products as their categories might have changed
        setManageCatName('');
        setEditCatOriginalId(null);
        setEditCatOriginalName('');
      } catch (error) {
        toast.showToast(error.response?.data?.message || 'Failed to delete category.', 'error');
        console.error('Error deleting category:', error);
      }
    });
  };

  const iconEmojis = [
    '🍫', '🍬', '🍪', '🍘', '🍡', '🍦',
    '🍜', '🍱', '🍣', '🍙', '🍛', '🥩',
    '🍵', '🍺', '🍶', '🥤', '🧃', '☕',
    '🧴', '🧼', '💄', '💅', '🦷', '🚿',
    '🧺', '🧽', '🫧', '🧻', '🧹', '🕯️',
    '👕', '👗', '👟', '🎒', '🌂', '📦'
  ];

  return (
    <div className="animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="relative w-full md:w-64">
            <Settings2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              id="inv-search"
              onKeyUp={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:border-japan-red"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            {user.role !== 'cashier' ? (
              <>
                <button onClick={openManageCategoryModal} className="bg-white border text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <Settings2 className="w-4 h-4" /> Manage Categories
                </button>
                <button onClick={openAddProductModal} className="bg-japan-red text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </>
            ) : (
              <span className="text-xs text-gray-500 italic bg-gray-100 px-3 py-1 rounded border">View Only</span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Price</th>
                <th className="px-6 py-3 text-center">Stock</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody id="inventory-list" className="divide-y divide-gray-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">No products found.</td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 font-medium flex items-center gap-3"><span className="text-xl">{p.image || '📦'}</span> {p.name}</td>
                    <td className="px-6 py-4 text-gray-500"><span className="px-2 py-1 bg-gray-100 rounded text-xs">{p.category}</span></td>
                    <td className="px-6 py-4 text-right">{formatCurrency(p.price)}</td>
                    <td className="px-6 py-4 text-center"><span className={`${p.stock < 20 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'} px-2 py-1 rounded font-bold`}>{p.stock}</span></td>
                    <td className="px-6 py-4 text-center">
                      {user.role !== 'cashier' ? (
                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => editProductStock(p.id, p.name, p.stock)} className="p-1 hover:bg-blue-100 text-blue-600 rounded"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => deleteProduct(p.id, p.name)} className="p-1 hover:bg-red-100 text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in" onClick={closeAddProductModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 text-gray-800">Add New Product</h3>
            <form onSubmit={handleAddProductSubmit} className="space-y-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label><input type="text" id="new-prod-name" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:border-japan-red" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Price (₱)</label><input type="number" id="new-prod-price" value={newProdPrice} onChange={(e) => setNewProdPrice(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:border-japan-red" required min="0" step="0.01" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Stock</label><input type="number" id="new-prod-stock" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:border-japan-red" required min="0" /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select id="new-prod-category-select" value={newProdCategory} onChange={(e) => setNewProdCategory(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white">
                  {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Icon</label>
                <div className="h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                  <div className="grid grid-cols-6 gap-2">
                    {iconEmojis.map((icon, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`icon-btn w-10 h-10 border rounded bg-white text-xl hover:bg-gray-100 ${selectedIcon === icon ? 'bg-gray-200 border-japan-red' : ''}`}
                        onClick={() => setSelectedIcon(icon)}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
                <button type="button" onClick={closeAddProductModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-japan-red text-white hover:bg-red-800 rounded-lg text-sm font-medium">Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Category Modal */}
      {isManageCategoryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={closeManageCategoryModal}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-fade-in max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">Manage Categories</h3>
              <button onClick={closeManageCategoryModal} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleManageCategorySubmit} className="flex gap-2 mb-4">
              <input type="text" id="manage-cat-name" value={manageCatName} onChange={(e) => setManageCatName(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:border-japan-red text-sm" placeholder="Category Name" required />
              <button type="submit" className="bg-japan-red hover:bg-red-800 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">{editCatOriginalId ? 'Save' : 'Add'}</button>
            </form>
            <div className="border rounded-lg overflow-hidden flex-1 min-h-[200px]">
              <div className="bg-gray-50 px-3 py-2 border-b text-xs font-medium text-gray-500 uppercase flex justify-between">
                <span>Existing Categories</span><span id="cat-count-display">{categories.length}/8</span>
              </div>
              <div id="cat-manager-list" className="overflow-y-auto max-h-60 p-2 space-y-1">
                {categories.length === 0 ? (
                  <p className="text-center text-gray-400 p-2">No categories exist.</p>
                ) : (
                  categories.map(c => (
                    <div key={c.id} className="flex justify-between p-2 hover:bg-gray-100 group">
                      <span className="text-sm">{c.name}</span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100">
                        <button type="button" onClick={() => startEditCategory(c)} className="text-blue-500"><Edit2 className="w-3 h-3" /></button>
                        <button type="button" onClick={() => deleteCategory(c.id, c.name)} className="text-red-500"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-400 text-center">Max 8 categories. Deleting moves products to &quot;General&quot; or other categories.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
