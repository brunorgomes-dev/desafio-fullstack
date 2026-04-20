class ClientModel {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String? cep;
  final String? street;
  final String? number;
  final String? city;
  final String? neighbor;
  final String? state;

  const ClientModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.cep,
    this.street,
    this.number,
    this.city,
    this.neighbor,
    this.state,
  });

  factory ClientModel.fromJson(Map<String, dynamic> json) {
    return ClientModel(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      cep: json['cep'] as String?,
      street: json['street'] as String?,
      number: json['number'] as String?,
      city: json['city'] as String?,
      neighbor: json['neighbor'] as String?,
      state: json['state'] as String?,
    );
  }
}
