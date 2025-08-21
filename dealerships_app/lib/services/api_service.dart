import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:dealerships_app/config.dart';
import 'package:dealerships_app/models/inventory.dart';
import 'package:dealerships_app/models/conversation.dart';

class ApiService {
  static const String baseUrl = Config.backendBaseUrl;
  
  // Headers for API requests with Supabase JWT token
  static Future<Map<String, String>> get _headers async {
    final supabase = Supabase.instance.client;
    final session = supabase.auth.currentSession;
    
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (session?.accessToken != null) {
      headers['Authorization'] = 'Bearer ${session!.accessToken}';
    }
    
    return headers;
  }

  // Inventory API methods
  static Future<List<Inventory>> getInventory() async {
    try {
      final headers = await _headers;
      final response = await http.get(
        Uri.parse('$baseUrl/inventory'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Inventory.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load inventory: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to load inventory: $e');
    }
  }

  static Future<Inventory> createInventory(Inventory inventory) async {
    try {
      final headers = await _headers;
      final response = await http.post(
        Uri.parse('$baseUrl/inventory'),
        headers: headers,
        body: json.encode(inventory.toJson()),
      );

      if (response.statusCode == 201) {
        return Inventory.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to create inventory: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to create inventory: $e');
    }
  }

  static Future<void> deleteInventory(String id) async {
    try {
      final headers = await _headers;
      final response = await http.delete(
        Uri.parse('$baseUrl/inventory/$id'),
        headers: headers,
      );

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception('Failed to delete inventory: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to delete inventory: $e');
    }
  }

  // Conversations API methods
  static Future<List<LeadWithConversationSummary>> getLeadsWithConversations() async {
    try {
      final headers = await _headers;
      final response = await http.get(
        Uri.parse('$baseUrl/me/leads-with-conversations-summary'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => LeadWithConversationSummary.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load conversations: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to load conversations: $e');
    }
  }

  static Future<List<Conversation>> getConversationsByLeadId(String leadId) async {
    try {
      final headers = await _headers;
      final response = await http.get(
        Uri.parse('$baseUrl/leads/$leadId/conversations'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => Conversation.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load conversations: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to load conversations: $e');
    }
  }

  static Future<Conversation> sendMessage(String leadId, String message, String sender) async {
    try {
      final headers = await _headers;
      final response = await http.post(
        Uri.parse('$baseUrl/messages'),
        headers: headers,
        body: json.encode({
          'lead_id': leadId,
          'message': message,
          'sender': sender,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // The backend returns a different format, so let's create a mock conversation
        return Conversation(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          createdAt: DateTime.now().toIso8601String(),
          message: message,
          sender: sender,
          leadId: leadId,
        );
      } else {
        throw Exception('Failed to send message: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Failed to send message: $e');
    }
  }

  // Health check
  static Future<bool> healthCheck() async {
    try {
      final headers = await _headers;
      final response = await http.get(
        Uri.parse('$baseUrl/health'),
        headers: headers,
      );

      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
