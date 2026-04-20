import 'package:flutter/material.dart';

import '../../app_colors.dart';
import '../../models/client_model.dart';
import '../../models/task_model.dart';
import '../../services/api_service.dart';

class OverviewScreen extends StatefulWidget {
  const OverviewScreen({super.key});

  @override
  State<OverviewScreen> createState() => _OverviewScreenState();
}

class _OverviewScreenState extends State<OverviewScreen> {
  bool _isLoading = true;
  List<ClientModel> _clients = const [];
  List<TaskModel> _tasks = const [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        ApiService.fetchClients(),
        ApiService.fetchTasks(),
      ]);

      setState(() {
        _clients = results[0] as List<ClientModel>;
        _tasks = results[1] as List<TaskModel>;
      });
    } catch (error) {
      setState(() {
        _error = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return _OverviewMessage(
        title: 'Nao foi possivel carregar o resumo',
        description: _error!,
        actionLabel: 'Tentar novamente',
        onPressed: _loadData,
      );
    }

    final pendingTasks =
        _tasks.where((task) => task.status == TaskStatus.pending).length;
    final doingTasks =
        _tasks.where((task) => task.status == TaskStatus.doing).length;

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _StatCard(
            title: 'Clientes',
            value: _clients.length.toString(),
            description: 'Base atual de contatos vinculados a sua conta.',
            borderColor: AppColors.primarySoft,
            accentColor: AppColors.primary,
            icon: Icons.groups_rounded,
          ),
          const SizedBox(height: 12),
          _StatCard(
            title: 'Pendentes',
            value: pendingTasks.toString(),
            description: 'Tarefas aguardando inicio.',
            borderColor: const Color(0xFFE5E7EB),
            accentColor: AppColors.textSecondary,
            icon: Icons.schedule_rounded,
          ),
          const SizedBox(height: 12),
          _StatCard(
            title: 'Em andamento',
            value: doingTasks.toString(),
            description: 'Itens que ja estao em execucao.',
            borderColor: const Color(0xFFFDE68A),
            accentColor: AppColors.warning,
            icon: Icons.timelapse_rounded,
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final String description;
  final Color borderColor;
  final Color accentColor;
  final IconData icon;

  const _StatCard({
    required this.title,
    required this.value,
    required this.description,
    required this.borderColor,
    required this.accentColor,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: borderColor),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: accentColor,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    description,
                    style: const TextStyle(color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                color: accentColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(icon, color: accentColor),
            ),
          ],
        ),
      ),
    );
  }
}

class _OverviewMessage extends StatelessWidget {
  final String title;
  final String description;
  final String actionLabel;
  final Future<void> Function() onPressed;

  const _OverviewMessage({
    required this.title,
    required this.description,
    required this.actionLabel,
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
              child: Text(actionLabel),
            ),
          ],
        ),
      ),
    );
  }
}
