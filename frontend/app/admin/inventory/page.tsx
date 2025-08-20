"use client"

import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Car, 
  Upload, 
  Search, 
  Filter,
  Plus,
  Settings,
  Download
} from "lucide-react"
import Link from "next/link"

function InventoryContent() {
  // Mock inventory data
  const inventory = [
    {
      id: '1',
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      price: '$28,500',
      mileage: 15000,
      status: 'active',
      condition: 'Excellent',
      description: 'Well-maintained Camry with low mileage'
    },
    {
      id: '2',
      make: 'Honda',
      model: 'CR-V',
      year: 2024,
      price: '$32,000',
      mileage: 5000,
      status: 'active',
      condition: 'Like New',
      description: 'Brand new CR-V with full warranty'
    },
    {
      id: '3',
      make: 'Ford',
      model: 'F-150',
      year: 2023,
      price: '$45,000',
      mileage: 25000,
      status: 'sold',
      condition: 'Good',
      description: 'Powerful truck with towing package'
    }
  ]

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'sold':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Inventory Management</h1>
          <p className="text-gray-400 mt-2">
            Manage your vehicle inventory and upload new listings
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="border-gray-700 text-gray-300">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Vehicles</CardTitle>
            <Car className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">{inventory.length}</div>
            <p className="text-xs text-gray-400">In inventory</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Listings</CardTitle>
            <div className="w-4 h-4 bg-green-400 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {inventory.filter(item => item.status === 'active').length}
            </div>
            <p className="text-xs text-green-400">Available for sale</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Recently Sold</CardTitle>
            <div className="w-4 h-4 bg-red-400 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">
              {inventory.filter(item => item.status === 'sold').length}
            </div>
            <p className="text-xs text-red-400">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/70 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg. Price</CardTitle>
            <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-100">$35,167</div>
            <p className="text-xs text-gray-400">Per vehicle</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card className="bg-gray-900/70 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Bulk Upload</CardTitle>
          <CardDescription className="text-gray-400">
            Upload multiple vehicles at once using CSV or connect your CRM
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="border-gray-700 text-gray-300 h-20">
              <Upload className="w-6 h-6 mr-2" />
              Upload CSV File
            </Button>
            <Button variant="outline" className="border-gray-700 text-gray-300 h-20">
              <Settings className="w-6 h-6 mr-2" />
              Connect CRM
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Download our CSV template to ensure proper formatting
          </p>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card className="bg-gray-900/70 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search inventory by make, model, or VIN..."
                className="pl-10 bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <Button variant="outline" className="border-gray-700 text-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory List */}
      <div className="space-y-4">
        {inventory.map((item) => (
          <Card key={item.id} className="bg-gray-900/70 border-gray-800 hover:border-gray-700 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-100">
                      {item.year} {item.make} {item.model}
                    </h3>
                    <Badge className={getStatusBadgeColor(item.status)}>
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-400">Price:</span> {item.price}
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-400">Mileage:</span> {item.mileage.toLocaleString()} mi
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-400">Condition:</span> {item.condition}
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-400">VIN:</span> 1HGBH41JXMN109186
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-400">Added:</span> 2 days ago
                      </div>
                      <div className="text-sm text-gray-300">
                        <span className="text-gray-400">Views:</span> 24
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <p className="text-sm text-gray-300">{item.description}</p>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 ml-4">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="border-gray-700 text-gray-300">
                    View Details
                  </Button>
                  <Button size="sm" variant="outline" className="border-gray-700 text-gray-300">
                    Generate Lead
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {inventory.length === 0 && (
          <Card className="bg-gray-900/70 border-gray-800">
            <CardContent className="p-12 text-center">
              <Car className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-200 mb-2">No vehicles in inventory</h3>
              <p className="text-gray-400 mb-4">
                Start by adding your first vehicle or uploading a CSV file.
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Vehicle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="text-gray-400">Loading...</div>}>
      <InventoryContent />
    </Suspense>
  )
}
