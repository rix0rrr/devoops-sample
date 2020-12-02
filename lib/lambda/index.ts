async function handler(_event: any, _context: any) {

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },
    body: 'This is the Lambda',
  };
}