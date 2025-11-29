import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Module {
  id: string;
  title: string;
  description?: string;
  status: string;
  created: string;
  author: string;
  assigned: number;
  completion: number;
  screenshot_url?: string;
}

interface ModuleTableProps {
  modules: Module[];
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function ModuleTable({ modules, onView, onEdit }: ModuleTableProps) {
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Module Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                  Module Name
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                  Created
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                  Author
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                  Assigned
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                  Completion
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <tr key={module.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {module.screenshot_url && (
                        <img 
                          src={module.screenshot_url} 
                          alt={module.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-foreground">{module.title}</div>
                        {module.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs">
                            {module.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={getStatusVariant(module.status)}>
                      {module.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">
                    {module.created}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                        {module.author.charAt(0)}
                      </div>
                      <span className="text-sm text-muted-foreground">{module.author}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-foreground">
                    {module.assigned} Users
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 max-w-[100px]">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${module.completion}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">{module.completion}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onView && (
                          <DropdownMenuItem onClick={() => onView(module.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                        )}
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(module.id)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Module
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
