# SMS Functionality Setup Guide

This guide explains how to set up and use the SMS functionality that allows salespeople to create leads and add inventory by simply texting the dealership number.

## 🚀 Overview

The system provides an intelligent SMS interface where salespeople can:
- **Create leads** by texting customer information
- **Add inventory** by texting vehicle details
- **Get instant confirmation** messages back
- **Work from anywhere** without needing the app

## 📋 Prerequisites

Before setting up the SMS functionality, ensure you have:

1. **Vonage Account** - For SMS sending/receiving
2. **OpenAI API Key** - For intelligent message parsing
3. **Supabase Database** - For storing leads and inventory
4. **Python Environment** - With required dependencies

## 🔧 Setup Steps

### Step 1: Install Dependencies

```bash
# Install required Python packages
pip install -r requirements.txt

# Or if using a virtual environment
source venv/bin/activate
pip install -r requirements.txt
```

### Step 2: Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```env
# OpenAI API Key (required for SMS parsing)
OPENAI_API_KEY=your_actual_openai_api_key_here

# Supabase JWT Secret (for authentication)
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here

# Vonage SMS Configuration
VONAGE_API_KEY=your_vonage_api_key_here
VONAGE_API_SECRET=your_vonage_api_secret_here
VONAGE_PHONE_NUMBER=your_vonage_phone_number_here

# Database configuration (if needed)
SUPABASE_DB_URL=your_supabase_database_url_here
```

### Step 3: Configure Vonage Webhooks

1. **Log into your Vonage dashboard**
2. **Go to Numbers → Manage → Your Number**
3. **Set the webhook URL to:**
   ```
   https://your-domain.com/api/vonage/webhook
   ```
4. **Set the delivery receipt URL to:**
   ```
   https://your-domain.com/api/vonage/delivery
   ```

### Step 4: Register Salespeople

Salespeople must be registered in the system with:
- User profile in Supabase
- Phone number associated with their account
- Role set to "salesperson"
- Associated with the correct dealership

## 📱 How It Works

### 1. Salesperson Sends SMS

Salesperson texts the Vonage number with natural language:

**Lead Creation Example:**
```
I just met Anna Johnson. Her number is 555-123-4567 and her email is anna@gmail.com. She is interested in subarus in the price range of $10K. I met her at the dealership.
```

**Inventory Update Example:**
```
I just picked up a 2006 Toyota Camry off facebook marketplace. It has 123456 miles. It is in good condition. Add it to the inventory
```

### 2. System Processing

1. **Webhook receives SMS** via Vonage
2. **Identifies sender** as a salesperson by phone number
3. **Parses message** using OpenAI LLM for structured data extraction
4. **Creates database records** (lead or inventory item)
5. **Sends confirmation** back to salesperson

### 3. Response to Salesperson

Salesperson receives a confirmation message:

**Lead Creation Response:**
```
✅ Lead created successfully!

Name: Anna Johnson
Phone: 555-123-4567
Email: anna@gmail.com
Car Interest: subarus
Price Range: $10K
Lead ID: abc123

The lead has been assigned to you and added to your pipeline.
```

**Inventory Response:**
```
✅ Vehicle added to inventory!

Year: 2006
Make: Toyota
Model: Camry
Mileage: 123456
Condition: good
Price: TBD
Inventory ID: xyz789

The vehicle is now available in your inventory.
```

## 🧪 Testing the System

### Test the Parser

Run the demo script to see the SMS parsing in action:

```bash
python demo_sms_functionality.py
```

### Test with Real SMS

1. **Send a test SMS** to your Vonage number
2. **Check the webhook logs** for processing
3. **Verify database records** are created
4. **Confirm response** is sent back

## 📝 Supported Message Formats

### Lead Creation

**Standard Format:**
```
I just met [Name]. His/her number is [Phone] and his/her email is [Email]. He/she is interested in [Car Interest] in the price range of [Price]. I met him/her at [Location].
```

**Alternative Formats:**
```
Met [Name] today. Phone: [Phone], Email: [Email]. Interested in [Car Interest] around [Price]

New lead: [Name] - [Phone] - [Email] - [Car Interest] - [Price]
```

### Inventory Updates

**Standard Format:**
```
I just picked up a [Year] [Make] [Model] off [Source]. It has [Mileage] miles. It is in [Condition] condition. Add it to the inventory
```

**Alternative Formats:**
```
New inventory: [Year] [Make] [Model] - [Mileage] miles - [Condition] - [Price]

Add vehicle: [Year] [Make] [Model], [Mileage] miles, [Condition], [Price]
```

### Other Supported Types

- **Lead Inquiries**: "What's the status of lead John Smith?"
- **Inventory Searches**: "Do we have any Honda Civics in stock?"
- **General Questions**: "What's my schedule today?"
- **Status Updates**: "Lead John is coming for test drive tomorrow"
- **Test Drive Scheduling**: "Customer Sarah wants to test drive the 2020 Toyota Camry tomorrow at 2pm"

## 🔍 Troubleshooting

### Common Issues

1. **"Salesperson not found"**
   - Ensure salesperson phone number is registered in the system
   - Check that the phone number format matches (with/without country code)

2. **"Message not recognized"**
   - The LLM couldn't parse the message format
   - Try using one of the supported formats above
   - Check that the message contains the required information

3. **"OpenAI API error"**
   - Verify your OpenAI API key is correct
   - Check that you have sufficient API credits
   - Ensure the API key has access to the required models

4. **"Vonage credentials not configured"**
   - Verify all Vonage environment variables are set
   - Check that the Vonage account is active
   - Ensure the phone number is properly configured

### Debug Mode

Enable detailed logging by setting:

```env
LOG_LEVEL=DEBUG
```

### Check Webhook Logs

Monitor the webhook endpoint logs to see incoming messages and processing:

```bash
# Check your application logs
tail -f your-app.log

# Or check the webhook endpoint directly
curl -X POST https://your-domain.com/api/vonage/webhook \
  -d "msisdn=15551234567&text=Test message"
```

## 🚀 Production Deployment

### Security Considerations

1. **Webhook Signature Verification** - Implement Vonage webhook signature validation
2. **Rate Limiting** - Add rate limiting to prevent abuse
3. **Phone Number Validation** - Validate incoming phone numbers
4. **Error Handling** - Implement proper error handling and logging

### Monitoring

1. **SMS Delivery Status** - Monitor delivery receipts
2. **API Usage** - Track OpenAI API usage and costs
3. **Database Performance** - Monitor lead/inventory creation performance
4. **Error Rates** - Track parsing success rates

### Scaling

1. **Async Processing** - Use async/await for better performance
2. **Queue System** - Implement message queuing for high volume
3. **Load Balancing** - Distribute webhook load across multiple instances
4. **Caching** - Cache frequently accessed data

## 📚 Additional Resources

- [Vonage SMS API Documentation](https://developer.vonage.com/sms/overview)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)

## 🆘 Support

If you encounter issues:

1. **Check the logs** for detailed error messages
2. **Verify configuration** matches the examples above
3. **Test with simple messages** first
4. **Check API quotas** and account status
5. **Review the troubleshooting section** above

## 🎯 Next Steps

Once the SMS functionality is working:

1. **Train your team** on the supported message formats
2. **Monitor usage** and gather feedback
3. **Customize responses** to match your dealership's voice
4. **Add additional features** like appointment scheduling
5. **Integrate with other systems** like CRM or inventory management

---

**Happy texting! 🚗📱**
