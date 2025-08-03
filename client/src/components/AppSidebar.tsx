import { useState } from "react";
import { useLocation } from "wouter";
import {
  Home,
  Tag,
  Key,
  BarChart3,
  Bell,
  Plus,
  ChevronDown,
  FileText,
  ExternalLink,
  Settings,
  Bot,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import AddKeywordModal from "./AddKeywordModal";
import CSVImportModal from "./CSVImportModal";
import GoogleSheetsImportModal from "./GoogleSheetsImportModal";
import AlertSetupModal from "./AlertSetupModal";
import APIUsageIndicator from "./APIUsageIndicator";

const AppSidebar = () => {
  const [location, setLocation] = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [apiEnabled, setApiEnabled] = useState(true);

  const handleApiToggle = (checked: boolean) => {
    setApiEnabled(checked);
    localStorage.setItem('openai-api-enabled', checked.toString());
  };

  const mainNavItems = [
    { path: "/", label: "Dashboard", icon: Home },
    { path: "/keywords", label: "Keywords", icon: Tag },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
    { path: "/alerts", label: "Alerts", icon: Bell },
  ];

  const organicSeoItems = [
    { path: "/organic", label: "Keyword Rankings", icon: Key },
    { path: "/organic/top-pages", label: "Top Pages", icon: FileText },
  ];

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <div className="flex items-center gap-2">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-600 text-white">
                    <Bot className="size-4 animate-pulse" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">AI Ranking Tracker</span>
                    <span className="truncate text-xs">SEO Intelligence</span>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.path}
                    >
                      <button 
                        onClick={() => setLocation(item.path)}
                        className="w-full flex items-center"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Organic SEO</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible defaultOpen className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        <Key className="mr-2 h-4 w-4" />
                        <span>Organic SEO</span>
                        <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {organicSeoItems.map((item) => (
                          <SidebarMenuSubItem key={item.path}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={location === item.path}
                            >
                              <button 
                                onClick={() => setLocation(item.path)}
                                className="w-full flex items-center"
                              >
                                <item.icon className="mr-2 h-4 w-4" />
                                <span>{item.label}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              {/* API Toggle */}
              <div className="px-3 py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">OpenAI API</span>
                  <Switch
                    checked={apiEnabled}
                    onCheckedChange={handleApiToggle}
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>
                <Badge 
                  variant={apiEnabled ? "default" : "secondary"} 
                  className={`text-xs w-full justify-center ${
                    apiEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {apiEnabled ? "ACTIVE" : "DISABLED"}
                </Badge>
              </div>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              <APIUsageIndicator />
            </SidebarMenuItem>

            <SidebarMenuItem>
              {/* Quick Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Quick Actions</span>
                    <ChevronDown className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Keywords
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowCSVModal(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Import from CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSheetsModal(true)}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Import from Google Sheets
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowAlertModal(true)}>
                    <Bell className="w-4 h-4 mr-2" />
                    Setup Alerts
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Modals */}
      <AddKeywordModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
      />
      
      <CSVImportModal 
        isOpen={showCSVModal} 
        onClose={() => setShowCSVModal(false)}
      />
      
      <GoogleSheetsImportModal 
        isOpen={showSheetsModal} 
        onClose={() => setShowSheetsModal(false)}
      />
      
      <AlertSetupModal 
        isOpen={showAlertModal} 
        onClose={() => setShowAlertModal(false)}
      />
    </>
  );
};

export default AppSidebar;