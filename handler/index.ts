export async function handler(event: any, _context: any) {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event, undefined, 2),
  };
}