import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { sepolia } from 'wagmi/chains';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contractConfig';
import { parseEther } from 'viem';

const formSchema = z.object({
  title: z.string().min(10).max(100),
  description: z.string().min(50).max(2000),
  minBudget: z.number().min(0.001),
  maxBudget: z.number().min(0.001),
  durationDays: z.number().min(1).max(90),
}).refine((data) => data.maxBudget > data.minBudget, {
  message: 'Max budget must be greater than min budget',
  path: ['maxBudget'],
});

type FormData = z.infer<typeof formSchema>;

export default function PostProject() {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      minBudget: 0,
      maxBudget: 0,
      durationDays: 7,
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const platformFee = parseEther('0.001');
      const maxBudgetWei = parseEther(data.maxBudget.toString());
      const minBudgetWei = parseEther(data.minBudget.toString());

      writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: CONTRACT_ABI,
        functionName: 'createProject',
        args: [data.title, data.description, maxBudgetWei, minBudgetWei, BigInt(data.durationDays)],
        value: platformFee,
        account: address as `0x${string}`,
        chain: sepolia,
      }, {
        onSuccess: () => {
          toast.success('Project created!');
          navigate('/my-projects');
        },
        onError: (error) => {
          toast.error('Failed to create project', {
            description: error.message,
          });
        },
      });
    } catch (error: any) {
      toast.error('Error', { description: error.message });
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Post a New Project</h1>
        <p className="text-muted-foreground">
          Create a project and receive encrypted bids from talented freelancers
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>
            Pay only 0.001 ETH platform fee to post your project
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Build a Modern E-commerce Website" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your project in detail..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Budget (ETH) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="0.1"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxBudget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Budget (ETH) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.001"
                          placeholder="1.0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Your maximum budget for this project</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bidding Duration (Days) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="90"
                        placeholder="7"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>How long freelancers can submit bids (max 90 days)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">Summary:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Budget Range: <strong>{form.watch('minBudget') || 0} - {form.watch('maxBudget') || 0} ETH</strong></p>
                  <p>• Platform fee: <strong>0.001 ETH</strong></p>
                  <p>• Total required now: <strong>0.001 ETH</strong></p>
                  <p className="text-xs mt-2">Note: Bidders will stake their bid amount. You'll pay the winner directly after selection.</p>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isPending || isConfirming}>
                {(isPending || isConfirming) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Confirm in Wallet...' : isConfirming ? 'Creating...' : 'Create Project'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
