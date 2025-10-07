'use client';

import { useState } from 'react';
import { MapPin, Search, Car, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { inventoryApi, type MarketcheckVehicle, type FetchInventoryRequest } from '@/lib/inventory-api';
import { useToast } from '@/components/ui/use-toast';

interface MarketcheckInventoryFetcherProps {
  onInventoryFetched?: (inventory: MarketcheckVehicle[]) => void;
}

export default function MarketcheckInventoryFetcher({ onInventoryFetched }: MarketcheckInventoryFetcherProps) {
  const [formData, setFormData] = useState<FetchInventoryRequest>({
    street: '',
    city: '',
    state: '',
    zip: '',
    dealer_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchedInventory, setFetchedInventory] = useState<MarketcheckVehicle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (field: keyof FetchInventoryRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.city || !formData.state || !formData.zip) {
      setError('Please fill in at least City, State, and ZIP code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const inventory = await inventoryApi.fetchMarketcheckInventory(formData);
      setFetchedInventory(inventory);
      
      if (inventory.length === 0) {
        toast({
          title: "No inventory found",
          description: "No active vehicles were found for this dealership address.",
          variant: "default"
        });
      } else {
        toast({
          title: "Inventory fetched successfully",
          description: `Found ${inventory.length} vehicles in active inventory.`,
        });
      }

      // Notify parent component
      if (onInventoryFetched) {
        onInventoryFetched(inventory);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch inventory';
      setError(errorMessage);
      toast({
        title: "Error fetching inventory",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price?: string) => {
    if (!price) return 'Price not available';
    const numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return `$${numPrice.toLocaleString()}`;
  };

  const formatMileage = (mileage?: number) => {
    if (!mileage) return 'Mileage not available';
    return `${mileage.toLocaleString()} mi`;
  };

  return (
    <div className="space-y-6">
      {/* Fetch Form */}
      <Card className="bg-gray-900/50 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-500" />
            Fetch External Inventory
          </CardTitle>
          <CardDescription className="text-gray-400">
            Enter a dealership's address to fetch their active inventory from Marketcheck
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street" className="text-gray-300">Street Address (Optional)</Label>
                <Input
                  id="street"
                  placeholder="123 Main Street"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dealer_name" className="text-gray-300">Dealer Name (Optional)</Label>
                <Input
                  id="dealer_name"
                  placeholder="ABC Motors"
                  value={formData.dealer_name}
                  onChange={(e) => handleInputChange('dealer_name', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-gray-300">City *</Label>
                <Input
                  id="city"
                  placeholder="Beverly Hills"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-gray-300">State *</Label>
                <Input
                  id="state"
                  placeholder="CA"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip" className="text-gray-300">ZIP Code *</Label>
                <Input
                  id="zip"
                  placeholder="90210"
                  value={formData.zip}
                  onChange={(e) => handleInputChange('zip', e.target.value)}
                  className="bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500"
                  required
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading || !formData.city || !formData.state || !formData.zip}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Fetching Inventory...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Fetch Inventory
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {fetchedInventory.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-100 flex items-center gap-2">
              <Car className="h-5 w-5 text-green-500" />
              Fetched Inventory ({fetchedInventory.length} vehicles)
            </CardTitle>
            <CardDescription className="text-gray-400">
              Active inventory from Marketcheck for the specified dealership
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fetchedInventory.map((vehicle, index) => (
                <Card key={vehicle.id || index} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Vehicle Image */}
                      {vehicle.images && vehicle.images.length > 0 && (
                        <div className="aspect-video bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={vehicle.images[0]}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Vehicle Info */}
                      <div>
                        <h3 className="font-semibold text-gray-100 text-lg">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </h3>
                        {vehicle.description && (
                          <p className="text-sm text-gray-400 mt-1">{vehicle.description}</p>
                        )}
                      </div>

                      {/* Price and Mileage */}
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-lg font-bold text-green-400">
                            {formatPrice(vehicle.price)}
                          </p>
                          <p className="text-sm text-gray-400">
                            {formatMileage(vehicle.mileage)}
                          </p>
                        </div>
                        {vehicle.stock_number && (
                          <Badge variant="outline" className="text-xs">
                            #{vehicle.stock_number}
                          </Badge>
                        )}
                      </div>

                      {/* Additional Details */}
                      <div className="space-y-1">
                        {vehicle.exterior_color && (
                          <p className="text-xs text-gray-400">
                            <span className="text-gray-300">Color:</span> {vehicle.exterior_color}
                          </p>
                        )}
                        {vehicle.transmission && (
                          <p className="text-xs text-gray-400">
                            <span className="text-gray-300">Transmission:</span> {vehicle.transmission}
                          </p>
                        )}
                        {vehicle.condition && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              vehicle.condition.toLowerCase() === 'excellent' ? 'border-green-500 text-green-400' :
                              vehicle.condition.toLowerCase() === 'good' ? 'border-blue-500 text-blue-400' :
                              vehicle.condition.toLowerCase() === 'fair' ? 'border-yellow-500 text-yellow-400' :
                              'border-gray-500 text-gray-400'
                            }`}
                          >
                            {vehicle.condition}
                          </Badge>
                        )}
                      </div>

                      {/* VIN */}
                      {vehicle.vin && (
                        <p className="text-xs text-gray-500 font-mono">
                          VIN: {vehicle.vin.slice(0, 8)}...
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {fetchedInventory.length === 0 && (
              <div className="text-center py-8">
                <Car className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                <h4 className="text-lg font-semibold text-gray-300 mb-2">No vehicles found</h4>
                <p className="text-gray-400">
                  No active inventory was found for this dealership address.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
