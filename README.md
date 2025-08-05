# Dealerships

A comprehensive dealership management system with AI-powered customer interactions.

## Features

- **AI-Powered Customer Interactions**: Intelligent chatbot for customer inquiries
- **Inventory Management**: Upload and manage vehicle inventory
- **VinSolutions Integration**: Sync inventory directly from VinSolutions CRM
- **Lead Management**: Track and manage customer leads
- **Analytics Dashboard**: Monitor dealership performance

## VinSolutions API Integration

The system now supports automatic inventory synchronization from VinSolutions CRM. This allows dealerships to:

- Pull vehicle inventory directly from VinSolutions
- Keep inventory data synchronized between systems
- Reduce manual data entry and potential errors

### Setup

1. **Environment Variables**: Add your VinSolutions API credentials to `.env`:
   ```
   VINSOLUTIONS_API_KEY=your_vinsolutions_api_key_here
   VINSOLUTIONS_DEALER_ID=your_vinsolutions_dealer_id_here
   ```

2. **API Access**: Ensure you have access to the VinSolutions Marketing Content API from [Cox Automotive](https://developer.coxautoinc.com/marketingcontent/exploreproducts).

### Usage

- **From Inventory Page**: Click the "Sync VinSolutions" button to pull latest inventory
- **From Upload Page**: Use the VinSolutions sync section as an alternative to file upload

### API Endpoint

The backend provides a `/inventory/pull-vinsolutions` endpoint that:
- Authenticates with VinSolutions API
- Fetches current inventory data
- Transforms data to match local schema
- Bulk imports vehicles to local database

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `env.example` to `.env` and fill in your API keys
4. Run the development server: `npm run dev`

## API Documentation

For detailed API documentation, see the [Cox Automotive Marketing Content API](https://developer.coxautoinc.com/marketingcontent/exploreproducts).