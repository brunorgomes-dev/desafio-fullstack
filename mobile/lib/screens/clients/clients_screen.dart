import 'package:flutter/material.dart';

import '../../app_colors.dart';
import '../../models/client_model.dart';
import '../../services/api_service.dart';

class ClientsScreen extends StatefulWidget {
  const ClientsScreen({super.key});

  @override
  State<ClientsScreen> createState() => _ClientsScreenState();
}

class _ClientsScreenState extends State<ClientsScreen> {
  bool _isLoading = true;
  List<ClientModel> _clients = const [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadClients();
  }

  Future<void> _loadClients() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final clients = await ApiService.fetchClients();
      setState(() => _clients = clients);
    } catch (error) {
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showFeedback(
    String message, {
    bool isError = false,
  }) {
    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.danger : AppColors.success,
      ),
    );
  }

  String _errorMessage(Object error) {
    return error.toString().replaceFirst('Exception: ', '');
  }

  Future<void> _openClientForm({ClientModel? client}) async {
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController(text: client?.name ?? '');
    final emailController = TextEditingController(text: client?.email ?? '');
    final phoneController = TextEditingController(text: client?.phone ?? '');
    final cepController = TextEditingController(text: client?.cep ?? '');
    final streetController = TextEditingController(text: client?.street ?? '');
    final numberController = TextEditingController(text: client?.number ?? '');
    final neighborController =
        TextEditingController(text: client?.neighbor ?? '');
    final cityController = TextEditingController(text: client?.city ?? '');
    final stateController = TextEditingController(text: client?.state ?? '');

    final wasSaved = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        var isSaving = false;
        var isLoadingCep = false;

        String cleanCep(String value) => value.replaceAll(RegExp(r'\D'), '');

        Future<void> loadAddressByCep(StateSetter setModalState) async {
          final formattedCep = cleanCep(cepController.text);
          if (formattedCep.length != 8) {
            _showFeedback('Informe um CEP valido com 8 numeros.',
                isError: true);
            return;
          }

          setModalState(() => isLoadingCep = true);

          try {
            final address = await ApiService.searchCep(formattedCep);
            streetController.text = address['street'] ?? '';
            neighborController.text = address['neighbor'] ?? '';
            cityController.text = address['city'] ?? '';
            stateController.text = address['state'] ?? '';
          } catch (error) {
            _showFeedback(_errorMessage(error), isError: true);
          } finally {
            if (dialogContext.mounted) {
              setModalState(() => isLoadingCep = false);
            }
          }
        }

        Future<void> submit(StateSetter setModalState) async {
          if (!formKey.currentState!.validate()) return;
          if (isSaving) return;

          setModalState(() => isSaving = true);

          try {
            if (client == null) {
              await ApiService.createClient(
                name: nameController.text,
                email: emailController.text,
                phone: phoneController.text,
                cep: cepController.text,
                street: streetController.text,
                number: numberController.text,
                neighbor: neighborController.text,
                city: cityController.text,
                state: stateController.text,
              );
            } else {
              await ApiService.updateClient(
                id: client.id,
                name: nameController.text,
                email: emailController.text,
                phone: phoneController.text,
                cep: cepController.text,
                street: streetController.text,
                number: numberController.text,
                neighbor: neighborController.text,
                city: cityController.text,
                state: stateController.text,
              );
            }

            if (dialogContext.mounted) {
              Navigator.of(dialogContext).pop(true);
            }
          } catch (error) {
            _showFeedback(_errorMessage(error), isError: true);
            if (dialogContext.mounted) {
              setModalState(() => isSaving = false);
            }
          }
        }

        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            return Dialog(
              insetPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24)),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(modalContext).size.height * 0.9,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Form(
                    key: formKey,
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            client == null ? 'Novo cliente' : 'Editar cliente',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: nameController,
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(
                              labelText: 'Nome completo',
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Informe o nome do cliente.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: emailController,
                            textInputAction: TextInputAction.next,
                            keyboardType: TextInputType.emailAddress,
                            decoration: const InputDecoration(
                              labelText: 'Email',
                            ),
                            validator: (value) {
                              final normalized = value?.trim() ?? '';
                              if (normalized.isEmpty) {
                                return 'Informe o email do cliente.';
                              }
                              if (!normalized.contains('@')) {
                                return 'Informe um email valido.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: phoneController,
                            textInputAction: TextInputAction.next,
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(
                              labelText: 'Telefone',
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: cepController,
                            textInputAction: TextInputAction.next,
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(
                              labelText: 'CEP',
                              suffixIcon: isLoadingCep
                                  ? const Padding(
                                      padding: EdgeInsets.all(14),
                                      child: SizedBox(
                                        width: 18,
                                        height: 18,
                                        child: CircularProgressIndicator(
                                            strokeWidth: 2),
                                      ),
                                    )
                                  : IconButton(
                                      onPressed: isSaving
                                          ? null
                                          : () =>
                                              loadAddressByCep(setModalState),
                                      icon: const Icon(Icons.search_rounded),
                                      tooltip: 'Buscar CEP',
                                    ),
                            ),
                            onFieldSubmitted: (_) =>
                                loadAddressByCep(setModalState),
                            validator: (value) {
                              if (cleanCep(value ?? '').length != 8) {
                                return 'Informe um CEP valido.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: cityController,
                                  readOnly: true,
                                  decoration: const InputDecoration(
                                    labelText: 'Cidade',
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextFormField(
                                  controller: neighborController,
                                  readOnly: true,
                                  decoration: const InputDecoration(
                                    labelText: 'Bairro',
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  controller: streetController,
                                  readOnly: true,
                                  decoration: const InputDecoration(
                                    labelText: 'Rua',
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              SizedBox(
                                width: 110,
                                child: TextFormField(
                                  controller: numberController,
                                  textInputAction: TextInputAction.next,
                                  decoration: const InputDecoration(
                                    labelText: 'Numero',
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: stateController,
                            readOnly: true,
                            decoration: const InputDecoration(
                              labelText: 'Estado',
                            ),
                          ),
                          const SizedBox(height: 20),
                          Row(
                            children: [
                              Expanded(
                                child: OutlinedButton(
                                  onPressed: isSaving
                                      ? null
                                      : () => Navigator.of(dialogContext)
                                          .pop(false),
                                  child: const Text('Cancelar'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: FilledButton(
                                  onPressed: isSaving
                                      ? null
                                      : () => submit(setModalState),
                                  child: Text(
                                    isSaving
                                        ? 'Salvando...'
                                        : client == null
                                            ? 'Criar'
                                            : 'Salvar',
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            );
          },
        );
      },
    );

    nameController.dispose();
    emailController.dispose();
    phoneController.dispose();
    cepController.dispose();
    streetController.dispose();
    numberController.dispose();
    neighborController.dispose();
    cityController.dispose();
    stateController.dispose();

    if (wasSaved == true) {
      await _loadClients();
      _showFeedback(
        client == null
            ? 'Cliente cadastrado com sucesso.'
            : 'Cliente atualizado com sucesso.',
      );
    }
  }

  Future<void> _confirmDeleteClient(ClientModel client) async {
    final shouldDelete = await showDialog<bool>(
          context: context,
          builder: (dialogContext) {
            return AlertDialog(
              title: const Text('Excluir cliente'),
              content: Text(
                'Deseja realmente excluir ${client.name}? '
                'As tarefas vinculadas tambem podem ser removidas.',
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: const Text('Cancelar'),
                ),
                FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.danger,
                  ),
                  onPressed: () => Navigator.of(dialogContext).pop(true),
                  child: const Text('Excluir'),
                ),
              ],
            );
          },
        ) ??
        false;

    if (!shouldDelete) return;

    try {
      await ApiService.deleteClient(client.id);
      await _loadClients();
      _showFeedback('Cliente excluido com sucesso.');
    } catch (error) {
      _showFeedback(_errorMessage(error), isError: true);
    }
  }

  Widget _buildFloatingCreateButton() {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.only(right: 16, bottom: 16),
        child: Align(
          alignment: Alignment.bottomRight,
          child: FloatingActionButton.extended(
            onPressed: () => _openClientForm(),
            icon: const Icon(Icons.add_rounded),
            label: const Text('Cliente'),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    Widget content;

    if (_error != null) {
      content = _ClientsStateMessage(
        title: 'Erro ao carregar clientes',
        description: _error!,
        onPressed: _loadClients,
      );
    } else if (_clients.isEmpty) {
      content = _ClientsStateMessage(
        title: 'Nenhum cliente encontrado',
        description: 'Cadastre um cliente para iniciar seu fluxo no app.',
        onPressed: _loadClients,
      );
    } else {
      content = RefreshIndicator(
        onRefresh: _loadClients,
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
          itemCount: _clients.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final client = _clients[index];
            final location = [
              client.city,
              client.neighbor,
              client.state,
            ].where((item) => item != null && item.isNotEmpty).join(' - ');

            return Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.primarySoft,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Center(
                        child: Text(
                          client.name.characters.first.toUpperCase(),
                          style: const TextStyle(
                            fontWeight: FontWeight.w900,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Text(
                                  client.name,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                              ),
                              PopupMenuButton<_ClientAction>(
                                icon: const Icon(Icons.more_vert_rounded),
                                tooltip: 'Acoes do cliente',
                                onSelected: (action) {
                                  if (action == _ClientAction.edit) {
                                    _openClientForm(client: client);
                                  } else {
                                    _confirmDeleteClient(client);
                                  }
                                },
                                itemBuilder: (_) => const [
                                  PopupMenuItem(
                                    value: _ClientAction.edit,
                                    child: ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      leading: Icon(Icons.edit_rounded),
                                      title: Text('Editar'),
                                    ),
                                  ),
                                  PopupMenuItem(
                                    value: _ClientAction.delete,
                                    child: ListTile(
                                      contentPadding: EdgeInsets.zero,
                                      leading: Icon(
                                        Icons.delete_outline_rounded,
                                        color: AppColors.danger,
                                      ),
                                      title: Text(
                                        'Excluir',
                                        style:
                                            TextStyle(color: AppColors.danger),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            client.email,
                            style:
                                const TextStyle(color: AppColors.textSecondary),
                          ),
                          if ((client.phone ?? '').isNotEmpty) ...[
                            const SizedBox(height: 8),
                            Text(
                              client.phone!,
                              style: const TextStyle(
                                  color: AppColors.textSecondary),
                            ),
                          ],
                          const SizedBox(height: 8),
                          Text(
                            location.isNotEmpty
                                ? location
                                : 'Endereco nao informado',
                            style:
                                const TextStyle(color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      );
    }

    return Stack(
      children: [
        Positioned.fill(child: content),
        _buildFloatingCreateButton(),
      ],
    );
  }
}

enum _ClientAction { edit, delete }

class _ClientsStateMessage extends StatelessWidget {
  final String title;
  final String description;
  final Future<void> Function() onPressed;

  const _ClientsStateMessage({
    required this.title,
    required this.description,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              description,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: onPressed,
              child: const Text('Atualizar'),
            ),
          ],
        ),
      ),
    );
  }
}
