import { useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { toast } from 'sonner';

export function useContractEvents(onUpdate?: () => void) {
  const publicClient = usePublicClient();

  useEffect(() => {
    if (!publicClient) return;

    const unwatch = publicClient.watchContractEvent({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      onLogs: (logs) => {
        logs.forEach((log) => {
          switch (log.eventName) {
            case 'ProjectCreated':
              toast.success('New Project Created!', {
                description: `Project: ${log.args.title}`,
              });
              onUpdate?.();
              break;
            case 'BidSubmitted':
              toast.info('New Bid Submitted', {
                description: `Project #${log.args.pid}`,
              });
              onUpdate?.();
              break;
            case 'BidRevealed':
              toast.info('Bid Revealed', {
                description: `Project #${log.args.pid}`,
              });
              onUpdate?.();
              break;
            case 'BidsRevealed':
              toast.success('All Bids Revealed!', {
                description: `${log.args.count} bids revealed`,
              });
              onUpdate?.();
              break;
            case 'WinnerSelected':
              toast.success('Winner Selected!', {
                description: `Project #${log.args.pid}`,
              });
              onUpdate?.();
              break;
            case 'PaymentReleased':
              toast.success('Payment Released!', {
                description: `Winner received payment`,
              });
              onUpdate?.();
              break;
          }
        });
      },
    });

    return () => {
      unwatch();
    };
  }, [publicClient, onUpdate]);
}
