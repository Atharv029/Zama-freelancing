import { useState, useEffect, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { Project } from '@/types/project';
import { formatEther } from 'viem';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const publicClient = usePublicClient();

  const fetchProjects = useCallback(async () => {
    if (!publicClient) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const count = (await publicClient.readContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'getProjectCount',
      } as any)) as bigint;

      if (count === 0n) {
        setProjects([]);
        return;
      }

      const projectPromises = [];
      for (let i = 0; i < Number(count); i++) {
        projectPromises.push(
          publicClient.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: CONTRACT_ABI,
            functionName: 'projects',
            args: [BigInt(i)],
          } as any)
        );
      }

      const projectsData = await Promise.all(projectPromises);
      
      const formattedProjects: Project[] = projectsData.map((data: any, index) => ({
        id: index,
        client: String(data[0]),
        title: data[1],
        descHash: data[2],
        description: data[2],
        category: 'Blockchain',
        budget: data[3],
        minBudget: data[4],
        maxBudget: formatEther(data[3]),
        deadline: data[5],
        escrow: BigInt(0),
        winner: String(data[6]),
        winnerBid: '0',
        status: data[7],
        createdAt: data[8],
        bidCount: data[9],
        revealed: data[10],
      }));

      setProjects(formattedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return { projects, loading, refetch: fetchProjects };
}
