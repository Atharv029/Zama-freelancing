import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign, Users } from 'lucide-react';
import { Project, ProjectStatus } from '@/types/project';
import { formatEther } from 'viem';
import StatusBadge from './StatusBadge';

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const getTimeRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    const deadline = Number(project.deadline);
    const remaining = deadline - now;

    if (remaining <= 0) return 'Ended';

    const days = Math.floor(remaining / 86400);
    if (days > 0) return `${days} days left`;
    
    const hours = Math.floor(remaining / 3600);
    return `${hours} hours left`;
  };

  const isActive = project.status === ProjectStatus.Active;

  return (
    <Card className="hover:shadow-lg transition-all border-border bg-card">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-1 mb-2 text-card-foreground">
              {project.title}
            </h3>
            <Badge variant="outline" className="text-xs">
              {project.category}
            </Badge>
          </div>
          <StatusBadge status={project.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {project.description}
        </p>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-foreground">
            <DollarSign className="h-4 w-4 text-primary" />
            <span>{formatEther(project.minBudget)} - {formatEther(project.budget)} ETH</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{getTimeRemaining()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{String(project.bidCount)} bids</span>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button asChild variant={isActive ? 'default' : 'outline'} className="w-full">
          <Link to={`/project/${project.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
