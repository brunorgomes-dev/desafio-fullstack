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
  CalendarDays,
  Building2,
  Mail,
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

type TaskStatus = 'PENDING' | 'DOING' | 'DONE';

type Task = {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  dueDate?: string | null;
  clientId: number;
  client?: {
    id: number;
    name: string;
  };
};

type TaskFormData = {
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string;
  clientId: string;
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

type Notification = {
  id: number;
  type: 'success' | 'error';
  title: string;
  message: string;
};

type ActionMenu = {
  entity: 'client' | 'task';
  id: number;
  x: number;
  y: number;
  placement: 'top' | 'bottom';
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

const emptyTaskFormData: TaskFormData = {
  title: '',
  description: '',
  status: 'PENDING',
  dueDate: '',
  clientId: ''
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
    className={`w-full flex items-center rounded-lg transition-all min-h-[52px] cursor-pointer ${
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
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const NotificationToast = ({
  notification,
  onClose
}: {
  notification: Notification;
  onClose: (id: number) => void;
}) => (
  <div
    className={`w-full max-w-sm rounded-2xl border shadow-2xl p-4 backdrop-blur-sm animate-in slide-in-from-right-8 duration-300 ${
      notification.type === 'success'
        ? 'bg-white border-blue-100 shadow-blue-100/70'
        : 'bg-white border-red-100 shadow-red-100/70'
    }`}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <p className={`text-sm font-bold ${notification.type === 'success' ? 'text-blue-700' : 'text-red-600'}`}>
          {notification.title}
        </p>
        <p className="text-sm text-gray-500">{notification.message}</p>
      </div>

      <button
        type="button"
        onClick={() => onClose(notification.id)}
        className="p-1 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer"
      >
        <X size={16} />
      </button>
    </div>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export const Dashboard = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('clients');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isFormModalOpen, setFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [isTaskDeleteModalOpen, setTaskDeleteModalOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('');
  const [taskClientFilter, setTaskClientFilter] = useState('');
  const [openActionMenu, setOpenActionMenu] = useState<ActionMenu | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Estados de dados
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>(emptyTaskFormData);

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
      setOpenActionMenu(null);
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
      showNotification('error', 'Erro ao carregar', 'Nao foi possivel buscar a lista de clientes.');
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  // 1.1 Carregamos as tarefas com filtros vindos da propria API
  const loadTasks = async () => {
    try {
      const response = await api.get('/tasks', {
        params: {
          ...(taskStatusFilter && { status: taskStatusFilter }),
          ...(taskClientFilter && { clientId: taskClientFilter })
        }
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Erro ao carregar tarefas', error);
      showNotification('error', 'Erro ao carregar', 'Nao foi possivel buscar a lista de tarefas.');
    }
  };

  useEffect(() => {
    loadTasks();
  }, [taskStatusFilter, taskClientFilter]);

  const showNotification = (type: Notification['type'], title: string, message: string) => {
    const notificationId = Date.now() + Math.floor(Math.random() * 1000);

    setNotifications((prev) => [
      ...prev,
      {
        id: notificationId,
        type,
        title,
        message
      }
    ]);

    window.setTimeout(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
    }, 3200);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  };

  const filteredClients = clients.filter((client) => {
    const searchValue = searchTerm.toLowerCase();
    const clientLocation = `${client.city || ''} ${client.neighbor || ''}`.toLowerCase();

    return (
      client.name.toLowerCase().includes(searchValue) ||
      client.email.toLowerCase().includes(searchValue) ||
      clientLocation.includes(searchValue)
    );
  });

  const clientsWithLocation = clients.filter((client) => client.city || client.neighbor).length;
  const uniqueCities = new Set(clients.map((client) => client.city).filter(Boolean)).size;
  const filteredTasks = tasks.filter((task) => {
    const searchValue = taskSearchTerm.toLowerCase();
    const descriptionText = task.description?.toLowerCase() || '';
    const clientName = task.client?.name?.toLowerCase() || '';

    return (
      task.title.toLowerCase().includes(searchValue) ||
      descriptionText.includes(searchValue) ||
      clientName.includes(searchValue)
    );
  });
  const pendingTasksCount = tasks.filter((task) => task.status === 'PENDING').length;
  const doingTasksCount = tasks.filter((task) => task.status === 'DOING').length;
  const actionMenuClient =
    openActionMenu?.entity === 'client'
      ? clients.find((client) => client.id === openActionMenu.id) || null
      : null;
  const actionMenuTask =
    openActionMenu?.entity === 'task'
      ? tasks.find((task) => task.id === openActionMenu.id) || null
      : null;

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
    setOpenActionMenu(null);
    setFormModalOpen(true);
  };

  const handleOpenDeleteModal = (client: Client) => {
    setClientToDelete(client);
    setOpenActionMenu(null);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setDeleteModalOpen(false);
    setClientToDelete(null);
  };

  const resetTaskForm = () => {
    setTaskFormData(emptyTaskFormData);
    setSelectedTask(null);
    setTaskModalMode('create');
  };

  const closeTaskModal = () => {
    setTaskModalOpen(false);
    resetTaskForm();
  };

  const handleOpenCreateTaskModal = () => {
    resetTaskForm();
    setTaskModalOpen(true);
  };

  const handleOpenEditTaskModal = (task: Task) => {
    // Reaproveitamos o mesmo modal para manter o padrao visual da tela
    setTaskModalMode('edit');
    setSelectedTask(task);
    setTaskFormData({
      title: task.title || '',
      description: task.description || '',
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '',
      clientId: String(task.clientId)
    });
    setOpenActionMenu(null);
    setTaskModalOpen(true);
  };

  const handleOpenDeleteTaskModal = (task: Task) => {
    setTaskToDelete(task);
    setOpenActionMenu(null);
    setTaskDeleteModalOpen(true);
  };

  const handleCloseDeleteTaskModal = () => {
    setTaskDeleteModalOpen(false);
    setTaskToDelete(null);
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
        showNotification('error', 'CEP nao encontrado', 'Verifique o CEP informado e tente novamente.');
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
        closeFormModal();
        showNotification('success', 'Cliente atualizado', 'Os dados do cliente foram salvos com sucesso.');
      } else {
        await api.post('/clients', formData);
        closeFormModal();
        showNotification('success', 'Cliente cadastrado', 'O novo cliente foi adicionado a sua base.');
      }

      loadClients();
    } catch (error) {
      showNotification('error', 'Erro ao salvar', 'Nao foi possivel salvar o cliente no momento.');
    }
  };

  // 4. Excluir cliente somente apos confirmacao no modal
  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      await api.delete(`/clients/${clientToDelete.id}`);
      handleCloseDeleteModal();
      showNotification('success', 'Cliente excluido', 'O cliente foi removido com sucesso.');
      loadClients();
    } catch (error) {
      showNotification('error', 'Erro ao excluir', 'Nao foi possivel excluir este cliente agora.');
    }
  };

  // 5. Encerrar sessao limpando os dados locais
  const handleLogout = () => {
    localStorage.removeItem('@App:token');
    localStorage.removeItem('@App:user');
    navigate('/login');
  };

  // 6. Criamos ou atualizamos tarefas usando a mesma experiencia visual do modulo de clientes
  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        ...taskFormData,
        dueDate: taskFormData.dueDate || null,
        clientId: Number(taskFormData.clientId)
      };

      if (taskModalMode === 'edit' && selectedTask) {
        await api.put(`/tasks/${selectedTask.id}`, payload);
        closeTaskModal();
        showNotification('success', 'Tarefa atualizada', 'As informacoes da tarefa foram salvas com sucesso.');
      } else {
        await api.post('/tasks', payload);
        closeTaskModal();
        showNotification('success', 'Tarefa criada', 'A nova tarefa foi adicionada com sucesso.');
      }

      loadTasks();
    } catch (error) {
      showNotification('error', 'Erro ao salvar', 'Nao foi possivel salvar a tarefa no momento.');
    }
  };

  // 7. Confirmamos a exclusao da tarefa em um modal proprio para manter o fluxo consistente
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      await api.delete(`/tasks/${taskToDelete.id}`);
      handleCloseDeleteTaskModal();
      showNotification('success', 'Tarefa excluida', 'A tarefa foi removida com sucesso.');
      loadTasks();
    } catch (error) {
      showNotification('error', 'Erro ao excluir', 'Nao foi possivel excluir esta tarefa agora.');
    }
  };

  const getStatusLabel = (status: TaskStatus) => {
    if (status === 'DONE') return 'Concluida';
    if (status === 'DOING') return 'Em andamento';
    return 'Pendente';
  };

  const getStatusClasses = (status: TaskStatus) => {
    if (status === 'DONE') return 'bg-emerald-100 text-emerald-700';
    if (status === 'DOING') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  const handleToggleActionMenu = (
    entity: ActionMenu['entity'],
    id: number,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    if (openActionMenu?.entity === entity && openActionMenu.id === id) {
      setOpenActionMenu(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const estimatedMenuHeight = 120;
    const canOpenBottom = rect.bottom + 8 + estimatedMenuHeight <= window.innerHeight - 8;

    setOpenActionMenu({
      entity,
      id,
      x: rect.right,
      y: canOpenBottom ? rect.bottom + 8 : rect.top - 8,
      placement: canOpenBottom ? 'bottom' : 'top'
    });
  };

  const renderDashboardContent = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* TITULO E RESUMO DA DASHBOARD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard</h2>
          <p className="text-gray-500 mt-1">Uma visao rapida dos seus relacionamentos e dados principais.</p>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-xl shadow-blue-50/70 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-500">Clientes</p>
              <h3 className="text-4xl font-black text-gray-900 mt-3">{clients.length}</h3>
              <p className="text-sm text-gray-500 mt-2">Clientes cadastrados na sua base atual.</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-100 shadow-xl shadow-emerald-50/70 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">Cobertura</p>
              <h3 className="text-4xl font-black text-gray-900 mt-3">{clientsWithLocation}</h3>
              <p className="text-sm text-gray-500 mt-2">Clientes com endereco preenchido automaticamente.</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <MapPin size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 shadow-xl shadow-amber-50/70 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Cidades</p>
              <h3 className="text-4xl font-black text-gray-900 mt-3">{uniqueCities}</h3>
              <p className="text-sm text-gray-500 mt-2">Locais diferentes presentes na sua carteira.</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Building2 size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO DE CONTEXTO RAPIDO */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Resumo rapido</p>
            <h3 className="text-xl font-extrabold text-gray-900 mt-2">Seu ambiente esta pronto para operacao</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-2xl">
              Use a aba de clientes para criar, editar e manter sua base atualizada. A navegacao lateral muda o
              conteudo da tela sem recarregar a aplicacao.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className="inline-flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 cursor-pointer"
          >
            <Users size={18} />
            <span>Ir para clientes</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderClientsContent = () => (
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
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 cursor-pointer"
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
                <th className="px-6 py-4">Contato</th>
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

                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Mail size={14} className="mr-1 text-gray-400 shrink-0" />
                          <span>{client.phone || 'Sem telefone cadastrado'}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={(event) => handleToggleActionMenu('client', client.id, event)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-400">
                    Nenhum cliente encontrado com o filtro informado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTasksContent = () => (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      {/* TITULO E ACAO PRINCIPAL DAS TAREFAS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Tarefas</h2>
          <p className="text-gray-500 mt-1">Organize entregas, acompanhe status e filtre por cliente com fluidez.</p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateTaskModal}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 cursor-pointer"
        >
          <Plus size={20} />
          <span>Nova Tarefa</span>
        </button>
      </div>

      {/* CARDS DE APOIO PARA LEITURA RAPIDA DAS TAREFAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-blue-100 shadow-xl shadow-blue-50/70 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500">Total</p>
          <h3 className="text-4xl font-black text-gray-900 mt-3">{tasks.length}</h3>
          <p className="text-sm text-gray-500 mt-2">Tarefas visiveis com os filtros atuais.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-50/70 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pendentes</p>
          <h3 className="text-4xl font-black text-gray-900 mt-3">{pendingTasksCount}</h3>
          <p className="text-sm text-gray-500 mt-2">Itens aguardando inicio ou definicao de proximo passo.</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-100 shadow-xl shadow-amber-50/70 p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-500">Em andamento</p>
          <h3 className="text-4xl font-black text-gray-900 mt-3">{doingTasksCount}</h3>
          <p className="text-sm text-gray-500 mt-2">Tarefas que ja entraram em execucao.</p>
        </div>
      </div>

      {/* AREA DE FILTROS */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px_220px] gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={taskSearchTerm}
              onChange={(e) => setTaskSearchTerm(e.target.value)}
              placeholder="Pesquisar tarefas..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={taskStatusFilter}
            onChange={(e) => setTaskStatusFilter(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendentes</option>
            <option value="DOING">Em andamento</option>
            <option value="DONE">Concluidas</option>
          </select>

          <select
            value={taskClientFilter}
            onChange={(e) => setTaskClientFilter(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="">Todos os clientes</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABELA DE TAREFAS */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                <th className="px-6 py-4">Tarefa</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Prazo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Acoes</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="font-bold text-gray-800">{task.title}</p>
                        <p className="text-xs text-gray-400">{task.description || 'Sem descricao cadastrada'}</p>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">{task.client?.name || 'Cliente nao informado'}</td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusClasses(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        type="button"
                        onClick={(event) => handleToggleActionMenu('task', task.id, event)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                      >
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-400">
                    Nenhuma tarefa encontrada com os filtros informados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderActiveContent = () => {
    if (activeTab === 'dashboard') return renderDashboardContent();
    if (activeTab === 'tasks') return renderTasksContent();
    return renderClientsContent();
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 overflow-hidden">
      {/* SIDEBAR DARK */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gray-900 transition-all duration-300 flex flex-col p-4 z-20 shadow-xl`}>
        <div className="flex items-center justify-between mb-8 px-2">
          {isSidebarOpen && <span className="text-blue-400 font-black text-xl tracking-tighter italic">EloSys</span>}
          <button
            type="button"
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="text-gray-400 hover:text-white shrink-0 cursor-pointer"
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
            className={`w-full flex items-center rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors min-h-[52px] cursor-pointer ${
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
              className="flex items-center space-x-3 rounded-xl px-3 py-2 hover:bg-gray-100 transition-colors cursor-pointer"
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
                  className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Sair da conta</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* NOTIFICACOES NO CANTO SUPERIOR DIREITO */}
        <div className="fixed top-20 right-6 z-[60] flex flex-col gap-3 pointer-events-none">
          {notifications.map((notification) => (
            <div key={notification.id} className="pointer-events-auto">
              <NotificationToast notification={notification} onClose={removeNotification} />
            </div>
          ))}
        </div>

        {openActionMenu && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpenActionMenu(null)}
          >
            <div
              className="absolute w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50"
              style={{
                top: `${openActionMenu.y}px`,
                left: `${openActionMenu.x}px`,
                transform:
                  openActionMenu.placement === 'bottom'
                    ? 'translateX(-100%)'
                    : 'translate(-100%, -100%)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {openActionMenu.entity === 'client' && actionMenuClient && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(actionMenuClient)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <Pencil size={16} />
                    <span>Editar cliente</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(actionMenuClient)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                    <span>Excluir cliente</span>
                  </button>
                </>
              )}

              {openActionMenu.entity === 'task' && actionMenuTask && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenEditTaskModal(actionMenuTask)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                  >
                    <Pencil size={16} />
                    <span>Editar tarefa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDeleteTaskModal(actionMenuTask)}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                    <span>Excluir tarefa</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">{renderActiveContent()}</div>
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
              <label className="text-xs font-bold text-gray-500 uppercase">Número</label>
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
              <label className="text-xs font-bold text-gray-500 uppercase">Ação</label>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 mt-[18px] cursor-pointer"
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
              Você tem certeza que deseja excluir o cliente{' '}
              <span className="font-bold text-gray-800">{clientToDelete?.name}</span>?
            </p>
            <p className="text-sm text-gray-400">
              Essa ação também pode remover as tarefas vinculadas a esse cliente.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCloseDeleteModal}
              className="w-full py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleDeleteClient}
              className="w-full py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95 cursor-pointer"
            >
              Confirmar exclusão
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL DE CADASTRO E EDICAO DE TAREFAS */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={closeTaskModal}
        title={taskModalMode === 'edit' ? 'Editar Tarefa' : 'Cadastrar Nova Tarefa'}
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Titulo</label>
            <input
              type="text"
              required
              value={taskFormData.title}
              onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="Ex: Ajustar proposta comercial"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Cliente</label>
              <select
                required
                value={taskFormData.clientId}
                onChange={(e) => setTaskFormData({ ...taskFormData, clientId: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Status</label>
              <select
                value={taskFormData.status}
                onChange={(e) => setTaskFormData({ ...taskFormData, status: e.target.value as TaskStatus })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="PENDING">Pendente</option>
                <option value="DOING">Em andamento</option>
                <option value="DONE">Concluida</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <CalendarDays size={14} className="text-gray-400" />
              Prazo
            </label>
            <input
              type="datetime-local"
              value={taskFormData.dueDate}
              onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Descricao</label>
            <textarea
              rows={4}
              value={taskFormData.description}
              onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              placeholder="Detalhes importantes para execucao da tarefa"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 cursor-pointer"
          >
            {taskModalMode === 'edit' ? 'Salvar Tarefa' : 'Criar Tarefa'}
          </button>
        </form>
      </Modal>

      {/* MODAL DE CONFIRMACAO DA EXCLUSAO DE TAREFA */}
      <Modal
        isOpen={isTaskDeleteModalOpen}
        onClose={handleCloseDeleteTaskModal}
        title="Excluir Tarefa"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Voce tem certeza que deseja excluir a tarefa{' '}
              <span className="font-bold text-gray-800">{taskToDelete?.title}</span>?
            </p>
            <p className="text-sm text-gray-400">
              Essa acao remove o item da lista e nao podera ser desfeita por esta tela.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleCloseDeleteTaskModal}
              className="w-full py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleDeleteTask}
              className="w-full py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 transition-all active:scale-95 cursor-pointer"
            >
              Confirmar exclusao
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
