import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProjectCard from '@/components/ProjectCard';
import { Search } from 'lucide-react';
import { ProjectStatus } from '@/types/project';
import { useProjects } from '@/hooks/useProjects';
import { useContractEvents } from '@/hooks/useContractEvents';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const { projects, loading, refetch } = useProjects();
  const { isConnected } = useAccount();
  
  useContractEvents(refetch);

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchQuery.toLowerCase());
    const isActive = project.status === ProjectStatus.Active;
    return matchesSearch && isActive;
  });

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-primary">
          Zama Freelance Bidding
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Post projects, receive encrypted bids, hire talent with complete privacy
        </p>
        {!isConnected && (
          <p className="text-warning">Connect your wallet to get started</p>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      ) : filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground text-lg">
            {projects.length === 0 ? 'No projects yet' : 'No projects match your search'}
          </p>
          {isConnected && (
            <Button asChild>
              <Link to="/post-project">Post the First Project</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
