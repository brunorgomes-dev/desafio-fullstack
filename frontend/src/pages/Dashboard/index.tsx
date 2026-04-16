import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckSquare, 
  LogOut, 
  LayoutDashboard,
  ChevronRight,
  Menu,
  X,
  Plus,
  Search,
  MoreVertical,
  MapPin,
  Loader2
} from 'lucide-react';
import api from '../../services/api';

// --- COMPONENTES AUXILIARES (Para manter o código limpo) ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${
      active 
        ? 'bg-blue-600 text-white shadow-lg' 
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={20} />
    <span className="font-medium text-sm">{label}</span>
    {active && <ChevronRight size={16} className="ml-auto" />}
  </button>
);

const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('clients');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isModalOpen, setModalOpen] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Estados de Dados
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cep: '',
    street: '',
    neighbor: '',
    city: '',
    state: ''
  });

  // 1. Carregar Clientes da API
  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error("Erro ao carregar clientes", error);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // 2. Lógica do CEP (Focada em UX)
  const handleCepBlur = async () => {
    const cleanCep = formData.cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await api.get(`/clients/cep/${cleanCep}`);
        setFormData(prev => ({
          ...prev,
          street: response.data.street,
          neighbor: response.data.neighbor,
          city: response.data.city,
          state: response.data.state
        }));
      } catch (error) {
        alert("CEP não encontrado ou erro na busca.");
      } finally {
        setLoadingCep(false);
      }
    }
  };

  // 3. Salvar Cliente
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      alert("Cliente cadastrado com sucesso!");
      setModalOpen(false);
      setFormData({ name: '', email: '', cep: '', street: '', neighbor: '', city: '', state: '' });
      loadClients();
    } catch (error) {
      alert("Erro ao salvar no banco de dados.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      
      {/* SIDEBAR DARK */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 transition-all duration-300 flex flex-col p-4 z-20 shadow-xl`}>
        <div className="flex items-center justify-between mb-8 px-2">
          {isSidebarOpen && <span className="text-blue-400 font-black text-xl tracking-tighter italic">Dashboard</span>}
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white">
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={LayoutDashboard} label={isSidebarOpen ? "Dashboard" : ""} active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Users} label={isSidebarOpen ? "Clientes" : ""} active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} />
          <SidebarItem icon={CheckSquare} label={isSidebarOpen ? "Tarefas" : ""} active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
        </nav>

        <div className="pt-4 border-t border-gray-800">
           <button className="flex items-center space-x-3 text-gray-400 hover:text-red-400 w-full p-3 transition-colors">
             <LogOut size={20} />
             {isSidebarOpen && <span className="text-sm font-medium">Sair</span>}
           </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* HEADER LIGHT */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
          <span className="font-bold text-gray-400 text-xs uppercase tracking-widest">Desafio Fullstack v2</span>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">B</div>
            <span className="text-sm font-bold text-gray-700">Bruno</span>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              
              {/* TÍTULO E BOTÃO NOVO */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Clientes</h2>
                  <p className="text-gray-500 mt-1">Gestão de contatos e endereços integrados.</p>
                </div>
                <button 
                  onClick={() => setModalOpen(true)}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  <Plus size={20} />
                  <span>Novo Cliente</span>
                </button>
              </div>

              {/* TABELA DE CLIENTES */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pesquisar clientes..." 
                      className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                        <th className="px-6 py-4">Nome</th>
                        <th className="px-6 py-4">Localização</th>
                        <th className="px-6 py-4 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {clients.map((client) => (
                        <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {client.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{client.name}</p>
                                <p className="text-xs text-gray-400">{client.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin size={14} className="mr-1 text-gray-400" />
                              {client.city} - {client.neighbor}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition-all">
                              <MoreVertical size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL DE CADASTRO */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        title="Cadastrar Novo Cliente"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" 
                placeholder="Ex: Brunno Silva" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">E-mail</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" 
                placeholder="exemplo@email.com" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center justify-between">
                CEP {loadingCep && <Loader2 size={12} className="animate-spin text-blue-600" />}
              </label>
              <input 
                type="text" 
                required
                value={formData.cep}
                onChange={e => setFormData({...formData, cep: e.target.value})}
                onBlur={handleCepBlur}
                className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20" 
                placeholder="00000-000" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Cidade</label>
              <input 
                type="text" 
                value={formData.city}
                readOnly
                className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" 
                placeholder="Automático" 
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Rua</label>
            <input 
              type="text" 
              value={formData.street}
              readOnly
              className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" 
              placeholder="Automático" 
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold mt-4 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
          >
            Salvar Cliente
          </button>
        </form>
      </Modal>
    </div>
  );
};