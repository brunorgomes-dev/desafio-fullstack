import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckSquare,
  LogOut,
  LayoutDashboard,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Plus,
  Search,
  MoreVertical,
  MapPin,
  Loader2,
  Pencil,
  Trash2,
  type LucideIcon
} from 'lucide-react';
import api from '../../services/api';

type Client = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  cep?: string;
  street?: string;
  number?: string;
  neighbor?: string;
  city?: string;
  state?: string;
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  neighbor: string;
  city: string;
  state: string;
};

type SidebarItemProps = {
  icon: LucideIcon;
  label: string;
  active: boolean;
  isSidebarOpen: boolean;
  onClick: () => void;
};

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

const emptyFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  cep: '',
  street: '',
  number: '',
  neighbor: '',
  city: '',
  state: ''
};

const getStoredUser = () => {
  try {
    const user = localStorage.getItem('@App:user');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

// --- COMPONENTES AUXILIARES (Para manter o codigo limpo) ---

const SidebarItem = ({ icon: Icon, label, active, isSidebarOpen, onClick }: SidebarItemProps) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center rounded-lg transition-all min-h-[52px] ${
      isSidebarOpen ? 'space-x-3 p-3' : 'justify-center p-3'
    } ${
      active
        ? 'bg-blue-600 text-white shadow-lg'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`}
  >
    <Icon size={isSidebarOpen ? 20 : 24} className="shrink-0" />
    {isSidebarOpen && <span className="font-medium text-sm">{label}</span>}
    {active && isSidebarOpen && <ChevronRight size={16} className="ml-auto shrink-0" />}
  </button>
);

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export const Dashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('clients');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openActionMenuId, setOpenActionMenuId] = useState<number | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Estados de dados
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState<FormData>(emptyFormData);

  // Dados do usuario logado vindos do localStorage salvo no login
  const storedUser = getStoredUser();
  const userFirstName = storedUser?.name?.trim()?.split(' ')[0] || 'Usuario';
  const userInitial = userFirstName.charAt(0).toUpperCase() || 'U';

  // Se nao existir token, voltamos para o login
  useEffect(() => {
    const token = localStorage.getItem('@App:token');

    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Fechamos menus suspensos ao clicar fora deles
  useEffect(() => {
    const handleCloseMenus = () => {
      setUserMenuOpen(false);
      setOpenActionMenuId(null);
    };

    document.addEventListener('click', handleCloseMenus);

    return () => {
      document.removeEventListener('click', handleCloseMenus);
    };
  }, []);

  // 1. Carregar clientes da API
  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Erro ao carregar clientes', error);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const searchValue = searchTerm.toLowerCase();
    const clientLocation = `${client.city || ''} ${client.neighbor || ''}`.toLowerCase();

    return (
      client.name.toLowerCase().includes(searchValue) ||
      client.email.toLowerCase().includes(searchValue) ||
      clientLocation.includes(searchValue)
    );
  });

  const resetForm = () => {
    setFormData(emptyFormData);
    setSelectedClient(null);
    setModalMode('create');
    setLoadingCep(false);
  };

  const closeFormModal = () => {
    setFormModalOpen(false);
    resetForm();
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setFormModalOpen(true);
  };

  const handleOpenEditModal = (client: Client) => {
    // Preenchemos o formulario com os dados do cliente para editar no mesmo modal
    setModalMode('edit');
    setSelectedClient(client);
    setFormData({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      cep: client.cep || '',
      street: client.street || '',
      number: client.number || '',
      neighbor: client.neighbor || '',
      city: client.city || '',
      state: client.state || ''
    });
    setOpenActionMenuId(null);
    setFormModalOpen(true);
  };

  const handleOpenDeleteModal = (client: Client) => {
    setClientToDelete(client);
    setOpenActionMenuId(null);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setClientToDelete(null);
  };

  // 2. Logica do CEP focada na UX do formulario
  const handleCepBlur = async () => {
    const cleanCep = formData.cep.replace(/\D/g, '');

    if (cleanCep.length === 8) {
      setLoadingCep(true);

      try {
        const response = await api.get(`/clients/cep/${cleanCep}`);
        setFormData((prev) => ({
          ...prev,
          street: response.data.street || '',
          neighbor: response.data.neighbor || '',
          city: response.data.city || '',
          state: response.data.state || ''
        }));
      } catch (error) {
        alert('CEP nao encontrado ou erro na busca.');
      } finally {
        setLoadingCep(false);
      }
    }
  };

  // 3. Criar ou atualizar cliente no mesmo fluxo do modal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalMode === 'edit' && selectedClient) {
        await api.put(`/clients/${selectedClient.id}`, formData);
        alert('Cliente atualizado com sucesso!');
      } else {
        await api.post('/clients', formData);
        alert('Cliente cadastrado com sucesso!');
      }

      closeFormModal();
      loadClients();
    } catch (error) {
      alert('Erro ao salvar no banco de dados.');
    }
  };

  // 4. Excluir cliente somente apos confirmacao no modal
  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      await api.delete(`/clients/${clientToDelete.id}`);
      alert('Cliente excluido com sucesso!');
      handleCloseDeleteModal();
      loadClients();
    } catch (error) {
      alert('Erro ao excluir cliente.');
    }
  };

  // 5. Encerrar sessao limpando os dados locais
  const handleLogout = () => {
    localStorage.removeItem('@App:token');
    localStorage.removeItem('@App:user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* SIDEBAR DARK */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 transition-all duration-300 flex flex-col p-4 z-20 shadow-xl`}>
        <div className="flex items-center justify-between mb-8 px-2">
          {isSidebarOpen && <span className="text-blue-400 font-black text-xl tracking-tighter italic">Dashboard</span>}
          <button
            type="button"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="text-gray-400 hover:text-white shrink-0"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            active={activeTab === 'dashboard'}
            isSidebarOpen={isSidebarOpen}
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarItem
            icon={Users}
            label="Clientes"
            active={activeTab === 'clients'}
            isSidebarOpen={isSidebarOpen}
            onClick={() => setActiveTab('clients')}
          />
          <SidebarItem
            icon={CheckSquare}
            label="Tarefas"
            active={activeTab === 'tasks'}
            isSidebarOpen={isSidebarOpen}
            onClick={() => setActiveTab('tasks')}
          />
        </nav>

        <div className="pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors min-h-[52px] ${
              isSidebarOpen ? 'space-x-3 p-3' : 'justify-center p-3'
            }`}
          >
            <LogOut size={isSidebarOpen ? 20 : 24} className="shrink-0" />
            {isSidebarOpen && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* AREA DE CONTEUDO */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER LIGHT */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
          <span className="font-bold text-gray-400 text-xs uppercase tracking-widest">Desafio Fullstack v2</span>

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {userInitial}
              </div>
              <span className="text-sm font-bold text-gray-700">{userFirstName}</span>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-30">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sair da conta</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              {/* TITULO E BOTAO NOVO */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Clientes</h2>
                  <p className="text-gray-500 mt-1">Gestao de contatos e enderecos integrados.</p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                  <Plus size={20} />
                  <span>Novo Cliente</span>
                </button>
              </div>

              {/* TABELA DE CLIENTES */}
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
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
                        <th className="px-6 py-4">Localizacao</th>
                        <th className="px-6 py-4 text-center">Acoes</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-50">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client) => {
                          const locationText = [client.city, client.neighbor].filter(Boolean).join(' - ');

                          return (
                            <tr key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                    {client.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-gray-800">{client.name}</p>
                                    <p className="text-xs text-gray-400">{client.email}</p>
                                  </div>
                                </div>
                              </td>

                              <td className="px-6 py-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <MapPin size={14} className="mr-1 text-gray-400 shrink-0" />
                                  <span>{locationText || 'Endereco nao informado'}</span>
                                </div>
                              </td>

                              <td className="px-6 py-4 text-center">
                                <div className="relative inline-flex" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenActionMenuId(openActionMenuId === client.id ? null : client.id)
                                    }
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  >
                                    <MoreVertical size={18} />
                                  </button>

                                  {openActionMenuId === client.id && (
                                    <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-30">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditModal(client)}
                                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                      >
                                        <Pencil size={16} />
                                        <span>Editar cliente</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleOpenDeleteModal(client)}
                                        className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                                      >
                                        <Trash2 size={16} />
                                        <span>Excluir cliente</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center text-sm text-gray-400">
                            Nenhum cliente encontrado com o filtro informado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL DE CADASTRO E EDICAO */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={closeFormModal}
        title={modalMode === 'edit' ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="exemplo@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Telefone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center justify-between">
                CEP {loadingCep && <Loader2 size={12} className="animate-spin text-blue-600" />}
              </label>
              <input
                type="text"
                required
                value={formData.cep}
                onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                onBlur={handleCepBlur}
                className="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="00000-000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Cidade</label>
              <input
                type="text"
                value={formData.city}
                readOnly
                className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                placeholder="Automatico"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Bairro</label>
              <input
                type="text"
                value={formData.neighbor}
                readOnly
                className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                placeholder="Automatico"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_140px] gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Rua</label>
              <input
                type="text"
                value={formData.street}
                readOnly
                className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                placeholder="Automatico"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Numero</label>
              <input
                type="text"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_110px] gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Estado</label>
              <input
                type="text"
                value={formData.state}
                readOnly
                className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
                placeholder="Automatico"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Acao</label>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 mt-[18px]"
              >
                {modalMode === 'edit' ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL DE CONFIRMACAO DA EXCLUSAO */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        title="Excluir Cliente"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Voce tem certeza que deseja excluir o cliente{' '}
              <span className="font-bold text-gray-800">{clientToDelete?.name}</span>?
            </p>
            <p className="text-sm text-gray-400">
              Essa acao tambem pode remover as tarefas vinculadas a esse cliente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCloseDeleteModal}
              className="w-full py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleDeleteClient}
              className="w-full py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95"
            >
              Confirmar exclusao
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
