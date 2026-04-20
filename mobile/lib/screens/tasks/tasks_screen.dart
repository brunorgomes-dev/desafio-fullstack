import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../app_colors.dart';
import '../../models/client_model.dart';
import '../../models/task_model.dart';
import '../../services/api_service.dart';

class TasksScreen extends StatefulWidget {
  const TasksScreen({super.key});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  bool _isLoading = true;
  int? _updatingTaskId;
  List<ClientModel> _clients = const [];
  List<TaskModel> _tasks = const [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTasks();
  }

  Future<void> _loadTasks() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        ApiService.fetchTasks(),
        ApiService.fetchClients(),
      ]);

      setState(() {
        _tasks = results[0] as List<TaskModel>;
        _clients = results[1] as List<ClientModel>;
      });
    } catch (error) {
      setState(() => _error = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _errorMessage(Object error) {
    return error.toString().replaceFirst('Exception: ', '');
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

  Future<void> _updateTaskStatus(TaskModel task, TaskStatus status) async {
    setState(() => _updatingTaskId = task.id);

    try {
      await ApiService.updateTaskStatus(taskId: task.id, status: status);
      await _loadTasks();
      _showFeedback('Status atualizado para ${status.label.toLowerCase()}.');
    } catch (error) {
      _showFeedback(_errorMessage(error), isError: true);
    } finally {
      if (mounted) {
        setState(() => _updatingTaskId = null);
      }
    }
  }

  Future<void> _openTaskForm({TaskModel? task}) async {
    if (_clients.isEmpty) {
      _showFeedback(
        'Cadastre pelo menos um cliente antes de criar tarefas.',
        isError: true,
      );
      return;
    }

    final formKey = GlobalKey<FormState>();
    final titleController = TextEditingController(text: task?.title ?? '');
    final descriptionController =
        TextEditingController(text: task?.description ?? '');

    final wasSaved = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        var isSaving = false;
        var selectedStatus = task?.status ?? TaskStatus.pending;
        var selectedClientId = task?.clientId;
        DateTime? dueDate = task?.dueDate?.toLocal();

        Future<void> pickDueDate(StateSetter setModalState) async {
          final date = await showDatePicker(
            context: dialogContext,
            initialDate: dueDate ?? DateTime.now(),
            firstDate: DateTime(2020),
            lastDate: DateTime(2100),
          );

          if (date == null) return;
          if (!dialogContext.mounted) return;

          final time = await showTimePicker(
            context: dialogContext,
            initialTime: TimeOfDay.fromDateTime(dueDate ?? DateTime.now()),
          );

          if (time == null) return;

          setModalState(() {
            dueDate = DateTime(
              date.year,
              date.month,
              date.day,
              time.hour,
              time.minute,
            );
          });
        }

        Future<void> submit(StateSetter setModalState) async {
          if (!formKey.currentState!.validate()) return;
          if (selectedClientId == null) {
            _showFeedback('Selecione um cliente para continuar.',
                isError: true);
            return;
          }
          if (isSaving) return;

          setModalState(() => isSaving = true);

          try {
            if (task == null) {
              await ApiService.createTask(
                title: titleController.text,
                description: descriptionController.text,
                status: selectedStatus,
                dueDate: dueDate,
                clientId: selectedClientId!,
              );
            } else {
              await ApiService.updateTask(
                id: task.id,
                title: titleController.text,
                description: descriptionController.text,
                status: selectedStatus,
                dueDate: dueDate,
                clientId: selectedClientId!,
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
            final dueDateText = dueDate != null
                ? DateFormat('dd/MM/yyyy HH:mm').format(dueDate!)
                : 'Sem prazo';

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
                            task == null ? 'Nova tarefa' : 'Editar tarefa',
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w900,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: titleController,
                            textInputAction: TextInputAction.next,
                            decoration: const InputDecoration(
                              labelText: 'Titulo',
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Informe o titulo da tarefa.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<int>(
                            initialValue: selectedClientId,
                            decoration: const InputDecoration(
                              labelText: 'Cliente',
                            ),
                            items: _clients
                                .map(
                                  (client) => DropdownMenuItem<int>(
                                    value: client.id,
                                    child: Text(client.name),
                                  ),
                                )
                                .toList(),
                            onChanged: isSaving
                                ? null
                                : (value) => setModalState(
                                    () => selectedClientId = value),
                            validator: (value) {
                              if (value == null) {
                                return 'Selecione um cliente.';
                              }
                              return null;
                            },
                          ),
                          const SizedBox(height: 12),
                          DropdownButtonFormField<TaskStatus>(
                            initialValue: selectedStatus,
                            decoration: const InputDecoration(
                              labelText: 'Status',
                            ),
                            items: TaskStatus.values
                                .map(
                                  (status) => DropdownMenuItem<TaskStatus>(
                                    value: status,
                                    child: Text(status.label),
                                  ),
                                )
                                .toList(),
                            onChanged: isSaving
                                ? null
                                : (value) {
                                    if (value != null) {
                                      setModalState(
                                          () => selectedStatus = value);
                                    }
                                  },
                          ),
                          const SizedBox(height: 12),
                          InputDecorator(
                            decoration: InputDecoration(
                              labelText: 'Prazo',
                              suffixIcon: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (dueDate != null)
                                    IconButton(
                                      onPressed: isSaving
                                          ? null
                                          : () => setModalState(
                                              () => dueDate = null),
                                      icon: const Icon(Icons.close_rounded),
                                      tooltip: 'Limpar prazo',
                                    ),
                                  IconButton(
                                    onPressed: isSaving
                                        ? null
                                        : () => pickDueDate(setModalState),
                                    icon: const Icon(Icons.event_rounded),
                                    tooltip: 'Selecionar prazo',
                                  ),
                                ],
                              ),
                            ),
                            child: Text(
                              dueDateText,
                              style: TextStyle(
                                color: dueDate != null
                                    ? AppColors.textPrimary
                                    : AppColors.textSecondary,
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          TextFormField(
                            controller: descriptionController,
                            maxLines: 4,
                            decoration: const InputDecoration(
                              labelText: 'Descricao',
                              alignLabelWithHint: true,
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
                                        : task == null
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

    titleController.dispose();
    descriptionController.dispose();

    if (wasSaved == true) {
      await _loadTasks();
      _showFeedback(
        task == null
            ? 'Tarefa criada com sucesso.'
            : 'Tarefa atualizada com sucesso.',
      );
    }
  }

  Future<void> _confirmDeleteTask(TaskModel task) async {
    final shouldDelete = await showDialog<bool>(
          context: context,
          builder: (dialogContext) {
            return AlertDialog(
              title: const Text('Excluir tarefa'),
              content: Text('Deseja realmente excluir a tarefa ${task.title}?'),
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
      await ApiService.deleteTask(task.id);
      await _loadTasks();
      _showFeedback('Tarefa excluida com sucesso.');
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
            onPressed: () => _openTaskForm(),
            icon: const Icon(Icons.add_task_rounded),
            label: const Text('Tarefa'),
          ),
        ),
      ),
    );
  }

  Color _statusColor(TaskStatus status) {
    switch (status) {
      case TaskStatus.done:
        return AppColors.success;
      case TaskStatus.doing:
        return AppColors.warning;
      case TaskStatus.pending:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    Widget content;

    if (_error != null) {
      content = _TasksStateMessage(
        title: 'Erro ao carregar tarefas',
        description: _error!,
        onPressed: _loadTasks,
      );
    } else if (_tasks.isEmpty) {
      content = _TasksStateMessage(
        title: 'Nenhuma tarefa encontrada',
        description: 'Cadastre uma tarefa para acompanhar o andamento no app.',
        onPressed: _loadTasks,
      );
    } else {
      content = RefreshIndicator(
        onRefresh: _loadTasks,
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
          itemCount: _tasks.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final task = _tasks[index];
            final dueDateText = task.dueDate != null
                ? DateFormat('dd/MM/yyyy HH:mm').format(task.dueDate!.toLocal())
                : 'Sem prazo';

            return Card(
              child: Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            task.title,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              color: AppColors.textPrimary,
                            ),
                          ),
                        ),
                        Container(
                          margin: const EdgeInsets.only(right: 4, top: 2),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: _statusColor(task.status).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: Text(
                            task.status.label,
                            style: TextStyle(
                              color: _statusColor(task.status),
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        PopupMenuButton<_TaskAction>(
                          icon: const Icon(Icons.more_vert_rounded),
                          tooltip: 'Acoes da tarefa',
                          onSelected: (action) {
                            if (action == _TaskAction.edit) {
                              _openTaskForm(task: task);
                            } else {
                              _confirmDeleteTask(task);
                            }
                          },
                          itemBuilder: (_) => const [
                            PopupMenuItem(
                              value: _TaskAction.edit,
                              child: ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: Icon(Icons.edit_rounded),
                                title: Text('Editar'),
                              ),
                            ),
                            PopupMenuItem(
                              value: _TaskAction.delete,
                              child: ListTile(
                                contentPadding: EdgeInsets.zero,
                                leading: Icon(
                                  Icons.delete_outline_rounded,
                                  color: AppColors.danger,
                                ),
                                title: Text(
                                  'Excluir',
                                  style: TextStyle(color: AppColors.danger),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      task.description?.isNotEmpty == true
                          ? task.description!
                          : 'Sem descricao informada.',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Cliente: ${task.clientName}',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Prazo: $dueDateText',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<TaskStatus>(
                      key: ValueKey('status-${task.id}-${task.status.name}'),
                      initialValue: task.status,
                      onChanged: _updatingTaskId == task.id
                          ? null
                          : (value) {
                              if (value != null) {
                                _updateTaskStatus(task, value);
                              }
                            },
                      decoration: const InputDecoration(
                        labelText: 'Atualizar status',
                      ),
                      items: TaskStatus.values
                          .map(
                            (status) => DropdownMenuItem<TaskStatus>(
                              value: status,
                              child: Text(status.label),
                            ),
                          )
                          .toList(),
                    ),
                    if (_updatingTaskId == task.id) ...[
                      const SizedBox(height: 12),
                      const LinearProgressIndicator(
                        borderRadius: BorderRadius.all(Radius.circular(999)),
                      ),
                    ],
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

enum _TaskAction { edit, delete }

class _TasksStateMessage extends StatelessWidget {
  final String title;
  final String description;
  final Future<void> Function() onPressed;

  const _TasksStateMessage({
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
