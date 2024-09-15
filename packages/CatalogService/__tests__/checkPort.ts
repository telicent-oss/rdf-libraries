import tcpPortUsed from 'tcp-port-used';

export const checkPort = async (port: number, timeout: number = 20000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const inUse = await tcpPortUsed.check(port, '127.0.0.1');
    if (!inUse) {
      return true; // Port is free
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a second before retrying
  }
  throw new Error(`Port ${port} did not become free within the ${Math.round(timeout/1000)}s timeout`);
};