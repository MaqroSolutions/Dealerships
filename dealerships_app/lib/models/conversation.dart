class Lead {
  final String id;
  final String createdAt;
  final String name;
  final String carInterest;
  final String source;
  final String status;
  final String lastContactAt;
  final String? email;
  final String? phone;
  final String? message;
  final String? maxPrice;
  final String userId;
  final List<Conversation>? conversations;

  Lead({
    required this.id,
    required this.createdAt,
    required this.name,
    required this.carInterest,
    required this.source,
    required this.status,
    required this.lastContactAt,
    this.email,
    this.phone,
    this.message,
    this.maxPrice,
    required this.userId,
    this.conversations,
  });

  factory Lead.fromJson(Map<String, dynamic> json) {
    return Lead(
      id: json['id'] ?? '',
      createdAt: json['created_at'] ?? '',
      name: json['name'] ?? '',
      carInterest: json['car_interest'] ?? '',
      source: json['source'] ?? '',
      status: json['status'] ?? 'new',
      lastContactAt: json['last_contact_at'] ?? '',
      email: json['email'],
      phone: json['phone'],
      message: json['message'],
      maxPrice: json['max_price'],
      userId: json['user_id'] ?? '',
      conversations: json['conversations'] != null
          ? List<Conversation>.from(
              json['conversations'].map((x) => Conversation.fromJson(x)))
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'created_at': createdAt,
      'name': name,
      'car_interest': carInterest,
      'source': source,
      'status': status,
      'last_contact_at': lastContactAt,
      'email': email,
      'phone': phone,
      'message': message,
      'max_price': maxPrice,
      'user_id': userId,
      'conversations': conversations?.map((x) => x.toJson()).toList(),
    };
  }
}

class Conversation {
  final String id;
  final String createdAt;
  final String message;
  final String sender;
  final String leadId;

  Conversation({
    required this.id,
    required this.createdAt,
    required this.message,
    required this.sender,
    required this.leadId,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'] ?? '',
      createdAt: json['created_at'] ?? '',
      message: json['message'] ?? '',
      sender: json['sender'] ?? 'customer',
      leadId: json['lead_id'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'created_at': createdAt,
      'message': message,
      'sender': sender,
      'lead_id': leadId,
    };
  }
}

class LeadWithConversationSummary {
  final String id;
  final String name;
  final String carInterest;
  final String status;
  final String lastMessage;
  final String lastMessageTime;
  final int conversationCount;
  final int unreadCount;

  LeadWithConversationSummary({
    required this.id,
    required this.name,
    required this.carInterest,
    required this.status,
    required this.lastMessage,
    required this.lastMessageTime,
    required this.conversationCount,
    required this.unreadCount,
  });

  factory LeadWithConversationSummary.fromJson(Map<String, dynamic> json) {
    return LeadWithConversationSummary(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      carInterest: json['car_interest'] ?? '',
      status: json['status'] ?? 'new',
      lastMessage: json['lastMessage'] ?? '',  // Backend uses camelCase
      lastMessageTime: json['lastMessageTime'] ?? '',  // Backend uses camelCase
      conversationCount: json['conversationCount'] ?? 0,  // Backend uses camelCase
      unreadCount: json['unreadCount'] ?? 0,  // Backend uses camelCase
    );
  }
}
