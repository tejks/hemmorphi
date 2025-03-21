import { TokenPrice } from '@/types/TokenPrice';
import Redis from 'ioredis';

const redis = new Redis({
  host: String(process.env.REDIS_HOST),
  port: Number(process.env.REDIS_PORT),
  password: String(process.env.REDIS_PASSWORD),
  db: 0,
});

const JUPITER_API_URL = 'https://api.jup.ag/price/v2';
const CACHE_EXPIRY = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tokens = searchParams.get('ids')?.split(',');

    if (!tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Tokens query parameter is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const results: Record<string, TokenPrice> = {};
    const tokensToFetch = [];

    for (const token of tokens) {
      const cachedPrice = await redis.get(token);
      if (cachedPrice) {
        results[token] = { price: JSON.parse(cachedPrice), source: 'cache' };
      } else {
        tokensToFetch.push(token);
      }
    }

    if (tokensToFetch.length > 0) {
      const response = await fetch(
        `${JUPITER_API_URL}?ids=${tokensToFetch.join(',')}`
      );

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch data from Jupiter API' }),
          {
            status: response.status,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const responseData = (await response.json()) as {
        data: Record<string, { price: number }>;
      };
      for (const tokenId of tokensToFetch) {
        const token = responseData.data[tokenId];
        if (token) {
          results[tokenId] = { price: token.price, source: 'api' };
          await redis.set(
            tokenId,
            JSON.stringify(token.price),
            'EX',
            CACHE_EXPIRY
          );
        }
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
