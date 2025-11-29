import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserCardProps {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'client';
  department?: string;
  lastActive?: string;
  assignedModules?: number;
  avatar?: string;
}

export function UserCard({ 
  name, 
  email, 
  role, 
  department, 
  lastActive, 
  assignedModules,
  avatar 
}: UserCardProps) {
  const getRoleBadgeVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'client':
        return 'default';
      default:
        return 'default';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-cyan-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <Card className="bg-card border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img 
                src={avatar} 
                alt={name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className={`w-12 h-12 rounded-full ${getAvatarColor(name)} flex items-center justify-center text-white font-medium`}>
                {getInitials(name)}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground">{name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <span className="text-muted-foreground/70">@</span>
                {email}
              </p>
            </div>
          </div>
          <Badge variant={getRoleBadgeVariant()}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          {department && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <span className="text-muted-foreground/50">🏢</span> Department
              </span>
              <span className="font-medium text-foreground">{department}</span>
            </div>
          )}
          {lastActive && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <span className="text-muted-foreground/50">📅</span> Last Active
              </span>
              <span className="font-medium text-foreground">{lastActive}</span>
            </div>
          )}
          {assignedModules !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Assigned Modules</span>
              <span className="font-bold text-lg text-primary">{assignedModules}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
