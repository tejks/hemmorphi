import { redirect } from 'next/navigation';
import { z } from 'zod';

const querySchema = z.object({
  search: z.string().min(1, 'Search parameter is required'),
  id: z.string().min(1, 'ID parameter is required'),
});

interface Props {
  searchParams: Promise<{ search: string; id: string }>;
}

export const metadata = {
  title: 'Transfer SOL - USDC',
};

export default async function Page({ searchParams }: Props) {
  const { success, data: searchParamsData } = querySchema.safeParse(
    await searchParams
  );

  if (!success || !searchParamsData) {
    redirect('/404');
  }

  const { id, search } = searchParamsData;

  return (
    <div>
      {search} - {id}
    </div>
  );
}
