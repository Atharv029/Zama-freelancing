import { Link, useLocation } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Briefcase, PlusCircle, User } from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                ZamaFreelancing
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Button
                variant={isActive('/') ? 'secondary' : 'ghost'}
                asChild
                className="transition-all"
              >
                <Link to="/">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Projects
                </Link>
              </Button>
              <Button
                variant={isActive('/post-project') ? 'secondary' : 'ghost'}
                asChild
                className="transition-all"
              >
                <Link to="/post-project">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Post Project
                </Link>
              </Button>
              <Button
                variant={isActive('/my-projects') ? 'secondary' : 'ghost'}
                asChild
                className="transition-all"
              >
                <Link to="/my-projects">
                  <User className="h-4 w-4 mr-2" />
                  My Projects
                </Link>
              </Button>
              <Button
                variant={isActive('/my-bids') ? 'secondary' : 'ghost'}
                asChild
                className="transition-all"
              >
                <Link to="/my-bids">
                  <User className="h-4 w-4 mr-2" />
                  My Bids
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <ConnectButton />
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-1 pb-3 overflow-x-auto">
            <Button
              variant={isActive('/') ? 'secondary' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/">Projects</Link>
            </Button>
            <Button
              variant={isActive('/post-project') ? 'secondary' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/post-project">Post</Link>
            </Button>
            <Button
              variant={isActive('/my-projects') ? 'secondary' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/my-projects">My Projects</Link>
            </Button>
            <Button
              variant={isActive('/my-bids') ? 'secondary' : 'ghost'}
              size="sm"
              asChild
            >
              <Link to="/my-bids">My Bids</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-border/50 bg-card/50 backdrop-blur-md mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 ZamaFreelancing. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Made by{' '}
              <a
                href="https://x.com/0xShyron"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:text-accent transition-colors underline decoration-dotted underline-offset-4"
              >
                0xShyron
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
