'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Edit, Trash2, Car, Download, Upload, Settings, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inventoryApi, type CreateInventoryData } from '@/lib/inventory-api';
import { type Inventory } from '@/lib/supabase';
import { INVENTORY_STATUS, UI } from '@/lib/constants';
import { useToast } from '@/components/ui/use-toast';
import { useUserRole } from '@/hooks/use-user-role';

export default function AdminInventoryPage() {
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    condition: 'all',
    minPrice: '',
    maxPrice: '',
    minYear: '',
    maxYear: ''
  });
  const [sortBy, setSortBy] = useState<'alphabetical' | 'price-high' | 'price-low'>('alphabetical');
  const [formData, setFormData] = useState<CreateInventoryData>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: '',
    mileage: undefined,
    description: '',
    features: '',
    condition: '',
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { role } = useUserRole();

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

  const resetForm = () => {
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      price: '',
      mileage: undefined,
      description: '',
      features: '',
      condition: '',
      status: 'active'
    });
  };

  const handleAddVehicle = async () => {
    if (!formData.make || !formData.model || !formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (make, model, price)",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newVehicle = await inventoryApi.createInventory(formData);
      setInventory([...inventory, newVehicle]);
      setIsAddModalOpen(false);
      resetForm();
      toast({
        title: "Vehicle added",
        description: `${formData.year} ${formData.make} ${formData.model} has been added to your inventory.`,
      });
    } catch (error) {
      toast({
        title: "Error adding vehicle",
        description: error instanceof Error ? error.message : "Failed to add vehicle",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVehicle = async () => {
    if (!editingItem || !formData.make || !formData.model || !formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert formData to match the backend's InventoryUpdate schema
      const updateData = {
        make: formData.make,
        model: formData.model,
        year: formData.year,
        price: formData.price,
        mileage: formData.mileage,
        description: formData.description,
        features: formData.features,
        condition: formData.condition,
        status: formData.status
      };
      
      const updatedVehicle = await inventoryApi.updateInventory(editingItem.id, updateData);
      setInventory(inventory.map(item => item.id === editingItem.id ? updatedVehicle : item));
      setIsEditModalOpen(false);
      setEditingItem(null);
      resetForm();
      toast({
        title: "Vehicle updated",
        description: `${formData.year} ${formData.make} ${formData.model} has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Error updating vehicle",
        description: error instanceof Error ? error.message : "Failed to update vehicle",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await inventoryApi.uploadInventory(uploadFile);
      
      if (result.successCount > 0) {
        // Reload inventory to show new items
        await loadInventory();
        toast({
          title: "Upload successful", 
          description: `${result.successCount} vehicles uploaded and ${result.embeddingsGenerated || 0} embeddings generated for AI search.`,
        });
        setIsUploadModalOpen(false);
        setUploadFile(null);
      }
      
      if (result.errorCount > 0) {
        toast({
          title: "Upload completed with errors",
          description: `${result.errorCount} rows failed to upload.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const isValidType = ['.csv', '.xlsx', '.xls'].some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    
    if (isValidType) {
      setUploadFile(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV or Excel file.",
        variant: "destructive"
      });
    }
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      condition: 'all',
      minPrice: '',
      maxPrice: '',
      minYear: '',
      maxYear: ''
    });
  };

  const hasActiveFilters = () => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'status' || key === 'condition') {
        return value !== 'all';
      }
      return value !== '';
    });
  };

  const openEditModal = (item: Inventory) => {
    setEditingItem(item);
    setFormData({
      make: item.make,
      model: item.model,
      year: item.year,
      price: item.price.toString(),
      mileage: item.mileage || undefined,
      description: item.description || '',
      features: item.features || '',
      condition: item.condition || '',
      status: item.status
    });
    setIsEditModalOpen(true);
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

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} vehicles?`)) return;
    
    try {
      // Delete each selected item
      for (const id of selectedItems) {
        await inventoryApi.deleteInventory(id);
      }
      
      // Remove deleted items from state
      setInventory(inventory.filter(item => !selectedItems.includes(item.id)));
      setSelectedItems([]);
      
      toast({
        title: "Vehicles deleted",
        description: `${selectedItems.length} vehicles have been removed from your inventory.`,
      });
    } catch (error) {
      toast({
        title: "Error deleting vehicles",
        description: error instanceof Error ? error.message : "Failed to delete vehicles",
        variant: "destructive"
      });
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === sortedInventory.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sortedInventory.map(item => item.id));
    }
  };

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const filteredInventory = inventory.filter(item => {
    // Search filter
    const matchesSearch = !searchTerm || 
      item.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.year.toString().includes(searchTerm);
    
    if (!matchesSearch) return false;
    
    // Status filter
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    
    // Condition filter
    if (filters.condition !== 'all' && item.condition !== filters.condition) return false;
    
    // Price range filter
    const itemPrice = parseFloat(item.price.toString());
    if (filters.minPrice && itemPrice < parseFloat(filters.minPrice)) return false;
    if (filters.maxPrice && itemPrice > parseFloat(filters.maxPrice)) return false;
    
    // Year range filter
    if (filters.minYear && item.year < parseInt(filters.minYear)) return false;
    if (filters.maxYear && item.year > parseInt(filters.maxYear)) return false;
    
    return true;
  });

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical':
        const aName = `${a.make} ${a.model}`.toLowerCase();
        const bName = `${b.make} ${b.model}`.toLowerCase();
        return aName.localeCompare(bName);
      
      case 'price-high':
        const aPrice = parseFloat(a.price.toString());
        const bPrice = parseFloat(b.price.toString());
        return bPrice - aPrice; // High to low
      
      case 'price-low':
        const aPriceLow = parseFloat(a.price.toString());
        const bPriceLow = parseFloat(b.price.toString());
        return aPriceLow - bPriceLow; // Low to high
      
      default:
        return 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case INVENTORY_STATUS.ACTIVE:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case INVENTORY_STATUS.SOLD:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case INVENTORY_STATUS.PENDING:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <div className={`animate-spin rounded-full border-b-2 border-blue-500 ${UI.LOADING_SPINNER_SIZE}`}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/30 rounded-xl p-8 border border-gray-800">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold text-gray-100 mb-2">Inventory Management</h2>
            <p className="text-gray-400 text-lg">Admin dashboard for comprehensive inventory control</p>
        </div>
        <div className="flex space-x-2">
            <Button 
              variant="outline" 
              className="border-gray-700 text-gray-300"
              onClick={() => {
                toast({
                  title: "Export feature",
                  description: "Export functionality coming soon!",
                });
              }}
            >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
                         <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
               <DialogTrigger asChild>
                 <Button variant="outline" className="border-gray-700 text-gray-300">
                   <Upload className="w-4 h-4 mr-2" />
                   Bulk Upload
                 </Button>
               </DialogTrigger>
               <DialogContent className="max-w-2xl bg-gray-900 border-gray-800">
                 <DialogHeader>
                   <DialogTitle className="text-gray-100">Bulk Upload Inventory</DialogTitle>
                   <DialogDescription className="text-gray-400">
                     Upload a CSV or Excel file with your vehicle inventory
                   </DialogDescription>
                 </DialogHeader>
                 <div className="space-y-4">
                   <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                     <Upload className="mx-auto h-8 w-8 text-gray-500 mb-2" />
                     <p className="text-gray-300 mb-2">
                       {uploadFile ? uploadFile.name : 'Drag and drop your file here'}
                     </p>
                     <p className="text-sm text-gray-400">or click to browse</p>
                     <input
                       type="file"
                       accept=".csv,.xlsx,.xls"
                       className="hidden"
                       id="bulk-upload"
                       onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) handleFileSelect(file);
                       }}
                     />
                     <label htmlFor="bulk-upload">
                       <Button asChild className="mt-2 bg-blue-600 hover:bg-blue-700">
                         <span>Choose File</span>
                       </Button>
                     </label>
                   </div>
                   {uploadFile && (
                     <div className="bg-gray-800/50 p-3 rounded-lg">
                       <p className="text-sm text-gray-300">
                         File selected: <span className="font-medium">{uploadFile.name}</span>
                       </p>
                       <p className="text-xs text-gray-400 mt-1">
                         Size: {(uploadFile.size / 1024).toFixed(1)} KB
                       </p>
                     </div>
                   )}
                   <div className="flex justify-end space-x-2">
                     <Button variant="outline" onClick={() => {
                       setIsUploadModalOpen(false);
                       setUploadFile(null);
                     }}>
                       Cancel
                     </Button>
                     <Button 
                       onClick={handleBulkUpload}
                       disabled={!uploadFile || isUploading}
                       className="bg-blue-600 hover:bg-blue-700"
                     >
                       {isUploading ? (
                         <>
                           <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                           Uploading...
                         </>
                       ) : (
                         'Upload'
                       )}
                     </Button>
                   </div>
                 </div>
               </DialogContent>
             </Dialog>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
            Add Vehicle
          </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-gray-100">Add New Vehicle</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Add a new vehicle to your inventory
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="make" className="text-gray-300">Make *</Label>
                      <Input
                        id="make"
                        value={formData.make}
                        onChange={(e) => setFormData({...formData, make: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-gray-100"
                        placeholder="Toyota"
                      />
                    </div>
                    <div>
                      <Label htmlFor="model" className="text-gray-300">Model *</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => setFormData({...formData, model: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-gray-100"
                        placeholder="Camry"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="year" className="text-gray-300">Year *</Label>
                      <Input
                        id="year"
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                        className="bg-gray-800 border-gray-700 text-gray-100"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                                         <div>
                       <Label htmlFor="price" className="text-gray-300">Price *</Label>
                       <Input
                         id="price"
                         type="number"
                         value={formData.price}
                         onChange={(e) => setFormData({...formData, price: e.target.value})}
                         className="bg-gray-800 border-gray-700 text-gray-100"
                         min="0"
                         placeholder="25000"
                       />
                     </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mileage" className="text-gray-300">Mileage</Label>
                      <Input
                        id="mileage"
                        type="number"
                        value={formData.mileage || ''}
                        onChange={(e) => setFormData({...formData, mileage: e.target.value ? parseInt(e.target.value) : undefined})}
                        className="bg-gray-800 border-gray-700 text-gray-100"
                        min="0"
                        placeholder="15000"
                      />
                    </div>
                    <div>
                      <Label htmlFor="condition" className="text-gray-300">Condition</Label>
                      <Select value={formData.condition} onValueChange={(value) => setFormData({...formData, condition: value})}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700">
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-gray-300">Status</Label>
                    <Select value={formData.status} onValueChange={(value: 'active' | 'sold' | 'pending') => setFormData({...formData, status: value})}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-gray-300">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-gray-100"
                      placeholder="Vehicle description..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="features" className="text-gray-300">Features</Label>
                    <Textarea
                      id="features"
                      value={formData.features}
                      onChange={(e) => setFormData({...formData, features: e.target.value})}
                      className="bg-gray-800 border-gray-700 text-gray-100"
                      placeholder="Key features, separated by commas..."
                      rows={2}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddVehicle}
                      disabled={isSubmitting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? 'Adding...' : 'Add Vehicle'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Car className="h-6 w-6 text-blue-500" />
              <div>
                <p className="text-sm text-gray-400">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-100">{inventory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-400">Active</p>
                <p className="text-2xl font-bold text-gray-100">
                  {inventory.filter(item => item.status === INVENTORY_STATUS.ACTIVE).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-400">Sold</p>
                <p className="text-2xl font-bold text-gray-100">
                  {inventory.filter(item => item.status === INVENTORY_STATUS.SOLD).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900/50 border-gray-800 hover:bg-gray-900/70 transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-gray-100">
                  {inventory.filter(item => item.status === INVENTORY_STATUS.PENDING).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Vehicle Inventory</CardTitle>
          <CardDescription className="text-gray-400">
            {sortedInventory.length} of {inventory.length} vehicles
            {selectedItems.length > 0 && ` • ${selectedItems.length} selected`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by make, model, or year..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
              />
            </div>
            <Dialog open={isFilterModalOpen} onOpenChange={setIsFilterModalOpen}>
              <DialogTrigger asChild>
            <Button variant="outline" className="border-gray-700 text-gray-300">
              <Filter className="w-4 h-4 mr-2" />
              Filter
                  {hasActiveFilters() && (
                    <Badge variant="secondary" className="ml-2 bg-blue-500 text-white">
                      Active
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-gray-900 border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-gray-100">Filter Inventory</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Filter vehicles by various criteria
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="filter-status" className="text-gray-300">Status</Label>
                                         <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                       <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                         <SelectValue placeholder="All statuses" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700">
                         <SelectItem value="all">All statuses</SelectItem>
                         <SelectItem value="active">Active</SelectItem>
                         <SelectItem value="sold">Sold</SelectItem>
                         <SelectItem value="pending">Pending</SelectItem>
                       </SelectContent>
                     </Select>
                  </div>
                  <div>
                    <Label htmlFor="filter-condition" className="text-gray-300">Condition</Label>
                                         <Select value={filters.condition} onValueChange={(value) => setFilters({...filters, condition: value})}>
                       <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                         <SelectValue placeholder="All conditions" />
                       </SelectTrigger>
                       <SelectContent className="bg-gray-800 border-gray-700">
                         <SelectItem value="all">All conditions</SelectItem>
                         <SelectItem value="excellent">Excellent</SelectItem>
                         <SelectItem value="good">Good</SelectItem>
                         <SelectItem value="fair">Fair</SelectItem>
                         <SelectItem value="poor">Poor</SelectItem>
                       </SelectContent>
                     </Select>
                      </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min-price" className="text-gray-300">Min Price</Label>
                      <Input
                        id="min-price"
                        type="number"
                        value={filters.minPrice}
                        onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-gray-100"
                        placeholder="0"
                        min="0"
                      />
                      </div>
                    <div>
                      <Label htmlFor="max-price" className="text-gray-300">Max Price</Label>
                      <Input
                        id="max-price"
                        type="number"
                        value={filters.maxPrice}
                        onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-gray-100"
                        placeholder="100000"
                        min="0"
                      />
                    </div>
                      </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min-year" className="text-gray-300">Min Year</Label>
                      <Input
                        id="min-year"
                        type="number"
                        value={filters.minYear}
                        onChange={(e) => setFilters({...filters, minYear: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-gray-100"
                        placeholder="1900"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-year" className="text-gray-300">Max Year</Label>
                      <Input
                        id="max-year"
                        type="number"
                        value={filters.maxYear}
                        onChange={(e) => setFilters({...filters, maxYear: e.target.value})}
                        className="bg-gray-800 border-gray-700 text-gray-100"
                        placeholder={new Date().getFullYear().toString()}
                        min="1900"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                    <Button onClick={() => setIsFilterModalOpen(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Select value={sortBy} onValueChange={(value: 'alphabetical' | 'price-high' | 'price-low') => setSortBy(value)}>
              <SelectTrigger className="w-48 bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="alphabetical">Alphabetical (A-Z)</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
              </SelectContent>
            </Select>
            {selectedItems.length > 0 && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedItems.length})
              </Button>
            )}
                </div>
                
          {sortedInventory.length === 0 ? (
            <div className="text-center py-12">
              <Car className="mx-auto h-12 w-12 text-gray-500 mb-4" />
              <h4 className="text-lg font-semibold text-gray-300 mb-2">No vehicles found</h4>
              <p className="text-gray-400 mb-6">
                {searchTerm ? 'Try adjusting your search terms' : 'Add your first vehicle to get started'}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Add Vehicle
                  </Button>
              )}
            </div>
          ) : (
            <div className="border border-gray-800 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 bg-gray-800/50">
                    <TableHead className="text-gray-300 font-medium w-12">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === sortedInventory.length && sortedInventory.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                      />
                    </TableHead>
                    <TableHead className="text-gray-300 font-medium">Vehicle</TableHead>
                    <TableHead className="text-gray-300 font-medium">Year</TableHead>
                    <TableHead className="text-gray-300 font-medium">Price</TableHead>
                    <TableHead className="text-gray-300 font-medium">Mileage</TableHead>
                    <TableHead className="text-gray-300 font-medium">Status</TableHead>
                    <TableHead className="text-gray-300 font-medium">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedInventory.map((item, index) => (
                    <TableRow 
                      key={item.id} 
                      className="border-gray-800 hover:bg-gray-800/50 transition-all duration-200"
                      style={{ animationDelay: `${index * UI.ANIMATION_DELAY}ms` }}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-100">{item.make} {item.model}</p>
                          {item.description && (
                            <p className="text-sm text-gray-400 truncate max-w-xs">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300">{item.year}</TableCell>
                      <TableCell className="text-gray-300">${item.price.toLocaleString()}</TableCell>
                      <TableCell className="text-gray-300">
                        {item.mileage ? item.mileage.toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(item.status)} border`}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(item)}
                          className="text-gray-400 hover:text-gray-300 hover:bg-gray-800"
                        >
                          <Edit className="h-4 w-4" />
                  </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Edit Vehicle</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update vehicle information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-make" className="text-gray-300">Make *</Label>
                <Input
                  id="edit-make"
                  value={formData.make}
                  onChange={(e) => setFormData({...formData, make: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                  placeholder="Toyota"
                />
              </div>
              <div>
                <Label htmlFor="edit-model" className="text-gray-300">Model *</Label>
                <Input
                  id="edit-model"
                  value={formData.model}
                  onChange={(e) => setFormData({...formData, model: e.target.value})}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                  placeholder="Camry"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-year" className="text-gray-300">Year *</Label>
                <Input
                  id="edit-year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                />
              </div>
                             <div>
                 <Label htmlFor="edit-price" className="text-gray-300">Price *</Label>
                 <Input
                   id="edit-price"
                   type="number"
                   value={formData.price}
                   onChange={(e) => setFormData({...formData, price: e.target.value})}
                   className="bg-gray-800 border-gray-700 text-gray-100"
                   min="0"
                   placeholder="25000"
                 />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-mileage" className="text-gray-300">Mileage</Label>
                <Input
                  id="edit-mileage"
                  type="number"
                  value={formData.mileage || ''}
                  onChange={(e) => setFormData({...formData, mileage: e.target.value ? parseInt(e.target.value) : undefined})}
                  className="bg-gray-800 border-gray-700 text-gray-100"
                  min="0"
                  placeholder="15000"
                />
                </div>
              <div>
                <Label htmlFor="edit-condition" className="text-gray-300">Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => setFormData({...formData, condition: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-status" className="text-gray-300">Status</Label>
              <Select value={formData.status} onValueChange={(value: 'active' | 'sold' | 'pending') => setFormData({...formData, status: value})}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sold">Sold</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-description" className="text-gray-300">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="bg-gray-800 border-gray-700 text-gray-100"
                placeholder="Vehicle description..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-features" className="text-gray-300">Features</Label>
              <Textarea
                id="edit-features"
                value={formData.features}
                onChange={(e) => setFormData({...formData, features: e.target.value})}
                className="bg-gray-800 border-gray-700 text-gray-100"
                placeholder="Key features, separated by commas..."
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditVehicle}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? 'Updating...' : 'Update Vehicle'}
              </Button>
            </div>
      </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
