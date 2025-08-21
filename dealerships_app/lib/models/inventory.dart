class Inventory {
  final String id;
  final String createdAt;
  final String updatedAt;
  final String make;
  final String model;
  final int year;
  final double price;
  final int? mileage;
  final String? description;
  final String? features;
  final String? condition;
  final String dealershipId;
  final String status;

  Inventory({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    required this.make,
    required this.model,
    required this.year,
    required this.price,
    this.mileage,
    this.description,
    this.features,
    this.condition,
    required this.dealershipId,
    required this.status,
  });

  factory Inventory.fromJson(Map<String, dynamic> json) {
    return Inventory(
      id: json['id'] ?? '',
      createdAt: json['created_at'] ?? '',
      updatedAt: json['updated_at'] ?? '',
      make: json['make'] ?? '',
      model: json['model'] ?? '',
      year: json['year'] ?? 0,
      price: (json['price'] ?? 0).toDouble(),
      mileage: json['mileage'],
      description: json['description'],
      features: json['features'],
      condition: json['condition'],
      dealershipId: json['dealership_id'] ?? '',
      status: json['status'] ?? 'active',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'created_at': createdAt,
      'updated_at': updatedAt,
      'make': make,
      'model': model,
      'year': year,
      'price': price,
      'mileage': mileage,
      'description': description,
      'features': features,
      'condition': condition,
      'dealership_id': dealershipId,
      'status': status,
    };
  }
}
