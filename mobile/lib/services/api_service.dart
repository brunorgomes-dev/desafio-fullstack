import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/client_model.dart';
import '../models/task_model.dart';
import '../models/user_model.dart';
import 'auth_storage_service.dart';

class ApiService {
  // Emulador Android usa 10.0.2.2 para acessar o host local.
  static const String baseUrl = String.fromEnvironment('API_BASE_URL',
      defaultValue: 'http://10.0.2.2:3333');

  static Uri _uri(String path, [Map<String, String>? query]) {
    return Uri.parse('$baseUrl$path').replace(queryParameters: query);
  }

  static Future<Map<String, String>> _headers(
      {bool authenticated = false}) async {
    final headers = {
      'Content-Type': 'application/json',
    };

    if (authenticated) {
      final token = await AuthStorageService.getToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return headers;
  }

  static String _extractError(http.Response response) {
    try {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return (data['error'] ?? data['message'] ?? 'Erro inesperado.') as String;
    } catch (_) {
      return 'Erro inesperado.';
    }
  }

  static String? _normalizeOptional(String? value) {
    final trimmed = value?.trim();
    if (trimmed == null || trimmed.isEmpty) {
      return null;
    }

    return trimmed;
  }

  static Future<(String, UserModel)> login({
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      _uri('/auth/login'),
      headers: await _headers(),
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return (
      data['token'] as String,
      UserModel.fromJson(data['user'] as Map<String, dynamic>),
    );
  }

  static Future<void> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final response = await http.post(
      _uri('/auth/register'),
      headers: await _headers(),
      body: jsonEncode({
        'name': name,
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }
  }

  static Future<List<ClientModel>> fetchClients() async {
    final response = await http.get(
      _uri('/clients'),
      headers: await _headers(authenticated: true),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }

    final data = jsonDecode(response.body) as List<dynamic>;
    return data
        .map((item) => ClientModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  static Future<List<TaskModel>> fetchTasks() async {
    final response = await http.get(
      _uri('/tasks'),
      headers: await _headers(authenticated: true),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }

    final data = jsonDecode(response.body) as List<dynamic>;
    return data
        .map((item) => TaskModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  static Future<Map<String, String?>> searchCep(String cep) async {
    final response = await http.get(
      _uri('/clients/cep/$cep'),
      headers: await _headers(authenticated: true),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;
    return {
      'street': data['street'] as String?,
      'neighbor': data['neighbor'] as String?,
      'city': data['city'] as String?,
      'state': data['state'] as String?,
    };
  }

  static Future<void> createClient({
    required String name,
    required String email,
    String? phone,
    String? cep,
    String? street,
    String? number,
    String? neighbor,
    String? city,
    String? state,
  }) async {
    final response = await http.post(
      _uri('/clients'),
      headers: await _headers(authenticated: true),
      body: jsonEncode({
        'name': name.trim(),
        'email': email.trim(),
        'phone': _normalizeOptional(phone),
        'cep': _normalizeOptional(cep),
        'street': _normalizeOptional(street),
        'number': _normalizeOptional(number),
        'neighbor': _normalizeOptional(neighbor),
        'city': _normalizeOptional(city),
        'state': _normalizeOptional(state),
      }),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }
  }

  static Future<void> updateClient({
    required int id,
    required String name,
    required String email,
    String? phone,
    String? cep,
    String? street,
    String? number,
    String? neighbor,
    String? city,
    String? state,
  }) async {
    final response = await http.put(
      _uri('/clients/$id'),
      headers: await _headers(authenticated: true),
      body: jsonEncode({
        'name': name.trim(),
        'email': email.trim(),
        'phone': _normalizeOptional(phone),
        'cep': _normalizeOptional(cep),
        'street': _normalizeOptional(street),
        'number': _normalizeOptional(number),
        'neighbor': _normalizeOptional(neighbor),
        'city': _normalizeOptional(city),
        'state': _normalizeOptional(state),
      }),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }
  }

  static Future<void> deleteClient(int id) async {
    final response = await http.delete(
      _uri('/clients/$id'),
      headers: await _headers(authenticated: true),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }
  }

  static Future<List<TaskModel>> fetchTasksFiltered({
    TaskStatus? status,
    int? clientId,
  }) async {
    final response = await http.get(
      _uri(
        '/tasks',
        {
          if (status != null) 'status': status.apiValue,
          if (clientId != null) 'clientId': '$clientId',
        },
      ),
      headers: await _headers(authenticated: true),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }

    final data = jsonDecode(response.body) as List<dynamic>;
    return data
        .map((item) => TaskModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  static Future<void> createTask({
    required String title,
    required int clientId,
    String? description,
    TaskStatus status = TaskStatus.pending,
    DateTime? dueDate,
  }) async {
    final response = await http.post(
      _uri('/tasks'),
      headers: await _headers(authenticated: true),
      body: jsonEncode({
        'title': title.trim(),
        'description': _normalizeOptional(description),
        'status': status.apiValue,
        'dueDate': dueDate?.toUtc().toIso8601String(),
        'clientId': clientId,
      }),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }
  }

  static Future<void> updateTask({
    required int id,
    required String title,
    required int clientId,
    String? description,
    required TaskStatus status,
    DateTime? dueDate,
  }) async {
    final response = await http.put(
      _uri('/tasks/$id'),
      headers: await _headers(authenticated: true),
      body: jsonEncode({
        'title': title.trim(),
        'description': _normalizeOptional(description),
        'status': status.apiValue,
        'dueDate': dueDate?.toUtc().toIso8601String(),
        'clientId': clientId,
      }),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }
  }

  static Future<void> deleteTask(int id) async {
    final response = await http.delete(
      _uri('/tasks/$id'),
      headers: await _headers(authenticated: true),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }
  }

  static Future<void> updateTaskStatus({
    required int taskId,
    required TaskStatus status,
  }) async {
    final response = await http.patch(
      _uri('/tasks/$taskId/status'),
      headers: await _headers(authenticated: true),
      body: jsonEncode({
        'status': status.apiValue,
      }),
    );

    if (response.statusCode >= 400) {
      throw Exception(_extractError(response));
    }
  }
}
