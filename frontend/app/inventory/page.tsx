'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { inventoryApi } from '@/lib/inventory-api';
import { type Inventory } from '@/lib/supabase';
import { INVENTORY_STATUS, UI } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { PremiumSpinner } from '@/components/ui/premium-spinner';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const data = await inventoryApi.getInventory();
      setInventory(data);
    } catch (error) {
      toast({
        title: "Error loading inventory",
        description: error instanceof Error ? error.message : "Failed to load inventory",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    
    try {
      await inventoryApi.deleteInventory(id);
      setInventory(inventory.filter(item => item.id !== id));
      toast({
        title: "Vehicle deleted",
        description: "The vehicle has been removed from your inventory.",
      });
    } catch (error) {
      toast({
        title: "Error deleting vehicle",
        description: error instanceof Error ? error.message : "Failed to delete vehicle",
        variant: "destructive"
      });
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.year.toString().includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case INVENTORY_STATUS.ACTIVE:
        return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 shadow-sm';
      case INVENTORY_STATUS.SOLD:
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border-red-200 shadow-sm';
      case INVENTORY_STATUS.PENDING:
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 border-amber-200 shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border-gray-200 shadow-sm';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
                  <div className="flex items-center justify-center h-64">
            <PremiumSpinner size="lg" />
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white">
      {/* Header Section */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 border border-amber-200 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-bold text-black mb-2">Inventory Management</h2>
            <p className="text-gray-700 text-lg">Manage your vehicle inventory for AI-powered responses</p>
          </div>
          <Button 
            onClick={() => router.push('/inventory/upload')} 
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3"
          >
            <Plus className="h-5 w-5" />
            Upload Inventory
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Car className="h-6 w-6 text-gray-500" />
              <div>
                <p className="text-sm text-gray-700">Total Vehicles</p>
                <p className="text-3xl font-bold text-black">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full shadow-sm"></div>
              <div>
                <p className="text-sm text-gray-700">Active</p>
                <p className="text-3xl font-bold text-black">
                  {inventory.filter(item => item.status === INVENTORY_STATUS.ACTIVE).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gradient-to-r from-red-400 to-rose-400 rounded-full shadow-sm"></div>
              <div>
                <p className="text-sm text-gray-700">Sold</p>
                <p className="text-3xl font-bold text-black">
                  {inventory.filter(item => item.status === INVENTORY_STATUS.SOLD).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm border-amber-200 shadow-md hover:shadow-lg transition-all duration-200 rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 bg-gradient-to-r from-yellow-400 to-amber-400 rounded-full shadow-sm"></div>
              <div>
                <p className="text-sm text-gray-700">Pending</p>
                <p className="text-3xl font-bold text-black">
                  {inventory.filter(item => item.status === INVENTORY_STATUS.PENDING).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-md rounded-2xl">
        <CardHeader>
          <CardTitle className="text-black text-2xl">Vehicle Inventory</CardTitle>
          <CardDescription className="text-gray-700 text-lg">
            {filteredInventory.length} of {inventory.length} vehicles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search by make, model, or year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 bg-white/90 border-gray-300 text-black placeholder:text-gray-500 focus:border-amber-400 focus:ring-amber-200 h-12 text-lg rounded-xl"
              />
            </div>
          </div>

          {filteredInventory.length === 0 ? (
            <div className="text-center py-12">
              <Car className="mx-auto h-16 w-16 text-gray-400 mb-6" />
              <h4 className="text-xl font-semibold text-gray-700 mb-3">No vehicles found</h4>
              <p className="text-gray-600 mb-8 text-lg">
                {searchTerm ? 'Try adjusting your search terms' : 'Upload your first inventory file to get started'}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => router.push('/inventory/upload')}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl px-6 py-3"
                >
                  Upload Inventory
                </Button>
              )}
            </div>
          ) : (
            <div className="border border-amber-200 rounded-2xl overflow-hidden shadow-md">
              <Table>
                <TableHeader>
                  <TableRow className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
                    <TableHead className="text-gray-700 font-semibold">Vehicle</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Year</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Price</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Mileage</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Status</TableHead>
                    <TableHead className="text-gray-700 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item, index) => (
                    <TableRow 
                      key={item.id} 
                      className="border-amber-200 hover:bg-amber-50/50 transition-all duration-200"
                      style={{ animationDelay: `${index * UI.ANIMATION_DELAY}ms` }}
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold text-black">{item.make} {item.model}</p>
                          {item.description && (
                            <p className="text-sm text-gray-600 truncate max-w-xs">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium">{item.year}</TableCell>
                      <TableCell className="text-gray-700 font-medium">${item.price.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-700 font-medium">
                        {item.mileage ? item.mileage.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(item.status)} text-sm font-medium px-3 py-1 rounded-full`}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              // TODO: Implement edit functionality
                              toast({
                                title: "Edit feature",
                                description: "Edit functionality coming soon!",
                              });
                            }}
                            className="text-gray-500 hover:text-black hover:bg-amber-50 rounded-xl"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 