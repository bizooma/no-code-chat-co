import React, { useState } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  Settings, 
  Crown,
  Globe 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const WorkspaceSwitcher = () => {
  const { workspaces, currentWorkspace, switchWorkspace, loading } = useWorkspace();

  if (loading || !currentWorkspace) {
    return (
      <div className="flex items-center space-x-2 animate-pulse">
        <div className="w-8 h-8 bg-muted rounded"></div>
        <div className="w-24 h-4 bg-muted rounded"></div>
      </div>
    );
  }

  const brandColor = currentWorkspace.brand_color || '#3B82F6';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 max-w-64">
          {currentWorkspace.logo_url ? (
            <img 
              src={currentWorkspace.logo_url} 
              alt={currentWorkspace.name}
              className="w-6 h-6 rounded"
            />
          ) : (
            <div 
              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: brandColor }}
            >
              {currentWorkspace.name.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="flex flex-col items-start min-w-0 flex-1">
            <span className="font-medium text-sm truncate max-w-full">
              {currentWorkspace.name}
            </span>
            {currentWorkspace.client_name && (
              <span className="text-xs text-muted-foreground truncate max-w-full">
                {currentWorkspace.client_name}
              </span>
            )}
          </div>
          
          <ChevronDown className="w-4 h-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Workspaces
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {workspaces.map((workspace) => {
          const isActive = workspace.id === currentWorkspace.id;
          const workspaceBrandColor = workspace.brand_color || '#3B82F6';
          
          return (
            <DropdownMenuItem 
              key={workspace.id}
              onClick={() => switchWorkspace(workspace.id)}
              className={`flex items-center gap-3 p-3 ${isActive ? 'bg-muted' : ''}`}
            >
              {workspace.logo_url ? (
                <img 
                  src={workspace.logo_url} 
                  alt={workspace.name}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: workspaceBrandColor }}
                >
                  {workspace.name.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {workspace.name}
                  </span>
                  {isActive && <Badge variant="secondary" className="text-xs">Current</Badge>}
                </div>
                
                <div className="flex items-center gap-1 mt-1">
                  {workspace.client_name && (
                    <span className="text-xs text-muted-foreground truncate">
                      {workspace.client_name}
                    </span>
                  )}
                  
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {workspace.subscription_tier}
                    </Badge>
                    
                    {workspace.white_label_enabled && (
                      <Crown className="w-3 h-3 text-yellow-500" />
                    )}
                    
                    {workspace.custom_domain && (
                      <Globe className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link to="/workspaces" className="flex items-center gap-2 w-full">
            <Settings className="w-4 h-4" />
            Manage Workspaces
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link to="/portal" className="flex items-center gap-2 w-full">
            <Building2 className="w-4 h-4" />
            Client Portal View
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkspaceSwitcher;