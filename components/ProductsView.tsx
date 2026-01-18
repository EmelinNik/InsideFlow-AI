
import React, { useState } from 'react';
import { AuthorProfile, ProductService } from '../types';
import { Package, Plus, Trash2, X, ShoppingBag, DollarSign, FileText, Info } from 'lucide-react';
import { createId } from '../utils/id';

interface ProductsViewProps {
  profile: AuthorProfile;
  onUpdate: (profile: AuthorProfile) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ profile, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<ProductService>>({});

  const handleAdd = () => {
    if (!newProduct.name || !newProduct.description) {
      alert("Пожалуйста, заполните название и описание продукта.");
      return;
    }
    const product: ProductService = {
      id: createId(),
      name: newProduct.name!,
      description: newProduct.description!,
      price: newProduct.price
    };
    onUpdate({
      ...profile,
      products: [...(profile.products || []), product]
    });
    setNewProduct({});
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Удалить этот продукт? Это может повлиять на сгенерированные черновики, привязанные к нему.")) {
      onUpdate({
        ...profile,
        products: (profile.products || []).filter(p => p.id !== id)
      });
    }
  };

  const products = profile.products || [];

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="text-indigo-600" size={28}/>
            Товары и Услуги
          </h2>
          <p className="text-slate-500 mt-1 max-w-2xl">
            Создайте базу ваших предложений. ИИ будет использовать их для написания продающих постов и офферов.
          </p>
        </div>
        <button 
            onClick={() => setIsAdding(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
        >
            <Plus size={18}/> Добавить продукт
        </button>
      </header>

      {/* FORM MODAL / PANEL */}
      {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-in zoom-in-95">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                  >
                      <X size={20}/>
                  </button>
                  
                  <div className="mb-6 text-center">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ShoppingBag size={24}/>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Новый продукт</h3>
                  </div>

                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Название</label>
                          <input 
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="Например: Курс по медитации"
                              value={newProduct.name || ''}
                              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                              autoFocus
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Описание и польза</label>
                          <textarea 
                              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm h-32 resize-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="Что это? Какую проблему решает? Какой результат получит клиент?"
                              value={newProduct.description || ''}
                              onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-500 uppercase">Цена (Опционально)</label>
                          <div className="relative">
                              <DollarSign size={16} className="absolute top-3 left-3 text-slate-400"/>
                              <input 
                                  className="w-full pl-9 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                  placeholder="5000 ₽"
                                  value={newProduct.price || ''}
                                  onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                              />
                          </div>
                      </div>
                      
                      <button 
                          onClick={handleAdd}
                          className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all mt-2"
                      >
                          Сохранить
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* PRODUCTS LIST */}
      {products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group relative flex flex-col h-full">
                      <button 
                          onClick={() => handleDelete(product.id)}
                          className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-full"
                          title="Удалить"
                      >
                          <Trash2 size={18}/>
                      </button>
                      
                      <div className="flex items-start gap-4 mb-4">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                              <Package size={20}/>
                          </div>
                          <div>
                              <h3 className="font-bold text-slate-900 text-lg leading-tight pr-6">{product.name}</h3>
                              {product.price && (
                                  <span className="inline-block mt-1 bg-green-50 text-green-700 text-xs px-2 py-0.5 rounded font-bold">
                                      {product.price}
                                  </span>
                              )}
                          </div>
                      </div>
                      
                      <div className="flex-1">
                          <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400 font-medium">
                          <FileText size={14}/>
                          <span>Используется в генерации</span>
                      </div>
                  </div>
              ))}
              
              {/* Add Button as Card */}
              <button 
                  onClick={() => setIsAdding(true)}
                  className="rounded-2xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all min-h-[200px] gap-3 group"
              >
                  <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-white flex items-center justify-center transition-colors">
                      <Plus size={24}/>
                  </div>
                  <span className="font-bold text-sm uppercase tracking-wider">Добавить новый</span>
              </button>
          </div>
      ) : (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <ShoppingBag size={40} className="text-slate-300"/>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Список пуст</h3>
              <p className="text-slate-500 max-w-md mx-auto mb-8">
                  Добавьте свои товары или услуги, чтобы ИИ мог учитывать их особенности и цены при создании контент-плана и постов.
              </p>
              <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                  Добавить первый продукт
              </button>
          </div>
      )}
      
      {/* INFO FOOTER */}
      <div className="flex gap-4 bg-indigo-50 border border-indigo-100 p-4 rounded-xl items-start">
          <Info size={20} className="text-indigo-600 shrink-0 mt-0.5"/>
          <div className="text-sm text-indigo-900">
              <p className="font-bold mb-1">Зачем это нужно?</p>
              <p className="opacity-90">
                  При создании поста в разделе "Календарь" или "Создать" вы сможете выбрать конкретный продукт из этого списка. 
                  ИИ автоматически подтянет его описание, цену и преимущества в контекст, чтобы пост продавал именно то, что нужно.
              </p>
          </div>
      </div>
    </div>
  );
};
