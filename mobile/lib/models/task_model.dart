enum TaskStatus { pending, doing, done }

class TaskModel {
  final int id;
  final String title;
  final String? description;
  final TaskStatus status;
  final DateTime? dueDate;
  final int clientId;
  final String clientName;

  const TaskModel({
    required this.id,
    required this.title,
    required this.description,
    required this.status,
    required this.dueDate,
    required this.clientId,
    required this.clientName,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id'] as int,
      title: json['title'] as String,
      description: json['description'] as String?,
      status: TaskStatusX.fromApi(json['status'] as String),
      dueDate: json['dueDate'] != null
          ? DateTime.tryParse(json['dueDate'] as String)
          : null,
      clientId: json['clientId'] as int,
      clientName: (json['client']?['name'] as String?) ?? 'Cliente',
    );
  }
}

extension TaskStatusX on TaskStatus {
  String get apiValue {
    switch (this) {
      case TaskStatus.pending:
        return 'PENDING';
      case TaskStatus.doing:
        return 'DOING';
      case TaskStatus.done:
        return 'DONE';
    }
  }

  String get label {
    switch (this) {
      case TaskStatus.pending:
        return 'Pendente';
      case TaskStatus.doing:
        return 'Em andamento';
      case TaskStatus.done:
        return 'Concluida';
    }
  }

  static TaskStatus fromApi(String value) {
    switch (value) {
      case 'DOING':
        return TaskStatus.doing;
      case 'DONE':
        return TaskStatus.done;
      default:
        return TaskStatus.pending;
    }
  }
}
