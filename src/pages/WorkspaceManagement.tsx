import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Plus,
  Settings,
  Users,
  Palette,
  Crown,
  Globe,
  Mail,
  Trash2,
  Edit3,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface WorkspaceFormData {
  name: string;
  client_name: string;
  agency_name: string;
  brand_color: string;
  logo_url: string;
  custom_domain: string;
  white_label_enabled: boolean;
  subscription_tier: string;
}

const WorkspaceManagement = () => {
  const { isPlatformOwner } = useAuth();
  const { workspaces, currentWorkspace, createWorkspace, updateWorkspace, deleteWorkspace, switchWorkspace } = useWorkspace();
  const { toast } = useToast();
  
  const [newWorkspaceOpen, setNewWorkspaceOpen] = useState(false);
  const [editWorkspaceOpen, setEditWorkspaceOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  
  const [formData, setFormData] = useState<WorkspaceFormData>({
    name: '',
    client_name: '',
    agency_name: '',
    brand_color: '#3B82F6',
    logo_url: '',
    custom_domain: '',
    white_label_enabled: false,
    subscription_tier: 'free'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      client_name: '',
      agency_name: '',
      brand_color: '#3B82F6',
      logo_url: '',
      custom_domain: '',
      white_label_enabled: false,
      subscription_tier: 'free'
    });
  };

  const handleCreateWorkspace = async () => {
    const workspace = await createWorkspace(formData);
    if (workspace) {
      resetForm();
      setNewWorkspaceOpen(false);
    }
  };

  const handleUpdateWorkspace = async () => {
    if (selectedWorkspace) {
      await updateWorkspace(selectedWorkspace.id, formData);
      setEditWorkspaceOpen(false);
      setSelectedWorkspace(null);
      resetForm();
    }
  };

  const handleEditWorkspace = (workspace: any) => {
    setSelectedWorkspace(workspace);
    setFormData({
      name: workspace.name,
      client_name: workspace.client_name || '',
      agency_name: workspace.agency_name || '',
      brand_color: workspace.brand_color || '#3B82F6',
      logo_url: workspace.logo_url || '',
      custom_domain: workspace.custom_domain || '',
      white_label_enabled: workspace.white_label_enabled || false,
      subscription_tier: workspace.subscription_tier || 'free'
    });
    setEditWorkspaceOpen(true);
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      await deleteWorkspace(workspaceId);
    }
  };

  const copyDashboardLink = (workspace: any) => {
    const link = workspace.custom_domain 
      ? `https://${workspace.custom_domain}` 
      : `${window.location.origin}?workspace=${workspace.id}`;
    
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied",
      description: "Client dashboard link copied to clipboard",
    });
  };

  if (!isPlatformOwner) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>
              You don't have permission to access workspace management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-2 mb-6">
        <Building2 className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Workspace Management</h1>
          <p className="text-muted-foreground">
            Manage client workspaces and agency settings
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{workspaces.length} Workspaces</Badge>
          {currentWorkspace && (
            <Badge variant="secondary">Current: {currentWorkspace.name}</Badge>
          )}
        </div>
        
        <Dialog open={newWorkspaceOpen} onOpenChange={setNewWorkspaceOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Workspace</DialogTitle>
              <DialogDescription>
                Set up a new client workspace with custom branding.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="basic" className="w-full">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Workspace Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Client Workspace"
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_name">Client Name</Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                      placeholder="Acme Corp"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="agency_name">Agency Name</Label>
                  <Input
                    id="agency_name"
                    value={formData.agency_name}
                    onChange={(e) => setFormData({...formData, agency_name: e.target.value})}
                    placeholder="Your Agency Name"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="branding" className="space-y-4">
                <div>
                  <Label htmlFor="brand_color">Brand Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="brand_color"
                      type="color"
                      value={formData.brand_color}
                      onChange={(e) => setFormData({...formData, brand_color: e.target.value})}
                      className="w-20"
                    />
                    <Input
                      value={formData.brand_color}
                      onChange={(e) => setFormData({...formData, brand_color: e.target.value})}
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="white_label"
                    checked={formData.white_label_enabled}
                    onCheckedChange={(checked) => setFormData({...formData, white_label_enabled: checked})}
                  />
                  <Label htmlFor="white_label">Enable White Label Branding</Label>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4">
                <div>
                  <Label htmlFor="custom_domain">Custom Domain</Label>
                  <Input
                    id="custom_domain"
                    value={formData.custom_domain}
                    onChange={(e) => setFormData({...formData, custom_domain: e.target.value})}
                    placeholder="client.yourdomain.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="subscription_tier">Subscription Tier</Label>
                  <Select value={formData.subscription_tier} onValueChange={(value) => setFormData({...formData, subscription_tier: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewWorkspaceOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateWorkspace}>
                Create Workspace
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workspaces Grid */}
      <div className="grid gap-4">
        {workspaces.map((workspace) => (
          <Card key={workspace.id} className={currentWorkspace?.id === workspace.id ? "border-primary" : ""}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {workspace.logo_url ? (
                    <img 
                      src={workspace.logo_url} 
                      alt={workspace.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div 
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: workspace.brand_color }}
                    >
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-semibold text-lg">{workspace.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {workspace.client_name && (
                        <span>Client: {workspace.client_name}</span>
                      )}
                      {workspace.agency_name && (
                        <span>• Agency: {workspace.agency_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={workspace.subscription_tier === 'free' ? 'secondary' : 'default'}>
                        {workspace.subscription_tier}
                      </Badge>
                      {workspace.white_label_enabled && (
                        <Badge variant="outline">
                          <Crown className="w-3 h-3 mr-1" />
                          White Label
                        </Badge>
                      )}
                      {workspace.custom_domain && (
                        <Badge variant="outline">
                          <Globe className="w-3 h-3 mr-1" />
                          Custom Domain
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyDashboardLink(workspace)}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy Link
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => switchWorkspace(workspace.id)}
                    disabled={currentWorkspace?.id === workspace.id}
                  >
                    {currentWorkspace?.id === workspace.id ? 'Current' : 'Switch'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditWorkspace(workspace)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteWorkspace(workspace.id)}
                    disabled={workspaces.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Workspace Dialog */}
      <Dialog open={editWorkspaceOpen} onOpenChange={setEditWorkspaceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workspace</DialogTitle>
            <DialogDescription>
              Update workspace settings and branding.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Workspace Name</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-client">Client Name</Label>
                  <Input
                    id="edit-client"
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-agency">Agency Name</Label>
                <Input
                  id="edit-agency"
                  value={formData.agency_name}
                  onChange={(e) => setFormData({...formData, agency_name: e.target.value})}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="branding" className="space-y-4">
              <div>
                <Label htmlFor="edit-color">Brand Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="edit-color"
                    type="color"
                    value={formData.brand_color}
                    onChange={(e) => setFormData({...formData, brand_color: e.target.value})}
                    className="w-20"
                  />
                  <Input
                    value={formData.brand_color}
                    onChange={(e) => setFormData({...formData, brand_color: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-logo">Logo URL</Label>
                <Input
                  id="edit-logo"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-white-label"
                  checked={formData.white_label_enabled}
                  onCheckedChange={(checked) => setFormData({...formData, white_label_enabled: checked})}
                />
                <Label htmlFor="edit-white-label">Enable White Label Branding</Label>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-4">
              <div>
                <Label htmlFor="edit-domain">Custom Domain</Label>
                <Input
                  id="edit-domain"
                  value={formData.custom_domain}
                  onChange={(e) => setFormData({...formData, custom_domain: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-tier">Subscription Tier</Label>
                <Select value={formData.subscription_tier} onValueChange={(value) => setFormData({...formData, subscription_tier: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditWorkspaceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateWorkspace}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkspaceManagement;